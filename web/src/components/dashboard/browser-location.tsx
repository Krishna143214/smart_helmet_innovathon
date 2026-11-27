"use client";

import { useState } from "react";

interface BrowserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

type LocationState = "idle" | "loading" | "success" | "error";

export function BrowserLocation() {
  const [position, setPosition] = useState<BrowserPosition | null>(null);
  const [state, setState] = useState<LocationState>("idle");
  const [error, setError] = useState<string | null>(null);

  function requestLocation() {
    if (!navigator.geolocation) {
      setError("This browser does not support location access.");
      setState("error");
      return;
    }

    setState("loading");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => {
        setPosition({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp,
        });
        setState("success");
      },
      (cause) => {
        const message =
          cause.code === cause.PERMISSION_DENIED
            ? "Location permission was denied. Allow it in your browser site settings and try again."
            : cause.code === cause.POSITION_UNAVAILABLE
              ? "Laptop location is unavailable. Check device location services."
              : "Location request timed out. Try again.";
        setError(message);
        setState("error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  return (
    <section className="browser-location" aria-label="Laptop browser location">
      <div className="browser-location__header">
        <div>
          <div className="panel-title">Laptop location</div>
          <div className="panel-kicker">Requested from this browser only</div>
        </div>
        <button
          className="btn"
          type="button"
          onClick={requestLocation}
          disabled={state === "loading"}
        >
          {state === "loading"
            ? "Finding location..."
            : position
              ? "Refresh location"
              : "Get laptop location"}
        </button>
      </div>

      {position ? (
        <>
          <div className="browser-location__values">
            <div className="mini-stat">
              <div className="mini-label">Latitude</div>
              <div className="mini-value">{position.latitude.toFixed(6)}</div>
            </div>
            <div className="mini-stat">
              <div className="mini-label">Longitude</div>
              <div className="mini-value">{position.longitude.toFixed(6)}</div>
            </div>
            <div className="mini-stat">
              <div className="mini-label">Accuracy</div>
              <div className="mini-value">±{Math.round(position.accuracy)} m</div>
            </div>
          </div>
          <time
            className="browser-location__time"
            dateTime={new Date(position.timestamp).toISOString()}
          >
            Updated {new Date(position.timestamp).toLocaleTimeString()}
          </time>
        </>
      ) : (
        <div className={`browser-location__message ${state === "error" ? "is-error" : ""}`} aria-live="polite">
          {error ?? (state === "loading" ? "Waiting for browser location permission..." : "Select the button to request this laptop's location.")}
        </div>
      )}
      {error && position && (
        <div className="browser-location__message is-error" role="status">
          {error}
        </div>
      )}
    </section>
  );
}
