# 🎥 10-Minute Video Demo Presentation Guide

Reference guide for recording the unlisted YouTube video required in **Section 3.1** of the challenge.

---

## Part 1: Client Commercial Pitch (Max 5 Minutes)
> **Audience**: Energy Utility Client (Commercial Trading & Procurement Team)  
> **Goal**: Impress the client with how this portal solves their day-ahead balancing penalty risks.

### 1. Problem Statement & Market Context (1 min)
- Explain the UK wholesale day-ahead market timing: EPEX SPOT / Nord Pool auction gate closure is at **12:00 GMT on Day D-1**.
- The utility must purchase required wholesale power to cover customer demand beyond renewable generation.
- **The Core Risk**: Wind intermittency exposes the utility to severe **Balancing Mechanism cash-out penalties (System Buy Price)**, which routinely exceed **£300 to £1,000+/MWh**.

### 2. Key Statistical Findings from January 2026 Data (1.5 min)
- Walk through the **Quantitative Error Analytics** tab:
  - Average error magnitude: **MAE = 2,021 MW**, **WAPE = 17.45%**.
  - **Systemic Over-Prediction**: National Grid ESO forecasts had a persistent **+1,806 MW Mean Bias**. Unhedged trading desks were consistently exposed to shortfall penalties.
  - **Quantile Tail Risk**: The 90th percentile shortfall error ($P_{90}$) is **+4,013 MW**.

### 3. Live Solution Demonstration (2.5 min)
- Open the **Day-Ahead Decision Center**:
  - Show delivery date selection (e.g., January 5, 2026).
  - Demonstrate the **12:00 GMT Gate Closure Lock**: isolating the exact forecast available when the trader had to bid.
  - Show the **Wholesale Thermal Purchase Simulator**:
    - Adjust the demand slider (e.g., cold weather peak).
    - Toggle between $P_{50}$ (no buffer) and $P_{90}$ (safety reserve margin).
    - Show how the cyan **$P_{90}$ Downside Risk Buffer** guarantees 90% protection against cash-out spikes.
  - Demonstrate the **AI Trading Copilot**: click *Generate AI Briefing* to show real-time executive procurement recommendations.

---

## Part 2: Technical Lead Review (Max 5 Minutes)
> **Audience**: Internal Technical Lead  
> **Goal**: Demonstrate software architecture, code quality, mathematical rigor, and engineering best practices.

### 1. Decoupled Full-Stack Architecture (1.5 min)
- **Backend Service Layer (`backend/app/services/`)**:
  - `elexon_service.py`: Automated ingestion from Elexon BMRS API (`FUELHH` actuals and `WINDFOR` forecasts).
  - `metrics_service.py`: High-performance pandas and NumPy vectorized statistical calculations (MAE, RMSE, WAPE, Mean Bias, quantiles).
  - `procurement_service.py`: Wholesale demand-supply dispatch matching with quantile risk buffers.
  - `ai_service.py`: Google Gemini 2.5 Flash integration with deterministic algorithmic fallback heuristics.
- **Embedded Database (`backend/data/wind_forecasting.db`)**:
  - SQLite with composite indices on `(start_time, publish_time)` for sub-5ms query performance. Pre-seeded with all 1,488 actuals and 19,272 forecast records.
- **Frontend**:
  - Streamlit reactive trading dashboard with custom dark theme, Plotly interactive charts, and instant parameter recalculation.
  - React + Vite + Tailwind CSS frontend in `frontend/`.

### 2. Data Normalization & Mathematical Rigor (1.5 min)
- **Time-Alignment Challenge**: `FUELHH` delivers 30-minute intervals (48 settlement periods), while `WINDFOR` publishes hourly forecasts up to several days ahead.
- Explain the gate closure query: for any target delivery day and cutoff hour $H$ (e.g., 12:00 on $D-1$), the system queries:
  $$\text{publishTime} \le D-1\ 12:00\text{ GMT}$$
  selecting the latest available forecast for each settlement period.

### 3. Production Readiness & Deployment (1 min)
- Pinned `requirements.txt` and virtual environment.
- Multi-target deployment compatibility: Streamlit Community Cloud, Heroku (`Procfile`), Docker (`Dockerfile`, `docker-compose.yml`), and Vercel (`vercel.json`).
- Complete automated test suite verifying element rendering and zero blank screens across all user interactions.
