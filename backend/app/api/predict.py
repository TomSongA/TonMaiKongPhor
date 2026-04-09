from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from app.models.sensor import SensorReading, PredictionLog
import pandas as pd
import numpy as np
import joblib
import os

from app.db.database import get_db
from app.models.sensor import SensorReading
from app.schemas.sensor import PredictionResponse
from app.services.psi import get_psi_level
from datetime import timezone

router = APIRouter(prefix="/api", tags=["Prediction"])


# Load Model
ML_DIR           = os.path.join(os.path.dirname(__file__), "../ml")
MODEL_PATH       = os.path.join(ML_DIR, "model.pkl")
CLASSIFIER_PATH  = os.path.join(ML_DIR, "classifier.pkl")
SCALER_PATH      = os.path.join(ML_DIR, "scaler.pkl")


def load_model():
    """Load model and scaler from disk."""
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(
            status_code=503,
            detail="ML model not trained yet. Run python -m app.ml.train first."
        )
    if not os.path.exists(CLASSIFIER_PATH):
        raise HTTPException(
            status_code=503,
            detail="ML classifier not trained yet. Run python -m app.ml.train first."
        )
    if not os.path.exists(SCALER_PATH):
        raise HTTPException(
            status_code=503,
            detail="Scaler not found. Run python -m app.ml.train first."
        )

    model      = joblib.load(MODEL_PATH)
    classifier = joblib.load(CLASSIFIER_PATH)
    scaler     = joblib.load(SCALER_PATH)
    return model, classifier, scaler


# Fallback: Linear Regression
def linear_regression_predict(scores: List[float], hours_ahead: int) -> float:
    """
    Fallback prediction if ML model is not available.
    Uses simple linear regression on recent PSI scores.
    """
    n      = len(scores)
    x      = list(range(n))
    x_mean = sum(x) / n
    y_mean = sum(scores) / n

    numerator   = sum((x[i] - x_mean) * (scores[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

    slope         = numerator / denominator if denominator != 0 else 0.0
    steps_ahead   = hours_ahead * 2
    predicted_psi = scores[-1] + (slope * steps_ahead)

    return round(max(0.0, min(100.0, predicted_psi)), 2)


# Confidence
def get_confidence(scores: List[float]) -> str:
    n = len(scores)
    if n < 4:
        return "low"
    elif n < 8:
        return "medium"

    mean     = sum(scores) / n
    variance = sum((s - mean) ** 2 for s in scores) / n

    if variance > 400:
        return "low"
    elif variance > 150:
        return "medium"
    else:
        return "high"


# Predict Endpoint
@router.get("/predict", response_model=PredictionResponse)
def get_prediction(hours_ahead: int = 3, db: Session = Depends(get_db)):
    """Answers: What is the predicted stress level in the next 3 hours?"""

    if hours_ahead < 1 or hours_ahead > 12:
        raise HTTPException(
            status_code=400,
            detail="hours_ahead must be between 1 and 12."
        )

    # Get last 6 hours of readings
    since    = datetime.utcnow() - timedelta(hours=6)
    readings = db.query(SensorReading)\
                 .filter(SensorReading.timestamp >= since)\
                 .order_by(SensorReading.timestamp.asc())\
                 .all()

    if len(readings) < 2:
        raise HTTPException(
            status_code=404,
            detail="Not enough data to make a prediction. Need at least 2 readings."
        )

    scores = [r.psi_score for r in readings]

    predicted_level = None

    # Try ML model first
    try:
        model, classifier, scaler = load_model()

        # Use latest reading as input features
        latest  = readings[-1]
        hour    = latest.timestamp.hour
        target_hour = (hour + hours_ahead) % 24

        # Build feature dataframe
        X = pd.DataFrame([{
            "soil":     latest.soil,
            "temp":     latest.temp,
            "humidity": latest.humidity,
            "light":    latest.light,
            "hour":     target_hour    # predict for future hour
        }])

        X_scaled      = scaler.transform(X)
        predicted_psi   = float(model.predict(X_scaled)[0])
        predicted_psi   = round(max(0.0, min(100.0, predicted_psi)), 2)
        predicted_level = str(classifier.predict(X_scaled)[0])
        method          = "ml"

    except HTTPException:
        # Fallback to linear regression
        predicted_psi = linear_regression_predict(scores, hours_ahead)
        method        = "linear_regression"

    if not predicted_level:
        predicted_level = get_psi_level(predicted_psi)
    confidence = get_confidence(scores)

    # Lower confidence if using fallback
    if method == "linear_regression":
        confidence = "low"

    # Save to DB
    # ตรวจว่ามี prediction เดิมอยู่แล้วไหมใน 1 ชั่วโมงที่ผ่านมา
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    existing = db.query(PredictionLog)\
                .filter(
                    PredictionLog.hours_ahead == hours_ahead,
                    PredictionLog.predicted_psi == predicted_psi,
                    PredictionLog.timestamp >= one_hour_ago
                )\
                .first()

    if not existing:
        log = PredictionLog(
            predicted_psi=predicted_psi,
            predicted_level=predicted_level,
            hours_ahead=hours_ahead,
            confidence=confidence,
            method=method,
        )
        db.add(log)
        db.commit()

    return PredictionResponse(
        predicted_psi=predicted_psi,
        predicted_level=predicted_level,
        hours_ahead=hours_ahead,
        confidence=confidence
    )


# Trend Endpoint
@router.get("/predict/trend")
def get_trend(db: Session = Depends(get_db)):
    """Returns current trend direction for the dashboard arrow indicator."""

    since    = datetime.utcnow() - timedelta(hours=6)
    readings = db.query(SensorReading)\
                 .filter(SensorReading.timestamp >= since)\
                 .order_by(SensorReading.timestamp.asc())\
                 .all()

    if len(readings) < 2:
        return {"trend": "unknown", "icon": "➡️", "slope": 0.0}

    scores = [r.psi_score for r in readings]
    n      = len(scores)
    x      = list(range(n))
    x_mean = sum(x) / n
    y_mean = sum(scores) / n

    numerator   = sum((x[i] - x_mean) * (scores[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    slope       = numerator / denominator if denominator != 0 else 0.0

    if slope > 2:
        trend = "rising"
        icon  = "⬆️"
    elif slope < -2:
        trend = "falling"
        icon  = "⬇️"
    else:
        trend = "stable"
        icon  = "➡️"

    return {
        "trend": trend,
        "icon":  icon,
        "slope": round(slope, 3)
    }


# Model Info Endpoint
@router.get("/predict/model-info")
def get_model_info():
    """Returns info about the current ML model status."""

    model_exists      = os.path.exists(MODEL_PATH)
    classifier_exists = os.path.exists(CLASSIFIER_PATH)
    scaler_exists     = os.path.exists(SCALER_PATH)

    if not (model_exists and classifier_exists and scaler_exists):
        return {
            "status":  "not_trained",
            "message": "Run python -m app.ml.train to train the model",
            "method":  "linear_regression_fallback"
        }

    model_size       = os.path.getsize(MODEL_PATH) / 1024
    classifier_size  = os.path.getsize(CLASSIFIER_PATH) / 1024

    return {
        "status":            "ready",
        "message":           "ML model is loaded and ready",
        "regression_model":  {
            "method":        "random_forest_regressor",
            "size_kb":       round(model_size, 2),
            "path":          MODEL_PATH,
        },
        "classifier_model": {
            "method":        "random_forest_classifier",
            "size_kb":       round(classifier_size, 2),
            "path":          CLASSIFIER_PATH,
        },
        "features":          ["soil", "temp", "humidity", "light", "hour"],
    }
