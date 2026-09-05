import type { IconName } from "@/lib/dashboard-types";

const ICON_MAP: Record<IconName, string> = {
  grid: "▦",
  field: "☷",
  chart: "⌁",
  settings: "⚙",
  water: "◒",
  map: "⌖",
  plus: "+",
  check: "✓",
  restart: "↻",
  shield: "◈",
  database: "▤",
  alert: "⚠",
  trend: "↗",
  download: "⇩",
};

export function Icon({ name }: { name: IconName }) {
  return (
    <span className={`icon icon-${name}`} aria-hidden="true">
      {ICON_MAP[name]}
    </span>
  );
}
