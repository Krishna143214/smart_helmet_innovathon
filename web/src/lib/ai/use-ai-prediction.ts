
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mapHistoryToReadings } from "@/lib/ai/anomaly-detector";
import type { HelmetHistoryRecord } from "@/lib/types";

export interface AiPredictionResult {
  status: "NORMAL" | "UNUSUAL";
  anomaly_score: number;
  is_anomaly: boolean;
  message: string;
  model: string;
  readings_analyzed?: number;
}

type PredictionState = "waiting" | "loading" | "success" | "error";

const REQUIRED_READINGS = 100;

export function useAiPrediction(
  history: HelmetHistoryRecord[],
  historyLoaded: boolean,
) {
  const [prediction, setPrediction] =
    useState<AiPredictionResult | null>(null);

  const [state, setState] = useState<PredictionState>("waiting");
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Convert Firebase history into valid AI readings
  const readings = useMemo(
    () => mapHistoryToReadings(history),
    [history],
  );

  // Select the most recent 100 readings
  const latestReadings = useMemo(
    () => readings.slice(-REQUIRED_READINGS),
    [readings],
  );

  const requestSignature = useMemo(
    () => JSON.stringify(latestReadings),
    [latestReadings],
  );

  useEffect(() => {
    if (!historyLoaded) return;

    if (latestReadings.length < REQUIRED_READINGS) {
      setPrediction(null);
      setError(null);
      setState("waiting");
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setState("loading");
      setError(null);

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_AI_API_URL ||
          "http://127.0.0.1:8000";

        const response = await fetch(
          `${apiUrl.replace(/\/$/, "")}/predict`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              readings: latestReadings,
            }),
            signal: controller.signal,
          },
        );

        const body = await response.json();

        if (!response.ok) {
          throw new Error(
            body?.detail || `API error: ${response.status}`,
          );
        }

        if (
          typeof body.status !== "string" ||
          typeof body.anomaly_score !== "number" ||
          typeof body.is_anomaly !== "boolean"
        ) {
          throw new Error("Invalid AI response received.");
        }

        setPrediction(body as AiPredictionResult);
        setState("success");
      } catch (err) {
        if (controller.signal.aborted) return;

        setPrediction(null);
        setError(
          err instanceof Error
            ? err.message
            : "Could not connect to AI service.",
        );
        setState("error");
      }
    }, 400);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [historyLoaded, requestSignature, refreshKey, latestReadings]);

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return {
    prediction,
    state,
    error,
    validReadingCount: readings.length,
    readingsRequired: REQUIRED_READINGS,
    refresh,
  };
}
