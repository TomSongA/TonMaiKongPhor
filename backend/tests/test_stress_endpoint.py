"""
Stress status: "Is my plant stressed right now?"
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.database import SessionLocal
from app.models.sensor import SensorReading

client = TestClient(app)
sensor_ids: list[int] = []


@pytest.fixture(autouse=True)
def cleanup():
    sensor_ids.clear()
    yield
    db: Session = SessionLocal()
    try:
        if sensor_ids:
            db.query(SensorReading).filter(
                SensorReading.id.in_(sensor_ids)
            ).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def post_sensor(payload: dict):
    resp = client.post("/api/sensor", json=payload)
    if resp.status_code == 200:
        sensor_ids.append(resp.json()["id"])
    return resp


class TestStressEndpoint:

    def test_healthy_status(self):
        post_sensor({"soil": 55, "temp": 27.0, "humidity": 68.0, "light": 15000})
        data = client.get("/api/stress").json()
        assert data["psi_level"] == "Healthy"
        assert "advice" in data

    def test_critical_status(self):
        post_sensor({"soil": 4, "temp": 41.0, "humidity": 22.0, "light": 92000})
        data = client.get("/api/stress").json()
        assert data["psi_level"] == "Critical"
        assert data["psi_score"] >= 71