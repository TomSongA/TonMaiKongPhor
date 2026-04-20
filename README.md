# TonMaiKongPhor

> **Plant Stress Early Warning System**  
> Monitors a basil plant in real-time using soil, temperature, humidity, and light sensors. Calculates a Plant Stress Index (PSI) score, fetches live weather data, and predicts upcoming stress levels using a trained machine learning model.

---

## Tech Stack

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| **Backend**  | Python 3.13, FastAPI, SQLAlchemy                                        |
| **Database** | MySQL (hosted on university server — `iot.cpe.ku.ac.th`)                |
| **MQTT**     | HiveMQ (free cloud broker) + paho-mqtt                                  |
| **Weather**  | Open-Meteo API (free, no key needed) + OpenWeatherMap                   |
| **ML**       | Scikit-learn (Random Forest classifier + regressor)                     |
| **Frontend** | Next.js (App Router), React, Vite, TailwindCSS                          |
| **Hardware** | KidBright32 with soil moisture, temperature/humidity, and light sensors |

---

## Project Structure

```
TonMaiKongPhor/
├── backend/
│   ├── app/
│   │   ├── api/            # Route handlers (sensor, history, predict, weather, water_time)
│   │   ├── core/           # Config & MQTT listener
│   │   ├── db/             # Database setup (SQLite)
│   │   ├── models/         # SQLAlchemy table definitions
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── services/       # PSI calculation + weather service
│   │   └── ml/             # Random Forest model training & prediction
│   ├── tests/              # Unit & API tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI (CircleGauge, SensorCard, MultiSensorChart, etc.)
│       ├── hooks/          # Custom hooks (useLiveSensors, usePrediction)
│       ├── lib/            # API client (sensorApi.js) + logic (sensorLogic.js)
│       └── screens/        # Page-level components (Dashboard, Calendar, DataTable,
│                           #   Notifications, Prediction)
├── microcontroller(thonny)/
│   └── main.py             # MicroPython script for KidBright32 (runs in Thonny IDE)
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in your MQTT broker credentials
python -m uvicorn app.main:app --reload
```

API will be available at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at `http://localhost:3000`

### Run Tests

```bash
cd backend
pytest tests/
```

---

## API Endpoints

| Method | Endpoint                      | Description                                 |
| ------ | ----------------------------- | ------------------------------------------- |
| `POST` | `/api/sensor`                 | Submit a new sensor reading                 |
| `GET`  | `/api/sensor/latest`          | Get the most recent reading + PSI           |
| `GET`  | `/api/stress`                 | Current stress status and explanation       |
| `GET`  | `/api/stress-history`         | Stress history over the past week           |
| `GET`  | `/api/stress-history/summary` | Weekly summary stats                        |
| `GET`  | `/api/best-water-time`        | Recommended watering window for today       |
| `GET`  | `/api/predict`                | Predicted PSI for the next 1–12 hours       |
| `GET`  | `/api/predict/trend`          | Predicted stress trend                      |
| `GET`  | `/api/weather`                | Current indoor + outdoor weather comparison |
| `GET`  | `/api/weather/outdoor`        | Raw outdoor weather from Open-Meteo         |
| `GET`  | `/api/readings`               | Historical readings by date range           |

---

## PSI Score

The **Plant Stress Index** is calculated from four sensor inputs using a weighted formula:

| Factor          | Weight | Role                                                       |
| --------------- | ------ | ---------------------------------------------------------- |
| Soil moisture   | 40%    | Primary stress indicator; triggers watering recommendation |
| Temperature     | 15%    | Detects heat stress                                        |
| Humidity        | 15%    | Paired with temperature for environmental stress           |
| Light intensity | 30%    | Checks daily light adequacy                                |

**PSI Levels:**

| Score    | Level          | Meaning              |
| -------- | -------------- | -------------------- |
| 0 – 40   | 🟢 Healthy     | Plant is fine        |
| 41 – 70  | 🟡 Mild Stress | Needs attention soon |
| 71 – 100 | 🔴 Critical    | Act immediately!     |

---

## Data Sources

- **Sensors** — KidBright32 reads soil, temp, humidity, and light every 15 minutes via MQTT
- **Weather APIs** — Open-Meteo (forecast + rain probability) and OpenWeatherMap (current outdoor conditions), fetched every 30 minutes
- **Stress Experiments** — Labeled drought, overwatering, low-light, and heat stress events used to train the ML model

---

## Pages

| Route            | Page          | Description                                                                 |
| ---------------- | ------------- | --------------------------------------------------------------------------- |
| `/`              | Dashboard     | Plant wellness score, live sensor cards, real-time chart, watering time, and 7-day stress trend |
| `/calendar`      | Calendar      | Daily PSI wellness history by date                                          |
| `/data`          | Data Table    | Browse and filter all historical readings by date range                     |
| `/predict`       | Prediction    | Predicted PSI trend for the next 1–12 hours                                 |

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```env
APP_NAME=TonMaiKongPhor
DEBUG=True
DATABASE_URL=mysql+pymysql://<DB_USER>:<DB_PASS>@<DB_HOST>:<DB_PORT>/<DB_NAME>
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
MQTT_TOPIC=tonmaikongphor/sensors
OPENWEATHER_API_KEY=        # optional — for OpenWeatherMap
DB_USER=your_student_id
DB_PASS=your_password
DB_HOST=iot.cpe.ku.ac.th
DB_PORT=3306
DB_NAME=your_student_id
```

> The database is hosted on the university MySQL server at `iot.cpe.ku.ac.th`.  
> Credentials are issued per student by the CPE department.

`NEXT_PUBLIC_API_URL` can be set in `frontend/.env.local` to point the frontend at a non-default backend address (default: `http://localhost:8000`).

## Microcontroller

The `microcontroller(thonny)/` folder contains the MicroPython script 
that runs directly on the **KidBright32** board using the Thonny IDE.

### What it does
- Reads sensor data (soil moisture, temperature/humidity, light intensity)
  every 15 minutes
- Publishes readings as JSON payload to the MQTT broker via Wi-Fi

### How to flash
1. Open **Thonny IDE** and connect the KidBright32 board via USB
2. Set the interpreter to **MicroPython (ESP32)**
3. Open `microcontroller(thonny)/main.py`
4. Edit the Wi-Fi credentials and MQTT broker settings at the top of the file
5. Run or save to device as `main.py`

### MQTT Payload format
```json
{
  "soil": 45,
  "temperature": 28.5,
  "humidity": 65.2,
  "light": 320
}
```
