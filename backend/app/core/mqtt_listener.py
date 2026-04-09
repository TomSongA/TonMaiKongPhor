import json
import time
import asyncio
import paho.mqtt.client as mqtt
import nest_asyncio
nest_asyncio.apply()

from app.core.config import settings
from app.db.database import SessionLocal, init_db
from app.models.sensor import SensorReading
from app.services.psi import calculate_psi
from app.services.weather_service import get_weather


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker!")
        client.subscribe(settings.MQTT_TOPIC)
        print(f"Listening on: {settings.MQTT_TOPIC}\n")
    else:
        print(f"Connection failed — code {rc}")


def on_disconnect(client, userdata, rc):
    print("Disconnected. Will reconnect...")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"Received: {payload}")

        result = calculate_psi(
            soil=payload["soil"],
            temp=payload["temp"],
            humidity=payload["humidity"],
            light=payload["light"],
        )

        # Fetch weather (sync wrapper around async function)
        # weather = asyncio.run(get_weather())
        try:
            loop = asyncio.get_event_loop()
            weather = loop.run_until_complete(get_weather())
        except RuntimeError:
            weather = None

        db = SessionLocal()
        try:
            reading = SensorReading(
                soil=payload["soil"],
                temp=payload["temp"],
                humidity=payload["humidity"],
                light=payload["light"],
                psi_score=result.psi_score,
                psi_level=result.psi_level,
                outdoor_temp=weather.temp if weather else None,
                outdoor_humidity=weather.humidity if weather else None,
                rain_probability=weather.rain_probability if weather else None,
            )
            db.add(reading)
            db.commit()
            print(f"Saved → PSI={result.psi_score} ({result.psi_level})")
            if weather:
                print(f"Weather → {weather.temp}°C, {weather.humidity}% ({weather.description})")
        except Exception as e:
            db.rollback()
            print(f"DB error: {e}")
        finally:
            db.close()

    except Exception as e:
        print(f"Message error: {e}")


def start_mqtt_listener():
    init_db()  # ensure table exists before listening

    client = mqtt.Client()
    client.on_connect    = on_connect
    client.on_disconnect = on_disconnect
    client.on_message    = on_message

    client.reconnect_delay_set(min_delay=1, max_delay=30)
    client.connect_async(settings.MQTT_BROKER, settings.MQTT_PORT, keepalive=30)

    print(f"onnecting to {settings.MQTT_BROKER}:{settings.MQTT_PORT}...")

    client.loop_forever(retry_first_connection=True)

    # while True:
    #     try:
    #         client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, keepalive=60)
    #         client.loop_forever()
    #     except Exception as e:
    #         print(f"Connection error: {e}")
    #         print("Retrying in 5 seconds...")
    #         time.sleep(5)


if __name__ == "__main__":
    start_mqtt_listener()