import type { HelmetAlertStatus } from "./helmet";

export type FirebaseConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type HelmetConnectionStatus = "online" | "offline" | "unknown";

export type MetricStatus = "normal" | "alert" | "unavailable";

export type TelemetryMetric = "gas" | "temperature" | "humidity";

export interface TelemetryChartPoint {
  label: string;
  value: number | null;
}

export interface ActiveHelmetAlert {
  active: boolean;
  status: HelmetAlertStatus;
  title: string;
  message: string;
}
