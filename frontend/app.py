import sys
from pathlib import Path

# Add root directory to path and import root streamlit_app
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from streamlit_app import *
