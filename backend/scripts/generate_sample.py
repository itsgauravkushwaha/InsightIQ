"""Utility: generate backend/uploads/sample_retail_sales.csv.

Run: `python scripts/generate_sample.py` from the backend directory.
Produces ~3,000 fictional retail rows with the columns listed in the
project brief. Deterministic via a fixed seed for reproducible builds.
"""
from __future__ import annotations

import csv
import random
from datetime import date, timedelta
from pathlib import Path

SEED = 42
ROW_COUNT = 3000
OUTPUT = Path(__file__).resolve().parent.parent / "uploads" / "sample_retail_sales.csv"

random.seed(SEED)

REGIONS = {
    "West":    [("California", "Los Angeles"), ("California", "San Francisco"), ("Washington", "Seattle"), ("Oregon", "Portland")],
    "East":    [("New York", "New York"), ("Massachusetts", "Boston"), ("Pennsylvania", "Philadelphia"), ("Florida", "Miami")],
    "Central": [("Illinois", "Chicago"), ("Texas", "Dallas"), ("Texas", "Austin"), ("Missouri", "Kansas City")],
    "South":   [("Georgia", "Atlanta"), ("Tennessee", "Nashville"), ("North Carolina", "Charlotte"), ("Louisiana", "New Orleans")],
}

SEGMENTS = ["Consumer", "Corporate", "Home Office", "Small Business"]

CATEGORIES = {
    "Technology": {
        "Phones":     [("Aurora X12 Smartphone", 899), ("Aurora Lite 5G", 549), ("Nimbus Pro Phone", 1099)],
        "Accessories":[("BraidedCharge USB-C Cable", 19), ("SonicPods Wireless Buds", 129), ("HyperDock 8-in-1 Hub", 79)],
        "Computers":  [("Vector 14 Laptop", 1399), ("Vector 16 Studio", 2199), ("Meridian Mini Desktop", 799)],
    },
    "Furniture": {
        "Chairs":    [("Halden Ergo Chair", 349), ("Kestrel Task Chair", 219), ("Loft Lounge Chair", 599)],
        "Tables":    [("Northwood Oak Desk", 489), ("Atlas Standing Desk", 649), ("Compass Meeting Table", 899)],
        "Storage":   [("Cirrus 3-Drawer Cabinet", 229), ("Ember Filing Unit", 179)],
    },
    "Office Supplies": {
        "Paper":     [("Silverleaf A4 Ream (500)", 8), ("HeavyStock Cardstock Pack", 14)],
        "Binders":   [("VaultBind 2\" Binder", 12), ("SlimEdge Ring Binder", 6)],
        "Writing":   [("Onyx Gel Pens (12-pack)", 15), ("Meridian Fineliners (6-pack)", 22)],
        "Storage":   [("StackWell Storage Bin", 24), ("ClearFile Document Tote", 32)],
    },
    "Apparel": {
        "Uniforms":  [("FieldOps Polo (M)", 34), ("FieldOps Polo (L)", 34), ("HighVis Softshell", 89)],
        "Footwear":  [("Trailmate Work Boots", 129), ("Portside Slip-On", 74)],
    },
}

SALESPEOPLE = ["Ava Nguyen", "Marcus Chen", "Priya Patel", "Sofia Rossi", "Liam O'Connor",
               "Noah Kim", "Elena Garcia", "Jonas Weber", "Yuki Tanaka", "Maya Sharma",
               "Diego Alvarez", "Chloe Dubois"]

PAYMENTS = ["Credit Card", "Debit Card", "PayPal", "Wire Transfer", "Purchase Order", "Apple Pay"]

FIRST = ["Alex", "Jamie", "Taylor", "Jordan", "Morgan", "Casey", "Riley", "Sam", "Drew", "Cameron",
         "Reese", "Avery", "Quinn", "Sasha", "Rowan", "Elliot", "Skyler", "Parker", "Hayden", "Emerson"]
LAST  = ["Bennett", "Carter", "Delgado", "Emerson", "Fitzgerald", "Garrison", "Holloway", "Ibarra",
         "Jansen", "Klein", "Lockhart", "Mercer", "Nash", "Ortega", "Pemberton", "Quintero",
         "Rowland", "Sinclair", "Thorne", "Underwood"]


def gen_customer() -> str:
    return f"{random.choice(FIRST)} {random.choice(LAST)}"


def gen_row(i: int) -> dict:
    start_date = date(2023, 1, 1)
    end_date = date(2024, 12, 31)
    days = (end_date - start_date).days
    order_date = start_date + timedelta(days=random.randint(0, days))

    region = random.choice(list(REGIONS.keys()))
    state, city = random.choice(REGIONS[region])
    segment = random.choice(SEGMENTS)

    category = random.choice(list(CATEGORIES.keys()))
    sub = random.choice(list(CATEGORIES[category].keys()))
    name, base_price = random.choice(CATEGORIES[category][sub])

    quantity = max(1, int(random.gauss(3.2, 2.1)))
    # Slight per-order price jitter to feel realistic
    unit_price = round(base_price * random.uniform(0.94, 1.08), 2)
    discount = round(random.choice([0, 0, 0, 0.05, 0.1, 0.1, 0.15, 0.2]), 2)
    sales = round(unit_price * quantity * (1 - discount), 2)
    cost = round(sales * random.uniform(0.55, 0.78), 2)
    profit = round(sales - cost, 2)

    return {
        "Order ID": f"ORD-{2023000 + i:07d}",
        "Order Date": order_date.isoformat(),
        "Region": region,
        "State": state,
        "City": city,
        "Customer Segment": segment,
        "Customer Name": gen_customer(),
        "Product Category": category,
        "Sub Category": sub,
        "Product Name": name,
        "Quantity": quantity,
        "Unit Price": unit_price,
        "Discount": discount,
        "Sales": sales,
        "Cost": cost,
        "Profit": profit,
        "Salesperson": random.choice(SALESPEOPLE),
        "Payment Method": random.choice(PAYMENTS),
    }


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    rows = [gen_row(i) for i in range(1, ROW_COUNT + 1)]
    fieldnames = list(rows[0].keys())
    with OUTPUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {OUTPUT}")


if __name__ == "__main__":
    main()
