"use client";

import { useEffect, useRef } from "react";
import {
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import type { HelmetHistoryRecord, TelemetryMetric } from "@/lib/types";
import {
  formatChartLabel,
  formatDetailedTimestamp,
  timestampToDate,
} from "@/lib/format";

Chart.register(
  CategoryScale,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

const MAX_CHART_READINGS = 60;

interface TelemetryChartProps {
  title: string;
  metric: TelemetryMetric;
  unit: string;
  records: HelmetHistoryRecord[];
  color: string;
}

function chartValue(
  record: HelmetHistoryRecord,
  metric: TelemetryMetric,
): number | null {
  const sensors = record.sensors;
  if (!sensors) return null;
  if (metric === "gas")
    return Number.isFinite(Number(sensors.gas)) ? Number(sensors.gas) : null;
  if (metric === "temperature") {
    return sensors.temperatureValid === false ||
      !Number.isFinite(Number(sensors.temperature))
      ? null
      : Number(sensors.temperature);
  }
  return sensors.humidityValid === false ||
    !Number.isFinite(Number(sensors.humidity))
    ? null
    : Number(sensors.humidity);
}

export function TelemetryChart({
  title,
  metric,
  unit,
  records,
  color,
}: TelemetryChartProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart<"line", (number | null)[], string> | null>(null);
  const chartRecords = useRef<HelmetHistoryRecord[]>([]);

  useEffect(() => {
    if (!canvas.current) return;
    chart.current = new Chart<"line", (number | null)[], string>(
      canvas.current,
      {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: title,
              data: [],
              borderColor: color,
              backgroundColor: color,
              fill: false,
              tension: 0.32,
              borderWidth: 2,
              pointRadius: 1.5,
              pointHoverRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: {
                title: (items) =>
                  formatDetailedTimestamp(
                    items[0]
                      ? chartRecords.current[items[0].dataIndex]?.device?.lastUpdate
                      : undefined,
                  ),
              },
            },
          },
          interaction: { mode: "index", intersect: false },
          scales: {
            x: {
              ticks: {
                color: "#8294aa",
                maxTicksLimit: 4,
                maxRotation: 0,
                minRotation: 0,
                font: { size: 8 },
              },
              grid: { color: "rgba(143,161,184,.08)" },
              border: { display: false },
            },
            y: {
              ticks: { color: "#8294aa", maxTicksLimit: 5, font: { size: 9 } },
              grid: { color: "rgba(143,161,184,.08)" },
              border: { display: false },
            },
          },
        },
      },
    );
    return () => {
      chart.current?.destroy();
      chart.current = null;
    };
  }, [color, title]);

  useEffect(() => {
    if (!chart.current) return;
    const latestRecords = records
      .filter((record) => timestampToDate(record.device?.lastUpdate) !== null)
      .slice()
      .sort((a, b) => {
        const timeA = timestampToDate(a.device?.lastUpdate)?.getTime() ?? 0;
        const timeB = timestampToDate(b.device?.lastUpdate)?.getTime() ?? 0;
        return timeA - timeB;
      })
      .slice(-MAX_CHART_READINGS);
    chartRecords.current = latestRecords;
    chart.current.data.labels = latestRecords.map((record) =>
      formatChartLabel(record.device?.lastUpdate),
    );
    chart.current.data.datasets[0].data = latestRecords.map((record) =>
      chartValue(record, metric),
    );
    chart.current.update("none");
  }, [records, metric]);

  const chartId =
    metric === "gas"
      ? "gasChart"
      : metric === "temperature"
        ? "tempChart"
        : "humidityChart";

  return (
    <article
      className="panel chart-panel"
      aria-label={`${title} history chart`}
    >
      <div className="chart-top">
        <div>
          <div className="chart-title">{title}</div>
          <div className="chart-unit">{unit}</div>
        </div>
        <span className="state">RECENT READINGS</span>
      </div>
      <div className="chart-box">
        <canvas
          id={chartId}
          ref={canvas}
          aria-label={`${title} history`}
          role="img"
        />
      </div>
    </article>
  );
}
