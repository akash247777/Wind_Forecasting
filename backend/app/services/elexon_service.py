import sqlite3
import urllib.request
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from backend.app.config import settings
from backend.app.database import get_connection

logger = logging.getLogger(__name__)

class ElexonService:
    def __init__(self):
        self.base_url = settings.ELEXON_API_BASE

    def fetch_actuals_from_api(self, date_from: str, date_to: str) -> List[Dict[str, Any]]:
        """Fetch actual wind generation from FUELHH dataset for a given date range."""
        url = f"{self.base_url}/datasets/FUELHH/stream?settlementDateFrom={date_from}&settlementDateTo={date_to}"
        logger.info(f"Fetching FUELHH from {url}")
        req = urllib.request.Request(url, headers={"User-Agent": "WindForecastingApp/1.0"})
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        # Filter for WIND only
        wind_records = [
            {
                "startTime": d["startTime"],
                "settlementDate": d.get("settlementDate", d["startTime"][:10]),
                "settlementPeriod": int(d.get("settlementPeriod", 1)),
                "generation": float(d.get("generation", 0.0)),
                "publishTime": d.get("publishTime")
            }
            for d in data
            if d.get("fuelType") == "WIND"
        ]
        return wind_records

    def save_actuals_to_db(self, records: List[Dict[str, Any]]) -> int:
        """Upsert wind actuals into the SQLite database."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.executemany(
            """
            INSERT INTO wind_actuals (start_time, settlement_date, settlement_period, generation, publish_time)
            VALUES (:startTime, :settlementDate, :settlementPeriod, :generation, :publishTime)
            ON CONFLICT(start_time) DO UPDATE SET
                generation=excluded.generation,
                publish_time=excluded.publish_time;
            """,
            records
        )
        conn.commit()
        count = cursor.rowcount
        conn.close()
        return count

    def fetch_forecasts_from_api(self, publish_from: str, publish_to: str) -> List[Dict[str, Any]]:
        """Fetch wind forecasts from WINDFOR dataset for a given publishTime window."""
        url = f"{self.base_url}/datasets/WINDFOR/stream?publishDateTimeFrom={publish_from}&publishDateTimeTo={publish_to}"
        logger.info(f"Fetching WINDFOR from {url}")
        req = urllib.request.Request(url, headers={"User-Agent": "WindForecastingApp/1.0"})
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        records = [
            {
                "publishTime": d["publishTime"],
                "startTime": d["startTime"],
                "generation": float(d.get("generation", 0.0))
            }
            for d in data
            if "startTime" in d and "publishTime" in d
        ]
        return records

    def save_forecasts_to_db(self, records: List[Dict[str, Any]]) -> int:
        """Upsert wind forecasts into the SQLite database."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.executemany(
            """
            INSERT INTO wind_forecasts (publish_time, start_time, generation)
            VALUES (:publishTime, :startTime, :generation)
            ON CONFLICT(publish_time, start_time) DO UPDATE SET
                generation=excluded.generation;
            """,
            records
        )
        conn.commit()
        count = cursor.rowcount
        conn.close()
        return count

    def get_actuals(self, date_from: str, date_to: str) -> List[Dict[str, Any]]:
        """Retrieve stored actuals between settlement dates."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT start_time, settlement_date, settlement_period, generation, publish_time
            FROM wind_actuals
            WHERE settlement_date >= ? AND settlement_date <= ?
            ORDER BY start_time ASC;
            """,
            (date_from, date_to)
        )
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "startTime": r["start_time"],
                "settlementDate": r["settlement_date"],
                "settlementPeriod": r["settlement_period"],
                "generation": r["generation"],
                "publishTime": r["publish_time"]
            }
            for r in rows
        ]

    def get_forecasts_at_cutoff(self, start_time_from: str, start_time_to: str, cutoff_time: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get the latest available forecast for each startTime published at or prior to cutoff_time.
        If cutoff_time is None, returns the absolute latest forecast for each startTime.
        """
        conn = get_connection()
        cursor = conn.cursor()

        if cutoff_time:
            query = """
            SELECT f.start_time, f.generation, f.publish_time
            FROM wind_forecasts f
            INNER JOIN (
                SELECT start_time, MAX(publish_time) AS max_pub
                FROM wind_forecasts
                WHERE publish_time <= ?
                  AND start_time >= ?
                  AND start_time <= ?
                GROUP BY start_time
            ) latest ON f.start_time = latest.start_time AND f.publish_time = latest.max_pub
            ORDER BY f.start_time ASC;
            """
            cursor.execute(query, (cutoff_time, start_time_from, start_time_to))
        else:
            query = """
            SELECT f.start_time, f.generation, f.publish_time
            FROM wind_forecasts f
            INNER JOIN (
                SELECT start_time, MAX(publish_time) AS max_pub
                FROM wind_forecasts
                WHERE start_time >= ?
                  AND start_time <= ?
                GROUP BY start_time
            ) latest ON f.start_time = latest.start_time AND f.publish_time = latest.max_pub
            ORDER BY f.start_time ASC;
            """
            cursor.execute(query, (start_time_from, start_time_to))

        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "startTime": r["start_time"],
                "generation": r["generation"],
                "publishTime": r["publish_time"]
            }
            for r in rows
        ]

    def get_all_forecasts_for_delivery(self, start_time_from: str, start_time_to: str) -> List[Dict[str, Any]]:
        """Get all forecast versions across all publish times for the target delivery period."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT start_time, publish_time, generation
            FROM wind_forecasts
            WHERE start_time >= ? AND start_time <= ?
            ORDER BY start_time ASC, publish_time ASC;
            """,
            (start_time_from, start_time_to)
        )
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "startTime": r["start_time"],
                "publishTime": r["publish_time"],
                "generation": r["generation"]
            }
            for r in rows
        ]

    def get_data_counts(self) -> Dict[str, Any]:
        """Check row counts and date ranges in database."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*), MIN(settlement_date), MAX(settlement_date) FROM wind_actuals;")
        act_row = cursor.fetchone()
        cursor.execute("SELECT COUNT(*), MIN(publish_time), MAX(publish_time), MIN(start_time), MAX(start_time) FROM wind_forecasts;")
        fc_row = cursor.fetchone()
        conn.close()
        return {
            "actualsCount": act_row[0] if act_row else 0,
            "actualsMinDate": act_row[1] if act_row else None,
            "actualsMaxDate": act_row[2] if act_row else None,
            "forecastsCount": fc_row[0] if fc_row else 0,
            "forecastsMinPublish": fc_row[1] if fc_row else None,
            "forecastsMaxPublish": fc_row[2] if fc_row else None,
            "forecastsMinStart": fc_row[3] if fc_row else None,
            "forecastsMaxStart": fc_row[4] if fc_row else None
        }

elexon_service = ElexonService()
