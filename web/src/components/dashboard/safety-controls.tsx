import type { HelmetAlerts } from "@/lib/types";

interface SafetyControlsProps {
  alerts: HelmetAlerts | null | undefined;
  buzzerOn: boolean;
  buzzerBusy: boolean;
  buzzerAvailable: boolean;
  buzzerError: string | null;
  hasTelemetry: boolean;
  onToggleBuzzer: () => void;
}

export function SafetyControls({
  alerts,
  buzzerOn,
  buzzerBusy,
  buzzerAvailable,
  buzzerError,
  hasTelemetry,
  onToggleBuzzer,
}: SafetyControlsProps) {
  const gasAlert = alerts?.gasAlert === true;
  const highTempAlert = alerts?.highTempAlert === true;
  const alarm = alerts?.autoAlarm === true;
  const status = hasTelemetry
    ? String(alerts?.status || (alarm ? "ALERT" : "NORMAL")).replaceAll(
        "_",
        " ",
      )
    : "Awaiting telemetry";
  const detail = hasTelemetry
    ? alarm
      ? "One or more configured safety thresholds have been exceeded."
      : "No active configured gas or temperature alert."
    : "Safety state will appear when data arrives.";

  return (
    <article className="panel status-card">
      <div className="panel-title">Safety &amp; controls</div>
      <div className="panel-kicker">Automatic alerts and remote buzzer</div>
      <div className="status-banner">
        <div
          className="status-symbol"
          style={
            alarm
              ? { color: "var(--red)", background: "rgba(255,107,114,.12)" }
              : undefined
          }
          aria-hidden="true"
        >
          {alarm ? "!" : "✓"}
        </div>
        <div>
          <div className="status-main">{status}</div>
          <div className="status-detail">{detail}</div>
        </div>
      </div>
      <div className="alert-list">
        <div className="alert-row">
          <span className="alert-name">Gas threshold (&gt; 400 ADC)</span>
          <span className={`state ${gasAlert ? "bad" : ""}`}>
            {gasAlert ? "ALERT" : "NORMAL"}
          </span>
        </div>
        <div className="alert-row">
          <span className="alert-name">High temperature (&gt; 35 °C)</span>
          <span className={`state ${highTempAlert ? "bad" : ""}`}>
            {highTempAlert ? "ALERT" : "NORMAL"}
          </span>
        </div>
        <div className="alert-row">
          <span className="alert-name">Automatic safety buzzer · D4</span>
          <span className={`state ${alarm ? "bad" : ""}`}>
            {alarm ? "ON" : "OFF"}
          </span>
        </div>
      </div>
      <div className="control-card">
        <div className="control-top">
          <div>
            <div className="control-label">Dashboard buzzer · D3</div>
            <div className="control-help">
              Remote command is read by the helmet every ~3 seconds.
            </div>
          </div>
          <label className="switch" aria-label="Dashboard buzzer toggle">
            <span className="sr-only">Dashboard buzzer D3</span>
            <input
              id="buzzerToggle"
              type="checkbox"
              checked={buzzerOn}
              disabled={!buzzerAvailable || buzzerBusy}
              onChange={onToggleBuzzer}
            />
            <span className="slider" />
          </label>
        </div>
        <div
          className="control-help"
          id="buzzerStateText"
          style={{ marginTop: 10 }}
        >
          {buzzerBusy
            ? "Sending command to Firebase…"
            : (buzzerError ??
              (!buzzerAvailable
                ? "Connect and wait for Firebase."
                : `Command stored in Firebase: ${buzzerOn ? "ON" : "OFF"}. The helmet polls this command about every 3 seconds.`))}
        </div>
      </div>
    </article>
  );
}
