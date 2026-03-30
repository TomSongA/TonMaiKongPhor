from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from app.db.database import get_db
from app.models.sensor import SensorReading
from app.schemas.sensor import PredictionResponse
from app.services.psi import get_psi_level

router = APIRouter(prefix="/api", tags=['Prediction'])


def linear_regression(values: List[float]) -> float:
    """
    Simple linear regression to predict next value.
    Returns the slope (trand direction and speed).
    """
    n = len(values)
    x = list(range(n))

    x_mean = sum(x) / n
    y_mean = sum(values) / n

    numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

    if denominator == 0:
        return 0.0
    
    slope = numerator / denominator
    return slope


def predict_psi(scores: List[float], hours_ahead: int) -> float:
    """
    Use slope to project PSI forward by hours_ahead.
    Clamp result between 0 to 100.
    """
    slope = linear_regression(scores)

    # Each reading is ~30 min apart, so 1 hour = 2 readings
    steps_ahead = hours_ahead * 2

    last_score = scores[-1]
    predicted_psi = last_score + (slope * steps_ahead)

    # Clamp between 0 to 100
    return round(max(0.0, min(100.0, predicted_psi)), 2)


def get_confidence(scores: List[float]) -> str:
    """
    Confidence based on how many readings we have and
    how consistent the trend is.
    """
    n = len(scores)

    if n < 4:
        return "low"
    elif n < 8:
        return "medium"
    
    # Check variance - high variance = less confident
    mean = sum(scores) / n
    variance = sum((s - mean) ** 2 for s in scores) / n

    if variance > 400:
        return "low"
    elif variance > 150:
        return "medium"
    else:
         return "high"
    

@router.get("/predict", response_model=PredictionResponse)
def get_prediction(hours_ahead: int = 3, db: Session = Depends(get_db)):
    """Answers: What is the predicted stress level in the next 3 hours?"""

    if hours_ahead < 1 or hours_ahead > 12:
        raise HTTPException(
            status_code=400,
            detail="hours_ahead must be between 1 and 12."
        )
    
    # Get last 6 hours of readings to base prediction on
    since = datetime.utcnow() - timedelta(hours=6)
    readings = db.query(SensorReading)\
    .filter(SensorReading.timestamp >= since)\
    .order_by(SensorReading.timestamp.asc())\
    .all()

    if len(readings) < 2:
        raise HTTPException(
            status_code=404,
            detail="Not enough data to make a prediction. Need at least 2 readings."
        )
    
    # Extract PSI scores in order
    scores = [r.psi_score for r in readings]

    # Predict
    predicted_psi = predict_psi(scores, hours_ahead)
    predicted_level = get_psi_level(predicted_psi)
    confidence = get_confidence(scores)

    return PredictionResponse(
        predicted_psi=predicted_psi,
        predicted_level=predicted_level,
        hours_ahead=hours_ahead,
        confidence=confidence
    )


@router.get("/predict/trend")
def get_trend(db: Session = Depends(get_db)):
    """Returns current trend direction for the dashboard arrow indicator."""

    since = datetime.utcnow() - timedelta(hours=6)
    readings = db.query(SensorReading)\
                 .filter(SensorReading.timestamp >= since)\
                 .order_by(SensorReading.timestamp.asc())\
                 .all()

    if len(readings) < 2:
        return {"trend": "unknown", "icon": "→", "slope": 0.0}

    scores = [r.psi_score for r in readings]
    slope  = linear_regression(scores)

    if slope > 2:
        trend = "rising"
        icon  = "↑"
    elif slope < -2:
        trend = "falling"
        icon  = "↓"
    else:
        trend = "stable"
        icon  = "→"

    return {
        "trend": trend,
        "icon":  icon,
        "slope": round(slope, 3)
    }