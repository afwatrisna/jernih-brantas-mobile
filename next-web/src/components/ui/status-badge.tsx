import type { StationInsight } from "@/lib/dashboard-types";

export function StatusBadge({
  insight,
  compact = false,
}: {
  insight: StationInsight;
  compact?: boolean;
}) {
  return (
    <span
      className={`status-badge ${compact ? "compact" : ""} severity-${insight.severity}`}
    >
      <i />
      {insight.label}
    </span>
  );
}
