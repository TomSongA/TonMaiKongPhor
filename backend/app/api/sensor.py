from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.sensor import SensorReading
from app.schemas.sensor import SensorInput, SensorResponse, StressStatusResponse
from app.services.psi import calculate_psi

router = APIRouter(prefix='/api', tags=['Sensor'])

@router.post("/sensor", response_model=SensorResponse)
def create_sensor_reading(payload: SensorInput, db: Session = Depends(get_db)):

    result = calculate_psi(
        soil=payload.soil,
        temp=payload.temp,
        humidity=payload.humidity,
        light=payload.light
    )

    reading = SensorReading(
        soil=payload.soil,
        temp=payload.temp,
        humidity=payload.humidity,
        light=payload.light,
        psi_score=result.psi_score,
        psi_level=result.psi_level,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    return SensorResponse(
        id=reading.id,
        soil=reading.soil,
        temp=reading.temp,
        humidity=reading.humidity,
        light=reading.light,
        psi_score=reading.psi_score,
        psi_level=reading.psi_level,
        explanation=result.explanation,
        breakdown=result.breakdown,
        timestamp=reading.timestamp
    )


@router.get("/sensor/latest", response_model=SensorResponse)
def get_latest_reading(db: Session = Depends(get_db)):

    reading = db.query(SensorReading)\
    .order_by(SensorReading.timestamp.desc())\
    .first()

    if not reading:
        raise HTTPException(status_code=404, detail="No sensor readings found")
    
    result = calculate_psi(
        soil=reading.soil,
        temp=reading.temp,
        humidity=reading.humidity,
        light=reading.light
    )

    return SensorResponse(
        id=reading.id,
        soil=reading.soil,
        temp=reading.temp,
        humidity=reading.humidity,
        light=reading.light,
        psi_score=reading.psi_score,
        psi_level=reading.psi_level,
        explanation=result.explanation,
        breakdown=result.breakdown,
        timestamp=reading.timestamp
    )


@router.get("/stress", response_model=StressStatusResponse)
def get_stress_status(db: Session = Depends(get_db)):
    """Answers: Is my plant currently stressed, and why?"""

    reading = db.query(SensorReading)\
    .order_by(SensorReading.timestamp.desc())\
    .first()

    if not reading:
        raise HTTPException(status_code=404, detail="No sensor data available yet")
    
    result = calculate_psi(
        soil=reading.soil,
        temp=reading.temp,
        humidity=reading.humidity,
        light=reading.light
    )

    return StressStatusResponse(
        psi_score=result.psi_score,
        psi_level=result.psi_level,
        explanation=result.explanation,
        breakdown=result.breakdown,
        advice=result.advice
    )