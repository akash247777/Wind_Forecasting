import sqlite3
from typing import Generator
from backend.app.config import settings

def get_db():
    conn = sqlite3.connect(settings.DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Wind actuals table (from FUELHH)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wind_actuals (
        start_time TEXT PRIMARY KEY,
        settlement_date TEXT NOT NULL,
        settlement_period INTEGER NOT NULL,
        generation REAL NOT NULL,
        publish_time TEXT
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_actuals_date ON wind_actuals(settlement_date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_actuals_sp ON wind_actuals(settlement_date, settlement_period);")

    # Wind forecasts table (from WINDFOR)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wind_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        publish_time TEXT NOT NULL,
        start_time TEXT NOT NULL,
        generation REAL NOT NULL,
        UNIQUE(publish_time, start_time)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_start ON wind_forecasts(start_time);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_publish ON wind_forecasts(publish_time);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_forecasts_start_pub ON wind_forecasts(start_time, publish_time);")

    # Cache metadata table for sync tracking
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
    );
    """)
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", settings.DATABASE_PATH)
