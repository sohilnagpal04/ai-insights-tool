import streamlit as st
import pandas as pd
import anthropic
import json
from analyser import analyse_csv, get_charts
from ai_insights import stream_insights, stream_chat

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="AI Business Insights",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ────────────────────────────────────────────────────────────────
st.markdown("""
<style>
[data-testid="stAppViewContainer"] { background: #f8fafc; }
.metric-card {
    background: white;
    border-radius: 12px;
    padding: 1.2rem 1.5rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    text-align: center;
}
.metric-card .value { font-size: 2rem; font-weight: 700; color: #6366f1; }
.metric-card .label { font-size: 0.8rem; color: #64748b; margin-top: 0.2rem; }
.insight-box {
    background: white;
    border-left: 4px solid #6366f1;
    border-radius: 0 10px 10px 0;
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.insight-box h4 { color: #1e293b; margin-bottom: 0.3rem; font-size: 0.95rem; }
.insight-box p  { color: #475569; font-size: 0.875rem; margin: 0; }
.rec-box {
    background: #f0fdf4;
    border-left: 4px solid #22c55e;
    border-radius: 0 10px 10px 0;
    padding: 1rem 1.25rem;
    margin-top: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.anomaly-box {
    background: #fff7ed;
    border-left: 4px solid #f97316;
    border-radius: 0 10px 10px 0;
    padding: 1rem 1.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.stTabs [data-baseweb="tab"] { font-weight: 600; }
</style>
""", unsafe_allow_html=True)


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/combo-chart.png", width=60)
    st.title("AI Business Insights")
    st.caption("Powered by Claude · scikit-learn · pandas")
    st.divider()

    api_key = st.text_input(
        "Anthropic API Key",
        type="password",
        placeholder="sk-ant-...",
        help="Your key is never stored. Get one at console.anthropic.com",
    )

    st.divider()
    uploaded_file = st.file_uploader(
        "Upload your CSV",
        type=["csv"],
        help="Sales, inventory, customer records — any structured CSV works.",
    )

    st.caption("👇 No data? Try the sample file.")
    use_sample = st.button("Load sample sales data", use_container_width=True)

    st.divider()
    st.markdown("**About**")
    st.caption(
        "This tool uses machine learning anomaly detection and the Anthropic Claude API "
        "to turn raw business data into clear, actionable insights — no data science knowledge required."
    )


# ── Load data ─────────────────────────────────────────────────────────────────
df = None

if use_sample:
    try:
        df = pd.read_csv("sample_data/sales_sample.csv")
        st.session_state["df"] = df
        st.session_state["filename"] = "sales_sample.csv"
        st.session_state["insights"] = None
        st.session_state["messages"] = []
    except FileNotFoundError:
        st.error("Sample file not found. Please upload your own CSV.")

if uploaded_file:
    df = pd.read_csv(uploaded_file)
    st.session_state["df"] = df
    st.session_state["filename"] = uploaded_file.name
    st.session_state["insights"] = None
    st.session_state["messages"] = []

if "df" in st.session_state:
    df = st.session_state["df"]


# ── Main content ──────────────────────────────────────────────────────────────
if df is None:
    # Landing state
    st.markdown("## Welcome to AI Business Insights 👋")
    st.markdown(
        "Upload a CSV file in the sidebar (or load the sample) to get started. "
        "You'll receive an **AI-generated executive summary**, **anomaly detection**, "
        "**key business insights**, and a **chat interface** to ask follow-up questions about your data."
    )
    col1, col2, col3 = st.columns(3)
    with col1:
        st.info("📁 **Upload any CSV**\nSales, inventory, CRM exports — any structured data.")
    with col2:
        st.info("🤖 **AI-powered analysis**\nClaude reads your data and explains what matters.")
    with col3:
        st.info("💬 **Chat with your data**\nAsk follow-up questions in plain English.")
    st.stop()


# ── Data loaded — show tabs ───────────────────────────────────────────────────
filename = st.session_state.get("filename", "your data")
st.markdown(f"### 📂 {filename} — {len(df):,} rows · {len(df.columns)} columns")

summary, anomaly_info = analyse_csv(df)
charts = get_charts(df)

tab_overview, tab_insights, tab_anomalies, tab_chat = st.tabs([
    "📋 Overview", "💡 AI Insights", "⚠️ Anomalies", "💬 Chat with Data"
])


# ── TAB 1: Overview ───────────────────────────────────────────────────────────
with tab_overview:
    st.subheader("Dataset Overview")

    c1, c2, c3, c4 = st.columns(4)
    c1.markdown(f'<div class="metric-card"><div class="value">{summary["row_count"]:,}</div><div class="label">Rows</div></div>', unsafe_allow_html=True)
    c2.markdown(f'<div class="metric-card"><div class="value">{summary["column_count"]}</div><div class="label">Columns</div></div>', unsafe_allow_html=True)
    c3.markdown(f'<div class="metric-card"><div class="value">{summary["anomaly_count"]}</div><div class="label">Anomalies</div></div>', unsafe_allow_html=True)
    c4.markdown(f'<div class="metric-card"><div class="value">{len(summary["missing_values"])}</div><div class="label">Columns with Missing Data</div></div>', unsafe_allow_html=True)

    st.divider()

    col_left, col_right = st.columns([1.2, 1])

    with col_left:
        st.markdown("**Data Preview**")
        st.dataframe(df.head(10), use_container_width=True, height=280)

    with col_right:
        st.markdown("**Column Types**")
        type_df = pd.DataFrame({
            "Column": df.columns,
            "Type": [str(t) for t in df.dtypes],
            "Missing": [int(df[c].isnull().sum()) for c in df.columns],
            "Unique": [int(df[c].nunique()) for c in df.columns],
        })
        st.dataframe(type_df, use_container_width=True, hide_index=True, height=280)

    if charts:
        st.divider()
        st.markdown("**Numeric Distributions**")
        chart_cols = st.columns(min(len(charts), 3))
        for i, (col_name, chart_data) in enumerate(list(charts.items())[:3]):
            with chart_cols[i]:
                st.markdown(f"*{col_name}*")
                st.bar_chart(chart_data, height=180)

    if summary.get("top_correlations"):
        st.divider()
        st.markdown("**Top Correlations**")
        for c in summary["top_correlations"]:
            bar = "█" * int(abs(c["correlation"]) * 20)
            st.markdown(f"`{c['columns']}` &nbsp; {bar} &nbsp; **{c['correlation']}**")


# ── TAB 2: AI Insights ────────────────────────────────────────────────────────
with tab_insights:
    st.subheader("AI-Generated Business Insights")

    if not api_key:
        st.warning("Enter your Anthropic API key in the sidebar to generate insights.")
        st.stop()

    # Generate insights button or show cached
    if st.session_state.get("insights") is None:
        if st.button("✨ Generate Insights", type="primary", use_container_width=True):
            with st.spinner("Analysing your data with Claude..."):
                placeholder = st.empty()
                full_text = ""
                insights_raw = ""

                # Stream the response
                with placeholder.container():
                    stream_box = st.empty()
                    for chunk in stream_insights(summary, api_key):
                        full_text += chunk
                        stream_box.markdown(f"```\n{full_text}▌\n```")
                    stream_box.empty()

                # Parse JSON
                try:
                    clean = full_text.strip()
                    if clean.startswith("```"):
                        clean = clean.split("```")[1]
                        if clean.startswith("json"):
                            clean = clean[4:]
                    insights = json.loads(clean.strip())
                    st.session_state["insights"] = insights
                    st.session_state["summary_str"] = json.dumps(summary, default=str)
                    st.rerun()
                except Exception as e:
                    st.error(f"Could not parse Claude's response. Raw output:\n\n{full_text}")
    else:
        insights = st.session_state["insights"]

        # Executive summary
        st.markdown("#### Executive Summary")
        st.markdown(
            f'<div class="insight-box" style="border-left-color:#6366f1">'
            f'<p style="font-size:1rem">{insights.get("executive_summary","")}</p></div>',
            unsafe_allow_html=True
        )

        st.markdown("#### Key Insights")
        for item in insights.get("insights", []):
            st.markdown(
                f'<div class="insight-box"><h4>{item.get("title","")}</h4>'
                f'<p>{item.get("detail","")}</p></div>',
                unsafe_allow_html=True
            )

        st.markdown(
            f'<div class="rec-box"><strong>🎯 Strategic Recommendation</strong><br/>'
            f'<span style="color:#166534">{insights.get("recommendation","")}</span></div>',
            unsafe_allow_html=True
        )

        if st.button("🔄 Regenerate Insights"):
            st.session_state["insights"] = None
            st.rerun()


# ── TAB 3: Anomalies ──────────────────────────────────────────────────────────
with tab_anomalies:
    st.subheader("Anomaly Detection")
    st.caption("Using scikit-learn Isolation Forest — flags rows that deviate significantly from expected patterns.")

    count = summary.get("anomaly_count", 0)

    if count == 0:
        st.success("✅ No significant anomalies detected in this dataset.")
    else:
        st.markdown(
            f'<div class="anomaly-box"><strong>⚠️ {count} anomalous rows detected</strong><br/>'
            f'<span style="color:#9a3412">These rows contain values that deviate significantly from the rest of the dataset. '
            f'Review them for data quality issues, unusual transactions, or business opportunities.</span></div>',
            unsafe_allow_html=True
        )
        st.divider()

        anomaly_rows = summary.get("anomaly_sample", [])
        if anomaly_rows:
            st.markdown(f"**Sample anomalous rows** (showing up to 5 of {count})")
            st.dataframe(pd.DataFrame(anomaly_rows), use_container_width=True, hide_index=True)

        # AI explanation of anomalies
        if api_key and st.session_state.get("insights"):
            insights = st.session_state["insights"]
            anomaly_text = insights.get("anomalies", "")
            if anomaly_text:
                st.divider()
                st.markdown("**Claude's Analysis**")
                st.markdown(
                    f'<div class="anomaly-box">{anomaly_text}</div>',
                    unsafe_allow_html=True
                )
        elif api_key:
            st.info("Generate insights in the AI Insights tab to see Claude's anomaly analysis here.")


# ── TAB 4: Chat ───────────────────────────────────────────────────────────────
with tab_chat:
    st.subheader("Chat with Your Data")
    st.caption("Ask Claude anything about your dataset in plain English.")

    if not api_key:
        st.warning("Enter your Anthropic API key in the sidebar to use the chat.")
        st.stop()

    # Initialise messages
    if "messages" not in st.session_state:
        st.session_state["messages"] = []

    # Render history
    for msg in st.session_state["messages"]:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # Input
    if prompt := st.chat_input("Ask a question about your data..."):
        st.session_state["messages"].append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            response_placeholder = st.empty()
            full_response = ""
            for chunk in stream_chat(
                prompt,
                st.session_state["messages"],
                json.dumps(summary, default=str),
                api_key
            ):
                full_response += chunk
                response_placeholder.markdown(full_response + "▌")
            response_placeholder.markdown(full_response)

        st.session_state["messages"].append({"role": "assistant", "content": full_response})
