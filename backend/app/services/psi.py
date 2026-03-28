from dataclasses import dataclass
from enum import Enum


SOIL_MIN, SOIL_MAX = 45.0, 75.0
TEMP_MIN, TEMP_MAX = 22.0, 40.0
HUM_MIN, HUM_MAX = 55.0, 85.0
LIGHT_MIN, LIGHT_MAX = 300.0, 1200.0


class PSILevel(str, Enum):
    HEALTHY = 'Healthy'
    MILD = 'Mild Stress'
    CRITICAL = 'Critical'


@dataclass
class PSIResult:
    psi_score: float
    psi_level: PSILevel
    soil_stress: float
    temp_humidity_stress: float
    light_stress: float


# Component stress score
def _soil_stress(soil: float) -> float:
    if SOIL_MIN <= soil <= SOIL_MAX:
        return 0.0
    if soil < SOIL_MIN:
        return min(100.0, (SOIL_MIN - soil) * 2.5)  # dry
    return min(100.0, (soil - SOIL_MAX) * 3.33)     # overwatered


def _temp_humidity_stress(temp: float, humidity: float) -> float:
    # Temperature
    if temp < TEMP_MIN:
        t = min(100.0, (TEMP_MIN - temp) * 8.0)   # cold is rare but bad
    elif temp > TEMP_MAX:
        t = min(100.0, (temp - TEMP_MAX) * 5.0)   # heat stress is gradual
    else:
        t = 0.0

    # Humidity
    if humidity < HUM_MIN:
        h = min(100.0, (HUM_MIN - humidity) * 3.0)  # dry air = bad
    elif humidity > HUM_MAX:
        h = min(100.0, (humidity - HUM_MAX) * 1.0)  # very forgiving above max
    else:
        h = 0.0

    return (t + h) / 2.0


def _light_stress(light: float) -> float:
    if LIGHT_MIN <= light <= LIGHT_MAX:
        return 0.0
    if light < LIGHT_MIN:
        return min(100.0, (LIGHT_MIN - light) * 0.5)
    return min(100.0, (light - LIGHT_MAX) * 0.05)


def calculate_psi(
        soil: float,
        temp: float,
        humidity: float,
        light: float,
) -> PSIResult:
    soil_s = _soil_stress(soil)
    th_s = _temp_humidity_stress(temp, humidity)
    light_s = _light_stress(light)

    psi = (soil_s * 0.40) + (th_s * 0.30) + (light_s * 0.30)
    psi = round(min(100.0, max(0.0, psi)), 2)

    if psi <= 40:
        level = PSILevel.HEALTHY
    elif psi <= 70:
        level = PSILevel.MILD
    else:
        level = PSILevel.CRITICAL
    
    return PSIResult(
        psi_score = psi,
        psi_level = level,
        soil_stress = round(soil_s, 2),
        temp_humidity_stress = round(th_s, 2),
        light_stress = round(light_s, 2),
    )