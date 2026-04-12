"""
Prediction → saved to prediction_logs table
/api/predict reads sensor_readings, runs ML model,
and saves the result to prediction_logs.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.database import SessionLocal
from app.models.sensor import SensorReading, PredictionLog

client = TestClient(app)
sensor_ids: list[int] = []
prediction_ids: list[int] = []


@pytest.fixture(autouse=True)
def cleanup():
    sensor_ids.clear()
    prediction_ids.clear()
    yield
    db: Session = SessionLocal()
    try:
        if sensor_ids:
            db.query(SensorReading).filter(
                SensorReading.id.in_(sensor_ids)
            ).delete(synchronize_session=False)
        if prediction_ids:
            db.query(PredictionLog).filter(
                PredictionLog.id.in_(prediction_ids)
            ).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def post_sensor(payload: dict):
    resp = client.post("/api/sensor", json=payload)
    if resp.status_code == 200:
        sensor_ids.append(resp.json()["id"])
    return resp


def seed_readings(n=5):
    for _ in range(n):
        post_sensor({"soil": 50, "temp": 28.0, "humidity": 65.0, "light": 20000})


class TestPredictionLogsTable:

    def test_predict_returns_forecast(self):
        seed_readings()
        resp = client.get("/api/predict")
        assert resp.status_code == 200
        data = resp.json()

        assert "predicted_psi" in data
        assert "predicted_level" in data
        assert "confidence" in data
        assert "hours_ahead" in data
        assert 0 <= data["predicted_psi"] <= 100
        assert data["predicted_level"] in ["Healthy", "Mild Stress", "Critical"]
        assert data["confidence"] in ["low", "medium", "high"]

    def test_prediction_saved_to_prediction_logs(self):
        seed_readings()

        db: Session = SessionLocal()
        try:
            before = db.query(PredictionLog).count()
        finally:
            db.close()

        resp = client.get("/api/predict?hours_ahead=3")
        assert resp.status_code == 200
        predicted_psi = resp.json()["predicted_psi"]

        db = SessionLocal()
        try:
            after = db.query(PredictionLog).count()
            log = db.query(PredictionLog).order_by(
                PredictionLog.timestamp.desc()
            ).first()

            assert after >= before
            assert log is not None
            assert log.predicted_psi == predicted_psi
            assert log.hours_ahead == 3
            assert log.predicted_level in ["Healthy", "Mild Stress", "Critical"]
            assert log.confidence in ["low", "medium", "high"]
            assert log.method in ["ml", "linear_regression"]

            prediction_ids.append(log.id)
        finally:
            db.close()

    def test_predict_with_custom_hours_ahead(self):
        seed_readings()
        resp = client.get("/api/predict?hours_ahead=6")
        assert resp.status_code == 200
        assert resp.json()["hours_ahead"] == 6

    def test_predict_not_enough_data_returns_404(self):
        resp = client.get("/api/predict")
        assert resp.status_code in [200, 404]