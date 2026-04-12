from app.core.config import settings
from dataclasses import dataclass

# Per-Factor Scoring

def score_soil(soil: float) -> float:
    """
    Soil moisture 0-100%.
    Stress = too dry (below 30) or too wet (above 80).
    """
    if soil < 20:
        return 100.0
    elif soil < 30:
        return 70.0
    elif soil <= 65:      # tighten the healthy range
        return 0.0
    elif soil <= 75:
        return 50.0       # raise penalty
    else:
        return 85.0       # raise penalty for severe overwatering


def score_temp(temp: float) -> float:
    """
    Temperature in Celsius.
    Adjusted for Thailand, plants adapted to tropical heat
    """
    if temp < 15:
        return 100.0
    elif temp < 22:
        return 50.0
    elif temp <= 35: 
        return 0.0
    elif temp <= 40:
        return 40.0
    else:
        return 85.0 


def score_light(light: float) -> float:
    """
    Light in lux (0-100000).
    Too dark or too bright both cause stress.
    """
    if light < 500:
        return 80.0
    elif light < 1000:
        return 30.0
    elif light <= 50000:
        return 0.0
    elif light <= 80000:
        return 35.0
    else:
        return 75.0  


# Level Classification

def get_psi_level(psi_score: float) -> str:
    if psi_score <= 40:
        return "Healthy"
    elif psi_score <= 70:
        return "Mild Stress"
    else:
        return "Critical"


# PSI Calculation

@dataclass
class PSIResult:
    psi_score: float
    psi_level: str
    explanation: str
    advice: str
    breakdown: dict

def calculate_psi(soil, temp, humidity, light) -> PSIResult:
    soil_pct = round((soil / 4095) * 100, 1)

    soil_score  = score_soil(soil_pct)
    temp_score  = score_temp(temp)
    light_score = score_light(light)

    psi_score = round(
        (soil_score  * settings.PSI_WEIGHT_SOIL) +
        (temp_score  * settings.PSI_WEIGHT_TEMP) +
        (light_score * settings.PSI_WEIGHT_LIGHT),
        2
    )

    return PSIResult(
        psi_score   = psi_score,
        psi_level   = get_psi_level(psi_score),
        explanation = build_explanation(soil_pct, temp, humidity, light, soil_score, temp_score, light_score),  # แก้ soil → soil_pct
        advice      = build_advice(soil_score, temp_score, light_score, get_psi_level(psi_score)),
        breakdown   = {
            "soil_score":  soil_score,
            "temp_score":  temp_score,
            "light_score": light_score,
        }
    )


# Human-readable Explanation

def build_explanation(
    soil: float,
    temp: float,
    humidity: float,
    light: float,
    soil_score: float,
    temp_score: float,
    light_score: float
) -> str:
    issues = []

    if soil_score >= 70:
        issues.append(f"soil is too wet ({soil:.0f}%)" if soil < 30 else f"soil is too dry ({soil:.0f}%)")
    elif soil_score >= 30:
        issues.append(f"soil moisture is slightly off ({soil:.0f}%)")

    if temp_score >= 70:
        issues.append(f"temperature is too {'cold' if temp < 18 else 'hot'} ({temp:.1f}°C)")
    elif temp_score >= 30:
        issues.append(f"temperature is slightly {'low' if temp < 18 else 'high'} ({temp:.1f}°C)")

    if light_score >= 70:
        issues.append(f"light is too {'dim' if light < 1000 else 'bright'} ({light:.0f} lux)")
    elif light_score >= 30:
        issues.append(f"light level is slightly off ({light:.0f} lux)")

    if humidity < 40:
        issues.append(f"air humidity is very low ({humidity:.0f}%)")
    elif humidity > 90:
        issues.append(f"air humidity is very high ({humidity:.0f}%)")

    if not issues:
        return "All conditions are within healthy ranges."

    return "Plant is stressed because: " + ", ".join(issues) + "."


# Actionable Advice

def build_advice(
    soil_score: float,
    temp_score: float,
    light_score: float,
    psi_level: str
) -> str:
    if psi_level == "Healthy":
        return "Your plant is doing great! Keep current conditions."

    advice = []

    if soil_score >= 70:
        advice.append("water immediately" if soil_score == 100 else "check soil moisture soon")
    if temp_score >= 50:
        advice.append("move plant to a cooler/warmer spot")
    if light_score >= 70:
        advice.append("adjust lighting or move away from direct sun")

    if not advice:
        return "Monitor conditions closely over the next few hours."

    prefix = "Act now: " if psi_level == "Critical" else "Suggestion: "
    return prefix + ", ".join(advice) + "."