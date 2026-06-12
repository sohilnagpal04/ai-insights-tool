# AI Business Insights Tool

A full-stack web app that turns raw CSV data into clear, actionable intelligence — powered by **scikit-learn anomaly detection** and the **Anthropic Claude API** with real-time streaming responses.

Built by [Sohil Nagpal](https://sohilnagpal.com)

---

## Features

| Feature | Details |
|---|---|
| CSV Upload | Drag & drop any structured CSV, or load the built-in sales sample |
| Anomaly Detection | scikit-learn Isolation Forest flags unusual rows automatically |
| Streaming AI Insights | Claude generates executive summaries, key insights, and recommendations in real time |
| Chat with Your Data | Ask plain-English questions — Claude always has full dataset context |
| Auto Visualisations | Histogram distributions, numeric summary table, and top correlations |
| Dark Dashboard UI | Professional SaaS-style interface built with React + Tailwind CSS |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.11+ |
| Data Analysis | pandas, NumPy |
| Anomaly Detection | scikit-learn (Isolation Forest) |
| AI Layer | Anthropic Claude API (streaming SSE) |

---

## Project Structure

```
ai-insights-tool/
├── backend/
│   ├── main.py           # FastAPI app — upload, sample, insights, chat endpoints
│   ├── analyser.py       # pandas + scikit-learn analysis pipeline
│   ├── ai_insights.py    # Claude API streaming (insights + chat)
│   ├── requirements.txt
│   └── .env              # ANTHROPIC_API_KEY goes here (never committed)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── UploadScreen.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Sidebar.jsx
│   │       ├── Overview.jsx
│   │       ├── AIInsights.jsx
│   │       ├── Anomalies.jsx
│   │       └── Chat.jsx
│   ├── package.json
│   └── tailwind.config.js
└── sample_data/
    └── sales_sample.csv  # Demo dataset with injected anomalies
```

---

## Setup & Run Locally

### 1. Clone the repo

```bash
git clone https://github.com/sohilnagpal04/ai-insights-tool.git
cd ai-insights-tool
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

Add your Anthropic API key to `backend/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

Visit **http://localhost:3000** in your browser.

---

## How It Works

1. User uploads a CSV (or loads the sample) via the upload screen
2. `analyser.py` computes a full statistical summary — row counts, distributions, correlations, missing values
3. scikit-learn's Isolation Forest detects outlier rows automatically
4. Results render across 4 tabs: **Overview**, **AI Insights**, **Anomalies**, **Chat**
5. In AI Insights, the summary is sent to Claude via streaming SSE — returns a structured JSON with executive summary, 3 key insights, anomaly analysis, and a strategic recommendation
6. In the Chat tab, Claude always has the full dataset summary injected into the system prompt, so it can answer any question about the data

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload a CSV file |
| GET | `/api/sample` | Load the built-in sample dataset |
| POST | `/api/insights/stream` | Stream AI insights (SSE) |
| POST | `/api/chat/stream` | Stream a chat reply (SSE) |

---

## Security

The Anthropic API key lives exclusively in `backend/.env` and is never exposed to the browser or frontend code. The `.env` file is gitignored.

---

## Author

**Sohil Nagpal** — Software Engineering (Honours) Graduate, Deakin University  
[sohilnagpal.com](https://sohilnagpal.com) · [LinkedIn](https://linkedin.com/in/sohilnagpal) · [GitHub](https://github.com/sohilnagpal04)
