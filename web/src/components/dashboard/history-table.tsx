import { formatTimestamp } from "@/lib/format";
import type { HelmetHistoryRecord } from "@/lib/types";
import { ExportCsvButton } from "./export-csv-button";

interface HistoryTableProps {
  records: HelmetHistoryRecord[];
  loaded: boolean;
  onNotify: (message: string) => void;
}

const formatNumber = (value: number | undefined, digits = 1) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : "--";

export function HistoryTable({ records, loaded, onNotify }: HistoryTableProps) {
  const latest = records.slice().reverse().slice(0, 10);

  return (
    <section className="panel history" id="history">
      <div className="panel-head">
        <div>
          <div className="panel-title">Recent telemetry</div>
          <div className="panel-kicker">
            Latest records from MiningHelmet/history
          </div>
        </div>
        <div className="history-tools">
          <span className="pill">{records.length} records</span>
          <ExportCsvButton records={records} onNotify={onNotify} />
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Gas ADC</th>
              <th>Temp °C</th>
              <th>Humidity %</th>
              <th>GPS fix</th>
              <th>Safety state</th>
            </tr>
          </thead>
          <tbody>
            {latest.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  {loaded
                    ? "No historical records found yet. The helmet sketch adds a record every 10 seconds."
                    : "Waiting for historical readings."}
                </td>
              </tr>
            ) : (
              latest.map((record) => {
                const status = String(
                  record.alerts?.status || "UNKNOWN",
                ).replaceAll("_", " ");
                const isAlert = record.alerts?.autoAlarm === true;
                return (
                  <tr key={record.key}>
                    <td>{formatTimestamp(record.device?.lastUpdate)}</td>
                    <td>
                      {typeof record.sensors?.gas === "number"
                        ? String(record.sensors.gas)
                        : "--"}
                    </td>
                    <td>
                      {record.sensors?.temperatureValid === false
                        ? "--"
                        : formatNumber(record.sensors?.temperature)}
                    </td>
                    <td>
                      {record.sensors?.humidityValid === false
                        ? "--"
                        : formatNumber(record.sensors?.humidity)}
                    </td>
                    <td>{record.gps?.gpsFix ? "YES" : "NO"}</td>
                    <td>
                      <span className={`state ${isAlert ? "bad" : ""}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
