import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from root or current folder
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv()

class Settings:
    BASE_DIR: Path = BASE_DIR
    PROJECT_NAME: str = "UK Wind Power Day-Ahead Forecasting & Procurement Portal"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ELEXON_API_BASE: str = os.getenv("ELEXON_API_BASE", "https://data.elexon.co.uk/bmrs/api/v1")
    
    DATA_DIR: Path = BASE_DIR / "backend" / "data"
    DATABASE_PATH: Path = DATA_DIR / "wind_forecasting.db"
    
    # Day-ahead standard cutoff hour (UK Day-Ahead auction closes at 12:00 GMT / 11:00 GMT)
    DEFAULT_DECISION_CUTOFF_HOUR: int = 12

settings = Settings()
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
