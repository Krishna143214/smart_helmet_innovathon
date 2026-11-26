import type { HelmetGps } from "@/lib/types";

interface GpsReadoutProps {
  gps: HelmetGps | null | undefined;
}

const format = (value: number | undefined, digits = 1) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : "--";

export function GpsReadout({ gps }: GpsReadoutProps) {
  const hasFix = gps?.gpsFix === true;
  const stats = [
    { label: "Latitude", value: hasFix ? format(gps.latitude, 6) : "--" },
    { label: "Longitude", value: hasFix ? format(gps.longitude, 6) : "--" },
    { label: "Altitude", value: hasFix ? `${format(gps.altitude)} m` : "-- m" },
    { label: "Speed", value: hasFix ? `${format(gps.speed)} km/h` : "-- km/h" },
    {
      label: "Satellites",
      value:
        typeof gps?.satellites === "number" && Number.isFinite(gps.satellites)
          ? String(gps.satellites)
          : "--",
    },
    { label: "HDOP", value: hasFix ? format(gps?.hdop) : "--" },
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
