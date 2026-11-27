import type { HelmetGps } from "@/lib/types";

export interface BrowserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export function hasValidGpsFix(
  gps: HelmetGps | null | undefined,
): gps is HelmetGps & { latitude: number; longitude: number } {
  return (
    gps?.gpsFix === true &&
    typeof gps.latitude === "number" &&
    Number.isFinite(gps.latitude) &&
    gps.latitude >= -90 &&
    gps.latitude <= 90 &&
    typeof gps.longitude === "number" &&
    Number.isFinite(gps.longitude) &&
    gps.longitude >= -180 &&
    gps.longitude <= 180
  );
}
