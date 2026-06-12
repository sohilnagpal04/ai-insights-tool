"""Business-specific analysis for HubSpot CRM data."""
from datetime import datetime, timezone
import pandas as pd

DEAL_STAGE_ORDER = [
    "appointmentscheduled",
    "qualifiedtobuy",
    "presentationscheduled",
    "decisionmakerboughtin",
    "contractsent",
    "closedwon",
    "closedlost",
]

STAGE_LABELS = {
    "appointmentscheduled":   "Appt Scheduled",
    "qualifiedtobuy":         "Qualified",
    "presentationscheduled":  "Presentation",
    "decisionmakerboughtin":  "Decision Maker",
    "contractsent":           "Contract Sent",
    "closedwon":              "Closed Won",
    "closedlost":             "Closed Lost",
}

LIFECYCLE_ORDER = [
    "subscriber", "lead", "marketingqualifiedlead",
    "salesqualifiedlead", "opportunity", "customer", "evangelist",
]

LIFECYCLE_LABELS = {
    "subscriber":             "Subscriber",
    "lead":                   "Lead",
    "marketingqualifiedlead": "MQL",
    "salesqualifiedlead":     "SQL",
    "opportunity":            "Opportunity",
    "customer":               "Customer",
    "evangelist":             "Evangelist",
}


def _now():
    return datetime.now(timezone.utc)


def _to_float(series):
    return pd.to_numeric(series, errors="coerce")


# ── Deals ─────────────────────────────────────────────────────────────────────

def analyse_deals(df: pd.DataFrame) -> dict:
    df = df.copy()
    df["amount"] = _to_float(df.get("amount", 0)).fillna(0)
    df["hs_deal_stage_probability"] = _to_float(df.get("hs_deal_stage_probability", 0)).fillna(0)

    for col in ["closedate", "createdate"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce", utc=True)

    now = _now()

    # Pipeline by stage
    pipeline = []
    for stage in DEAL_STAGE_ORDER:
        subset = df[df.get("dealstage", pd.Series(dtype=str)) == stage] if "dealstage" in df else pd.DataFrame()
        pipeline.append({
            "stage":  stage,
            "label":  STAGE_LABELS.get(stage, stage),
            "count":  int(len(subset)),
            "value":  round(float(subset["amount"].sum()), 2),
        })

    # Active deals (exclude closed)
    active = df[~df.get("dealstage", pd.Series(dtype=str)).isin(["closedwon", "closedlost"])] \
        if "dealstage" in df else df

    total_pipeline   = round(float(active["amount"].sum()), 2)
    weighted_pipeline = round(float(
        (active["amount"] * active["hs_deal_stage_probability"]).sum()
    ), 2)
    avg_deal_size    = round(float(active["amount"].replace(0, pd.NA).dropna().mean() or 0), 2)

    # Win / loss rate
    won  = int((df.get("dealstage", pd.Series(dtype=str)) == "closedwon").sum())  if "dealstage" in df else 0
    lost = int((df.get("dealstage", pd.Series(dtype=str)) == "closedlost").sum()) if "dealstage" in df else 0
    closed = won + lost
    win_rate = round((won / closed * 100) if closed > 0 else 0, 1)

    # At-risk deals
    at_risk = []
    if "closedate" in df.columns and "dealstage" in df.columns:
        overdue = active[
            active["closedate"].notna() &
            (active["closedate"] < pd.Timestamp(now)) &
            (active["amount"] > 0)
        ].copy()
        overdue["days_overdue"] = (now - overdue["closedate"]).dt.days
        for _, row in overdue.nlargest(5, "amount").iterrows():
            at_risk.append({
                "name":        str(row.get("dealname", "—")),
                "amount":      float(row["amount"]),
                "stage":       STAGE_LABELS.get(str(row.get("dealstage", "")), str(row.get("dealstage", ""))),
                "days_overdue": int(row["days_overdue"]),
                "risk":        "Overdue",
            })

    # No close date set
    if "closedate" in df.columns and len(at_risk) < 8:
        no_date = active[active["closedate"].isna() & (active["amount"] > 0)]
        for _, row in no_date.nlargest(3, "amount").iterrows():
            at_risk.append({
                "name":   str(row.get("dealname", "—")),
                "amount": float(row["amount"]),
                "stage":  STAGE_LABELS.get(str(row.get("dealstage", "")), str(row.get("dealstage", ""))),
                "days_overdue": None,
                "risk":   "No Close Date",
            })

    return {
        "source_type":        "hubspot_deals",
        "total_pipeline":     total_pipeline,
        "weighted_pipeline":  weighted_pipeline,
        "avg_deal_size":      avg_deal_size,
        "win_rate":           win_rate,
        "open_deals":         int(len(active)),
        "won_deals":          won,
        "lost_deals":         lost,
        "pipeline_by_stage":  pipeline,
        "at_risk_deals":      at_risk,
    }


# ── Contacts ──────────────────────────────────────────────────────────────────

def analyse_contacts(df: pd.DataFrame) -> dict:
    df = df.copy()

    # Lifecycle funnel
    funnel = []
    for stage in LIFECYCLE_ORDER:
        col = "lifecyclestage"
        count = int((df[col] == stage).sum()) if col in df.columns else 0
        funnel.append({"stage": stage, "label": LIFECYCLE_LABELS.get(stage, stage), "count": count})

    # Lead status breakdown
    lead_status = {}
    if "hs_lead_status" in df.columns:
        for val, cnt in df["hs_lead_status"].value_counts().items():
            if pd.notna(val):
                lead_status[str(val)] = int(cnt)

    # Top countries
    top_countries = {}
    if "country" in df.columns:
        for val, cnt in df["country"].value_counts().head(6).items():
            if pd.notna(val):
                top_countries[str(val)] = int(cnt)

    # Top job titles
    top_titles = {}
    if "jobtitle" in df.columns:
        for val, cnt in df["jobtitle"].value_counts().head(6).items():
            if pd.notna(val):
                top_titles[str(val)] = int(cnt)

    customers  = sum(1 for s in (df.get("lifecyclestage", pd.Series(dtype=str))) if s == "customer")
    mqls       = sum(1 for s in (df.get("lifecyclestage", pd.Series(dtype=str))) if s == "marketingqualifiedlead")
    sqls       = sum(1 for s in (df.get("lifecyclestage", pd.Series(dtype=str))) if s == "salesqualifiedlead")
    total      = len(df)
    conv_rate  = round((customers / total * 100) if total > 0 else 0, 1)

    return {
        "source_type":      "hubspot_contacts",
        "total_contacts":   total,
        "customers":        customers,
        "mqls":             mqls,
        "sqls":             sqls,
        "conversion_rate":  conv_rate,
        "lifecycle_funnel": funnel,
        "lead_status":      lead_status,
        "top_countries":    top_countries,
        "top_job_titles":   top_titles,
    }


# ── Companies ─────────────────────────────────────────────────────────────────

def analyse_companies(df: pd.DataFrame) -> dict:
    df = df.copy()
    df["annualrevenue"]     = _to_float(df.get("annualrevenue"))
    df["numberofemployees"] = _to_float(df.get("numberofemployees"))

    # Industry breakdown
    industries = {}
    if "industry" in df.columns:
        for val, cnt in df["industry"].value_counts().head(8).items():
            if pd.notna(val):
                industries[str(val)] = int(cnt)

    # Country breakdown
    countries = {}
    if "country" in df.columns:
        for val, cnt in df["country"].value_counts().head(6).items():
            if pd.notna(val):
                countries[str(val)] = int(cnt)

    # Size segments
    def size_band(n):
        if pd.isna(n):   return "Unknown"
        if n < 10:       return "1–9"
        if n < 50:       return "10–49"
        if n < 200:      return "50–199"
        if n < 1000:     return "200–999"
        return "1000+"

    size_dist = {}
    if "numberofemployees" in df.columns:
        for val, cnt in df["numberofemployees"].map(size_band).value_counts().items():
            size_dist[str(val)] = int(cnt)

    avg_revenue = round(float(df["annualrevenue"].dropna().mean() or 0), 2)
    total_revenue = round(float(df["annualrevenue"].dropna().sum()), 2)

    return {
        "source_type":       "hubspot_companies",
        "total_companies":   len(df),
        "avg_annual_revenue": avg_revenue,
        "total_revenue":     total_revenue,
        "industries":        industries,
        "countries":         countries,
        "size_distribution": size_dist,
    }


ANALYSERS = {
    "deals":     analyse_deals,
    "contacts":  analyse_contacts,
    "companies": analyse_companies,
}
