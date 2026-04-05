from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    soil = Column(Float, nullable=False)
    temp = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    light = Column(Float, nullable=False)
    psi_score = Column(Float, nullable=False)   # 0-100
    psi_level = Column(String(20), nullable=False)  # Healthy / Mild Stress / Critical
    outdoor_temp = Column(Float, nullable=True)
    outdoor_humidity = Column(Float, nullable=True)
    rain_probability = Column(Float, nullable=True)
    timestamp = Column (DateTime, server_default=func.now())

class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    predicted_psi = Column(Float, nullable=False)
    predicted_level = Column(String(20), nullable=False)
    hours_ahead = Column(Integer, nullable=False)
    confidence = Column(String(10), nullable=False)
    method = Column(String(20), nullable=False)
    timestamp = Column(DateTime, server_default=func.now())