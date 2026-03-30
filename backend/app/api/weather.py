from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from app.db.database import get_db
from app.models.sensor import SensorReading
from app.schemas.sensor import WeatherComparison

router = APIRouter(prefix="/api", tags=["Weather"])

# Bangkok coordinates
LATITUDE  = 13.7563
LONGITUDE = 100.5018


async def fetch_outdoor_weather() -> dict:
    """
    Fetch current outdoor weather from Open-Meteo.
    Free API — no key needed.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={LATITUDE}"
        f"&longitude={LONGITUDE}"
        f"&current=temperature_2m,relative_humidity_2m,"
        f"apparent_temperature,weather_code"
        f"&timezone=Asia%2FBangkok"
    )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            current = data["current"]
            return {
                "temp":     current["temperature_2m"],
                "humidity": current["relative_humidity_2m"],
                "feels_like": current["apparent_temperature"],
                "weather_code": current["weather_code"]
            }

        except httpx.TimeoutException:
            raise HTTPException(
                status_code=503,
                detail="Weather service timeout. Try again later."
            )
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Could not fetch outdoor weather: {str(e)}"
            )


def decode_weather_code(code: int) -> str:
    """
    Convert Open-Meteo weather code to human readable string.
    https://open-meteo.com/en/docs#weathervariables
    """
    if code == 0:
        return "Clear sky"
    elif code in [1, 2, 3]:
        return "Partly cloudy"
    elif code in [45, 48]:
        return "Foggy"
    elif code in [51, 53, 55]:
        return "Drizzle"
    elif code in [61, 63, 65]:
        return "Rainy"
    elif code in [80, 81, 82]:
        return "Rain showers"
    elif code in [95, 96, 99]:
        return "Thunderstorm"
    else:
        return "Unknown"


@router.get("/weather", response_model=WeatherComparison)
async def get_weather_comparison(db: Session = Depends(get_db)):
    """
    Returns indoor vs outdoor weather comparison panel data.
    Indoor = latest sensor reading.
    Outdoor = Open-Meteo API for Bangkok.
    """

    # Get latest indoor reading
    indoor = db.query(SensorReading)\
               .order_by(SensorReading.timestamp.desc())\
               .first()

    if not indoor:
        raise HTTPException(
            status_code=404,
            detail="No indoor sensor data available yet."
        )

    # Get outdoor weather
    outdoor = await fetch_outdoor_weather()

    temp_diff     = round(indoor.temp - outdoor["temp"], 2)
    humidity_diff = round(indoor.humidity - outdoor["humidity"], 2)

    return WeatherComparison(
        indoor_temp=indoor.temp,
        indoor_humidity=indoor.humidity,
        outdoor_temp=outdoor["temp"],
        outdoor_humidity=outdoor["humidity"],
        temp_diff=temp_diff,
        humidity_diff=humidity_diff
    )


@router.get("/weather/outdoor")
async def get_outdoor_only():
    """Returns just outdoor weather — useful for frontend weather widget."""

    outdoor = await fetch_outdoor_weather()
    condition = decode_weather_code(outdoor["weather_code"])

    return {
        "temp":        outdoor["temp"],
        "humidity":    outdoor["humidity"],
        "feels_like":  outdoor["feels_like"],
        "condition":   condition,
        "location":    "Bangkok, Thailand",
        "latitude":    LATITUDE,
        "longitude":   LONGITUDE
    }