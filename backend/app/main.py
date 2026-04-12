from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_db
from app.api.sensor import router as sensor_router
from app.api.water_time import router as water_time_router
from app.api.history import router as history_router
from app.api.predict import router as predict_router
from app.api.weather import router as weather_router

import threading
from app.core.mqtt_listener import start_mqtt_listener


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    print("Database initialized")
    thread = threading.Thread(target=start_mqtt_listener, daemon=True)
    thread.start()
    print("MQTT listener started")
    print("TonMaiKongPhor API is ready")
    yield  # app runs here


app = FastAPI(
    title="TonMaiKongPhor API",
    description="Plant Stress Early Warning System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev
        "http://localhost:5173",   # Vite
        "http://localhost:4173",   # Vite preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(sensor_router)
app.include_router(water_time_router)
app.include_router(history_router)
app.include_router(predict_router)
app.include_router(weather_router)

# Health Check
@app.get("/")
def root():
    return {
        "message": "TonMaiKongPhor API is running",
        "version": "1.0.0",
        "docs":    "http://localhost:8000/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "endpoints": [
            "POST /api/sensor",
            "GET  /api/sensor/latest",
            "GET  /api/stress",
            "GET  /api/best-water-time",
            "GET  /api/stress-history",
            "GET  /api/stress-history/summary",
            "GET  /api/predict",
            "GET  /api/predict/trend",
            "GET  /api/weather",
            "GET  /api/weather/outdoor",
        ]
    }