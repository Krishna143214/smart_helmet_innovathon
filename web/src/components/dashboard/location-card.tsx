"use client";

import { useCallback, useEffect, useState } from "react";
import type { HelmetGps, HelmetHistoryRecord } from "@/lib/types";
import { hasValidGpsFix, type BrowserPosition } from "@/lib/gps";
import { GpsReadout } from "./gps-readout";
import { LocationMap } from "./location-map";

interface LocationCardProps {
  gps: HelmetGps | null | undefined;
  history: HelmetHistoryRecord[];
  firebaseLoaded: boolean;
}

export function LocationCard({ gps, history, firebaseLoaded }: LocationCardProps) {
  const hasFix = hasValidGpsFix(gps);
  const [browserPosition, setBrowserPosition] = useState<BrowserPosition | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const requestBrowserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => {
        setBrowserPosition({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp,
        });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    if (firebaseLoaded && !hasFix) requestBrowserLocation();
  }, [firebaseLoaded, hasFix, requestBrowserLocation]);

  const usingBrowserPosition = !hasFix && browserPosition !== null;
  const hasLocation = hasFix || usingBrowserPosition;
  const locationStatus = hasLocation
    ? "GPS FIX"
    : !firebaseLoaded
      ? "CHECKING FIREBASE"
      : isLocating
        ? "LOCATING"
        : "NO LOCATION";

  return (
    <article className="panel" id="location">
      <div className="panel-head">
        <div>
          <div className="panel-title">Device location</div>
          <div className="panel-kicker">Live GPS coordinates</div>
        </div>
        <span className={`state ${hasLocation ? "" : "warn"}`}>
          {locationStatus}
        </span>
      </div>
      <div className="panel-body">
        <LocationMap
          gps={gps}
          history={history}
          browserPosition={usingBrowserPosition ? browserPosition : null}
        />
        <GpsReadout
          gps={gps}
          browserPosition={usingBrowserPosition ? browserPosition : null}
        />
      </div>
    </article>
  );
}
