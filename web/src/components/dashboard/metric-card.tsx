interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  note: string;
  icon: React.ReactNode;
  dotClass?: string;
  meterWidth?: number;
  meterColor?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  note,
  icon,
  dotClass = "",
  meterWidth = 0,
  meterColor,
}: MetricCardProps) {
  return (
    <article className="panel metric">
      <div className="metric-head">
        <span>{title}</span>
        <span className="metric-icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="metric-value">
        {value} <span className="metric-unit">{unit}</span>
      </div>
      <div className="metric-foot">
        <span className={`dot ${dotClass}`} />
        <span>{note}</span>
      </div>
      <div className="meter">
        <span
          style={{
            width: `${meterWidth}%`,
            ...(meterColor ? { background: meterColor } : {}),
          }}
        />
      </div>
    </article>
  );
}
