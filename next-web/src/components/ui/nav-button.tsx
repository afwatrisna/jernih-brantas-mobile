import type { IconName } from "@/lib/dashboard-types";
import { Icon } from "./icon";

type NavButtonProps = {
  active: boolean;
  icon: IconName;
  label: string;
  onClick: () => void;
};

export function NavButton({ active, icon, label, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      className={`nav-button ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
}
