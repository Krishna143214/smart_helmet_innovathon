
import json
import os
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import RobustScaler


DATA_FILE = "helmet_readings.json"
MODEL_FILE = "artifacts/isolation_forest.joblib"


def create_features(df):
    df = df.copy()

    required = ["timestamp", "gas", "temperature"]

    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    for col in ["timestamp", "gas", "temperature", "humidity"]:
        if col not in df.columns:
            df[col] = np.nan

        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=required)
    df = df.sort_values("timestamp").reset_index(drop=True)

    if len(df) < 100:
        raise ValueError("At least 100 valid readings are required.")

    df["humidity"] = df["humidity"].fillna(
        df["humidity"].median()
    )

    # Changes between consecutive readings
    time_diff = (
        df["timestamp"].diff().div(1000)
        .clip(lower=1, upper=60)
    )

    df["gas_rate"] = (
        df["gas"].diff().fillna(0) / time_diff * 60
    )

    df["temperature_rate"] = (
        df["temperature"].diff().fillna(0) / time_diff * 60
    )

    # Local variation
    df["gas_variation"] = (
        df["gas"].rolling(5, min_periods=1).std().fillna(0)
    )

    df["temperature_variation"] = (
        df["temperature"].rolling(5, min_periods=1)
        .std().fillna(0)
    )

    features = [
        "gas",
        "temperature",
        "humidity",
        "gas_rate",
        "temperature_rate",
        "gas_variation",
        "temperature_variation",
    ]

    return df[features].replace(
        [np.inf, -np.inf], np.nan
    ).fillna(0)


def train():
    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(
            f"{DATA_FILE} not found. Export Firebase readings first."
        )

    with open(DATA_FILE, "r", encoding="utf-8") as file:
        records = json.load(file)

    df = pd.DataFrame(records)
    X = create_features(df)

    model = Pipeline([
        ("scaler", RobustScaler()),
        ("isolation_forest", IsolationForest(
            n_estimators=300,
            contamination="auto",
            random_state=42,
        )),
    ])

    model.fit(X)

    predictions = model.predict(X)

    anomaly_count = int((predictions == -1).sum())
    normal_count = int((predictions == 1).sum())

    os.makedirs("artifacts", exist_ok=True)

    joblib.dump(
        {
            "model": model,
            "features": list(X.columns),
            "version": 1,
        },
        MODEL_FILE,
    )

    print("\n===== MINEWATCH AI TRAINING =====")
    print(f"Total readings: {len(X)}")
    print(f"Normal patterns: {normal_count}")
    print(f"Unusual patterns: {anomaly_count}")
    print(f"Model saved: {MODEL_FILE}")


if __name__ == "__main__":
    train()
