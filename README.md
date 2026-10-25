# Wind Forecasting and Energy Market Simulation

This project is a comprehensive system for wind power forecasting, market data analysis, and energy market simulation using Python, FastAPI, and a Streamlit frontend.

## Features

### Backend (FastAPI)
- **Data Ingestion**: Fetches real-time and historical data from Elexon BMRA API.
- **Wind Forecasting**: Implements LSTM-based time series forecasting for wind generation.
- **Market Simulation**: Simulates wholesale electricity prices and trading.
- **Data Management**: SQLite database for storing market data, forecasts, and simulations.

### Frontend (Streamlit)
- **Dashboard**: Visualizes wind generation, system marginal prices, and demand.
- **Forecasting Interface**: Generate and view wind forecasts.
- **Market Analysis**: Analyze settlement data and price trends.
- **Simulation**: Run and visualize energy market simulations.

## Prerequisites

- Python 3.8+
- Required packages listed in `requirements.txt`

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Wind_Forecating
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   # Activate the virtual environment
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Starting the Backend

The backend runs as a FastAPI server.

```bash
uvicorn backend.app.main:app --host [IP_ADDRESS] --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

### Running the Frontend

The frontend runs as a Streamlit application.

```bash
streamlit run frontend/app.py
```

The Streamlit app will open automatically in your browser at `http://localhost:8501`.

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=8000
HOST=0.0.0.0
DATA_DIR=./data
DATABASE_PATH=./data/wind_forecasting.db
ELEXON_API_BASE=https://data.elexon.co.uk/bmrs/api/v1
```

## Database

The application uses SQLite for data storage. The database file is located at `data/wind_forecasting.db`.

## Data Sources

- **Elexon BMRS API**: Provides national level half-hourly wind actual generation (`FUELHH`) and published wind forecasts (`WINDFOR`).

## ☁️ Deploying to Streamlit Cloud (Community Cloud)

You can deploy and host this application on [Streamlit Community Cloud](https://share.streamlit.io/) with zero configuration:

1. **Sign in to Streamlit Community Cloud**:
   Go to [share.streamlit.io](https://share.streamlit.io/) and log in with your GitHub account (`akash247777`).

2. **Create a New App**:
   - Click **"Create app"** > **"I already have an app"**.
   - **Repository**: `akash247777/Wind_Forecasting`
   - **Branch**: `main`
   - **Main file path**: `streamlit_app.py` (or `app.py`)

3. **Configure Secrets (Gemini API Key)**:
   - Click **"Advanced settings..."** before deploying.
   - In the **Secrets** text box, add:
     ```toml
     GEMINI_API_KEY = "your_gemini_api_key_here"
     ```
   - Click **Save**.

4. **Deploy**:
   - Click **"Deploy"**. Streamlit Cloud will automatically install dependencies from `requirements.txt` and launch the interactive trading desk portal!

---

## 📁 Repository Structure

```
├── streamlit_app.py               # Main Streamlit Cloud application entrypoint
├── app.py                         # Root alias for Streamlit execution
├── .streamlit/
│   └── config.toml                # Institutional dark theme & UI settings
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI REST API server
│   │   ├── config.py              # Settings & directory configuration
│   │   ├── database.py            # SQLite schema & connection manager
│   │   ├── models.py              # Pydantic schemas
│   │   ├── services/
│   │   │   ├── elexon_service.py  # Elexon BMRS API ingestor (FUELHH & WINDFOR)
│   │   │   ├── metrics_service.py # Accuracy engine (MAE, RMSE, WAPE, Bias, P10/P90)
│   │   │   ├── procurement_service.py # Day-ahead net thermal procurement & buffer sizing
│   │   │   └── ai_service.py      # Gemini 2.5 Flash trading analyst & copilot
│   │   └── routers/               # FastAPI modular endpoints
│   ├── data/
│   │   └── wind_forecasting.db    # Pre-seeded SQLite database for January 2026
│   ├── seed_data.py               # Automated Elexon data sync script
│   └── run.py                     # Backend runner script
├── frontend/
│   ├── app.py                     # Streamlit frontend alias (streamlit run frontend/app.py)
│   ├── src/                       # React frontend source (optional alternative UI)
│   └── package.json
├── requirements.txt               # Pinned Python dependencies (streamlit, plotly, fastapi, etc.)
├── .env.example                   # Environment variables template
└── README.md
```
