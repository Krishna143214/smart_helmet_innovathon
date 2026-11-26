
import json
import urllib.request
from pathlib import Path

# Load actual exported sensor readings
data_path = Path(__file__).parent / "helmet_readings.json"

with open(data_path, "r") as file:
    readings = json.load(file)

# Keep only valid readings
valid = [
    r for r in readings
    if isinstance(r.get("timestamp"), (int, float))
    and isinstance(r.get("gas"), (int, float))
    and isinstance(r.get("temperature"), (int, float))
]

# Sort chronologically and select latest 100
valid.sort(key=lambda r: r["timestamp"])
latest = valid[-100:]

if len(latest) < 100:
    raise ValueError(f"Only {len(latest)} valid readings found.")

payload = json.dumps({"readings": latest}).encode("utf-8")

request = urllib.request.Request(
    "http://127.0.0.1:8000/predict",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    with urllib.request.urlopen(request) as response:
        result = json.loads(response.read().decode())
        print("\n===== MINEWATCH AI PREDICTION =====")
        print(json.dumps(result, indent=4))
except Exception as error:
    print("API Error:", error)
