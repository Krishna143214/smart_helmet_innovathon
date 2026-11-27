"use client";

import { useAiPrediction } from "@/lib/ai/use-ai-prediction";
import type { HelmetHistoryRecord } from "@/lib/types";

interface AiPredictionCardProps {
  history: HelmetHistoryRecord[];
  historyLoaded: boolean;
}

const RefreshIcon = () => {
  return <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-refresh-cw preview-icon"
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>;
};
export function AiPredictionCard({
  history,
  historyLoaded,
}: AiPredictionCardProps) {
  const ai = useAiPrediction(history, historyLoaded);
  const isUnusual = ai.prediction?.is_anomaly === true;
  const tone = isUnusual ? "bad" : "good";

  return (
    <section
      className="panel ai-card"
      id="ai-prediction"
      aria-label="AI sensor prediction"
    >
      <div className="panel-head">
        <div>
          <div className="panel-title">AI sensor prediction</div>
          <div className="panel-kicker">
            Isolation Forest · latest sensor pattern
          </div>
        </div>
        <span
          className={`ai-model-badge ${ai.state === "success" ? tone : ""}`}
        >
          <span
            className={`dot ${ai.state === "success" ? (isUnusual ? "red" : "green") : ""}`}
          />
          {ai.state === "success"
            ? ai.prediction?.status
            : ai.state === "loading"
              ? "ANALYZING"
              : "MODEL STATUS"}
        </span>
      </div>
      <div className="panel-body ai-body">
        <div className="ai-result-row">
          <div>
            <div className="ai-result-label">Pattern assessment</div>
            <div className={`ai-result ${ai.state === "success" ? tone : ""}`}>
              {ai.state === "success"
                ? isUnusual
                  ? "Unusual pattern detected"
                  : "Within learned patterns"
                : ai.state === "loading"
                  ? "Analyzing recent readings…"
                  : "Prediction unavailable"}
            </div>
            <div className="panel-kicker ai-message">
              {ai.state === "success"
                ? ai.prediction?.message
                : ai.state === "waiting"
                  ? historyLoaded
                    ? `Need ${ai.readingsRequired - ai.validReadingCount} more valid readings to run a prediction.`
                    : "Waiting for sensor history to load."
                  : ai.state === "loading"
                    ? "Sending the latest sensor window to the ML model."
                    : ai.error}
            </div>
          </div>
          <button
            className="btn ai-refresh"
            type="button"
            onClick={ai.refresh}
            disabled={
              ai.state === "loading" ||
              ai.validReadingCount < ai.readingsRequired
            }
          >
            {RefreshIcon()}
          </button>
        </div>
        <div className="ai-stats">
          <div className="mini-stat">
            <div className="mini-label">Valid readings</div>
            <div className="mini-value">
              {ai.validReadingCount} / {ai.readingsRequired}
            </div>
          </div>
          <div className="mini-stat">
            <div className="mini-label">Analyzed window</div>
            <div className="mini-value">
              {ai.prediction?.readings_analyzed ??
                (ai.validReadingCount >= ai.readingsRequired
                  ? ai.readingsRequired
                  : "—")}
            </div>
          </div>
          <div className="mini-stat">
            <div className="mini-label">Anomaly score</div>
            <div className="mini-value">
              {typeof ai.prediction?.anomaly_score === "number"
                ? ai.prediction.anomaly_score.toFixed(4)
                : "—"}
            </div>
          </div>
        </div>
        {ai.state === "error" && (
          <div className="ai-error" role="alert">
            {ai.error} Check that the Backend is running...
          </div>
        )}
      </div>
    </section>
  );
}
