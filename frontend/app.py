import sys
from pathlib import Path

# Add root directory to path and import root streamlit_app
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import streamlit_app

if __name__ == "__main__" or True:
    streamlit_app.main()
