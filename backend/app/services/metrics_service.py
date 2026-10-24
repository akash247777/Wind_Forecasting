import math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

from backend.app.models import MetricsSummary, HourlyMetric, LeadTimeMetric, ComparisonPoint
from backend.app.services.elexon_service import elexon_service

class MetricsService:
    def align_forecasts_and_actuals(
        self,
        date_from: str,
        date_to: str,
        cutoff_hour: Optional[int] = 12,
        custom_cutoff_time: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Align actual generation data with day-ahead forecast data for each period.
        By default, uses the forecast published on or before D-1 at cutoff_hour (e.g. 12:00 GMT).
        """
        # 1. Fetch actuals for the date range
        actuals = elexon_service.get_actuals(date_from, date_to)
        if not actuals:
            return []

        # Convert actuals to a dict by start_time
        # For dates in the range, determine the cutoff time per delivery day or overall
        start_min = min(a["startTime"] for a in actuals)
        start_max = max(a["startTime"] for a in actuals)

        # Get all forecasts in this window
        all_forecasts = elexon_service.get_all_forecasts_for_delivery(start_min, start_max)
        
        # Build index of forecasts: start_time -> list of {publishTime, generation}
        fc_by_target: Dict[str, List[Dict[str, Any]]] = {}
        for fc in all_forecasts:
            st = fc["startTime"]
            fc_by_target.setdefault(st, []).append(fc)

        aligned = []
        for act in actuals:
            st_iso = act["startTime"]
            s_date = act["settlementDate"]
            sp = act["settlementPeriod"]
            act_mw = act["generation"]

            # Target datetime
            dt_target = datetime.fromisoformat(st_iso.replace("Z", "+00:00"))
            
            # Determine cutoff timestamp for this target period:
            # If custom_cutoff_time is provided, use it
            # Else, cutoff is Day D-1 at cutoff_hour:00:00 UTC
            if custom_cutoff_time:
                cutoff_dt = datetime.fromisoformat(custom_cutoff_time.replace("Z", "+00:00"))
            elif cutoff_hour is not None:
                d_day = datetime.strptime(s_date, "%Y-%m-%d").date()
                d_minus_1 = d_day - timedelta(days=1)
                cutoff_dt = datetime(d_minus_1.year, d_minus_1.month, d_minus_1.day, cutoff_hour, 0, 0, tzinfo=dt_target.tzinfo)
            else:
                cutoff_dt = dt_target # Latest before delivery

            cutoff_iso = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            # Find matching forecast:
            # Exact match on start_time
            candidates = fc_by_target.get(st_iso, [])
            
            # If exact match not found (e.g. 30-min period like 00:30, but WINDFOR is hourly 00:00),
            # check the top-of-the-hour timestamp
            if not candidates and st_iso.endswith(":30:00Z"):
                hour_start = st_iso.replace(":30:00Z", ":00:00Z")
                candidates = fc_by_target.get(hour_start, [])

            # Filter candidates published <= cutoff_iso
            valid_fc = [c for c in candidates if c["publishTime"] <= cutoff_iso]

            if valid_fc:
                # Latest published among valid
                best_fc = max(valid_fc, key=lambda x: x["publishTime"])
                fc_mw = best_fc["generation"]
                pub_time = best_fc["publishTime"]

                error_mw = fc_mw - act_mw
                abs_error = abs(error_mw)
                perc_error = (abs_error / act_mw * 100.0) if act_mw > 10.0 else None

                pub_dt = datetime.fromisoformat(pub_time.replace("Z", "+00:00"))
                lead_hours = round((dt_target - pub_dt).total_seconds() / 3600.0, 1)

                aligned.append({
                    "startTime": st_iso,
                    "settlementDate": s_date,
                    "settlementPeriod": sp,
                    "actualMW": round(act_mw, 1),
                    "forecastMW": round(fc_mw, 1),
                    "errorMW": round(error_mw, 1),
                    "absErrorMW": round(abs_error, 1),
                    "percError": round(perc_error, 1) if perc_error is not None else None,
                    "publishTime": pub_time,
                    "leadHours": max(0.0, lead_hours)
                })

        return aligned

    def calculate_summary_metrics(self, aligned_data: List[Dict[str, Any]]) -> Optional[MetricsSummary]:
        """Compute statistical error metrics on aligned actuals and forecasts."""
        if not aligned_data:
            return None

        errors = np.array([d["errorMW"] for d in aligned_data])
        abs_errors = np.array([d["absErrorMW"] for d in aligned_data])
        actuals = np.array([d["actualMW"] for d in aligned_data])
        forecasts = np.array([d["forecastMW"] for d in aligned_data])

        total_actual_mw = float(np.sum(actuals))
        total_abs_error = float(np.sum(abs_errors))
        
        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        wape = float((total_abs_error / total_actual_mw * 100.0)) if total_actual_mw > 0 else 0.0
        mean_bias = float(np.mean(errors))
        std_dev = float(np.std(errors))

        p10 = float(np.percentile(errors, 10))
        p50 = float(np.percentile(errors, 50))
        p90 = float(np.percentile(errors, 90))

        max_over = float(np.max(errors))
        max_under = float(np.min(errors))

        return MetricsSummary(
            totalPeriods=len(aligned_data),
            mae=round(mae, 1),
            rmse=round(rmse, 1),
            wape=round(wape, 2),
            meanBias=round(mean_bias, 1),
            stdDev=round(std_dev, 1),
            maxOverForecast=round(max_over, 1),
            maxUnderForecast=round(max_under, 1),
            p10Error=round(p10, 1),
            p50Error=round(p50, 1),
            p90Error=round(p90, 1),
            totalActualMWh=round(total_actual_mw * 0.5, 1),
            totalForecastMWh=round(float(np.sum(forecasts)) * 0.5, 1)
        )

    def calculate_hourly_metrics(self, aligned_data: List[Dict[str, Any]]) -> List[HourlyMetric]:
        """Compute metrics grouped by settlement hour of day (0-23)."""
        if not aligned_data:
            return []

        df = pd.DataFrame(aligned_data)
        df["hour"] = df["settlementPeriod"].apply(lambda sp: (sp - 1) // 2)

        hourly_results = []
        for hour, group in df.groupby("hour"):
            errors = group["errorMW"].values
            abs_errors = group["absErrorMW"].values
            actuals = group["actualMW"].values
            forecasts = group["forecastMW"].values

            mae = float(np.mean(abs_errors))
            rmse = float(np.sqrt(np.mean(errors ** 2)))
            mean_bias = float(np.mean(errors))

            hourly_results.append(HourlyMetric(
                hour=int(hour),
                mae=round(mae, 1),
                rmse=round(rmse, 1),
                meanBias=round(mean_bias, 1),
                avgActual=round(float(np.mean(actuals)), 1),
                avgForecast=round(float(np.mean(forecasts)), 1),
                count=len(group)
            ))

        return sorted(hourly_results, key=lambda x: x.hour)

    def calculate_lead_time_metrics(
        self,
        date_from: str,
        date_to: str
    ) -> List[LeadTimeMetric]:
        """
        Evaluate forecast degradation across lead-time horizons.
        Examines how accuracy improves as gate closure / delivery gets closer.
        """
        actuals = elexon_service.get_actuals(date_from, date_to)
        if not actuals:
            return []

        act_dict = {a["startTime"]: a["generation"] for a in actuals}
        # Also map :30:00Z to hour start for hourly forecasts
        for a in actuals:
            if a["startTime"].endswith(":30:00Z"):
                h_start = a["startTime"].replace(":30:00Z", ":00:00Z")
                # average if needed
                if h_start not in act_dict:
                    act_dict[h_start] = a["generation"]

        start_min = min(a["startTime"] for a in actuals)
        start_max = max(a["startTime"] for a in actuals)

        all_fc = elexon_service.get_all_forecasts_for_delivery(start_min, start_max)
        if not all_fc:
            return []

        buckets = [
            ("0-6h (Intraday)", 0.0, 6.0),
            ("6-12h (Same-Day)", 6.0, 12.0),
            ("12-24h (D-1 Post-Auction)", 12.0, 24.0),
            ("24-36h (D-1 Gate Closure)", 24.0, 36.0),
            ("36-48h (D-1 Morning)", 36.0, 48.0),
            ("48h+ (D-2 Ahead)", 48.0, 120.0)
        ]

        bucket_data = {b[0]: [] for b in buckets}

        for fc in all_fc:
            st = fc["startTime"]
            act_mw = act_dict.get(st)
            if act_mw is None:
                continue

            pt = fc["publishTime"]
            dt_target = datetime.fromisoformat(st.replace("Z", "+00:00"))
            dt_pub = datetime.fromisoformat(pt.replace("Z", "+00:00"))
            lead_h = (dt_target - dt_pub).total_seconds() / 3600.0

            if lead_h < 0:
                continue

            error = fc["generation"] - act_mw

            for name, min_h, max_h in buckets:
                if min_h <= lead_h < max_h:
                    bucket_data[name].append(error)
                    break

        results = []
        for name, min_h, max_h in buckets:
            errs = bucket_data[name]
            if errs:
                arr = np.array(errs)
                mae = float(np.mean(np.abs(arr)))
                rmse = float(np.sqrt(np.mean(arr ** 2)))
                results.append(LeadTimeMetric(
                    leadBucket=name,
                    minHours=min_h,
                    maxHours=max_h,
                    mae=round(mae, 1),
                    rmse=round(rmse, 1),
                    count=len(arr)
                ))
            else:
                results.append(LeadTimeMetric(
                    leadBucket=name,
                    minHours=min_h,
                    maxHours=max_h,
                    mae=0.0,
                    rmse=0.0,
                    count=0
                ))

        return results

metrics_service = MetricsService()
