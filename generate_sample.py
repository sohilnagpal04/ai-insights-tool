"""Generate sample datasets for AI Insights Tool demo."""
import csv
import random
from datetime import date, timedelta
import os

random.seed(42)

os.makedirs("sample_data", exist_ok=True)

# ── Original sales sample ─────────────────────────────────────────────────────
products  = ["Widget A", "Widget B", "Gadget Pro", "Gadget Lite", "Service Pack"]
regions   = ["Victoria", "New South Wales", "Queensland", "Western Australia", "South Australia"]
customers = [f"CUST{str(i).zfill(4)}" for i in range(1, 51)]

rows = []
start_date = date(2024, 1, 1)
for i in range(200):
    d        = start_date + timedelta(days=random.randint(0, 364))
    product  = random.choice(products)
    region   = random.choice(regions)
    customer = random.choice(customers)
    units    = random.randint(1, 50)
    price    = round(random.uniform(20, 200), 2)
    revenue  = round(units * price, 2)
    return_rate = round(random.uniform(0, 0.1), 3)
    if i in [15, 42, 88, 130, 175]:
        revenue = round(revenue * 10, 2)
        units   = random.randint(200, 500)
    rows.append([d, product, region, customer, units, price, revenue, return_rate])

with open("sample_data/sales_sample.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["date", "product", "region", "customer_id",
                "units_sold", "unit_price", "revenue", "return_rate"])
    w.writerows(rows)
print("sales_sample.csv done")

# ── Rich marketing analytics sample ──────────────────────────────────────────
CAMPAIGNS  = ['Email', 'Paid Search', 'Social Media', 'Display', 'Referral']
CHANNELS   = ['Google', 'Facebook', 'Instagram', 'LinkedIn', 'Organic']
COUNTRIES  = ['Australia', 'United States', 'United Kingdom', 'Canada', 'Singapore']
INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Education']
PLANS      = ['Starter', 'Growth', 'Enterprise']

CHANNEL_MULT = {'Google': 1.3, 'LinkedIn': 1.1, 'Facebook': 0.9, 'Instagram': 0.7, 'Organic': 1.5}
PLAN_ARPU    = {'Starter': 49, 'Growth': 199, 'Enterprise': 999}
PLAN_SAT     = {'Starter': 3.2, 'Growth': 3.8, 'Enterprise': 4.4}

mrows = []
for i in range(400):
    d        = start_date + timedelta(days=random.randint(0, 364))
    campaign = random.choice(CAMPAIGNS)
    channel  = random.choice(CHANNELS)
    country  = random.choice(COUNTRIES)
    industry = random.choice(INDUSTRIES)
    plan     = random.choice(PLANS)

    spend       = round(random.uniform(200, 8000), 2)
    cpc         = round(random.uniform(0.5, 12.0), 2)
    clicks      = int(spend / cpc)
    ctr         = round(random.uniform(0.01, 0.12), 4)
    impressions = int(clicks / max(ctr, 0.001))
    leads       = max(1, int(spend * CHANNEL_MULT.get(channel, 1.0) * random.uniform(0.04, 0.12)))
    conv_rate   = round(random.uniform(0.05, 0.30), 4)
    conversions = max(0, int(leads * conv_rate))
    revenue     = round(conversions * PLAN_ARPU.get(plan, 99) * random.uniform(0.85, 1.2), 2)
    satisfaction = round(min(5.0, max(1.0, PLAN_SAT.get(plan, 3.5) + random.gauss(0, 0.4))), 1)
    churn_risk  = round(min(1.0, max(0.0, (5 - satisfaction) / 5 + random.gauss(0, 0.08))), 3)

    mrows.append([
        d.strftime('%Y-%m-%d'), campaign, channel, country, industry, plan,
        impressions, clicks, spend, cpc, round(ctr * 100, 2),
        leads, conversions, round(conv_rate * 100, 2),
        revenue, satisfaction, round(churn_risk * 100, 2),
    ])

# Inject anomalies
for idx in random.sample(range(len(mrows)), 4):
    mrows[idx][8]  = round(random.uniform(40000, 80000), 2)
    mrows[idx][14] = round(random.uniform(80000, 150000), 2)
for idx in random.sample(range(len(mrows)), 4):
    mrows[idx][12] = 0
    mrows[idx][14] = 0.0
    mrows[idx][8]  = round(random.uniform(15000, 25000), 2)
for idx in random.sample(range(len(mrows)), 4):
    mrows[idx][15] = 5.0
    mrows[idx][16] = round(random.uniform(0.80, 0.99), 3)

# Inject missing values
for _ in range(20):
    mrows[random.randint(0, len(mrows) - 1)][random.randint(6, 10)] = ''

with open("sample_data/marketing_sample.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow([
        'date', 'campaign', 'channel', 'country', 'industry', 'plan',
        'impressions', 'clicks', 'spend', 'cpc', 'ctr_pct',
        'leads', 'conversions', 'conversion_rate_pct',
        'revenue', 'satisfaction_score', 'churn_risk_pct',
    ])
    w.writerows(mrows)
print("marketing_sample.csv done")
