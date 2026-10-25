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

- **Elexon BMRA API**: Provides real-time and historical market data.
- **Wind Data**: Historical wind generation data (can be populated from Elexon API or other sources).

## License

This project is licensed under the terms of the MIT license.
