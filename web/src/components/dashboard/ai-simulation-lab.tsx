"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { AiPredictionResult } from "@/lib/ai/use-ai-prediction";
import { downloadCsvFile, rowsToCsv } from "@/lib/csv";
import { formatTimestamp } from "@/lib/format";
import { SENSOR_THRESHOLDS } from "@/lib/sensors/thresholds";

const SimulationHelmetView = dynamic(
  () =>
    import("@/components/dashboard/simulation-helmet-view").then(
      (module) => module.SimulationHelmetView,
    ),
  {
    ssr: false,
    loading: () => <div className="simulation-helmet-loading">Loading helmet model…</div>,
  },
);

type SimulationStatus = "idle" | "loading" | "success" | "error";
type SensorKey = keyof typeof SENSOR_THRESHOLDS;
type ThresholdEdge = "min" | "max";
type AlertSeverity = "WARNING" | "CRITICAL";

interface SimulationEvent {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  reason: string;
  gas: number;
  temperature: number;
  humidity: number;
  acknowledged: boolean;
}

function makeReadings(target: {
  gas: number;
  temperature: number;
  humidity: number;
}) {
  const now = Date.now();

  return Array.from({ length: 100 }, (_, index) => {
    const smallWave = Math.sin(index * 1.7) * 0.6;

    return {
      timestamp: now - (99 - index) * 1000,
      gas: Math.max(0, Math.min(1023, target.gas + smallWave)),
      temperature: target.temperature + smallWave * 0.15,
      humidity: Math.max(0, Math.min(100, target.humidity + smallWave)),
    };
  });
}

export function AiSimulationLab() {
  const [gas, setGas] = useState(320);
  const [temperature, setTemperature] = useState(24);
  const [humidity, setHumidity] = useState(51);
  const [status, setStatus] = useState<SimulationStatus>("idle");
  const [prediction, setPrediction] = useState<AiPredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dashboardBuzzerOn, setDashboardBuzzerOn] = useState(false);
  const [thresholds, setThresholds] = useState({
    gas: { ...SENSOR_THRESHOLDS.gas },
    temperature: { ...SENSOR_THRESHOLDS.temperature },
    humidity: { ...SENSOR_THRESHOLDS.humidity },
  });
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const lastLoggedSeverity = useRef<AlertSeverity | null>(null);

  const gasLow = gas < thresholds.gas.min;
  const gasHigh = gas > thresholds.gas.max;
  const temperatureLow = temperature < thresholds.temperature.min;
  const temperatureHigh = temperature > thresholds.temperature.max;
  const humidityLow = humidity < thresholds.humidity.min;
  const humidityHigh = humidity > thresholds.humidity.max;
  const criticalThresholds = gasHigh || temperatureHigh || humidityHigh;
  const warningThresholds = gasLow || temperatureLow || humidityLow;
  const aiAlert = prediction?.is_anomaly === true;
  const warningActive = warningThresholds || aiAlert;
  const alertActive = criticalThresholds || warningActive;
  const buzzerActive = alertActive || dashboardBuzzerOn;
  const displaySeverity: "NORMAL" | "WARNING" | "CRITICAL" = criticalThresholds
    ? "CRITICAL"
    : warningActive
      ? "WARNING"
      : "NORMAL";
  const severity: AlertSeverity | null = criticalThresholds
  
    ? "CRITICAL"
    : warningActive
      ? "WARNING"
      : null;
  const alertReason = criticalThresholds
    ? `Maximum exceeded: ${[
        gasHigh && `gas ADC > ${thresholds.gas.max}`,
        temperatureHigh && `temperature > ${thresholds.temperature.max}°C`,
        humidityHigh && `humidity > ${thresholds.humidity.max}%`,
      ].filter(Boolean).join(", ")}`
    : warningThresholds
      ? `Below minimum: ${[
          gasLow && `gas ADC < ${thresholds.gas.min}`,
          temperatureLow && `temperature < ${thresholds.temperature.min}°C`,
          humidityLow && `humidity < ${thresholds.humidity.min}%`,
        ].filter(Boolean).join(", ")}`
      : aiAlert
        ? `AI flagged an unusual pattern (score ${prediction?.anomaly_score.toFixed(4)}).`
        : "No alert is active.";

  useEffect(() => {
    if (!severity) {
      lastLoggedSeverity.current = null;
      return;
    }
    if (lastLoggedSeverity.current === severity) return;
    lastLoggedSeverity.current = severity;
    setEvents((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        severity,
        reason: alertReason,
        gas,
        temperature,
        humidity,
        acknowledged: false,
      },
      ...current,
    ].slice(0, 50));
  }, [severity, alertReason, gas, temperature, humidity]);

  function updateThreshold(sensor: SensorKey, edge: ThresholdEdge, value: number) {
    if (!Number.isFinite(value)) return;
    const maxAllowed = sensor === "gas" ? 1023 : sensor === "temperature" ? 70 : 100;
    const boundedValue = Math.min(maxAllowed, Math.max(0, value));
    setThresholds((current) => {
      const nextRange = { ...current[sensor], [edge]: boundedValue };
      if (nextRange.min >= nextRange.max) return current;
      return { ...current, [sensor]: nextRange };
    });
  }

  function updateReading(sensor: "gas" | "temperature" | "humidity", value: number) {
    if (sensor === "gas") setGas(value);
    if (sensor === "temperature") setTemperature(value);
    if (sensor === "humidity") setHumidity(value);
    setPrediction(null);
    setStatus("idle");
    setError(null);
  }

  function applyScenario(next: { gas: number; temperature: number; humidity: number }) {
    setGas(next.gas);
    setTemperature(next.temperature);
    setHumidity(next.humidity);
    setStatus("idle");
    setPrediction(null);
    setError(null);
    setDashboardBuzzerOn(false);
  }

  function resetDemo() {
    applyScenario({ gas: 320, temperature: 24, humidity: 51 });
    setThresholds({
      gas: { ...SENSOR_THRESHOLDS.gas },
      temperature: { ...SENSOR_THRESHOLDS.temperature },
      humidity: { ...SENSOR_THRESHOLDS.humidity },
    });
  }

  function downloadEvents() {
    const rows = [
      ["timestamp", "severity", "reason", "gas_adc", "temperature_c", "humidity_percent", "acknowledged"],
      ...events.map((event) => [
        new Date(event.timestamp).toISOString(),
        event.severity,
        event.reason,
        event.gas,
        event.temperature,
        event.humidity,
        event.acknowledged ? "yes" : "no",
      ]),
    ];
    downloadCsvFile("minewatch-simulation-alerts.csv", rowsToCsv(rows));
  }

  function unlockDemoAudio() {
    if (typeof window === "undefined" || !window.AudioContext) return;
    audioContext.current ??= new window.AudioContext();
    if (audioContext.current.state === "suspended") {
      void audioContext.current.resume();
    }
  }

  useEffect(() => {
    const context = audioContext.current;
    if (!buzzerActive || !context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 760;
    gain.gain.value = 0;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();

    let toneOn = false;
    const pulse = window.setInterval(() => {
      toneOn = !toneOn;
      gain.gain.setTargetAtTime(toneOn ? 0.025 : 0, context.currentTime, 0.015);
    }, 180);
    return () => {
      window.clearInterval(pulse);
      gain.gain.setTargetAtTime(0, context.currentTime, 0.01);
      oscillator.stop(context.currentTime + 0.06);
      oscillator.disconnect();
      gain.disconnect();
    };
  }, [buzzerActive]);

  useEffect(() => () => {
    if (audioContext.current && audioContext.current.state !== "closed") {
      void audioContext.current.close();
    }
  }, []);

  async function runSimulation() {
    unlockDemoAudio();
    setStatus("loading");
    setError(null);
    const readings = makeReadings({ gas, temperature, humidity });

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readings,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body?.detail || `API error: ${response.status}`);
      if (
        typeof body.is_anomaly !== "boolean" ||
        typeof body.anomaly_score !== "number"
      ) {
        throw new Error("Invalid AI response received.");
      }
      setPrediction(body as AiPredictionResult);
      setStatus("success");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not connect to the AI service.",
      );
      setStatus("error");
    }
  }

  const rangeControl = (
    label: string,
    value: number,
    min: number,
    max: number,
    unit: string,
    onChange: (value: number) => void,
  ) => (
    <label className="sim-control">
      <span className="sim-control-head">
        <span>{label}</span>
        <strong>
          {value} {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          unlockDemoAudio();
          onChange(Number(event.target.value));
        }}
      />
      <span className="sim-range">
        <span>{min}</span>
        <span>{max}</span>
      </span>
    </label>
  );

  return (
    <section
      className="panel ai-card"
      id="simulation-lab"
      aria-label="AI simulation lab"
    >
      <div className="panel-body sim-body">
        <div className="simulation-helmet-panel">
          <div className="simulation-helmet-heading">
            <div>
              <div className="panel-title">Helmet response</div>
              <div className="panel-kicker">Interactive model · drag to rotate, scroll to zoom</div>
            </div>
            <span className={`ai-model-badge ${criticalThresholds ? "bad" : warningActive ? "warn" : "good"}`}>
              <span className={`dot ${criticalThresholds ? "red" : warningActive ? "amber" : "green"}`} />
              {criticalThresholds ? "CRITICAL" : warningActive ? "WARNING" : "NORMAL"}
            </span>
          </div>
          <SimulationHelmetView
            alertActive={alertActive}
            dashboardBuzzerOn={dashboardBuzzerOn}
            gas={gas}
            temperature={temperature}
            humidity={humidity}
            severity={displaySeverity}
          />
          <div className="simulation-device-status">
            <span className={criticalThresholds ? "device-status-on" : warningActive ? "device-status-warning" : "device-status-off"}><i /> LED {alertActive ? "ON" : "OFF"}</span>
            <span className={criticalThresholds ? "device-status-on" : warningActive || dashboardBuzzerOn ? "device-status-warning" : "device-status-off"}><i /> BUZZER {buzzerActive ? "ON" : "OFF"}</span>
          </div>
          <div className="simulation-alert-reason">{alertReason}</div>
        </div>

        <div className="sim-controls">
          <div>
            <div className="panel-title">Environment controls</div>
            <div className="panel-kicker">Simulation-only values · live helmet data is untouched</div>
          </div>
          <div className="sim-presets" aria-label="Quick simulation scenarios">
            <button className="btn" type="button" onClick={() => applyScenario({ gas: 320, temperature: 24, humidity: 51 })}>Normal</button>
            <button className="btn" type="button" onClick={() => applyScenario({ gas: 320, temperature: Math.max(0, thresholds.temperature.min - 1), humidity: 51 })}>Warning</button>
            <button className="btn danger" type="button" onClick={() => applyScenario({ gas: Math.min(1023, thresholds.gas.max + 50), temperature: 24, humidity: 51 })}>Critical gas</button>
            <button className="btn" type="button" onClick={() => applyScenario({ gas: 320, temperature: 24, humidity: Math.min(100, thresholds.humidity.max + 5) })}>High humidity</button>
            <button className="btn" type="button" onClick={resetDemo}>Reset demo</button>
          </div>
          {rangeControl("Gas sensor (ADC)", gas, 0, 1023, "ADC", (value) => updateReading("gas", value))}
          {rangeControl(
            "Temperature",
            temperature,
            0,
            70,
            "°C",
            (value) => updateReading("temperature", value),
          )}
          {rangeControl("Humidity", humidity, 0, 100, "%", (value) => updateReading("humidity", value))}
          <div className="sim-thresholds">
            <div>
              <div className="control-label">Demo alert ranges</div>
              <div className="control-help">Below minimum = warning; above maximum = critical.</div>
            </div>
            {(["gas", "temperature", "humidity"] as SensorKey[]).map((sensor) => (
              <div className="sim-threshold-row" key={sensor}>
                <span>{sensor === "gas" ? "Gas ADC" : sensor === "temperature" ? "Temperature" : "Humidity"}</span>
                <label>
                  <span>Min</span>
                  <input
                    className="sim-threshold-input"
                    type="number"
                    min={0}
                    max={sensor === "gas" ? 1022 : sensor === "temperature" ? 70 : 99}
                    step={sensor === "temperature" ? 0.5 : 1}
                    value={thresholds[sensor].min}
                    onChange={(event) => updateThreshold(sensor, "min", Number(event.target.value))}
                    aria-label={`${sensor} minimum demo threshold`}
                  />
                </label>
                <label>
                  <span>Max</span>
                  <input
                    className="sim-threshold-input"
                    type="number"
                    min={1}
                    max={sensor === "gas" ? 1023 : sensor === "temperature" ? 70 : 100}
                    step={sensor === "temperature" ? 0.5 : 1}
                    value={thresholds[sensor].max}
                    onChange={(event) => updateThreshold(sensor, "max", Number(event.target.value))}
                    aria-label={`${sensor} maximum demo threshold`}
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="sim-buzzer-control">
            <div>
              <div className="control-label">Dashboard buzzer</div>
              <div className="control-help">Simulation-only manual override</div>
            </div>
            <button
              className={`sim-buzzer-toggle ${dashboardBuzzerOn ? "is-on" : ""}`}
              type="button"
              role="switch"
              aria-checked={dashboardBuzzerOn}
              onClick={() => {
                unlockDemoAudio();
                setDashboardBuzzerOn((value) => !value);
              }}
            >
              {dashboardBuzzerOn ? "ON" : "OFF"}
            </button>
          </div>
          <button
            className="btn primary"
            type="button"
            onClick={() => void runSimulation()}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Running…" : "Run AI simulation"}
          </button>
        </div>
        <div className="sim-result" aria-live="polite">
          {status === "success" && prediction ? (
            <>
              <div className="panel-title">Model response</div>

              <div
                className={`ai-result ${prediction.is_anomaly ? "bad" : "good"}`}
              >
                {prediction.is_anomaly
                  ? "Unusual pattern detected"
                  : "Within learned patterns"}
              </div>
              <div className="panel-kicker ai-message">
                {prediction.message}
              </div>
              <div className="mini-label sim-score">
                Anomaly score{" "}
                <strong>{prediction.anomaly_score.toFixed(4)}</strong>
              </div>
            </>
          ) : status === "error" ? (
            <div className="ai-error" role="alert">
              {error} Check that the ML API is running.
            </div>
          ) : (
            <>
              <div className="panel-title">Model response</div>
              <div className="sim-placeholder">
                Set conditions and run a simulation to see the prediction.
              </div>
              <div className="panel-kicker ai-message">
                The lab sends 100 generated readings to the backend.
              </div>
            </>
          )}
        </div>
        <div className="simulation-event-log">
          <div className="simulation-event-header">
            <div>
              <div className="panel-title">Simulation alert log</div>
              <div className="panel-kicker">Local demo events only · no Database writes</div>
            </div>
            <button className="btn" type="button" onClick={downloadEvents} disabled={events.length === 0}>
              Export CSV ({events.length})
            </button>
          </div>
          {events.length === 0 ? (
            <div className="sim-placeholder text-center">No alerts recorded yet. Try a Warning or Critical scenario.</div>
          ) : (
            <div className="simulation-event-list">
              {events.map((event) => (
                <article className="simulation-event-row" key={event.id}>
                  <div className="simulation-event-main">
                    <span className={`state ${event.severity === "CRITICAL" ? "bad" : "warn"}`}>{event.severity}</span>
                    <strong>{event.reason}</strong>
                    <span>{event.gas} ADC · {event.temperature}°C · {event.humidity}% RH</span>
                    <time dateTime={new Date(event.timestamp).toISOString()}>{formatTimestamp(event.timestamp)}</time>
                  </div>
                  <button
                    className="btn"
                    type="button"
                    disabled={event.acknowledged}
                    onClick={() => setEvents((current) => current.map((item) => item.id === event.id ? { ...item, acknowledged: true } : item))}
                  >
                    {event.acknowledged ? "Acknowledged" : "Acknowledge"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
