from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from backend.app.services.procurement_service import procurement_service
from backend.app.models import ProcurementSimulationResult

router = APIRouter(prefix="/procurement", tags=["procurement"])

@router.get("/simulate", response_model=ProcurementSimulationResult)
def simulate_procurement(
    date: str = Query("2026-01-05", description="Delivery date YYYY-MM-DD"),
    cutoff_hour: int = Query(12, description="D-1 Day-Ahead cutoff hour (12:00 GMT standard)"),
    custom_cutoff_time: Optional[str] = Query(None, description="Custom ISO cutoff timestamp"),
    demand_scale: float = Query(1.0, ge=0.5, le=2.0, description="Multiplier for baseline UK demand profile"),
    confidence_level: float = Query(0.90, ge=0.50, le=0.99, description="Confidence level for downside risk buffer (e.g. 0.90 for P90)")
):
    """
    Simulate Day-Ahead wholesale power procurement decision for an energy utility.
    Calculates:
    - Expected wind generation from latest forecast available before gate closure
    - Customer electricity demand
    - Net thermal power to procure from EPEX/Nord Pool day-ahead auction
    - Quantified downside risk buffer (P90) to prevent balancing penalties
    - Actual generation and imbalance performance post-delivery
    """
    return procurement_service.simulate_day_ahead_procurement(
        delivery_date=date,
        cutoff_hour=cutoff_hour,
        custom_cutoff_time=custom_cutoff_time,
        demand_scale=demand_scale,
        confidence_level=confidence_level
    )
