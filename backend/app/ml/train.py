import pandas as pd
import numpy as np
import joblib
import os

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler

from app.ml.generate_data import generate_training_data, save_training_data


# Paths
ML_DIR      = os.path.dirname(__file__)
MODEL_PATH  = os.path.join(ML_DIR, "model.pkl")
SCALER_PATH = os.path.join(ML_DIR, "scaler.pkl")
DATA_PATH   = os.path.join(ML_DIR, "training_data.csv")


# Load or Generate Data
def load_data() -> pd.DataFrame:
    if os.path.exists(DATA_PATH):
        print(f"Loading existing data from {DATA_PATH}")
        return pd.read_csv(DATA_PATH)
    else:
        print("No training data found — generating now...")
        df = generate_training_data()
        save_training_data(df)
        return df


# Train
def train():
    print("\nTonMaiKongPhor — ML Model Training")
    print("=" * 45)

    # 1. Load data
    df = load_data()
    print(f"Loaded {len(df)} rows")

    # 2. Features and target
    # We use raw sensor values + hour as features
    # Target is psi_score (regression)
    FEATURES = ["soil", "temp", "humidity", "light", "hour"]
    TARGET   = "psi_score"

    # hour column may not exist if loaded from old CSV
    if "hour" not in df.columns:
        df["hour"] = 12   # default midday if missing

    X = df[FEATURES]
    y = df[TARGET]

    # 3. Train/test split — 80% train, 20% test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42
    )
    print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")

    # 4. Scale features
    scaler  = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test  = scaler.transform(X_test)

    # 5. Train RandomForest
    print("\nTraining RandomForestRegressor...")
    model = RandomForestRegressor(
        n_estimators=100,    # 100 decision trees
        max_depth=10,        # prevent overfitting
        min_samples_leaf=4,  # smoother predictions
        random_state=42,
        n_jobs=-1            # use all CPU cores
    )
    model.fit(X_train, y_train)
    print("Training complete!")

    # 6. Evaluate
    y_pred = model.predict(X_test)
    mae    = mean_absolute_error(y_test, y_pred)
    r2     = r2_score(y_test, y_pred)

    print("\n── Model Performance ────────────────────────")
    print(f"MAE (Mean Absolute Error): {mae:.2f} PSI points")
    print(f"R²  (Accuracy):            {r2:.4f}")

    if mae < 5:
        print("Excellent — error under 5 PSI points")
    elif mae < 10:
        print("Good — error under 10 PSI points")
    else:
        print("Poor — consider more training data")

    # 7. Feature importance
    print("\n── Feature Importance ───────────────────────")
    features_importance = zip(
        ["soil", "temp", "humidity", "light", "hour"],
        model.feature_importances_
    )
    for name, importance in sorted(features_importance, key=lambda x: -x[1]):
        bar = "█" * int(importance * 50)
        print(f"  {name:<10} {bar} {importance:.3f}")

    # 8. Save model and scaler
    joblib.dump(model,  MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"\nModel  saved → {MODEL_PATH}")
    print(f"Scaler saved → {SCALER_PATH}")

    return model, scaler


# ── Quick Predict Test ───────────────────────────────────────────────────────
def test_prediction(model, scaler):
    """Sanity check — predict a few known scenarios."""

    print("\n── Prediction Sanity Check ──────────────────")

    test_cases = [
        {"soil": 50, "temp": 28, "humidity": 70, "light": 15000, "hour": 9,  "expected": "Healthy"},
        {"soil": 15, "temp": 39, "humidity": 50, "light": 85000, "hour": 13, "expected": "Critical"},
        {"soil": 35, "temp": 33, "humidity": 65, "light": 35000, "hour": 11, "expected": "Mild Stress"},
    ]

    for case in test_cases:
        expected = case.pop("expected")
        X = pd.DataFrame([case])
        X_scaled = scaler.transform(X)
        predicted_psi = model.predict(X_scaled)[0]

        from app.services.psi import get_psi_level
        predicted_level = get_psi_level(predicted_psi)

        match = "✅" if predicted_level == expected else "⚠️"
        print(f"  {match} Input: soil={case['soil']} temp={case['temp']} "
              f"→ PSI: {predicted_psi:.1f} ({predicted_level}) | Expected: {expected}")


if __name__ == "__main__":
    model, scaler = train()
    test_prediction(model, scaler)
    print("\nModel ready for predictions!")