import paho.mqtt.client as mqtt
import json
import time

# ── Broker Settings ────────────────────────────────
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT   = 1883
MQTT_TOPIC  = "tonmaikongphor/sensors"

# ── Callbacks ──────────────────────────────────────
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker!")
        client.subscribe(MQTT_TOPIC)
        print(f"Listening on topic: {MQTT_TOPIC}")
        print("Waiting for sensor data...\n")
    else:
        print(f"Connection failed — code {rc}")

def on_disconnect(client, userdata, rc):
    print("Disconnected from broker. Reconnecting...")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print("Received sensor data:")
        print(f"   Soil:     {payload.get('soil')}%")
        print(f"   Temp:     {payload.get('temp')}°C")
        print(f"   Humidity: {payload.get('humidity')}%")
        print(f"   Light:    {payload.get('light')}")
        print(f"   Raw:      {payload}\n")
    except Exception as e:
        print(f"Error parsing message: {e}")
        print(f"   Raw message: {msg.payload}\n")

# ── Start Listener ─────────────────────────────────
def start_mqtt_listener():
    client = mqtt.Client()
    client.on_connect    = on_connect
    client.on_disconnect = on_disconnect
    client.on_message    = on_message

    print(f"Connecting to {MQTT_BROKER}:{MQTT_PORT}...")

    while True:
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            client.loop_forever()   # keeps listening indefinitely
        except Exception as e:
            print(f"Connection error: {e}")
            print("Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    start_mqtt_listener()