# 📊 AI Business Insights Tool

A Streamlit web app that turns raw business CSV data into clear, actionable intelligence — powered by **scikit-learn anomaly detection** and the **Anthropic Claude API** with real-time streaming responses.

🔗 **[Live Demo](https://your-app.streamlit.app)** &nbsp;|&nbsp; Built by [Sohil Nagpal](https://sohilnagpal.com)

---

## Features

| Feature | Details |
|---|---|
| 📁 CSV Upload | Sales, inventory, CRM exports — any structured data |
| 🔍 Anomaly Detection | scikit-learn Isolation Forest flags unusual rows automatically |
| 🧠 Streaming AI Insights | Claude generates executive summaries with real-time streaming |
| 💬 Chat with Your Data | Ask follow-up questions in plain English — Claude responds conversationally |
| 📈 Auto Visualisations | Distribution charts and correlation analysis |
| 🎯 Strategic Recommendations | Actionable next steps tailored to your dataset |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI & App | Streamlit |
| Data Analysis | pandas, NumPy |
| ML / Anomaly Detection | scikit-learn (Isolation Forest) |
| AI Layer | Anthropic Claude API (streaming) |
| Language | Python 3.11+ |

---

## Setup & Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/sohilnagpal04/ai-insights-tool.git
cd ai-insights-tool
```

### 2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Add your Anthropic API key
Either enter it directly in the app sidebar, or set it as an environment variable:
```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

### 5. Run the app
```bash
streamlit run app.py
```

Visit `http://localhost:8501` in your browser.

---

## Try it with sample data

A realistic sales dataset (200 rows, 5 injected anomalies) is included:
```
sample_data/sales_sample.csv
```
Click **"Load sample sales data"** in the sidebar to load it instantly.

---

## Deploy to Streamlit Cloud (free)

1. Push to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your repo → set `app.py` as the entry point
4. Add `ANTHROPIC_API_KEY` under **Secrets**
5. Deploy — live URL in ~60 seconds

---

## Project Structure

```
ai-insights-tool/
├── app.py                  # Streamlit app — UI, tabs, state management
├── analyser.py             # pandas + scikit-learn analysis pipeline
├── ai_insights.py          # Claude API streaming (insights + chat)
├── sample_data/
│   └── sales_sample.csv    # Demo dataset with injected anomalies
├── generate_sample.py      # Script to regenerate sample data
├── requirements.txt
└── README.md
```

---

## How It Works

1. User uploads a CSV (or loads the sample) via the Streamlit sidebar
2. `analyser.py` computes a full statistical summary — row counts, distributions, correlations, missing values
3. scikit-learn's **Isolation Forest** detects outlier rows automatically
4. The summary is streamed to Claude via the Anthropic API with a structured prompt
5. Claude returns a JSON object: executive summary, 3 key insights, anomaly analysis, and a strategic recommendation
6. Results render across 4 tabs — Overview, AI Insights, Anomalies, and a live Chat interface
7. In the Chat tab, users can ask plain-English questions — Claude responds with streaming text, with the dataset summary injected as context

---

## Roadmap

- [ ] Chart visualisations — revenue trends, category breakdowns (Plotly)
- [ ] Excel (.xlsx) upload support
- [ ] Export insights to PDF report
- [ ] CRM/ERP API connectors (HubSpot, Salesforce)
- [ ] Scheduled automated reporting via email

---

## Author

**Sohil Nagpal** — Software Engineering (Honours) Graduate, Deakin University  
[sohilnagpal.com](https://sohilnagpal.com) · [LinkedIn](https://linkedin.com/in/sohilnagpal) · [GitHub](https://github.com/sohilnagpal04)
