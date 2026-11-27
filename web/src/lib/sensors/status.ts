import type { HelmetConnectionStatus } from "@/lib/types";

export function sensorDotClass(
  value: number | null,
  belowMinimum: boolean,
  aboveMaximum: boolean,
  helmetStatus: HelmetConnectionStatus,
): string {
  if (aboveMaximum) return "red";
  if (value === null) return helmetStatus === "unknown" ? "" : "amber";
  if (belowMinimum || helmetStatus !== "online") return "amber";
  return "green";
}
