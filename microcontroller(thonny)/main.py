from machine import Pin
import network
import dht
import time
from umqtt.simple import MQTTClient
import machine
import json

# Reset WiFi
wlan = network.WLAN(network.STA_IF)
wlan.active(False)
time.sleep(1)

# WiFi
WIFI_SSID = "your_wifi_name"
WIFI_PASS = "your_password"

# MQTT
MQTT_BROKER = "broker.hivemq.com"
MQTT_TOPIC  = b"tonmaikongphor/sensors"

# Sensors
soil  = machine.ADC(machine.Pin(35))
soil.atten(machine.ADC.ATTN_11DB)
light = machine.ADC(machine.Pin(34))
light.atten(machine.ADC.ATTN_11DB)
sensor = dht.DHT11(Pin(33, Pin.IN, Pin.PULL_UP))

# Connect WiFi
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(WIFI_SSID, WIFI_PASS)
print("Connecting to WiFi...")
while not wlan.isconnected():
    time.sleep(0.5)
print("WiFi connected!", wlan.ifconfig())

# Connect MQTT
client = MQTTClient("kidbright32_001", MQTT_BROKER, port=1883, keepalive=60)
client.connect()
print("MQTT connected!")

# Send data
INTERVAL = 900
elapsed = INTERVAL

while True:
    print(f"tick elapsed={elapsed}")
    try:
        client.ping()
    except Exception as e:
        print(f"Ping failed: {e} — reconnecting...")
        try:
            client.disconnect()
        except:
            pass
        time.sleep(3)
        # add retry loop
        for attempt in range(5):
            try:
                client = MQTTClient("kidbright32_001", MQTT_BROKER, port=1883, keepalive=60)
                client.connect()
                print("MQTT reconnected!")
                break
            except Exception as e2:
                print(f"Reconnect attempt {attempt+1} failed: {e2}")
                time.sleep(5)
        else:
            print("Cannot reconnect — rebooting...")
            machine.reset()  # reset
        #elapsed = 0

    elapsed += 50
    if elapsed >= INTERVAL:
        try:
            sensor.measure()
            temp = sensor.temperature()
            hum  = sensor.humidity()
            data = {
                "soil": soil.read(),
                "light": light.read(),
                "temp": temp,
                "humidity": hum
            }
            client.publish(MQTT_TOPIC, json.dumps(data))
            print(f"Sent: {data}")
        except Exception as e:
            print(f"Send Error: {e}")
        elapsed = 0
    time.sleep(50)
