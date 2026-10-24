from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ActualRecord(BaseModel):
    startTime: str
    settlementDate: str
    settlementPeriod: int
    generation: float
    publishTime: Optional[str] = None

class ForecastRecord(BaseModel):
    publishTime: str
    startTime: str
    generation: float

class ComparisonPoint(BaseModel):
    startTime: str
    settlementDate: str
    settlementPeriod: int
    actualMW: float
    forecastMW: float
    errorMW: float         # Forecast - Actual
    absErrorMW: float      # |Forecast - Actual|
    percError: Optional[float] = None # Relative error %
    publishTime: str
    leadHours: float

class MetricsSummary(BaseModel):
    totalPeriods: int
    mae: float             # Mean Absolute Error (MW)
    rmse: float            # Root Mean Square Error (MW)
    wape: float            # Weighted Absolute Percentage Error (%)
    meanBias: float        # Mean Error (MW) (+ = over-forecast, - = under-forecast)
    stdDev: float          # Standard deviation of error (MW)
    maxOverForecast: float # Max (Forecast - Actual)
    maxUnderForecast: float# Min (Forecast - Actual)
    p10Error: float        # 10th percentile error (conservative downside)
    p50Error: float        # Median error
    p90Error: float        # 90th percentile error
    totalActualMWh: float  # Total actual generation in MWh (sum MW * 0.5h)
    totalForecastMWh: float

class HourlyMetric(BaseModel):
    hour: int
    mae: float
    rmse: float
    meanBias: float
    avgActual: float
    avgForecast: float
    count: int

class LeadTimeMetric(BaseModel):
    leadBucket: str
    minHours: float
    maxHours: float
    mae: float
    rmse: float
    count: int

class PeriodProcurement(BaseModel):
    startTime: str
    settlementPeriod: int
    hour: int
    demandMW: float
    windForecastMW: float
    windActualMW: Optional[float] = None
    baselineThermalMW: float
    downsideRiskBufferMW: float
    recommendedThermalMW: float
    imbalanceExposureMW: Optional[float] = None

class ProcurementSimulationResult(BaseModel):
    deliveryDate: str
    decisionCutoffTime: str
    confidenceLevel: float
    totalDemandMWh: float
    forecastWindMWh: float
    baselineThermalMWh: float
    recommendedThermalMWh: float
    downsideBufferMWh: float
    actualWindMWh: Optional[float] = None
    actualImbalanceMWh: Optional[float] = None
    periods: List[PeriodProcurement]

class AiBriefingRequest(BaseModel):
    date: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    prompt: Optional[str] = None

class AiBriefingResponse(BaseModel):
    executiveSummary: str
    procurementAdvice: str
    riskFactors: List[str]
    forecastReliability: str
    source: str # 'gemini' or 'algorithmic'
