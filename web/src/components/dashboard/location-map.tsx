"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import type { HelmetGps, HelmetHistoryRecord } from "@/lib/types";
import { hasValidGpsFix } from "@/lib/gps";
import type { BrowserPosition } from "@/lib/gps";

interface LocationMapProps {
  gps: HelmetGps | null | undefined;
  history: HelmetHistoryRecord[];
  browserPosition: BrowserPosition | null;
}

function gpsValue(value: number | undefined, digits = 1): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : "--";
}

function popupMarkup(gps: HelmetGps): string {
  const values = [
    ["Latitude", gpsValue(gps.latitude, 6)],
    ["Longitude", gpsValue(gps.longitude, 6)],
    ["Satellites", gpsValue(gps.satellites, 0)],
    ["Speed", `${gpsValue(gps.speed)} km/h`],
    ["Altitude", `${gpsValue(gps.altitude)} m`],
    ["HDOP", gpsValue(gps.hdop)],
  ];

  return `<div class="helmet-popup"><div class="helmet-popup__title">Smart Mining Helmet</div><div class="helmet-popup__grid">${values.map(([label, value]) => `<div class="helmet-popup__item"><span>${label}</span><strong>${value}</strong></div>`).join("")}</div></div>`;
}

function browserPopupMarkup(position: BrowserPosition): string {
  return `<div class="helmet-popup"><div class="helmet-popup__title">GPS location</div><div class="helmet-popup__grid"><div class="helmet-popup__item"><span>Latitude</span><strong>${position.latitude.toFixed(6)}</strong></div><div class="helmet-popup__item"><span>Longitude</span><strong>${position.longitude.toFixed(6)}</strong></div><div class="helmet-popup__item"><span>Accuracy</span><strong>±${Math.round(position.accuracy)} m</strong></div></div></div>`;
}

export function LocationMap({ gps, history, browserPosition }: LocationMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const route = useRef<Polyline | null>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const hasValidPosition = hasValidGpsFix(gps);
  const useBrowserPosition = !hasValidPosition && browserPosition !== null;
  const activePosition = hasValidPosition
    ? { latitude: gps.latitude, longitude: gps.longitude, source: "helmet" as const }
    : useBrowserPosition
      ? {
          latitude: browserPosition.latitude,
          longitude: browserPosition.longitude,
          source: "laptop" as const,
        }
      : null;
  const markerSource = useRef<"helmet" | "laptop" | null>(null);

  const routePoints = useMemo<[number, number][]>(() => {
    const points: [number, number][] = [];
    for (const record of history) {
      const fix = record.gps;
      if (!hasValidGpsFix(fix)) continue;
      points.push([fix.latitude, fix.longitude]);
    }

    if (hasValidGpsFix(gps)) {
      points.push([gps.latitude, gps.longitude]);
    }

    const uniquePoints = points.filter((point, index) => {
      const previous = points[index - 1];
      return (
        index === 0 || point[0] !== previous[0] || point[1] !== previous[1]
      );
    });
    return uniquePoints.slice(-20);
  }, [gps?.gpsFix, gps?.latitude, gps?.longitude, hasValidPosition, history]);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let invalidateTimer = 0;

    import("leaflet")
      .then((leaflet) => {
        if (cancelled || !mapElement.current || mapInstance.current) return;

        const map = leaflet
          .map(mapElement.current, { zoomControl: true })
          .setView([22.5, 78.9], 4);
        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
          })
          .addTo(map);

        mapInstance.current = map;
        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() =>
            map.invalidateSize({ pan: false }),
          );
          resizeObserver.observe(mapElement.current);
        }
        setReady(true);
        invalidateTimer = window.setTimeout(() => map.invalidateSize(), 150);
      })
      .catch(() => setMapError("Map tiles could not be loaded."));

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      window.clearTimeout(invalidateTimer);
      mapInstance.current?.remove();
      mapInstance.current = null;
      marker.current = null;
      markerSource.current = null;
      route.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    if (!activePosition) {
      marker.current?.remove();
      marker.current = null;
      markerSource.current = null;
      return;
    }

    const coordinates: [number, number] = [
      activePosition.latitude,
      activePosition.longitude,
    ];
    import("leaflet").then((leaflet) => {
      const map = mapInstance.current;
      if (!map) return;

      const isLaptop = activePosition.source === "laptop";
      const icon = leaflet.divIcon({
        className: "helmet-map-marker",
        html: '<div class="helmet-marker"><span class="helmet-marker__badge"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 14a8 8 0 0 1 16 0v2H4v-2Z" stroke="currentColor" stroke-width="2"/><path d="M3 16h18v3H3zM12 6V3M8 7 6 5m10 2 2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span><span class="helmet-marker__tip"></span></div>',
        iconSize: [40, 48],
        iconAnchor: [20, 45],
        popupAnchor: [0, -41],
      });

      if (!marker.current) {
        marker.current = leaflet.marker(coordinates, { icon }).addTo(map);
        map.setView(coordinates, isLaptop ? 14 : 16);
      } else {
        marker.current.setLatLng(coordinates);
        marker.current.setIcon(icon);
        if (markerSource.current !== activePosition.source || map.getZoom() < 10) {
          map.setView(coordinates, isLaptop ? 14 : 16);
        }
      }
      markerSource.current = activePosition.source;
      marker.current.bindPopup(
        isLaptop
          ? browserPopupMarkup(browserPosition!)
          : popupMarkup(gps!),
      );
    });
  }, [gps, browserPosition, activePosition?.latitude, activePosition?.longitude, activePosition?.source, ready]);

  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    import("leaflet").then((leaflet) => {
      const map = mapInstance.current;
      if (!map) return;

      if (routePoints.length < 2) {
        route.current?.remove();
        route.current = null;
        return;
      }

      if (!route.current) {
        route.current = leaflet
          .polyline(routePoints, {
            color: "#49d69a",
            weight: 3,
            opacity: 0.78,
            lineCap: "round",
            lineJoin: "round",
          })
          .addTo(map);
      } else {
        route.current.setLatLngs(routePoints);
      }
      route.current.bringToBack();
    });
  }, [ready, routePoints]);

  const position = activePosition
    ? `${gpsValue(activePosition.latitude, 6)}, ${gpsValue(activePosition.longitude, 6)}`
    : null;

  function recenterMap() {
    const map = mapInstance.current;
    if (!map) return;
    const target = activePosition
      ? ([activePosition.latitude, activePosition.longitude] as [number, number])
      : (marker.current?.getLatLng() ?? routePoints[routePoints.length - 1]);
    if (target) {
      const zoom = activePosition?.source === "laptop" ? 14 : 16;
      map.setView(target, zoom, { animate: true });
    }
  }

  return (
    <div className="map-wrap">
      <div id="map" ref={mapElement} aria-label="GPS location map" />
      <div className="map-overlay">
        {mapError ??
          (position
            ? `GPS LOCATION · ${position}`
            : "Waiting for valid GPS coordinates")}
      </div>
      {routePoints.length > 1 && (
        <div className="map-legend">
          <span className="map-legend__line" />
          Recent route
        </div>
      )}
      <button
        className="map-recenter"
        type="button"
        onClick={recenterMap}
        disabled={!activePosition && routePoints.length === 0}
        aria-label="Center map on active location"
        title="Center map on active location"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="7"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
