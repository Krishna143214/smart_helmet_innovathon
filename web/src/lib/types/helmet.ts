
export type FirebaseKey = string;

export interface FirebaseServerTimestamp {
  ".sv": "timestamp";
}

export type FirebaseTimestamp = number | FirebaseServerTimestamp;

export interface HelmetSensors {
  gas?: number;
  temperature?: number;
  humidity?: number;
  temperatureValid?: boolean;
  humidityValid?: boolean;
}

export interface HelmetGps {
  gpsFix?: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
  satellites?: number;
  hdop?: number;
}

export type HelmetAlertStatus =
  | "NORMAL"
  | "GAS_ALERT"
  | "HIGH_TEMP"
  | "GAS_AND_HIGH_TEMP";

export interface HelmetAlerts {
  gasAlert?: boolean;
  highTempAlert?: boolean;
  autoAlarm?: boolean;
  dashboardBuzzer?: boolean;
  status?: HelmetAlertStatus;
}

export interface HelmetDevice {
  online?: boolean;
  uptimeMs?: number;
  lastUpdate?: FirebaseTimestamp;
}

export interface HelmetTelemetry {
  sensors?: HelmetSensors | null;
  gps?: HelmetGps | null;
  alerts?: HelmetAlerts | null;
  device?: HelmetDevice | null;
}

export type LiveHelmetTelemetry = HelmetTelemetry;

export interface HelmetHistoryRecord extends HelmetTelemetry {
  key: FirebaseKey;
}

export type HelmetHistoryData = Record<FirebaseKey, HelmetTelemetry>;

/** Boolean value stored at /MiningHelmet/commands/dashboardBuzzer. */
export type DashboardBuzzerCommand = boolean;
