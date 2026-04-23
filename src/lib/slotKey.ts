import { LANES, POSITION_SET, RANKS, SCENARIOS } from "../constants/layout";
import type { PositionId, SlotCoordinate } from "../types";

export function buildSlotKey(coordinate: SlotCoordinate): string {
  return `${coordinate.positionId}|${coordinate.rank}|${coordinate.scenario}|${coordinate.lane}`;
}

export function parseSlotKey(key: string): SlotCoordinate | null {
  const [positionIdRaw, rankRaw, scenarioRaw, laneRaw] = key.split("|");
  const rank = Number(rankRaw);
  if (!positionIdRaw || !scenarioRaw || !laneRaw || Number.isNaN(rank)) {
    return null;
  }
  if (!POSITION_SET.has(positionIdRaw as PositionId)) {
    return null;
  }
  if (!SCENARIOS.find((s) => s.id === scenarioRaw)) {
    return null;
  }
  if (!LANES.find((lane) => lane.id === laneRaw)) {
    return null;
  }
  if (!RANKS.includes(rank as (typeof RANKS)[number])) {
    return null;
  }
  return {
    positionId: positionIdRaw as PositionId,
    rank,
    scenario: scenarioRaw as SlotCoordinate["scenario"],
    lane: laneRaw as SlotCoordinate["lane"]
  };
}

export function allSlotCoordinatesForPosition(positionId: PositionId): SlotCoordinate[] {
  const out: SlotCoordinate[] = [];
  for (const rank of RANKS) {
    for (const scenario of SCENARIOS) {
      for (const lane of LANES) {
        out.push({
          positionId,
          rank,
          scenario: scenario.id,
          lane: lane.id
        });
      }
    }
  }
  return out;
}
