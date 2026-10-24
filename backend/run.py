import uvicorn
import os
import sys
from pathlib import Path

# Add root directory to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.config import settings

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting UK Wind Forecasting & Procurement Backend on http://{host}:{port}")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
