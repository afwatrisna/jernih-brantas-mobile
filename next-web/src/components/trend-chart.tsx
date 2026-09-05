import type { Reading } from "@/lib/jernih-data";
import { formatNtu } from "@/lib/jernih-data";
import { formatDateTime, getSeverity } from "@/lib/dashboard-utils";

type TrendChartProps = {
  readings: Reading[];
  baseline: number;
};

export function TrendChart({ readings, baseline }: TrendChartProps) {
  const data = readings.slice(-48);
  if (data.length < 2) {
    return <div className="chart-empty">Data belum cukup untuk menampilkan tren.</div>;
  }

  const values = data.map((reading) => reading.ntu);
  const min = Math.max(0, Math.min(...values, baseline, 25) - 4);
  const max = Math.max(...values, baseline, 50) + 5;
  const width = 600;
  const height = 210;
  const chartHeight = 145;
  const yFor = (value: number) =>
    20 + (1 - (value - min) / Math.max(1, max - min)) * chartHeight;
  const points = values.map((value, index) => ({
    x: 38 + (index / (values.length - 1)) * 530,
    y: yFor(value),
  }));
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");

  return (
    <div
      className="trend-chart"
      aria-label="Grafik tren NTU dengan baseline, ambang, dan penanda anomali"
    >
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        {[20, 92, 165].map((y) => (
          <line key={y} x1="38" x2="568" y1={y} y2={y} className="chart-guide" />
        ))}
        <line
          x1="38"
          x2="568"
          y1={yFor(baseline)}
          y2={yFor(baseline)}
          className="chart-baseline"
        />
        <text x="474" y={Math.max(16, yFor(baseline) - 4)}>
          baseline {formatNtu(baseline)}
        </text>
        <line x1="38" x2="568" y1={yFor(25)} y2={yFor(25)} className="chart-threshold" />
        <text x="526" y={Math.max(16, yFor(25) - 4)}>
          25
        </text>
        <line
          x1="38"
          x2="568"
          y1={yFor(50)}
          y2={yFor(50)}
          className="chart-threshold high"
        />
        <text x="526" y={Math.max(16, yFor(50) - 4)}>
          50
        </text>
        <text x="4" y="24">
          {max.toFixed(0)}
        </text>
        <text x="4" y="96">
          {((max + min) / 2).toFixed(0)}
        </text>
        <text x="15" y="169">
          {min.toFixed(0)}
        </text>
        <path d={line} className="chart-line" />
        {points.map((point, index) => {
          const severity = getSeverity(data[index].ntu, baseline);
          const anomaly =
            severity === "high" ||
            severity === "critical" ||
            data[index].ntu > baseline * 1.6;
          return (
            <circle
              key={`${point.x}-${point.y}`}
              cx={point.x}
              cy={point.y}
              r={index === points.length - 1 || anomaly ? 5 : 3.4}
              className={`chart-point ${index === points.length - 1 ? "active" : ""} ${anomaly ? "anomaly" : ""}`}
            />
          );
        })}
        <text x="38" y="198">
          {formatDateTime(data[0].timestamp)}
        </text>
        <text x="470" y="198">
          {formatDateTime(data[data.length - 1].timestamp)}
        </text>
      </svg>
      <div className="chart-legend">
        <span>
          <i className="baseline" />
          Baseline
        </span>
        <span>
          <i className="threshold" />
          Ambang
        </span>
        <span>
          <i className="anomaly" />
          Anomali
        </span>
      </div>
    </div>
  );
}
