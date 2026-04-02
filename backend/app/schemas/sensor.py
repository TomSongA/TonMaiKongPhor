from pydantic import BaseModel, Field
from datetime import datetime


class SensorInput(BaseModel):
    soil: float = Field(..., ge=0, le=100)
    temp: float = Field(..., ge=-10, le=60)
    humidity: float = Field(..., ge=0, le=100)
    light: float = Field(..., ge=0, le=100000)


class FactorBreakdown(BaseModel):
    soil_score: float
    temp_score: float
    light_score: float


class SensorResponse(BaseModel):
    id: int
    soil: float
    temp: float
    humidity: float
    light: float
    psi_score: float
    psi_level: str
    explanation: str
    breakdown: FactorBreakdown
    timestamp: datetime

    class Config:
        from_attributes = True


class StressStatusResponse(BaseModel):
    psi_score: float
    psi_level: str
    explanation: str
    breakdown: FactorBreakdown
    advice: str


class WaterTimeResponse(BaseModel):
    best_time: str
    reason: str
    psi_at_time: float


class HistoryPoint(BaseModel):
    date: str
    avg_psi: float
    psi_level: str


class ReadingRow(BaseModel):
    """Single stored sensor row (for charts / tables)."""

    id: int
    soil: float
    temp: float
    humidity: float
    light: float
    psi_score: float
    psi_level: str
    timestamp: datetime

    class Config:
        from_attributes = True


class PredictionResponse(BaseModel):
    predicted_psi: float
    predicted_level: str
    hours_ahead: int
    confidence: str


class WeatherComparison(BaseModel):
    indoor_temp: float
    indoor_humidity: float
    outdoor_temp: float
    outdoor_humidity: float
    temp_diff: float
    humidity_diff: float