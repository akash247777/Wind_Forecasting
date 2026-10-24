import math
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from backend.app.models import ProcurementSimulationResult, PeriodProcurement
from backend.app.services.metrics_service import metrics_service
from backend.app.services.elexon_service import elexon_service

# Standard UK winter hourly demand shape factor (scaled to national demand ~24-40 GW)
UK_TYPICAL_WINTER_HOURLY_DEMAND_MW = [
    24500, 23800, 23200, 22900, 23500, 25800, # 00:00 - 05:00
    29500, 34200, 36500, 35800, 35000, 34500, # 06:00 - 11:00
    34200, 34000, 34500, 35800, 38500, 41200, # 12:00 - 17:00
    39800, 36500, 33500, 30500, 27500, 25500  # 18:00 - 23:00
]

class ProcurementService:
    def simulate_day_ahead_procurement(
        self,
        delivery_date: str,
        cutoff_hour: int = 12,
        custom_cutoff_time: Optional[str] = None,
        demand_scale: float = 1.0,
        confidence_level: float = 0.90
    ) -> ProcurementSimulationResult:
        """
        Simulate the UK wholesale Day-Ahead power purchase decision for a delivery date in January 2026.
        Determines:
        1. Wind forecast available at D-1 gate closure
        2. Customer demand requirement
        3. Baseline thermal procurement needed
        4. Quantified downside error buffer (P90 / P95) to protect against balancing penalties
        5. Post-delivery actuals & imbalance performance
        """
        # Align actuals and day-ahead forecasts for this delivery date
        aligned = metrics_service.align_forecasts_and_actuals(
            date_from=delivery_date,
            date_to=delivery_date,
            cutoff_hour=cutoff_hour,
            custom_cutoff_time=custom_cutoff_time
        )

        # Also get broader monthly error distribution to determine statistically sound risk buffer
        # (e.g. Month-to-date or full month error volatility)
        month_aligned = metrics_service.align_forecasts_and_actuals(
            date_from="2026-01-01",
            date_to="2026-01-31",
            cutoff_hour=cutoff_hour
        )

        std_dev = 1500.0 # Default fallback
        downside_quantile_mw = 1800.0

        if month_aligned:
            errors = np.array([m["errorMW"] for m in month_aligned])
            std_dev = float(np.std(errors))
            # Quantile based on confidence level
            # If confidence is 0.90, we want the 90th percentile downside deficit (Forecast > Actual)
            # which is the 90th percentile of positive errors
            over_forecasts = errors[errors > 0]
            if len(over_forecasts) > 0:
                downside_quantile_mw = float(np.percentile(over_forecasts, confidence_level * 100))
            else:
                downside_quantile_mw = std_dev * 1.645

        # Cutoff ISO string
        if custom_cutoff_time:
            cutoff_iso = custom_cutoff_time
        else:
            d_day = datetime.strptime(delivery_date, "%Y-%m-%d").date()
            d_minus_1 = d_day - timedelta(days=1)
            cutoff_iso = f"{d_minus_1.isoformat()}T{cutoff_hour:02d}:00:00Z"

        periods: List[PeriodProcurement] = []
        total_demand_mw = 0.0
        total_forecast_wind_mw = 0.0
        total_baseline_thermal_mw = 0.0
        total_recommended_thermal_mw = 0.0
        total_downside_buffer_mw = 0.0
        total_actual_wind_mw = 0.0
        total_actual_imbalance_mw = 0.0

        # Build map of aligned records by settlementPeriod
        aligned_by_sp = {a["settlementPeriod"]: a for a in aligned}

        for sp in range(1, 49):
            hour = (sp - 1) // 2
            # Demand profile for this hour
            base_demand = UK_TYPICAL_WINTER_HOURLY_DEMAND_MW[hour] * demand_scale
            # Add small intra-hour curve (+/- 1.5%)
            if sp % 2 == 0:
                base_demand *= 1.015
            else:
                base_demand *= 0.985
            demand_mw = round(base_demand, 1)

            aligned_point = aligned_by_sp.get(sp)
            if aligned_point:
                wind_fc = aligned_point["forecastMW"]
                wind_act = aligned_point["actualMW"]
            else:
                wind_fc = 0.0
                wind_act = None

            # Baseline thermal = max(0, Demand - Wind Forecast)
            baseline_thermal = max(0.0, demand_mw - wind_fc)

            # Downside risk buffer: proportional to forecast level and confidence quantile
            # If wind forecast is high, error potential is higher (cannot drop by 2000 MW if forecast is only 500 MW)
            buffer_fraction = min(1.0, wind_fc / 12000.0) if wind_fc > 0 else 0.0
            period_buffer = round(downside_quantile_mw * (0.4 + 0.6 * buffer_fraction), 1)

            # Recommended thermal incorporates buffer
            recommended_thermal = round(baseline_thermal + period_buffer, 1)

            # Imbalance with recommended procurement:
            # Imbalance = (Actual Wind + Recommended Thermal) - Demand
            # Positive = long (surplus), Negative = short (deficit)
            if wind_act is not None:
                imbalance = round((wind_act + recommended_thermal) - demand_mw, 1)
                total_actual_wind_mw += wind_act
                total_actual_imbalance_mw += imbalance
            else:
                imbalance = None

            total_demand_mw += demand_mw
            total_forecast_wind_mw += wind_fc
            total_baseline_thermal_mw += baseline_thermal
            total_recommended_thermal_mw += recommended_thermal
            total_downside_buffer_mw += period_buffer

            st_hour = hour
            st_min = 30 if sp % 2 == 0 else 0
            st_str = f"{delivery_date}T{st_hour:02d}:{st_min:02d}:00Z"

            periods.append(PeriodProcurement(
                startTime=aligned_point["startTime"] if aligned_point else st_str,
                settlementPeriod=sp,
                hour=hour,
                demandMW=demand_mw,
                windForecastMW=wind_fc,
                windActualMW=wind_act,
                baselineThermalMW=round(baseline_thermal, 1),
                downsideRiskBufferMW=period_buffer,
                recommendedThermalMW=recommended_thermal,
                imbalanceExposureMW=imbalance
            ))

        return ProcurementSimulationResult(
            deliveryDate=delivery_date,
            decisionCutoffTime=cutoff_iso,
            confidenceLevel=confidence_level,
            totalDemandMWh=round(total_demand_mw * 0.5, 1),
            forecastWindMWh=round(total_forecast_wind_mw * 0.5, 1),
            baselineThermalMWh=round(total_baseline_thermal_mw * 0.5, 1),
            recommendedThermalMWh=round(total_recommended_thermal_mw * 0.5, 1),
            downsideBufferMWh=round(total_downside_buffer_mw * 0.5, 1),
            actualWindMWh=round(total_actual_wind_mw * 0.5, 1) if aligned else None,
            actualImbalanceMWh=round(total_actual_imbalance_mw * 0.5, 1) if aligned else None,
            periods=periods
        )

procurement_service = ProcurementService()
