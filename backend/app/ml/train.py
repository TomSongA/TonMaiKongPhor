import pandas as pd
import numpy as np
import joblib
import os

from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler

from app.ml.generate_data import generate_training_data, save_training_data


# Paths
ML_DIR          = os.path.dirname(__file__)
MODEL_PATH      = os.path.join(ML_DIR, "model.pkl")
CLASSIFIER_PATH = os.path.join(ML_DIR, "classifier.pkl")
SCALER_PATH     = os.path.join(ML_DIR, "scaler.pkl")
DATA_PATH       = os.path.join(ML_DIR, "training_data.csv")


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
    # Regression target → psi_score; classification target → psi_level
    FEATURES          = ["soil", "temp", "humidity", "light", "hour"]
    TARGET_REGRESSION = "psi_score"
    TARGET_CLASS      = "psi_level"

    # hour column may not exist if loaded from old CSV
    if "hour" not in df.columns:
        df["hour"] = 12   # default midday if missing

    X       = df[FEATURES]
    y_reg   = df[TARGET_REGRESSION]
    y_class = df[TARGET_CLASS]

    # 3. Train/test split — 80% train, 20% test
    (X_train,
     X_test,
     y_train_reg,
     y_test_reg,
     y_train_class,
     y_test_class) = train_test_split(
        X,
        y_reg,
        y_class,
        test_size=0.2,
        random_state=42,
        stratify=y_class
    )
    print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")

    # 4. Scale features
    scaler         = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # 5. Train RandomForest
    print("\nTraining RandomForestRegressor...")
    model = RandomForestRegressor(
        n_estimators=100,    # 100 decision trees
        max_depth=10,        # prevent overfitting
        min_samples_leaf=4,  # smoother predictions
        random_state=42,
        n_jobs=-1            # use all CPU cores
    )
    model.fit(X_train_scaled, y_train_reg)
    print("Training complete!")

    # 6. Evaluate
    y_pred = model.predict(X_test_scaled)
    mae    = mean_absolute_error(y_test_reg, y_pred)
    r2     = r2_score(y_test_reg, y_pred)

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

    # 8. Train classifier on labeled psi levels
    print("\nTraining RandomForestClassifier for PSI levels...")
    classifier = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    classifier.fit(X_train_scaled, y_train_class)
    class_pred = classifier.predict(X_test_scaled)
    accuracy   = accuracy_score(y_test_class, class_pred)
    print(f"Classifier Accuracy: {accuracy:.3f}")
    print("\nClassification Report:\n")
    print(classification_report(y_test_class, class_pred, digits=3))

    # 9. Save artifacts
    joblib.dump(model, MODEL_PATH)
    joblib.dump(classifier, CLASSIFIER_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"\nRegressor saved  → {MODEL_PATH}")
    print(f"Classifier saved → {CLASSIFIER_PATH}")
    print(f"Scaler saved     → {SCALER_PATH}")

    return model, classifier, scaler


# ── Quick Predict Test ───────────────────────────────────────────────────────
def test_prediction(model, classifier, scaler):
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
        predicted_level = classifier.predict(X_scaled)[0]
        predicted_psi = float(max(0.0, min(100.0, predicted_psi)))

        match = "✅" if predicted_level == expected else "⚠️"
        print(
            f"  {match} Input: soil={case['soil']} temp={case['temp']} "
            f"→ PSI: {predicted_psi:.1f} ({predicted_level}) | Expected: {expected}"
        )


if __name__ == "__main__":
    model, classifier, scaler = train()
    test_prediction(model, classifier, scaler)
    print("\nModel ready for predictions!")
