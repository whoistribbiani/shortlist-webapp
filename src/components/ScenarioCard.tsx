import type { ReactNode } from "react";

import type { LaneId, ScenarioId } from "../types";

const SCENARIO_STYLE_CLASS: Record<ScenarioId, string> = {
  "0-2": "scenario-theme-green",
  "2-5": "scenario-theme-blue",
  "5-10": "scenario-theme-purple",
  "10-20": "scenario-theme-orange"
};

interface ScenarioCardProps {
  scenarioId: ScenarioId;
  label: string;
  lanes: Array<{ id: LaneId; label: string }>;
  children: ReactNode;
}

export function ScenarioCard({ scenarioId, label, lanes, children }: ScenarioCardProps): JSX.Element {
  return (
    <article className={`scenario-column-card ${SCENARIO_STYLE_CLASS[scenarioId]}`}>
      <header className="scenario-column-header">
        <h3>{label}</h3>
      </header>
      <div className="scenario-lane-head-row">
        {lanes.map((lane) => (
          <div key={lane.id} className="scenario-lane-head">
            {lane.label}
          </div>
        ))}
      </div>
      <div className="scenario-rows">{children}</div>
    </article>
  );
}
