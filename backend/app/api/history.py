from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from app.db.database import get_db
from app.models.sensor import SensorReading
from app.schemas.sensor import HistoryPoint, ReadingRow
from app.services.psi import get_psi_level

router = APIRouter(prefix="/api", tags=["History"])


@router.get("/readings", response_model=List[ReadingRow])
def get_readings(
    from_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD (inclusive)"),
    to_date: Optional[str] = Query(None, description="End date YYYY-MM-DD (inclusive)"),
    limit: int = Query(5000, ge=1, le=20000),
    db: Session = Depends(get_db),
):
    """Raw readings in a date range (for calendar / data table / client-side charts)."""

    q = db.query(SensorReading).order_by(SensorReading.timestamp.asc())

    if from_date:
        try:
            start = datetime.strptime(from_date[:10], "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="from_date must be YYYY-MM-DD")
        q = q.filter(SensorReading.timestamp >= start)

    if to_date:
        try:
            end_day = datetime.strptime(to_date[:10], "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            raise HTTPException(status_code=400, detail="to_date must be YYYY-MM-DD")
        q = q.filter(SensorReading.timestamp < end_day)

    rows = q.limit(limit).all()
    return rows


@router.get("/stress-history", response_model=List[HistoryPoint])
def get_stress_history(db: Session = Depends(get_db)):
    """Answers: How has stress changed over the past week?"""

    # Get readings from last 7 days
    since = datetime.utcnow() - timedelta(days=7)
    readings = db.query(SensorReading)\
                 .filter(SensorReading.timestamp >= since)\
                 .order_by(SensorReading.timestamp.asc())\
                 .all()

    if not readings:
        raise HTTPException(
            status_code=404,
            detail="No data found for the past week."
        )

    # Group readings by date
    grouped = {}
    for reading in readings:
        date_str = reading.timestamp.strftime("%Y-%m-%d")
        if date_str not in grouped:
            grouped[date_str] = []
        grouped[date_str].append(reading.psi_score)

    # Calculate daily average PSI
    history = []
    for date_str, scores in sorted(grouped.items()):
        avg_psi = round(sum(scores) / len(scores), 2)
        history.append(HistoryPoint(
            date=date_str,
            avg_psi=avg_psi,
            psi_level=get_psi_level(avg_psi)
        ))

    return history


@router.get("/stress-history/summary")
def get_stress_summary(db: Session = Depends(get_db)):
    """Returns a quick week summary — improving, worsening, or stable?"""

    since = datetime.utcnow() - timedelta(days=7)
    readings = db.query(SensorReading)\
                 .filter(SensorReading.timestamp >= since)\
                 .order_by(SensorReading.timestamp.asc())\
                 .all()

    if not readings:
        raise HTTPException(
            status_code=404,
            detail="No data found for the past week."
        )

    # Split into first half and second half of the week
    mid = len(readings) // 2
    first_half  = readings[:mid]
    second_half = readings[mid:]

    avg_first  = sum(r.psi_score for r in first_half)  / len(first_half)
    avg_second = sum(r.psi_score for r in second_half) / len(second_half)

    diff = avg_second - avg_first

    if diff > 5:
        trend   = "worsening"
        message = f"Plant stress has increased by {diff:.1f} points this week."
        icon    = "📈"
    elif diff < -5:
        trend   = "improving"
        message = f"Plant stress has decreased by {abs(diff):.1f} points this week."
        icon    = "📉"
    else:
        trend   = "stable"
        message = "Plant stress has been stable this week."
        icon    = "➡️"

    return {
        "trend":        trend,
        "message":      message,
        "icon":         icon,
        "avg_psi_first_half":  round(avg_first, 2),
        "avg_psi_second_half": round(avg_second, 2),
        "diff":         round(diff, 2)
    }