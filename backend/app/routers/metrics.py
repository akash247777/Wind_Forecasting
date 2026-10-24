from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any

from backend.app.services.metrics_service import metrics_service
from backend.app.models import MetricsSummary, HourlyMetric, LeadTimeMetric

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("/summary", response_model=MetricsSummary)
def get_metrics_summary(
    date_from: str = Query("2026-01-01", description="Start date YYYY-MM-DD"),
    date_to: str = Query("2026-01-31", description="End date YYYY-MM-DD"),
    cutoff_hour: Optional[int] = Query(12, description="D-1 Day-Ahead cutoff hour (default 12 for 12:00 GMT Gate Closure)"),
    custom_cutoff_time: Optional[str] = Query(None, description="Exact custom cutoff ISO timestamp")
):
    """
    Get quantitative forecast accuracy metrics (MAE, RMSE, WAPE, Mean Bias, P10/P50/P90)
    for the selected period and decision cutoff.
    """
    aligned = metrics_service.align_forecasts_and_actuals(
        date_from=date_from,
        date_to=date_to,
        cutoff_hour=cutoff_hour,
        custom_cutoff_time=custom_cutoff_time
    )
    if not aligned:
        raise HTTPException(status_code=404, detail="No aligned data found for the specified date range. Please verify database sync.")
    
    summary = metrics_service.calculate_summary_metrics(aligned)
    if not summary:
        raise HTTPException(status_code=404, detail="Could not compute metrics.")
    return summary

@router.get("/hourly", response_model=List[HourlyMetric])
def get_hourly_metrics(
    date_from: str = Query("2026-01-01", description="Start date YYYY-MM-DD"),
    date_to: str = Query("2026-01-31", description="End date YYYY-MM-DD"),
    cutoff_hour: Optional[int] = Query(12, description="D-1 Day-Ahead cutoff hour")
):
    """
    Get forecast accuracy metrics broken down by hour of the day (0 to 23).
    Reveals error diurnal patterns, such as morning ramp-up and evening peak errors.
    """
    aligned = metrics_service.align_forecasts_and_actuals(
        date_from=date_from,
        date_to=date_to,
        cutoff_hour=cutoff_hour
    )
    return metrics_service.calculate_hourly_metrics(aligned)

@router.get("/lead-time", response_model=List[LeadTimeMetric])
def get_lead_time_metrics(
    date_from: str = Query("2026-01-01", description="Start date YYYY-MM-DD"),
    date_to: str = Query("2026-01-31", description="End date YYYY-MM-DD")
):
    """
    Get forecast error progression across different lead-time horizons
    (from >48 hours ahead down to 0-6 hours ahead).
    """
    return metrics_service.calculate_lead_time_metrics(date_from=date_from, date_to=date_to)
