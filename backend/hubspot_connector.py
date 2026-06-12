import os
import requests
import pandas as pd
from dotenv import load_dotenv

HUBSPOT_BASE = "https://api.hubapi.com"

CONTACT_PROPS = [
    "firstname", "lastname", "email", "phone", "company",
    "lifecyclestage", "hs_lead_status", "createdate", "lastmodifieddate",
    "city", "country", "jobtitle", "numemployees",
]

DEAL_PROPS = [
    "dealname", "amount", "dealstage", "pipeline", "closedate",
    "createdate", "hs_deal_stage_probability", "hubspot_owner_id",
]

COMPANY_PROPS = [
    "name", "domain", "industry", "city", "country",
    "numberofemployees", "annualrevenue", "createdate", "hs_lead_status",
]


def _token() -> str:
    load_dotenv(override=True)
    token = os.environ.get("HUBSPOT_ACCESS_TOKEN")
    if not token:
        raise RuntimeError("HUBSPOT_ACCESS_TOKEN is not set.")
    return token


def _headers() -> dict:
    return {"Authorization": f"Bearer {_token()}", "Content-Type": "application/json"}


def _fetch_all(endpoint: str, props: list[str]) -> list[dict]:
    url = f"{HUBSPOT_BASE}{endpoint}"
    params = {"limit": 100, "properties": ",".join(props)}
    records = []
    after = None
    while True:
        if after:
            params["after"] = after
        res = requests.get(url, headers=_headers(), params=params, timeout=15)
        res.raise_for_status()
        data = res.json()
        for result in data.get("results", []):
            row = {"id": result.get("id")}
            row.update(result.get("properties", {}))
            records.append(row)
        paging = data.get("paging", {})
        after = paging.get("next", {}).get("after")
        if not after:
            break
    return records


def fetch_contacts() -> pd.DataFrame:
    records = _fetch_all("/crm/v3/objects/contacts", CONTACT_PROPS)
    df = pd.DataFrame(records)
    for col in ["createdate", "lastmodifieddate"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")
    return df


def fetch_deals() -> pd.DataFrame:
    records = _fetch_all("/crm/v3/objects/deals", DEAL_PROPS)
    df = pd.DataFrame(records)
    for col in ["amount", "hs_deal_stage_probability"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    for col in ["closedate", "createdate"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")
    return df


def fetch_companies() -> pd.DataFrame:
    records = _fetch_all("/crm/v3/objects/companies", COMPANY_PROPS)
    df = pd.DataFrame(records)
    for col in ["numberofemployees", "annualrevenue"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    if "createdate" in df.columns:
        df["createdate"] = pd.to_datetime(df["createdate"], errors="coerce")
    return df


FETCHERS = {
    "contacts":  (fetch_contacts,  "hubspot_contacts.csv"),
    "deals":     (fetch_deals,     "hubspot_deals.csv"),
    "companies": (fetch_companies, "hubspot_companies.csv"),
}
