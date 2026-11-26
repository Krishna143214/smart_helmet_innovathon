import { GpsReadout } from "./gps-readout";
import { LocationMap } from "./location-map";
import type { HelmetGps, HelmetHistoryRecord } from "@/lib/types";

interface LocationCardProps {
  gps: HelmetGps | null | undefined;
  history: HelmetHistoryRecord[];
}

export function LocationCard({ gps, history }: LocationCardProps) {
  const hasFix = gps?.gpsFix === true;

  return (
    <article className="panel" id="location">
      <div className="panel-head">
        <div>
          <div className="panel-title">Device location</div>
          <div className="panel-kicker">NEO-6M GPS · live coordinates</div>
        </div>
        <span className={`state ${hasFix ? "" : "warn"}`}>
          {hasFix ? "GPS FIX" : "NO FIX"}
        </span>
      </div>
      <div className="panel-body">
        <LocationMap gps={gps} history={history} />
        <GpsReadout gps={gps} />
      </div>
    </article>
  );
}
