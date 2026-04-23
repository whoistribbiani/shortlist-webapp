import { POSITIONS } from "../constants/layout";
import type { PositionId } from "../types";

type TabValue = PositionId | "RECAP";

interface PositionTabsProps {
  value: TabValue;
  onChange: (value: TabValue) => void;
}

export function PositionTabs({ value, onChange }: PositionTabsProps): JSX.Element {
  return (
    <nav className="position-tabs" aria-label="Position tabs">
      {POSITIONS.map((position) => (
        <button
          key={position.id}
          type="button"
          className={value === position.id ? "tab tab-active" : "tab"}
          onClick={() => onChange(position.id)}
        >
          {position.id}
        </button>
      ))}
      <button
        type="button"
        className={value === "RECAP" ? "tab tab-active tab-recap" : "tab tab-recap"}
        onClick={() => onChange("RECAP")}
      >
        Recap
      </button>
    </nav>
  );
}
