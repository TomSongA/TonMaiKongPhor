import httpx
import time
from dataclasses import dataclass
from app.core.config import settings


_cache: dict = {}
CACHE_TTL = 600


@dataclass
class WeatherData:
    temp: float
    humidity: float
    description: str


# Open-Meteo
async def fetch_open_meteo(lat: float, lon: float) -> WeatherData:
    cache_key = f"open_meteo_{lat}_{lon}"
    now = time.time()

    if cache_key in _cache and now - _cache[cache_key]["ts"] < CACHE_TTL:
        return _cache[cache_key]["data"]
    
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,weather_code"
        "&timezone=Asia%2FBangkok"
    )

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        raw = resp.json()['current']

    data = WeatherData(
        temp = raw['temperature_2m'],
        humidity = raw['relative_humidity_2m'],
        description = _wmo_description(raw['weather_code']),
    )

    _cache[cache_key] = {'data': data, 'ts': now}
    return data


# OpenWeatherMap
async def fetch_openweathermap(lat: float, lon: float) -> WeatherData:
    cache_key = f"owm_{lat}_{lon}"
    now = time.time()

    if cache_key in _cache and now - _cache[cache_key]['ts'] < CACHE_TTL:
        return _cache[cache_key]['data']
    
    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}"
        f"&appid={settings.OPENWEATHER_API_KEY}"
        "&units=metric"
    )

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        raw = resp.json()

    data = WeatherData(
        temp = raw['main']['temp'],
        humidity = raw['main']['humidity'],
        description = raw['weather'][0]['description'],
    )

    _cache[cache_key] = {'data': data, 'ts': now}
    return data


# Main entry point
async def get_weather(lat: float = 13.61787144918023, lon: float = 100.53693076799493) -> WeatherData | None:
    """
    Tries OpenWeatherMap first (richer data).
    Falls back to Open-Meteo if no API key or request fails.
    Default coords = Bangkok
    """
    if settings.OPENWEATHER_API_KEY:
        try:
            return await fetch_openweathermap(lat, lon)
        except Exception as e:
            print(f"[weather] OWM failed: {e} - falling back to Open-Meteo")
    
    try:
        return await fetch_open_meteo(lat, lon)
    except Exception as e:
        print(f"[weather] Open-Meteo failed: {e}")
        return None


def _wmo_description(code: int) -> str:
    WMO = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Icy fog',
        51: 'Light drizzle', 53: 'drizzle', 55: 'Heavy drizzle',
        61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: "Snow", 75: "Heavy snow",
        80: "Slight showers", 81: "Showers", 82: "Heavy showers",
        95: "Thunderstorm", 99: "Thunderstorm with hail"
    }
    return WMO.get(code, f"Unknown ({code})")
