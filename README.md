# AI Business Insights Tool

A full-stack web app that turns raw CSV data and HubSpot CRM data into clear, actionable intelligence — powered by **scikit-learn anomaly detection**, the **Anthropic Claude API** with real-time streaming, and a **HubSpot CRM integration**.

Built by [Sohil Nagpal](https://sohilnagpal.com)

---

## What This Does

Upload any CSV or connect your HubSpot account — the tool automatically analyses your data, detects anomalies, generates AI-written insights, and lets you chat with your data in plain English. HubSpot data gets purpose-built dashboards (Deals pipeline, Contact funnel, Company intelligence) rather than generic stats.

---

## Features

| Feature | Details |
|---|---|
| CSV Upload | Drag & drop any structured CSV |
| HubSpot CRM Integration | Fetch Deals, Contacts, or Companies directly from your HubSpot account |
| Anomaly Detection | scikit-learn Isolation Forest flags unusual rows automatically |
| Streaming AI Insights | Claude generates executive summaries, key insights, and recommendations in real time |
| Chat with Your Data | Ask plain-English questions — Claude always has full dataset context |
| Auto Visualisations | Area charts, donut charts, correlation bars, distribution charts per data type |
| HubSpot Dashboards | Purpose-built pipeline, funnel, and company intelligence views |
| PDF Export | Download a formatted report — generic for CSVs, CRM-specific for HubSpot data |
| Sample Data | Built-in marketing analytics and sales CSVs to explore without uploading |
| Dark Dashboard UI | Professional SaaS-style interface built with React + Tailwind CSS |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS, Recharts, Lucide Icons |
| Backend | FastAPI, Python 3.11+ |
| Data Analysis | pandas, NumPy, scikit-learn (Isolation Forest) |
| AI Layer | Anthropic Claude API — `claude-opus-4-7` with streaming SSE |
| PDF Export | ReportLab |
| CRM Integration | HubSpot CRM v3 API (Private App token) |

---

## Project Structure

```
ai-insights-tool/
├── backend/
│   ├── main.py               # FastAPI app — all API endpoints
│   ├── analyser.py           # pandas + scikit-learn analysis pipeline
│   ├── ai_insights.py        # Claude API streaming (insights + chat)
│   ├── hubspot_connector.py  # HubSpot CRM API fetchers (deals, contacts, companies)
│   ├── hubspot_analyser.py   # Business-specific analysis per CRM object type
│   ├── pdf_export.py         # ReportLab PDF generation (generic + HubSpot-specific)
│   ├── seed_hubspot.py       # Script to seed test data into HubSpot
│   ├── requirements.txt
│   └── .env                  # API keys — never committed (see setup below)
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── UploadScreen.jsx       # Upload + sample loader + HubSpot fetch buttons
│           ├── Dashboard.jsx          # Tab layout, routes to correct overview by source type
│           ├── Sidebar.jsx            # Navigation sidebar
│           ├── Overview.jsx           # Generic CSV overview (charts, correlations, stats)
│           ├── HubSpotDeals.jsx       # Deals pipeline dashboard
│           ├── HubSpotContacts.jsx    # Contact funnel + lifecycle dashboard
│           ├── HubSpotCompanies.jsx   # Company intelligence dashboard
│           ├── AIInsights.jsx         # Streaming AI insights panel
│           ├── Anomalies.jsx          # Anomaly table with flags
│           └── Chat.jsx               # Chat interface backed by Claude
├── sample_data/
│   ├── marketing_sample.csv  # 400-row marketing analytics dataset (17 columns, injected anomalies)
│   └── sales_sample.csv      # Sales transactions dataset
└── generate_sample.py        # Script that generated the marketing sample CSV
```

---

## What Was Built (Session Log)

This section tracks the major features added over development sessions for future reference.

### v1 — Initial Build
- FastAPI backend with CSV upload endpoint
- pandas analysis pipeline: row counts, distributions, correlations, missing values, anomaly detection via Isolation Forest
- React frontend with Upload screen and 4-tab Dashboard (Overview, AI Insights, Anomalies, Chat)
- Claude API integration with SSE streaming for insights and chat
- PDF export with ReportLab

### v2 — HubSpot CRM Integration
- `hubspot_connector.py`: fetches Deals, Contacts, Companies from HubSpot CRM v3 API using a Private App token
- `hubspot_analyser.py`: business-specific analysis per object type:
  - **Deals**: pipeline by stage, total/weighted pipeline value, avg deal size, win rate, at-risk deals (overdue or no close date)
  - **Contacts**: lifecycle stage funnel, lead status breakdown, top countries, top job titles, MQL/SQL/customer counts, conversion rate
  - **Companies**: industry mix, size distribution (by employee count), geographic breakdown, avg/total annual revenue
- New frontend components: `HubSpotDeals.jsx`, `HubSpotContacts.jsx`, `HubSpotCompanies.jsx`
- `Dashboard.jsx` routes to the correct overview component based on `session.hubspot.source_type`
- HubSpot analysis stored in session server-side for PDF export

### v2.1 — Improved Overview & Sample Data
- Rebuilt `Overview.jsx` with:
  - 5 stat cards (rows, columns, numeric cols, anomalies, data quality %)
  - Area charts with gradient fill per numeric column
  - Correlation bars with positive (cyan) / negative (rose) colour coding
  - Donut charts for categorical columns
  - Numeric summary table with min (rose) / max (cyan) highlights
- New `marketing_sample.csv`: 400 rows, 17 columns, realistic campaign/channel data with injected anomalies
- Two sample loaders on the upload screen: Marketing Analytics and Sales

### v2.2 — HubSpot-Aware PDF Export
- `pdf_export.py` completely rewritten:
  - `generate_pdf()` routes by `hubspot.source_type` to a dedicated section
  - `_pdf_deals()`: pipeline KPIs, won/lost summary, pipeline by stage table, at-risk deals table
  - `_pdf_contacts()`: contact KPIs, lifecycle funnel, top countries table
  - `_pdf_companies()`: company KPIs, industry breakdown, size distribution
  - `_pdf_generic()`: original CSV report (AI insights, numeric summary, correlations, anomalies)
- Fixed ReportLab header overlap: replaced Paragraph-based header with a `Table` using explicit `rowHeights`

### Bug Fixes Across Sessions
- Fixed frontend proxy port: `package.json` had `8002`, corrected to `8000`
- Fixed correlation sign preservation in `analyser.py` (was calling `.abs()` before sorting)
- Fixed categorical column detection: cardinality filter now ratio-based (`n_unique / len(df) > 0.4`) instead of an absolute cap
- Fixed anomaly table column width overflow in PDF (was using full A4 width instead of usable width)

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
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

Create `backend/.env` with your API keys:

```
ANTHROPIC_API_KEY=sk-ant-...
HUBSPOT_ACCESS_TOKEN=pat-...   # Optional — only needed for HubSpot features
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

Visit **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload a CSV file |
| GET | `/api/sample/{name}` | Load sample data (`marketing` or `sales`) |
| GET | `/api/hubspot/fetch/{object_type}` | Fetch from HubSpot (`deals`, `contacts`, `companies`) |
| POST | `/api/insights/stream` | Stream AI insights via SSE |
| POST | `/api/chat/stream` | Stream chat reply via SSE |
| GET | `/api/export/{session_id}` | Download PDF report |

---

## Potential Extensions

- **Persistent sessions**: replace in-memory session dict with Redis or a database so sessions survive backend restarts
- **Auth**: add user accounts so multiple users can have separate sessions
- **More CRM sources**: Salesforce, Pipedrive, Zoho connectors following the same `hubspot_connector.py` pattern
- **Scheduled reports**: cron-triggered PDF reports emailed to stakeholders
- **Chart export in PDF**: render Recharts to canvas and embed as images in the PDF
- **Multi-file comparison**: upload two CSVs and ask Claude to compare them
- **Custom AI prompts**: let users tweak the insight prompt or pick different Claude models

---

## Security

- API keys live exclusively in `backend/.env` — gitignored, never committed
- HubSpot token uses a Private App with minimum required scopes (read-only CRM objects)
- No user data is persisted server-side beyond the in-memory session dict (lost on restart)

---

## Author

**Sohil Nagpal** — Software Engineering (Honours) Graduate, Deakin University  
[sohilnagpal.com](https://sohilnagpal.com) · [LinkedIn](https://linkedin.com/in/sohilnagpal) · [GitHub](https://github.com/sohilnagpal04)
