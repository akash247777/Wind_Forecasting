from fastapi import APIRouter, Query, BackgroundTasks, HTTPException
from typing import Optional, Dict, Any, List

from backend.app.services.elexon_service import elexon_service
from backend.app.services.metrics_service import metrics_service
from backend.app.models import ComparisonPoint

router = APIRouter(prefix="/data", tags=["data"])

@router.get("/status")
def get_data_status() -> Dict[str, Any]:
    """Get database coverage and total record counts."""
    return elexon_service.get_data_counts()

@router.get("/actuals")
def get_actuals(
    date_from: str = Query("2026-01-01", description="Start settlement date YYYY-MM-DD"),
    date_to: str = Query("2026-01-31", description="End settlement date YYYY-MM-DD")
):
    """Get actual wind generation records from FUELHH dataset."""
    actuals = elexon_service.get_actuals(date_from, date_to)
    return {"count": len(actuals), "data": actuals}

@router.get("/forecasts")
def get_forecasts(
    date_from: str = Query("2026-01-01", description="Start date YYYY-MM-DD"),
    date_to: str = Query("2026-01-31", description="End date YYYY-MM-DD"),
    cutoff_time: Optional[str] = Query(None, description="ISO timestamp cutoff for forecast publication (e.g. 2026-01-01T12:00:00Z)")
):
    """Get forecasts available for target delivery period."""
    start_from = f"{date_from}T00:00:00Z"
    start_to = f"{date_to}T23:59:59Z"
    forecasts = elexon_service.get_forecasts_at_cutoff(start_from, start_to, cutoff_time)
    return {"count": len(forecasts), "data": forecasts}

@router.get("/comparison", response_model=List[ComparisonPoint])
def get_comparison(
    date_from: str = Query("2026-01-01", description="Start date YYYY-MM-DD"),
    date_to: str = Query("2026-01-01", description="End date YYYY-MM-DD"),
    cutoff_hour: Optional[int] = Query(12, description="D-1 Day-Ahead cutoff hour (e.g. 12 for 12:00 GMT Gate Closure)"),
    custom_cutoff_time: Optional[str] = Query(None, description="Exact custom cutoff ISO timestamp")
):
    """
    Get aligned actuals vs Day-Ahead forecasts for each settlement period,
    including calculated errors, absolute errors, percentage errors, and lead times.
    """
    aligned = metrics_service.align_forecasts_and_actuals(
        date_from=date_from,
        date_to=date_to,
        cutoff_hour=cutoff_hour,
        custom_cutoff_time=custom_cutoff_time
    )
    return aligned

@router.post("/sync")
def trigger_sync(background_tasks: BackgroundTasks):
    """Trigger background synchronization of January 2026 Elexon data."""
    def sync_worker():
        try:
            # 1. Fetch actuals
            act_records = elexon_service.fetch_actuals_from_api("2026-01-01", "2026-01-31")
            elexon_service.save_actuals_to_db(act_records)
            
            # 2. Fetch forecasts in 5-day intervals
            from datetime import datetime, timedelta
            cur = datetime(2025, 12, 31)
            end = datetime(2026, 2, 1)
            while cur < end:
                next_cur = min(end, cur + timedelta(days=5))
                p_from = cur.strftime("%Y-%m-%dT%H:%M:%SZ")
                p_to = next_cur.strftime("%Y-%m-%dT%H:%M:%SZ")
                fc_records = elexon_service.fetch_forecasts_from_api(p_from, p_to)
                elexon_service.save_forecasts_to_db(fc_records)
                cur = next_cur
        except Exception as e:
            print("Sync failed:", e)

    background_tasks.add_task(sync_worker)
    return {"status": "Sync initiated in background for January 2026."}
