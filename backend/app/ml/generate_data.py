import pandas as pd
import numpy as np
import os

from app.services.psi import calculate_psi

# Set seed for reproducibility
np.random.seed(42)

NUM_SAMPLES = 5000


def generate_training_data() -> pd.DataFrame:
    """
    Generate realistic synthetic sensor readings for Thailand hot season.
    Label each row with PSI score using our real calculate_psi function.
    """

    records = []

    for _ in range(NUM_SAMPLES):

        # Simulate time of day effect
        # Thailand hot season — temp and light vary by time of day
        hour = np.random.randint(0, 24)

        # Temperature — hotter midday (11am-3pm), cooler at night
        if 11 <= hour <= 15:
            temp = np.random.uniform(34, 42)      # midday heat
        elif 6 <= hour <= 10 or 16 <= hour <= 19:
            temp = np.random.uniform(28, 35)      # morning/afternoon
        else:
            temp = np.random.uniform(22, 30)      # night/early morning

        # Light — bright midday, dark at night
        if 11 <= hour <= 15:
            light = np.random.uniform(40000, 100000)   # direct sun
        elif 6 <= hour <= 10 or 16 <= hour <= 18:
            light = np.random.uniform(5000, 40000)     # partial sun
        elif 19 <= hour <= 20 or 5 <= hour <= 6:
            light = np.random.uniform(500, 5000)       # dawn/dusk
        else:
            light = np.random.uniform(0, 500)          # night/indoor

        # Humidity — higher at night, lower midday
        if 11 <= hour <= 15:
            humidity = np.random.uniform(45, 65)       # dry midday
        else:
            humidity = np.random.uniform(60, 90)       # humid morning/night

        # Soil — random, independent of time
        soil = np.random.uniform(10, 90)

        # Calculate PSI using real service
        result = calculate_psi(
            soil=round(soil, 2),
            temp=round(temp, 2),
            humidity=round(humidity, 2),
            light=round(light, 2)
        )

        records.append({
            "soil":        round(soil, 2),
            "temp":        round(temp, 2),
            "humidity":    round(humidity, 2),
            "light":       round(light, 2),
            "hour":        hour,
            "psi_score":   result["psi_score"],
            "psi_level":   result["psi_level"],
            "soil_score":  result["breakdown"]["soil_score"],
            "temp_score":  result["breakdown"]["temp_score"],
            "light_score": result["breakdown"]["light_score"],
        })

    df = pd.DataFrame(records)
    return df


def save_training_data(df: pd.DataFrame):
    """Save to CSV in ml folder."""
    output_path = os.path.join(os.path.dirname(__file__), "training_data.csv")
    df.to_csv(output_path, index=False)
    print(f"Saved {len(df)} rows to {output_path}")


def summarize(df: pd.DataFrame):
    """Print a quick summary of the generated data."""
    print("\n── Dataset Summary ──────────────────────────")
    print(f"Total rows:     {len(df)}")
    print(f"PSI range:      {df['psi_score'].min():.1f} – {df['psi_score'].max():.1f}")
    print(f"PSI mean:       {df['psi_score'].mean():.1f}")
    print("\n── PSI Level Distribution ───────────────────")
    print(df["psi_level"].value_counts())
    print("\n── Feature Ranges ───────────────────────────")
    print(df[["soil", "temp", "humidity", "light"]].describe().round(2))


if __name__ == "__main__":
    print("Generating synthetic training data for Thailand hot season...")
    df = generate_training_data()
    summarize(df)
    save_training_data(df)