from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.sensor import SensorReading
from app.schemas.sensor import WaterTimeResponse
from app.services.psi import calculate_psi

router = APIRouter(prefix="/api", tags=["Water Time"])


@router.get("/best-water-time", response_model=WaterTimeResponse)
def get_best_water_time(db: Session = Depends(get_db)):
    """Answers: When is the best time to water today?"""

    # Get all readings from the last 24 hours
    since = datetime.utcnow() - timedelta(hours=24)
    readings = db.query(SensorReading)\
                 .filter(SensorReading.timestamp >= since)\
                 .order_by(SensorReading.timestamp.asc())\
                 .all()

    if not readings:
        raise HTTPException(
            status_code=404,
            detail="Not enough data yet. Need at least 24 hours of readings."
        )

    # Find the reading with the lowest PSI score
    # That's the window when the plant is least stressed = best time to water
    best_reading = min(readings, key=lambda r: r.psi_score)

    # Recalculate PSI for full breakdown
    result = calculate_psi(
        soil=best_reading.soil,
        temp=best_reading.temp,
        humidity=best_reading.humidity,
        light=best_reading.light
    )

    # Format the time nicely
    best_time = best_reading.timestamp.strftime("%H:%M")

    # Build reason based on conditions at that time
    reason = _build_water_reason(best_reading, result)

    return WaterTimeResponse(
        best_time=best_time,
        reason=reason,
        psi_at_time=best_reading.psi_score
    )


def _build_water_reason(reading: SensorReading, psi_result: dict) -> str:
    reasons = []

    # Check each condition at that time
    if reading.temp <= 30:
        reasons.append(f"temperature is cooler ({reading.temp:.1f}°C)")

    if reading.light < 20000:
        reasons.append(f"light intensity is lower ({reading.light:.0f} lux)")

    if reading.humidity >= 50:
        reasons.append(f"humidity is favorable ({reading.humidity:.0f}%)")

    if reading.soil < 35:
        reasons.append(f"soil is getting dry ({reading.soil:.0f}%)")

    if not reasons:
        return f"This is the lowest stress window found in the last 24 hours " \
               f"(PSI: {reading.psi_score:.1f})."

    return "Best time because: " + ", ".join(reasons) + "."