import io
import json
import math
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response, JSONResponse
from pydantic import BaseModel
import pandas as pd

from analyser import analyse_csv, get_charts
from ai_insights import stream_insights, stream_chat, get_insights
from pdf_export import generate_pdf
from hubspot_connector import FETCHERS

load_dotenv()

app = FastAPI(title="AI Insights API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: dict = {}

SAMPLE_PATH = Path(__file__).parent.parent / "sample_data" / "sales_sample.csv"


def _sanitize(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj


def _make_session(df: pd.DataFrame, filename: str):
    session_id = str(uuid.uuid4())
    summary = analyse_csv(df)
    charts = get_charts(df)
    sessions[session_id] = {"df": df, "summary": summary, "filename": filename}
    payload = {"session_id": session_id, "filename": filename, "summary": summary, "charts": charts}
    return JSONResponse(content=json.loads(json.dumps(_sanitize(payload), default=str)))


@app.get("/api/hubspot/fetch/{object_type}")
def hubspot_fetch(object_type: str):
    if object_type not in FETCHERS:
        raise HTTPException(400, f"Unknown object type. Choose from: {', '.join(FETCHERS)}")
    try:
        fetcher, filename = FETCHERS[object_type]
        df = fetcher()
        if df.empty:
            raise HTTPException(404, f"No {object_type} found in HubSpot.")
        return _make_session(df, filename)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(500, traceback.format_exc())


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported.")
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {e}")
    return _make_session(df, file.filename)


@app.get("/api/sample")
def load_sample():
    if not SAMPLE_PATH.exists():
        raise HTTPException(404, "Sample file not found.")
    df = pd.read_csv(SAMPLE_PATH)
    return _make_session(df, "sales_sample.csv")


class InsightsRequest(BaseModel):
    session_id: str


@app.post("/api/insights/stream")
def insights_stream(req: InsightsRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(404, "Session not found. Please re-upload your file.")

    def generator():
        try:
            for chunk in stream_insights(session["summary"]):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generator(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/api/export/{session_id}")
def export_pdf(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found. Please re-upload your file.")

    insights = get_insights(session["summary"])
    filename = session.get("filename", "report")
    pdf_bytes = generate_pdf(filename, session["summary"], insights)
    safe_name = filename.replace(".csv", "").replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}_insights.pdf"'},
    )


class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: list


@app.post("/api/chat/stream")
def chat_stream(req: ChatRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(404, "Session not found. Please re-upload your file.")

    summary_str = json.dumps(session["summary"], default=str)

    def generator():
        try:
            for chunk in stream_chat(req.message, req.history, summary_str):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generator(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
