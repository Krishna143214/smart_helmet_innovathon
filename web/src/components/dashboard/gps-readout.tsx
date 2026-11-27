import type { HelmetGps } from "@/lib/types";
import { hasValidGpsFix } from "@/lib/gps";
import type { BrowserPosition } from "@/lib/gps";

interface GpsReadoutProps {
  gps: HelmetGps | null | undefined;
  browserPosition: BrowserPosition | null;
}

const format = (value: number | undefined, digits = 1) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : "--";

export function GpsReadout({ gps, browserPosition }: GpsReadoutProps) {
  const hasHelmetFix = hasValidGpsFix(gps);
  const hasLaptopFallback = !hasHelmetFix && browserPosition !== null;
  const latitude = hasHelmetFix
    ? format(gps.latitude, 6)
    : hasLaptopFallback
      ? format(browserPosition.latitude, 6)
      : "--";
  const longitude = hasHelmetFix
    ? format(gps.longitude, 6)
    : hasLaptopFallback
      ? format(browserPosition.longitude, 6)
      : "--";

  const stats = [
    { label: "Latitude", value: latitude },
    { label: "Longitude", value: longitude },
    {
      label: hasHelmetFix ? "Altitude" : "Accuracy",
      value: hasHelmetFix
        ? `${format(gps.altitude)} m`
        : hasLaptopFallback
          ? `±${Math.round(browserPosition.accuracy)} m`
          : "-- m",
    },
    { label: "Speed", value: hasHelmetFix ? `${format(gps.speed)} km/h` : "-- km/h" },
    {
      label: "Satellites",
      value:
        hasHelmetFix && typeof gps.satellites === "number" && Number.isFinite(gps.satellites)
          ? String(gps.satellites)
          : "--",
    },
    { label: "HDOP", value: hasHelmetFix ? format(gps.hdop) : "--" },
  ];

  return (
    <div className="gps-readout">
      {stats.map((stat) => (
        <div className="mini-stat" key={stat.label}>
          <div className="mini-label">{stat.label}</div>
          <div className="mini-value">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
