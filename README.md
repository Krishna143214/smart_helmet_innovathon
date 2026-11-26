# MineWatch — IoT-Based Smart Mining Helmet

**Smart worker safety through environmental sensing, GPS context, and connected alerts.**

MineWatch is an IoT-based smart mining helmet prototype built around an **ESP8266 NodeMCU**. It monitors gas-sensor readings, temperature, and humidity; obtains GPS information when a valid satellite fix is available; and sends telemetry to **Firebase Realtime Database** for live viewing in a web dashboard.

The system also supports two separate alert paths: a locally triggered automatic alert and a dashboard-controlled buzzer command.

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
| Dashboard | HTML, CSS, JavaScript |
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

---

## System architecture

```text
┌────────────────────────────────────────────┐
│             SMART HELMET                   │
│                                            │
│  Gas sensor ───────┐                       │
│  DHT11 ────────────┼──> NodeMCU ESP8266     │
│  NEO-6M GPS ───────┤         │              │
│  OLED display <────┤         ├──> Local     │
│  Auto alert <──────┘         │    alert     │
│                              │              │
│                     Wi-Fi   │              │
└──────────────────────────────┼──────────────┘
                               │
                               ▼
┌────────────────────────────────────────────┐
│          FIREBASE REALTIME DATABASE        │
│                                            │
│  /MiningHelmet/live                        │
│  /MiningHelmet/history                     │
│  /MiningHelmet/commands/dashboardBuzzer    │
└──────────────────────────────┬─────────────┘
                               │
                   Realtime data│ / command
                               ▼
┌────────────────────────────────────────────┐
│              MINEWATCH DASHBOARD           │
│                                            │
│  Live readings · Charts · GPS map          │
│  History table · CSV export                │
│  Sign-in · Remote buzzer control           │
└────────────────────────────────────────────┘
```

**Data flow:** Sensors and GPS feed the ESP8266. The controller processes readings and uploads telemetry to Firebase. The dashboard listens for database updates. For remote buzzer control, the dashboard writes a Boolean command and the ESP8266 reads it.

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
| Dashboard | HTML, CSS, JavaScript |
| Map | Leaflet 1.9.4 + OpenStreetMap tiles |
| Charts | Chart.js |
| Fonts | Google Fonts (Manrope, DM Mono) |

The dashboard loads Firebase Web SDK modules and frontend libraries from CDNs, so an internet connection is required.

## Repository structure

```text
smart-mining-helmet/
├── app.js
├── index.html
├── style.css
├── Smart_mining_firmware.ino
├── MineWatch-IoT-Based-Smart-Mining-Helmet-Polished.pptx
└── README.md
```

## How it works

1. The ESP8266 reads the gas sensor and DHT11 on its sensor-reading cycle.
2. TinyGPS++ continuously parses incoming GPS serial data.
3. The firmware evaluates the configured gas and temperature alert conditions.
4. The OLED displays the current readings and alert status.
5. When Firebase authentication is ready, the ESP8266 uploads live telemetry approximately every 3 seconds.
6. The firmware appends a history record approximately every 10 seconds.
7. The dashboard subscribes to live data, history, and the dashboard-buzzer command in Firebase.
8. When an operator changes the dashboard buzzer control, the dashboard writes a Boolean command. The ESP8266 polls the command approximately every 3 seconds and updates the separate buzzer output.

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

- A Firebase project with **Email/Password Authentication** enabled.
- Firebase Realtime Database configured with appropriate security rules.
- A Firebase Authentication user authorized to access the dashboard and database.
- Arduino IDE with ESP8266 board support for firmware upload.
- Required Arduino libraries listed in [Firmware setup](#firmware-setup).
- A modern browser and an internet connection for the dashboard.

### 1. Clone the repository

```bash
git clone https://github.com/Krishna143214/smart-mining-helmet.git
cd smart-mining-helmet
```

### 2. Configure Firebase

Create or use the Firebase project associated with the prototype. Enable Email/Password sign-in and configure Realtime Database rules so only authorized users and the authenticated device account can access the required paths.

The dashboard's Firebase web configuration is currently defined in `app.js`. The firmware has separate device authentication settings in `Smart_mining_firmware.ino`.

**Security note:** Never commit real passwords, Wi-Fi credentials, service-account keys, or other secrets. Replace placeholder credentials before compiling the firmware. Review database rules before deployment; do not use public read/write rules.

### 3. Run the dashboard

This repository contains a static HTML/CSS/JavaScript dashboard (not a Next.js app in its current form).

- Open the project folder in VS Code.
- Run `index.html` using the VS Code Live Server extension.
- Sign in using an Email/Password account created in Firebase Authentication.

The dashboard uses CDN-hosted libraries and OpenStreetMap tiles, so the browser needs internet access.

## Firmware setup

1. Install Arduino IDE and configure ESP8266 board support.
2. Install the libraries used by `Smart_mining_firmware.ino`:
   - FirebaseClient
   - Adafruit GFX Library
   - Adafruit SSD1306
   - DHT sensor library
   - TinyGPSPlus
3. Open `Smart_mining_firmware.ino`.
4. Set the Wi-Fi SSID and password.
5. Set the Firebase API key, device authentication email/password, and Realtime Database URL.
6. Verify the pin connections against the [firmware pin configuration](#firmware-pin-configuration).
7. Select the correct NodeMCU ESP8266 board and port.
8. Upload the firmware and open Serial Monitor at **9600 baud**.

The firmware uploads live telemetry every 3 seconds and adds a history record every 10 seconds. It polls the dashboard-buzzer command approximately every 3 seconds.

## Dashboard setup

The dashboard uses:
- Firebase Authentication for sign-in.
- Firebase Realtime Database listeners for live telemetry, history, and buzzer state.
- Leaflet with OpenStreetMap tiles for GPS visualization.
- Chart.js for telemetry charts.

If the dashboard reports a database permission error, verify the signed-in Firebase user, device authentication, database URL, and Realtime Database security rules.

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
