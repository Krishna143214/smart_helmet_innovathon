
import os
import joblib
import pandas as pd

from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from train_model import create_features

app = FastAPI(title="MineWatch AI API")
frontend_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("FRONTEND_URL", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        *frontend_origins,
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
BASE_DIR = Path(__file__).resolve().parent
artifact = joblib.load(BASE_DIR / "artifacts" / "isolation_forest.joblib")

model = artifact["model"]
feature_columns = artifact["features"]


class Reading(BaseModel):
    timestamp: int
    gas: float = Field(ge=0, le=1023, allow_inf_nan=False)
    temperature: float = Field(allow_inf_nan=False)
    humidity: float | None = Field(default=None, ge=0, le=100, allow_inf_nan=False)


class PredictionRequest(BaseModel):
    readings: list[Reading] = Field(min_length=100, max_length=1000)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}


@app.post("/predict")
def predict(request: PredictionRequest):
    try:
        df = pd.DataFrame(
            [reading.model_dump() for reading in request.readings]
        )

        # Maintain chronological order
        df = df.sort_values("timestamp").reset_index(drop=True)

        # Generate model features
        features = create_features(df)

        if len(features) < 1:
            raise ValueError("No valid features generated.")

        # Keep the exact training feature order
        latest_features = features[feature_columns].iloc[[-1]]

        prediction = int(model.predict(latest_features)[0])
        score = float(model.decision_function(latest_features)[0])

        return {
            "status": "UNUSUAL" if prediction == -1 else "NORMAL",
            "anomaly_score": score,
            "is_anomaly": prediction == -1,
            "message": (
                "Unusual sensor pattern detected."
                if prediction == -1
                else "Sensor pattern is within learned patterns."
            ),
            "model": "Isolation Forest",
            "readings_analyzed": len(df)
        }

    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
