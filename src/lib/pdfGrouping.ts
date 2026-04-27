import { LANES, POSITIONS, SCENARIOS } from "../constants/layout";
import type { BoardState } from "../lib/boardModel";
import type { LaneId, PositionId, ScenarioId, SlotEntry } from "../types";

export type PdfGrouped = {
  positionId: PositionId;
  positionTitle: string;
  lanes: {
    laneId: LaneId;
    laneLabel: string;
    scenarios: {
      scenarioId: ScenarioId;
      scenarioLabel: string;
      slots: SlotEntry[];
    }[];
  }[];
}[];

function isFilledSlot(entry: SlotEntry): boolean {
  return entry.player !== "" || entry.name !== "";
}

export function groupBoardForPdf(state: BoardState): PdfGrouped {
  const result: PdfGrouped = [];

  for (const pos of POSITIONS) {
    const lanes: PdfGrouped[number]["lanes"] = [];

    for (const lane of LANES) {
      const scenarios: PdfGrouped[number]["lanes"][number]["scenarios"] = [];

      for (const scenario of SCENARIOS) {
        const slots = Object.values(state).filter(
          (entry) =>
            entry.positionId === pos.id &&
            entry.lane === lane.id &&
            entry.scenario === scenario.id &&
            isFilledSlot(entry)
        );
        slots.sort((a, b) => a.rank - b.rank);

        if (slots.length > 0) {
          scenarios.push({
            scenarioId: scenario.id,
            scenarioLabel: scenario.label,
            slots,
          });
        }
      }

      if (scenarios.length > 0) {
        lanes.push({
          laneId: lane.id,
          laneLabel: lane.label,
          scenarios,
        });
      }
    }

    if (lanes.length > 0) {
      result.push({
        positionId: pos.id,
        positionTitle: pos.title,
        lanes,
      });
    }
  }

  return result;
}
