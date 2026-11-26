# MineWatch — IoT-Based Smart Mining Helmet

**Smart worker safety through environmental sensing, GPS context, and connected alerts.**

MineWatch is an IoT-based smart mining helmet prototype built around an **ESP8266 NodeMCU**. It monitors gas-sensor readings, temperature, and humidity; obtains GPS information when a valid satellite fix is available; and sends telemetry to **Firebase Realtime Database** for live viewing in a web dashboard.

The system also supports two separate alert paths: a locally triggered automatic alert and a dashboard-controlled buzzer command. The web application is built with Next.js and React, and its separate FastAPI service provides machine-learning anomaly predictions.

> **Prototype status:** This repository contains the current breadboard-oriented prototype, its web dashboard, ESP8266 firmware, and project presentation. It is not a certified mining safety device.

---

## Contents

- [Project at a glance](#project-at-a-glance)
- [Features](#features)
- [System architecture](#system-architecture)
- [Hardware](#hardware)
- [Software stack](#software-stack)
- [Repository structure](#repository-structure)
- [How it works](#how-it-works)
- [Firebase data structure](#firebase-data-structure)
- [Getting started](#getting-started)
- [Firmware setup](#firmware-setup)
- [Dashboard setup](#dashboard-setup)
- [Safety logic](#safety-logic)
- [Current limitations](#current-limitations)
- [Roadmap](#roadmap)
- [Project presentation](#project-presentation)
- [Team](#team)

---

## Project at a glance

| Capability | Current prototype |
|---|---|
| Controller | NodeMCU ESP8266 |
| Gas monitoring | Analog gas-sensor reading |
| Temperature | DHT11 |
| Humidity | DHT11 |
| Location | NEO-6M GPS module |
| Local display | 128 × 64 OLED |
| Cloud communication | Wi-Fi + Firebase Realtime Database |
| Dashboard | Next.js App Router, React, TypeScript, and CSS |
| Live map | Leaflet + OpenStreetMap |
| Telemetry charts | Chart.js |
| Remote control | Firebase dashboard-buzzer command |

## Features

### Environmental monitoring
- Reads the gas sensor's raw analog value (ADC).
- Measures ambient temperature and relative humidity with a DHT11.
- Detects configured gas and high-temperature conditions.
- Displays readings and alert status on the helmet's OLED and web dashboard.

### GPS context
- Reads NMEA data from the NEO-6M module using TinyGPS++.
- Processes latitude, longitude, altitude, speed, satellite count, and HDOP.
- Sends coordinates when the GPS location fix is valid.
- Displays the latest available position and recent location information on a Leaflet map.

### Alerts and buzzer control
- Activates the local automatic alert output when configured gas or temperature thresholds are exceeded.
- Provides a separate dashboard-controlled buzzer output.
- The dashboard writes an ON/OFF Boolean command to Firebase; the ESP8266 polls that command.

### Web dashboard
- Firebase email/password sign-in.
- Live sensor and device status.
- GPS details and map visualization.
- Gas, temperature, and humidity history charts.
- Recent telemetry table.
- CSV export of available history records.
- Remote dashboard-buzzer control.
- AI anomaly predictions through the FastAPI service.
- A separate Simulation Lab with environment controls and an imported 3D helmet model.

---

## System architecture

```text
SMART HELMET
  Gas sensor / DHT11 / NEO-6M GPS / OLED
                  |
          NodeMCU ESP8266
            |           ^
        Wi-Fi telemetry | buzzer command
            v           |
      Firebase Realtime Database
            ^           ^
            |           |
 Next.js dashboard -----+
            |
            | POST /predict
            v
 FastAPI ML service
            |
   Isolation Forest model
```

**Data flow:** Sensors and GPS feed the ESP8266. The controller processes readings and uploads telemetry to Firebase. The Next.js dashboard subscribes to database updates. For AI analysis, the dashboard sends sensor readings to the FastAPI prediction endpoint. For remote buzzer control, the dashboard writes a Boolean command to Firebase and the ESP8266 reads it. Simulation Lab readings are sent only to the ML API; they do not update Firebase or the physical helmet.

## Hardware

The presentation and firmware identify these prototype components:

| Component | Purpose |
|---|---|
| NodeMCU ESP8266 | Main controller and Wi-Fi communication |
| Gas sensor | Raw analog gas-level reading |
| DHT11 | Temperature and humidity |
| NEO-6M GPS | Outdoor location context |
| 128 × 64 OLED | Local readings and status |
| Automatic alert output | Local threshold-based alert |
| Dashboard buzzer | Remote buzzer control |

### Firmware pin configuration

The current firmware defines the following connections:

| Signal | ESP8266 pin |
|---|---|
| Gas sensor analog output | A0 |
| Automatic alert output | D4 |
| Dashboard-controlled buzzer | D3 |
| DHT11 data | D6 |
| GPS software serial RX/TX | D5 / D0 |
| OLED I²C | D2 (SDA), D1 (SCL) |

Check the exact board, module, voltage, and wiring requirements before connecting hardware. ESP8266 GPIO pins are not all 5 V tolerant.

## Software stack

| Layer | Technology |
|---|---|
| Embedded firmware | Arduino C++ |
| Controller platform | ESP8266 / NodeMCU |
| Sensor libraries | DHT, Adafruit GFX, Adafruit SSD1306 |
| GPS parsing | TinyGPS++ |
| Cloud database | Firebase Realtime Database |
| Authentication | Firebase Authentication |
| Web dashboard | Next.js App Router, React, TypeScript |
| Styling | CSS in `web/src/app/globals.css` (Tailwind CSS is also installed) |
| Map | Leaflet 1.9.4 + OpenStreetMap tiles |
| Telemetry charts | Chart.js |
| 3D Simulation Lab | Three.js, React Three Fiber, and Drei |
| ML API | Python + FastAPI |
| Anomaly model | scikit-learn Isolation Forest + RobustScaler |
| ML data processing | pandas + NumPy |

The Next.js frontend is deployed separately from the FastAPI service. The frontend uses Firebase Web SDK configuration from environment variables. The ML API is hosted as a separate service and allows the configured frontend origin through CORS.

## Repository structure

```text
smart-mining-helmet/
|-- firmware/
|   `-- Smart_mining_firmware.ino
|-- ml/
|   |-- api.py
|   |-- helmet_readings.json
|   |-- requirements.txt
|   |-- test.py
|   |-- train_model.py
|   `-- artifacts/
|       `-- isolation_forest.joblib
|-- web/
|   |-- public/models/helmet.glb
|   |-- src/
|   |   |-- app/
|   |   |   |-- page.tsx
|   |   |   `-- simulation/page.tsx
|   |   |-- components/
|   |   |   |-- auth/
|   |   |   |-- dashboard/
|   |   |   |-- icons/
|   |   |   `-- ui/
|   |   `-- lib/
|   |       |-- ai/
|   |       |-- firebase/
|   |       |-- sensors/
|   |       `-- types/
|   |-- package.json
|   `-- pnpm-lock.yaml
|-- smart-mining-helmet-innovathon.pptx
`-- README.md
```

## How it works

1. The ESP8266 reads the gas sensor and DHT11 on its sensor-reading cycle.
2. TinyGPS++ continuously parses incoming GPS serial data.
3. The firmware evaluates the configured gas and temperature alert conditions.
4. The OLED displays the current readings and alert status.
5. When Firebase authentication is ready, the ESP8266 uploads live telemetry approximately every 3 seconds.
6. The firmware appends a history record approximately every 10 seconds.
7. The Next.js dashboard subscribes to live data and history in Firebase, and sends dashboard-buzzer commands through Firebase.
8. The dashboard sends recent sensor history to the FastAPI `/predict` endpoint for anomaly detection.
9. The Simulation Lab creates 100 generated readings and sends them to the same ML endpoint. These simulated readings do not go to Firebase or to the physical helmet.

## Firebase data structure

The firmware and dashboard use this Realtime Database layout:

```text
MiningHelmet/
├── live/
│   ├── sensors/
│   │   ├── gas
│   │   ├── temperature
│   │   ├── humidity
│   │   ├── temperatureValid
│   │   └── humidityValid
│   ├── gps/
│   │   ├── gpsFix
│   │   ├── latitude
│   │   ├── longitude
│   │   ├── altitude
│   │   ├── speed
│   │   ├── satellites
│   │   └── hdop
│   ├── alerts/
│   │   ├── gasAlert
│   │   ├── highTempAlert
│   │   ├── autoAlarm
│   │   ├── dashboardBuzzer
│   │   └── status
│   └── device/
│       ├── online
│       ├── uptimeMs
│       └── lastUpdate
├── history/
└── commands/
    └── dashboardBuzzer
```

The dashboard reads:
- `/MiningHelmet/live`
- `/MiningHelmet/history`
- `/MiningHelmet/commands/dashboardBuzzer`

The dashboard writes a Boolean (`true` or `false`) to `/MiningHelmet/commands/dashboardBuzzer`.

## Getting started

### Prerequisites

- Node.js and pnpm for the Next.js dashboard.
- Python 3.10 or newer recommended for the ML service.
- A Firebase project with **Email/Password Authentication** enabled.
- Firebase Realtime Database configured with appropriate security rules.
- Arduino IDE with ESP8266 board support for firmware upload.
- Required Arduino libraries listed in [Firmware setup](#firmware-setup).

### 1. Clone the repository

```bash
git clone https://github.com/Krishna143214/smart-mining-helmet.git
cd smart-mining-helmet
```

### 2. Configure Firebase

Create `web/.env.local` with the Firebase web app configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-database-url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_AI_API_URL=http://127.0.0.1:8000
```

Keep real secrets out of version control. The `.env*` files are ignored by Git. Firebase database rules should allow only authorized access. The firmware has separate device authentication settings in `firmware/Smart_mining_firmware.ino`.

### 3. Run the web dashboard

```bash
cd web
pnpm install
pnpm dev
```

Open `http://localhost:3000` and sign in with an account created in Firebase Authentication. Start the ML API separately as described in [Dashboard setup](#dashboard-setup) to use AI predictions.

## Firmware setup

1. Install Arduino IDE and configure ESP8266 board support.
2. Install the libraries used by `Smart_mining_firmware.ino`:
   - FirebaseClient
   - Adafruit GFX Library
   - Adafruit SSD1306
   - DHT sensor library
   - TinyGPSPlus
3. Open `firmware/Smart_mining_firmware.ino`.
4. Set the Wi-Fi SSID and password.
5. Set the Firebase API key, device authentication email/password, and Realtime Database URL.
6. Verify the pin connections against the [firmware pin configuration](#firmware-pin-configuration).
7. Select the correct NodeMCU ESP8266 board and port.
8. Upload the firmware and open Serial Monitor at **9600 baud**.

The firmware uploads live telemetry every 3 seconds and adds a history record every 10 seconds. It polls the dashboard-buzzer command approximately every 3 seconds.

## Dashboard setup

The dashboard uses:
- Next.js App Router, React, and TypeScript.
- Firebase Authentication and Realtime Database listeners for live telemetry, history, and buzzer state.
- Leaflet with OpenStreetMap tiles for GPS visualization.
- Chart.js for telemetry charts.
- Three.js with React Three Fiber and Drei for the Simulation Lab helmet model.

The ML service is separate from the web app. To run it locally:

```bash
cd ml
python -m venv .venv
# Activate the virtual environment, then:
pip install -r requirements.txt
uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

The API loads `artifacts/isolation_forest.joblib` and exposes `/health` and `/predict`. For Render, use `ml` as the service root and `uvicorn api:app --host 0.0.0.0 --port $PORT` as the start command. Set `FRONTEND_URL` in Render to the Vercel dashboard origin. Set `NEXT_PUBLIC_AI_API_URL` in Vercel to the Render service origin (without `/predict`), then redeploy the frontend.

If the dashboard reports a database permission error, verify the signed-in Firebase user, device authentication, database URL, and Realtime Database security rules. If AI prediction fails after deployment, verify the Render service URL and its `FRONTEND_URL` CORS setting.

## Safety logic

The current firmware uses these prototype conditions:

| Condition | Prototype threshold | Result |
|---|---:|---|
| Gas sensor | Raw ADC reading > 400 | Automatic alert output ON |
| Temperature | > 35 °C | Automatic alert output ON |

The automatic alert output turns off when both conditions are cleared. The dashboard-controlled buzzer is a separate output controlled through Firebase.

**These values are demonstration thresholds only.** The gas value is a raw ADC reading, not a concentration in ppm. The thresholds are not certified occupational exposure limits or mine-safety limits. A real deployment would require appropriate certified sensors, calibration, validation, and compliance with applicable mining safety standards.

## Current limitations

- The current repository contains a prototype dashboard and firmware, not a production deployment.
- GPS is useful when a valid satellite fix is available; **ordinary GPS should not be presented as reliable underground positioning**.
- The current map plots GPS coordinates on a geographic map. It does not yet provide underground tunnel mapping or indoor worker positioning.
- The prototype uses a single helmet data path; multi-worker tracking is not implemented in the supplied firmware.
- Sensor thresholds are demonstration values and require calibration and domain validation.
- The firmware uses Wi-Fi and Firebase connectivity; loss of connectivity prevents cloud updates and remote commands, although local threshold logic runs on the controller.

## Roadmap

The project presentation describes the following planned evolution:

1. **Current breadboard prototype** — ESP8266, sensors, OLED, GPS, and separate alert/buzzer paths.
2. **Custom PCB** — replace jumper wiring with secure connectors, labelled ports, mounting holes, and integrated power management.
3. **Rechargeable integrated prototype** — protected rechargeable battery, charging and voltage regulation, and battery monitoring.
4. **Enhanced smart helmet** — investigate additional sensing and calibrated motion analysis for fall/collision-related events and emergency alerts.

Further software directions include underground tunnel mapping, indoor positioning, multi-worker monitoring, geofencing, and richer incident analysis. These are future directions, not current implemented features.

## Project presentation

The repository includes the project presentation:

[`MineWatch-IoT-Based-Smart-Mining-Helmet-Polished.pptx`](./MineWatch-IoT-Based-Smart-Mining-Helmet-Polished.pptx)

## Team

**Team COFFEE&CODE**

- Dingle Varshney
- Anvesha Sharma
- Krishna Dubey

---

<p align="center">
  <strong>MineWatch — Safer Mines, Smarter Monitoring.</strong><br />
  Built to explore connected worker safety through IoT.
</p>