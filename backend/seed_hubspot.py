import requests
import random
from datetime import datetime, timedelta

TOKEN = "pat-ap1-18e2d82c-f338-47ff-8c40-c7156e4d3b1b"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
BASE = "https://api.hubapi.com"

random.seed(99)

prefixes  = ["Alpha","Beta","Gamma","Delta","Sigma","Apex","Nova","Peak","Core","Edge","Titan","Vega"]
suffixes  = ["Solutions","Tech","Group","Partners","Systems","Digital","Global","Ventures","Labs","Co"]
industries = ["COMPUTER_SOFTWARE","HOSPITAL_HEALTH_CARE","FINANCIAL_SERVICES","RETAIL","MECHANICAL_OR_INDUSTRIAL_ENGINEERING","EDUCATION_MANAGEMENT","REAL_ESTATE","INFORMATION_TECHNOLOGY_AND_SERVICES","MARKETING_AND_ADVERTISING","MANAGEMENT_CONSULTING"]
cities     = ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Auckland","Singapore"]
countries  = ["Australia","New Zealand","Singapore","United Kingdom","United States"]

# ── Companies ─────────────────────────────────────────────────────────────
companies = []
for i in range(40):
    companies.append({"properties": {
        "name":            f"{random.choice(prefixes)} {random.choice(suffixes)}",
        "industry":        random.choice(industries),
        "city":            random.choice(cities),
        "country":         random.choice(countries),
        "numberofemployees": str(random.randint(5, 2000)),
        "annualrevenue":   str(random.randint(100000, 50000000)),
        "domain":          f"company{i+1}.com",
    }})

r = requests.post(f"{BASE}/crm/v3/objects/companies/batch/create",
                  headers=HEADERS, json={"inputs": companies})
resp = r.json()
if r.status_code not in (200, 201):
    print(f"Company error {r.status_code}: {str(resp)[:400]}")
comp_results = resp.get("results", [])
print(f"Companies created: {len(comp_results)}")

# ── Contacts ──────────────────────────────────────────────────────────────
first_names = ["James","Emma","Oliver","Ava","William","Sophia","Noah","Isabella",
               "Liam","Mia","Lucas","Charlotte","Henry","Amelia","Jack","Harper",
               "Ethan","Evelyn","Mason","Abigail","Grace","Elijah","Chloe","Logan"]
last_names  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
               "Wilson","Taylor","Anderson","Thomas","Jackson","White","Harris",
               "Martin","Thompson","Moore","Lee","Clark","Walker","Hall","Allen"]
stages   = ["subscriber","lead","marketingqualifiedlead","salesqualifiedlead",
            "opportunity","customer","evangelist"]
statuses = ["NEW","OPEN","IN_PROGRESS","OPEN_DEAL","UNQUALIFIED",
            "ATTEMPTED_TO_CONTACT","CONNECTED","BAD_TIMING"]
jobtitles = ["CEO","CTO","CFO","Sales Manager","Marketing Director",
             "Product Manager","Developer","Analyst","Consultant","VP Sales"]
domains   = ["gmail.com","outlook.com","company.com","business.io","corp.net"]

contacts = []
base_date = datetime(2024, 1, 1)
for i in range(100):
    fn      = random.choice(first_names)
    ln      = random.choice(last_names)
    created = base_date + timedelta(days=random.randint(0, 500))
    contacts.append({"properties": {
        "firstname":      fn,
        "lastname":       ln,
        "email":          f"{fn.lower()}.{ln.lower()}{random.randint(1,99)}@{random.choice(domains)}",
        "phone":          f"+61 4{random.randint(10,99)} {random.randint(100,999)} {random.randint(100,999)}",
        "company":        f"{random.choice(prefixes)} {random.choice(suffixes)}",
        "jobtitle":       random.choice(jobtitles),
        "city":           random.choice(cities),
        "country":        random.choice(countries),
        "lifecyclestage": random.choice(stages),
        "hs_lead_status": random.choice(statuses),
    }})

all_contact_ids = []
for chunk in [contacts[i:i+100] for i in range(0, len(contacts), 100)]:
    r = requests.post(f"{BASE}/crm/v3/objects/contacts/batch/create",
                      headers=HEADERS, json={"inputs": chunk})
    resp = r.json()
    if r.status_code not in (200, 201):
        print(f"Contact error {r.status_code}: {str(resp)[:400]}")
    all_contact_ids += [c["id"] for c in resp.get("results", [])]
print(f"Contacts created: {len(all_contact_ids)}")

# ── Deals ─────────────────────────────────────────────────────────────────
deal_stages = ["appointmentscheduled","qualifiedtobuy","presentationscheduled",
               "decisionmakerboughtin","contractsent","closedwon","closedlost"]
prob_map = {
    "appointmentscheduled": "0.2", "qualifiedtobuy": "0.4",
    "presentationscheduled": "0.6", "decisionmakerboughtin": "0.7",
    "contractsent": "0.9", "closedwon": "1.0", "closedlost": "0.0",
}
deal_adj  = ["Enterprise","Starter","Growth","Pro","Basic","Premium","Custom","Elite","Core"]
deal_noun = ["License","Contract","Subscription","Project","Retainer","Partnership","Agreement"]

deals = []
for i in range(80):
    created  = base_date + timedelta(days=random.randint(0, 400))
    close_dt = created + timedelta(days=random.randint(7, 180))
    stage    = random.choice(deal_stages)
    deals.append({"properties": {
        "dealname":  f"{random.choice(deal_adj)} {random.choice(deal_noun)} - {random.choice(last_names)}",
        "amount":    str(round(random.uniform(1000, 250000), 2)),
        "dealstage": stage,
        "pipeline":  "default",
        "closedate": close_dt.strftime("%Y-%m-%d"),
        "hs_deal_stage_probability": prob_map[stage],
    }})

all_deal_ids = []
for chunk in [deals[i:i+100] for i in range(0, len(deals), 100)]:
    r = requests.post(f"{BASE}/crm/v3/objects/deals/batch/create",
                      headers=HEADERS, json={"inputs": chunk})
    all_deal_ids += [d["id"] for d in r.json().get("results", [])]
print(f"Deals created: {len(all_deal_ids)}")
print("Done!")
