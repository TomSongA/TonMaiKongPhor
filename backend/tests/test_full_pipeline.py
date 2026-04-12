"""
STEP 6 — Full end-to-end pipeline (Week 5 requirement)
KidBright32 → MQTT → POST /api/sensor → sensor_readings (MySQL)
            → GET /api/sensor/latest  → Dashboard reads it
            → GET /api/predict        → prediction_logs (MySQL)
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


class TestFullPipeline:

    def test_healthy_plant_sensor_to_dashboard(self):
        raw = {"soil": 60, "temp": 26.5, "humidity": 70.0, "light": 12000}
        post_resp = post_sensor(raw)
        assert post_resp.status_code == 200
        saved = post_resp.json()

        assert saved["psi_level"] == "Healthy"
        assert 0 <= saved["psi_score"] <= 40

        latest = client.get("/api/sensor/latest").json()
        assert latest["id"] == saved["id"]
        assert latest["psi_level"] == "Healthy"

        assert client.get("/api/stress").json()["psi_level"] == "Healthy"

        print(f"\nsensor_readings ← soil={raw['soil']} temp={raw['temp']}"
              f" → PSI={saved['psi_score']:.1f} ({saved['psi_level']})")

    def test_critical_plant_sensor_to_dashboard(self):
        raw = {"soil": 3, "temp": 42.0, "humidity": 20.0, "light": 96000}
        post_resp = post_sensor(raw)
        assert post_resp.status_code == 200
        saved = post_resp.json()

        assert saved["psi_level"] == "Critical"
        assert saved["psi_score"] >= 71

        latest = client.get("/api/sensor/latest").json()
        assert latest["psi_level"] == "Critical"

        stress = client.get("/api/stress").json()
        assert stress["psi_level"] == "Critical"
        assert "advice" in stress

        print(f"\nsensor_readings ← soil={raw['soil']} temp={raw['temp']}"
              f" → PSI={saved['psi_score']:.1f} ({saved['psi_level']}) — ALERT!")

    def test_prediction_log_written_after_readings(self):
        for _ in range(5):
            post_sensor({"soil": 50, "temp": 28.0, "humidity": 65.0, "light": 20000})

        resp = client.get("/api/predict?hours_ahead=3")
        assert resp.status_code == 200

        db: Session = SessionLocal()
        try:
            log = db.query(PredictionLog).order_by(
                PredictionLog.timestamp.desc()
            ).first()
            assert log is not None
            assert log.hours_ahead == 3
            assert log.method in ["ml", "linear_regression"]
            prediction_ids.append(log.id)
        finally:
            db.close()

        print(f"\nprediction_logs ← PSI={resp.json()['predicted_psi']:.1f}"
              f" ({resp.json()['predicted_level']}) method={log.method}")