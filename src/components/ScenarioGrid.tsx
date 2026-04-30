import { LANES, RANKS, SCENARIOS } from "../constants/layout";
import type { BoardState } from "../lib/boardModel";
import { buildSlotKey } from "../lib/slotKey";
import type { PositionId, SlotEntry } from "../types";
import { ScenarioCard } from "./ScenarioCard";
import { SlotCard } from "./SlotCard";

interface ScenarioGridProps {
  apiBaseUrl: string;
  positionId: PositionId;
  zoom: "small" | "default" | "large";
  state: BoardState;
  duplicateSlotKeys: Set<string>;
  onPatchSlot: (slotKey: string, patch: Partial<SlotEntry>) => void;
  onClearSlot: (slotKey: string) => void;
  onOpenPicker: (slotKey: string) => void;
}

export function ScenarioGrid({
  apiBaseUrl,
  positionId,
  zoom,
  state,
  duplicateSlotKeys,
  onPatchSlot,
  onClearSlot,
  onOpenPicker
}: ScenarioGridProps): JSX.Element {
  return (
    <section className="scenario-board" data-testid="scenario-board" data-zoom={zoom}>
      <div className="scenario-board-scroll">
        <div className="scenario-layout-grid">
          <aside className="rank-column-card">
            <header className="rank-column-header">n°</header>
            <div className="rank-column-lane-head" aria-hidden="true">
              &nbsp;
            </div>
            <div className="rank-rows">
              {RANKS.map((rank) => (
                <div key={rank} className="rank-row-card">
                  {rank}
                </div>
              ))}
            </div>
          </aside>

          {SCENARIOS.map((scenario) => (
            <ScenarioCard key={scenario.id} scenarioId={scenario.id} label={scenario.label} lanes={LANES}>
              {RANKS.map((rank) => (
                <div key={`${scenario.id}-${rank}`} className="scenario-slot-row">
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
            </ScenarioCard>
          ))}
        </div>
      </div>
    </section>
  );
}
