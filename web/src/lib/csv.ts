import type { HelmetHistoryRecord } from "@/lib/types";
import { formatTimestamp } from "@/lib/format";

export function rowsToCsv(rows: readonly (readonly unknown[])[]): string {
  return rows
    .map((row) =>
      row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
}

export function downloadCsvFile(filename: string, csv: string): void {
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function telemetryToCsv(records: HelmetHistoryRecord[]): string {
  const rows: unknown[][] = [
    [
      "time",
      "gas_adc",
      "temperature_c",
      "humidity_percent",
      "gps_fix",
      "latitude",
      "longitude",
      "status",
    ],
    ...records.map((record) => [
      formatTimestamp(record.device?.lastUpdate),
      record.sensors?.gas ?? "",
      record.sensors?.temperatureValid === false
        ? ""
        : (record.sensors?.temperature ?? ""),
      record.sensors?.humidityValid === false
        ? ""
        : (record.sensors?.humidity ?? ""),
      record.gps?.gpsFix ? "true" : "false",
      record.gps?.latitude ?? "",
      record.gps?.longitude ?? "",
      record.alerts?.status ?? "",
    ]),
  ];
  return rowsToCsv(rows);
}
