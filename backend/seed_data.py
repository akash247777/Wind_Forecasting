import sys
import os
import time
from datetime import datetime, timedelta
from pathlib import Path

# Add root directory to python path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.config import settings
from backend.app.database import init_db, get_connection
from backend.app.services.elexon_service import elexon_service

def seed_january_2026_data():
    print("=" * 60)
    print("Seeding UK Wind Forecasting Database for January 2026")
    print("=" * 60)
    
    # Ensure database is initialized
    init_db()

    # 1. Fetch FUELHH Actuals
    print("\n[1/2] Fetching actual wind generation (FUELHH) for Jan 1 to Jan 31, 2026...")
    t0 = time.time()
    try:
        actuals = elexon_service.fetch_actuals_from_api("2026-01-01", "2026-01-31")
        print(f"-> Fetched {len(actuals)} wind actuals in {time.time() - t0:.2f}s")
        saved_act = elexon_service.save_actuals_to_db(actuals)
        print(f"-> Saved {saved_act} actual records to SQLite.")
    except Exception as e:
        print(f"Error fetching actuals: {e}")

    # 2. Fetch WINDFOR Forecasts in weekly chunks
    print("\n[2/2] Fetching wind forecasts (WINDFOR) published 2025-12-31 to 2026-02-01...")
    chunks = [
        ("2025-12-31T00:00:00Z", "2026-01-07T00:00:00Z"),
        ("2026-01-07T00:00:00Z", "2026-01-14T00:00:00Z"),
        ("2026-01-14T00:00:00Z", "2026-01-21T00:00:00Z"),
        ("2026-01-21T00:00:00Z", "2026-01-28T00:00:00Z"),
        ("2026-01-28T00:00:00Z", "2026-02-01T23:59:59Z"),
    ]

    total_forecasts = 0
    t_fc_start = time.time()
    for i, (p_from, p_to) in enumerate(chunks, 1):
        try:
            print(f"   Fetching chunk {i}/{len(chunks)} ({p_from[:10]} to {p_to[:10]})...", end=" ", flush=True)
            chunk_t0 = time.time()
            fc_records = elexon_service.fetch_forecasts_from_api(p_from, p_to)
            elexon_service.save_forecasts_to_db(fc_records)
            total_forecasts += len(fc_records)
            print(f"Done: {len(fc_records)} records ({time.time() - chunk_t0:.2f}s)")
        except Exception as e:
            print(f"Failed chunk {i}: {e}")

    print(f"-> Total forecasts fetched & saved: {total_forecasts} in {time.time() - t_fc_start:.2f}s")

    # 3. Print verification stats
    counts = elexon_service.get_data_counts()
    print("\n" + "=" * 60)
    print("Database Verification Summary:")
    print(f"  Actuals count:         {counts['actualsCount']} (Dates: {counts['actualsMinDate']} to {counts['actualsMaxDate']})")
    print(f"  Forecasts count:       {counts['forecastsCount']}")
    print(f"  Forecasts publish:     {counts['forecastsMinPublish']} to {counts['forecastsMaxPublish']}")
    print(f"  Forecasts target:      {counts['forecastsMinStart']} to {counts['forecastsMaxStart']}")
    print("=" * 60)
    print("Seeding complete! Database is ready for queries.")

if __name__ == "__main__":
    seed_january_2026_data()
