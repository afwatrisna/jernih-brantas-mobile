import type { IconName } from "@/lib/dashboard-types";
import { Icon } from "./icon";

type NavButtonProps = {
  active: boolean;
  icon: IconName;
  label: string;
  onClick: () => void;
  badge?: number | string;
};

export function NavButton({ active, icon, label, onClick, badge }: NavButtonProps) {
  const showBadge = badge !== undefined && badge !== null && badge !== 0 && badge !== "0";

  return (
    <button
      type="button"
      className={`nav-button ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <Icon name={icon} />
      <span className="nav-button-label">{label}</span>
      {showBadge ? <em className="nav-button-badge">{badge}</em> : null}
    </button>
  );
}
