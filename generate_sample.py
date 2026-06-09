import csv
import random
from datetime import date, timedelta
import os

random.seed(42)

products = ["Widget A", "Widget B", "Gadget Pro", "Gadget Lite", "Service Pack"]
regions = ["Victoria", "New South Wales", "Queensland", "Western Australia", "South Australia"]
customers = [f"CUST{str(i).zfill(4)}" for i in range(1, 51)]

rows = []
start_date = date(2024, 1, 1)

for i in range(200):
    d = start_date + timedelta(days=random.randint(0, 364))
    product = random.choice(products)
    region = random.choice(regions)
    customer = random.choice(customers)
    units = random.randint(1, 50)
    price = round(random.uniform(20, 200), 2)
    revenue = round(units * price, 2)
    return_rate = round(random.uniform(0, 0.1), 3)

    # Inject anomalies
    if i in [15, 42, 88, 130, 175]:
        revenue = round(revenue * 10, 2)
        units = random.randint(200, 500)

    rows.append([d, product, region, customer, units, price, revenue, return_rate])

os.makedirs("sample_data", exist_ok=True)
with open("sample_data/sales_sample.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["date", "product", "region", "customer_id",
                     "units_sold", "unit_price", "revenue", "return_rate"])
    writer.writerows(rows)

print("✅ sample_data/sales_sample.csv created — 200 rows, 5 injected anomalies.")
