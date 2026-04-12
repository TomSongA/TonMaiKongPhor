"""
Dashboard reads /api/sensor/latest from sensor_readings
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


class TestLatestEndpoint:

    def test_returns_most_recent_row(self):
        post_sensor({"soil": 55, "temp": 27.0, "humidity": 68.0, "light": 15000})
        post_sensor({"soil": 4,  "temp": 41.0, "humidity": 22.0, "light": 92000})

        resp = client.get("/api/sensor/latest")
        assert resp.status_code == 200
        data = resp.json()
        assert data["soil"] == 4
        assert data["psi_level"] == "Critical"

    def test_response_has_all_dashboard_fields(self):
        post_sensor({"soil": 55, "temp": 27.0, "humidity": 68.0, "light": 15000})
        data = client.get("/api/sensor/latest").json()

        for field in ["id", "soil", "temp", "humidity", "light",
                      "psi_score", "psi_level", "explanation", "breakdown", "timestamp"]:
            assert field in data, f"Missing field for dashboard: {field}"