"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HistoryTable } from "@/components/dashboard/history-table";
import { LocationCard } from "@/components/dashboard/location-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SafetyControls } from "@/components/dashboard/safety-controls";
import { TelemetryChart } from "@/components/dashboard/telemetry-chart";
import { Toast } from "@/components/ui/toast";
import { AiPredictionCard } from "@/components/dashboard/ai-prediction-card";
import { useDashboardData } from "@/lib/firebase/use-dashboard-data";
import { formatLastUpdate, timestampToDate } from "@/lib/format";
import { SENSOR_THRESHOLDS } from "@/lib/sensors/thresholds";
import { sensorDotClass } from "@/lib/sensors/status";
import { DropLets, HeatWaves, GasSensor, SatelliteIcon } from "@/components/icons";
const degreeC = "\u00b0C";
const middleDot = "\u00b7";

function numberOrNull(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fixed(value: number | null, digits = 1): string {
  if (value === null) return "--";
  return digits === 0 ? String(Math.round(value)) : value.toFixed(digits);
}

function percent(value: number | null, maximum: number): number {
  if (value === null) return 0;
  return Math.max(0, Math.min(100, (value / maximum) * 100));
}

export default function Home() {
  const dashboard = useDashboardData();
  const [now, setNow] = useState<number | undefined>();

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const sensors = dashboard.live?.sensors;
  const gps = dashboard.live?.gps;
  const alerts = dashboard.live?.alerts;
  const gas = numberOrNull(sensors?.gas);
  const temperature =
    sensors?.temperatureValid === false
      ? null
      : numberOrNull(sensors?.temperature);
  const humidity =
    sensors?.humidityValid === false ? null : numberOrNull(sensors?.humidity);
  const satellites = numberOrNull(gps?.satellites);
  const gasLow = gas !== null && gas < SENSOR_THRESHOLDS.gas.min;
  const gasHigh = gas !== null && gas > SENSOR_THRESHOLDS.gas.max;
  const tempLow =
    temperature !== null && temperature < SENSOR_THRESHOLDS.temperature.min;
  const tempHigh =
    temperature !== null && temperature > SENSOR_THRESHOLDS.temperature.max;
  const humidityLow =
    humidity !== null && humidity < SENSOR_THRESHOLDS.humidity.min;
  const humidityHigh =
    humidity !== null && humidity > SENSOR_THRESHOLDS.humidity.max;
  const lastUpdate = timestampToDate(dashboard.live?.device?.lastUpdate);
  const helmetStatus = !dashboard.live
    ? "unknown"
    : dashboard.live.device?.online === true &&
        lastUpdate &&
        now !== undefined &&
        now - lastUpdate.getTime() < 20_000
      ? "online"
      : "offline";
  const lastUpdated =
    dashboard.live && lastUpdate && now !== undefined
      ? formatLastUpdate(dashboard.live?.device?.lastUpdate, now)
      : dashboard.live
        ? "No valid timestamp"
        : "Waiting for device data";

  return (
    <>
      <DashboardShell
        email={
          dashboard.user?.email ??
          (dashboard.authLoading ? "Authenticated" : "Signed out")
        }
        firebaseStatus={dashboard.firebaseStatus}
        helmetStatus={helmetStatus}
        lastUpdated={lastUpdated}
        onSignOut={() => void dashboard.logout()}
      >
        <div className="dashboard-stack" id="overview">
          <section className="page-heading">
            <div>
              <div className="eyebrow">Operations / Live monitoring</div>
              <h1>Helmet overview</h1>
            </div>
            <div className="sync-note">
              LAST UPDATE
              <br />
              <span>{lastUpdated}</span>
            </div>
          </section>

          <section className="grid metrics" aria-label="Live helmet readings">
            <MetricCard
              title="GAS SENSOR"
              value={fixed(gas, 0)}
              unit="ADC"
              note={
                gas === null
                  ? dashboard.live
                    ? "No sensor data"
                    : "Waiting for reading"
                  : gasHigh
                    ? `Above demo maximum (${SENSOR_THRESHOLDS.gas.max} ADC)`
                    : gasLow
                      ? `Below demo minimum (${SENSOR_THRESHOLDS.gas.min} ADC)`
                      : `Demo range: ${SENSOR_THRESHOLDS.gas.min}-${SENSOR_THRESHOLDS.gas.max} ADC`
              }
              icon={GasSensor()}
              dotClass={sensorDotClass(gas, gasLow, gasHigh, helmetStatus)}
              meterWidth={percent(gas, 1023)}
              meterColor={
                gasHigh
                  ? "var(--red)"
                  : gasLow
                    ? "var(--amber)"
                    : "var(--green)"
              }
            />
            <MetricCard
              title="TEMPERATURE"
              value={fixed(temperature)}
              unit={degreeC}
              note={
                temperature === null
                  ? dashboard.live
                    ? "DHT11 reading invalid"
                    : `DHT11 ${middleDot} waiting`
                  : tempHigh
                    ? `Above demo maximum (${SENSOR_THRESHOLDS.temperature.max}${degreeC})`
                    : tempLow
                      ? `Below demo minimum (${SENSOR_THRESHOLDS.temperature.min}${degreeC})`
                      : `Demo range: ${SENSOR_THRESHOLDS.temperature.min}-${SENSOR_THRESHOLDS.temperature.max}${degreeC}`
              }
              icon={HeatWaves()}
              dotClass={sensorDotClass(temperature, tempLow, tempHigh, helmetStatus)}
              meterWidth={percent(temperature, 60)}
              meterColor={
                tempHigh
                  ? "var(--red)"
                  : tempLow
                    ? "var(--amber)"
                    : "var(--blue)"
              }
            />
            <MetricCard
              title="HUMIDITY"
              value={fixed(humidity)}
              unit="%"
              note={
                humidity === null
                  ? dashboard.live
                    ? "DHT11 reading invalid"
                    : `DHT11 ${middleDot} waiting`
                  : humidityHigh
                    ? `Above demo maximum (${SENSOR_THRESHOLDS.humidity.max}%)`
                    : humidityLow
                      ? `Below demo minimum (${SENSOR_THRESHOLDS.humidity.min}%)`
                      : `Demo range: ${SENSOR_THRESHOLDS.humidity.min}-${SENSOR_THRESHOLDS.humidity.max}%`
              }
              icon={DropLets()}
              dotClass={sensorDotClass(humidity, humidityLow, humidityHigh, helmetStatus)}
              meterWidth={percent(humidity, 100)}
              meterColor={
                humidityHigh
                  ? "var(--red)"
                  : humidityLow
                    ? "var(--amber)"
                    : "var(--green)"
              }
            />
            <MetricCard
              title="GPS SATELLITES"
              value={fixed(satellites, 0)}
              unit="SAT"
              note={
                gps?.gpsFix
                  ? "Valid position received"
                  : dashboard.live
                    ? "Waiting for valid GPS fix"
                    : "Waiting for GPS fix"
              }
              icon={SatelliteIcon()}
              dotClass={
                !dashboard.live
                  ? ""
                  : gps?.gpsFix && satellites !== null && helmetStatus === "online"
                    ? "green"
                    : "amber"
              }
              meterWidth={gps?.gpsFix ? percent(satellites, 12) : 0}
              meterColor="var(--green)"
            />
          </section>

          <AiPredictionCard
            history={dashboard.history}
            historyLoaded={dashboard.historyLoaded}
          />

          <section
            className="grid main-grid"
            aria-label="Location and safety controls"
          >
            <LocationCard
              gps={gps}
              history={dashboard.history}
              firebaseLoaded={dashboard.liveLoaded}
            />
            <SafetyControls
              alerts={alerts}
              hasTelemetry={dashboard.live !== null}
              buzzerOn={dashboard.buzzerOn}
              buzzerBusy={dashboard.buzzerBusy}
              buzzerAvailable={dashboard.buzzerAvailable}
              buzzerError={dashboard.buzzerError}
              onToggleBuzzer={() =>
                void dashboard.setDashboardBuzzer(!dashboard.buzzerOn)
              }
            />
          </section>

          <section
            className="grid charts"
            id="telemetry"
            aria-label="Sensor history charts"
          >
            <TelemetryChart
              title="Gas level"
              metric="gas"
              unit={`Raw ADC ${middleDot} 0-1023`}
              records={dashboard.history}
              color="#f7bd55"
            />
            <TelemetryChart
              title="Temperature"
              metric="temperature"
              unit="Degrees Celsius"
              records={dashboard.history}
              color="#69a9ff"
            />
            <TelemetryChart
              title="Humidity"
              metric="humidity"
              unit={`Relative humidity ${middleDot} %`}
              records={dashboard.history}
              color="#49d69a"
            />
          </section>

          <HistoryTable
            records={dashboard.history}
            loaded={dashboard.historyLoaded}
            onNotify={dashboard.setNotice}
          />
        </div>
      </DashboardShell>
      {!dashboard.user && (
        <LoginForm error={dashboard.loginError} onSubmit={dashboard.login} />
      )}
      <Toast message={dashboard.notice} onDismiss={dashboard.clearNotice} />
    </>
  );
}
