import type { FirebaseTimestamp } from "@/lib/types";

export function timestampToDate(
  value: FirebaseTimestamp | undefined,
): Date | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTimestamp(value: FirebaseTimestamp | undefined): string {
  const date = timestampToDate(value);
  return date
    ? date.toLocaleString([], {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Timestamp unavailable";
}

export function formatChartLabel(value: FirebaseTimestamp | undefined): string {
  const date = timestampToDate(value);
  return date
    ? date.toLocaleString([], {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
}

export function formatDetailedTimestamp(
  value: FirebaseTimestamp | undefined,
): string {
  const date = timestampToDate(value);
  return date
    ? date.toLocaleString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Timestamp unavailable";
}

export function formatLastUpdate(
  value: FirebaseTimestamp | undefined,
  now = Date.now(),
): string {
  const date = timestampToDate(value);
  if (!date) return "No valid timestamp";
  const ageSeconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  return `${formatTimestamp(value)} · ${ageSeconds}s ago`;
}

