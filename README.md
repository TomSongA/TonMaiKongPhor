# TonMaiKongPhor

> Plant Stress Early Warning System

## Tech Stack

- **Backend:** Python + FastAPI
- **Database:** SQLite
- **MQTT:** HiveMQ (free cloud broker)
- **ML:** Scikit-learn
- **Frontend:** React + Vite + TailwindCSS

## Project Structure
```

TonMaiKongPhor/
├── backend/
│ ├── app/
│ │ ├── api/ # API routes
│ │ ├── core/ # Config & MQTT
│ │ ├── db/ # Database setup
│ │ ├── models/ # Database tables
│ │ ├── schemas/ # Data validation
│ │ ├── services/ # PSI calculation
│ │ └── ml/ # ML model
│ ├── tests/ # Unit & API tests
│ ├── requirements.txt
│ └── .env.example
├── frontend/
│ └── src/
│ ├── components/ # Reusable UI
│ ├── pages/ # Dashboard, History
│ ├── hooks/ # Custom hooks
│ ├── utils/ # Helper functions
│ └── api/ # API calls
├── .gitignore
└── README.md

````

### Backend
```
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload
```

### Frontend
```
cd frontend
npm install
npm run dev
```

### Run Tests
```
cd backend
pytest tests/
```

## PSI Levels
| Score | Level | Meaning |
|---|---|---|
| 0 - 40 | 🟢 Healthy | Plant is fine |
| 41 - 70 | 🟡 Mild Stress | Needs attention soon |
| 71 - 100 | 🔴 Critical | Act immediately! |

