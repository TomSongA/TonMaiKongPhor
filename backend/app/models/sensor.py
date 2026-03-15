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
    psi_level = Column(String, nullable=False)  # Healthy / Mild Stress / Critical
    timestamp = Column (DateTime, server_default=func.now())