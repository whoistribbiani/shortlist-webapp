import { LANES, RANKS, SCENARIOS } from "../constants/layout";
import type { BoardState } from "../lib/boardModel";
import { buildSlotKey } from "../lib/slotKey";
import type { PositionId, SlotEntry } from "../types";
import { SlotCard } from "./SlotCard";

interface ScenarioGridProps {
  apiBaseUrl: string;
  positionId: PositionId;
  state: BoardState;
  duplicateSlotKeys: Set<string>;
  onPatchSlot: (slotKey: string, patch: Partial<SlotEntry>) => void;
  onClearSlot: (slotKey: string) => void;
  onOpenPicker: (slotKey: string) => void;
}

export function ScenarioGrid({
  apiBaseUrl,
  positionId,
  state,
  duplicateSlotKeys,
  onPatchSlot,
  onClearSlot,
  onOpenPicker
}: ScenarioGridProps): JSX.Element {
  return (
    <section className="scenario-grid-wrapper">
      <div className="scenario-grid-header">
        <div className="rank-head">n°</div>
        {SCENARIOS.map((scenario) => (
          <div key={scenario.id} className="scenario-group-head">
            <div className="scenario-title">{scenario.label}</div>
            <div className="lane-heads">
              {LANES.map((lane) => (
                <div key={lane.id} className="lane-head">
                  {lane.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {RANKS.map((rank) => (
        <div className="rank-row" key={rank}>
          <div className="rank-cell">{rank}</div>
          {SCENARIOS.map((scenario) => (
            <div key={`${rank}-${scenario.id}`} className="scenario-lane-group">
              {LANES.map((lane) => {
                const slotKey = buildSlotKey({
                  positionId,
                  rank,
                  scenario: scenario.id,
                  lane: lane.id
                });
                const slot = state[slotKey];
                return (
                  <SlotCard
                    apiBaseUrl={apiBaseUrl}
                    key={slotKey}
                    slotKey={slotKey}
                    slot={slot}
                    duplicateBlocked={duplicateSlotKeys.has(slotKey)}
                    onPatch={onPatchSlot}
                    onClearSlot={onClearSlot}
                    onOpenPicker={onOpenPicker}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
