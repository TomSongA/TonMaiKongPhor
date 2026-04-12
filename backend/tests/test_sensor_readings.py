"""
Sensor sends data → saved to sensor_readings table
Simulates KidBright32 publishing via MQTT → backend receives it →
row is written to sensor_readings with PSI calculated.
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


class TestSensorReadingsTable:

    def test_healthy_reading_written_to_sensor_readings(self):
        resp = post_sensor({"soil": 55, "temp": 27.0, "humidity": 68.0, "light": 15000})
        assert resp.status_code == 200
        data = resp.json()

        assert data["id"] is not None
        assert data["timestamp"] is not None
        assert data["soil"] == 55
        assert data["temp"] == 27.0
        assert data["humidity"] == 68.0
        assert data["light"] == 15000
        assert 0 <= data["psi_score"] <= 40
        assert data["psi_level"] == "Healthy"

        db: Session = SessionLocal()
        try:
            row = db.query(SensorReading).filter(SensorReading.id == data["id"]).first()
            assert row is not None
            assert row.soil == 55
            assert row.psi_level == "Healthy"
        finally:
            db.close()

    def test_mild_stress_written_to_sensor_readings(self):
        resp = post_sensor({"soil": 15, "temp": 36.0, "humidity": 48.0, "light": 55000})
        assert resp.status_code == 200
        data = resp.json()
        assert 41 <= data["psi_score"] <= 70
        assert data["psi_level"] == "Mild Stress"

        db: Session = SessionLocal()
        try:
            row = db.query(SensorReading).filter(SensorReading.id == data["id"]).first()
            assert row.psi_level == "Mild Stress"
        finally:
            db.close()

    def test_critical_written_to_sensor_readings(self):
        resp = post_sensor({"soil": 4, "temp": 41.0, "humidity": 22.0, "light": 92000})
        assert resp.status_code == 200
        data = resp.json()

        assert data["psi_score"] >= 71
        assert data["psi_level"] == "Critical"

        db: Session = SessionLocal()
        try:
            row = db.query(SensorReading).filter(SensorReading.id == data["id"]).first()
            assert row.psi_level == "Critical"
            assert row.psi_score >= 71
        finally:
            db.close()

    def test_outdoor_weather_stored_alongside_reading(self):
        resp = post_sensor({"soil": 55, "temp": 27.0, "humidity": 68.0, "light": 15000})
        assert resp.status_code == 200

        db: Session = SessionLocal()
        try:
            row = db.query(SensorReading).filter(
                SensorReading.id == resp.json()["id"]
            ).first()
            assert hasattr(row, "outdoor_temp")
            assert hasattr(row, "outdoor_humidity")
            assert hasattr(row, "rain_probability")
        finally:
            db.close()

    def test_incomplete_payload_rejected(self):
        resp = client.post("/api/sensor", json={"soil": 50, "temp": 28.0})
        assert resp.status_code == 422