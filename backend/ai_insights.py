import anthropic
import json
import os
from typing import Generator

INSIGHTS_SYSTEM = """You are a senior business intelligence analyst.
Analyse the dataset summary provided and respond ONLY with a valid JSON object.
No markdown, no backticks, no preamble — raw JSON only.

The JSON must have exactly these keys:
- "executive_summary": 2-3 sentence plain-English summary of what the data shows
- "insights": list of exactly 3 objects, each with "title" (short label) and "detail" (1-2 sentences)
- "anomalies": 1-2 sentence description of anomalies found, or "No significant anomalies detected." if none
- "recommendation": single strategic recommendation in 1-2 sentences

Use clear, non-technical language suitable for a business owner."""

CHAT_SYSTEM = """You are a helpful data analyst assistant.
The user has uploaded a CSV dataset and you have been given a statistical summary of it.
Answer the user's questions about their data clearly and concisely.
Reference specific numbers from the summary when relevant.
Keep answers under 150 words unless a detailed breakdown is explicitly requested."""


def _client():
    from dotenv import load_dotenv
    load_dotenv(override=True)
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set in the environment.")
    return anthropic.Anthropic(api_key=api_key)


def get_insights(summary: dict) -> dict | None:
    try:
        msg = _client().messages.create(
            model="claude-opus-4-7",
            max_tokens=1024,
            system=INSIGHTS_SYSTEM,
            messages=[{
                "role": "user",
                "content": f"Dataset summary:\n{json.dumps(summary, indent=2, default=str)}"
            }],
        )
        text = msg.content[0].text
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start:end + 1])
    except Exception:
        pass
    return None


def stream_insights(summary: dict) -> Generator[str, None, None]:
    with _client().messages.stream(
        model="claude-opus-4-7",
        max_tokens=1024,
        system=INSIGHTS_SYSTEM,
        messages=[{
            "role": "user",
            "content": f"Dataset summary:\n{json.dumps(summary, indent=2, default=str)}"
        }],
    ) as stream:
        for text in stream.text_stream:
            yield text


def stream_chat(user_message: str, history: list, summary_str: str) -> Generator[str, None, None]:
    system = CHAT_SYSTEM + f"\n\nDataset summary (always available):\n{summary_str}"

    messages = []
    for msg in history:
        role = msg.get("role")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})

    with _client().messages.stream(
        model="claude-opus-4-7",
        max_tokens=512,
        system=system,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text
