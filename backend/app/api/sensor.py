from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from app.db.database import get_db
from app.models.sensor import SensorReading
from app.schemas.sensor import SensorInput, SensorResponse, StressStatusResponse
from app.services.psi import calculate_psi

router = APIRouter(prefix='/api', tags=['Sensor'])

LATITUDE  = 13.7563
LONGITUDE = 100.5018


async def fetch_weather() -> dict:
    """Fetch outdoor weather from Open-Meteo (free, no API key required)."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={LATITUDE}&longitude={LONGITUDE}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation_probability"
        f"&timezone=Asia%2FBangkok"
    )
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            current = response.json()["current"]
            return {
                "outdoor_temp":     current.get("temperature_2m"),
                "outdoor_humidity": current.get("relative_humidity_2m"),
                "rain_probability": current.get("precipitation_probability"),
            }
    except Exception:
        return {
            "outdoor_temp":     None,
            "outdoor_humidity": None,
            "rain_probability": None,
        }


@router.post("/sensor", response_model=SensorResponse)
async def create_sensor_reading(payload: SensorInput, db: Session = Depends(get_db)):

    result  = calculate_psi(
        soil=payload.soil,
        temp=payload.temp,
        humidity=payload.humidity,
        light=payload.light
    )

    weather = await fetch_weather()

    reading = SensorReading(
        soil=payload.soil,
        temp=payload.temp,
        humidity=payload.humidity,
        light=payload.light,
        psi_score=result.psi_score,
        psi_level=result.psi_level,
        outdoor_temp=weather["outdoor_temp"],
        outdoor_humidity=weather["outdoor_humidity"],
        rain_probability=weather["rain_probability"],
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