import type { LaneId, PositionDefinition, PositionId, ScenarioId, SlotPayload } from "../types";

export const POSITIONS: PositionDefinition[] = [
  { id: "1-GK", code: 1, title: "GK - GoalKeeper" },
  { id: "2-RWB", code: 2, title: "RWB - Right Wing Back" },
  { id: "3-LWB", code: 3, title: "LWB - Left Wing Back" },
  { id: "4-RCB", code: 4, title: "RCB - Right Centre Back" },
  { id: "5-CB", code: 5, title: "CB - Centre Back" },
  { id: "6-LCB", code: 6, title: "LCB - Left Centre Back" },
  { id: "7-CM", code: 7, title: "CM - Central Midfielder" },
  { id: "8-DM", code: 8, title: "DM - Difensive Midfielder" },
  { id: "9-CF", code: 9, title: "CF - Central Forward" },
  { id: "10-AM", code: 10, title: "AM - Attacking Midfielder" },
  { id: "11-ST", code: 11, title: "ST - 2nd Striker" },
  { id: "12-AW", code: 12, title: "AW - Attacking Winger" }
];

export const SCENARIOS: Array<{ id: ScenarioId; label: string }> = [
  { id: "0-2", label: "Scenario 0 - 2 m/EUR" },
  { id: "2-5", label: "Scenario 2 - 5 m/EUR" },
  { id: "5-10", label: "Scenario 5 - 10 m/EUR" },
  { id: "10-20", label: "Scenario 10 - 20 m/EUR" }
];

export const LANES: Array<{ id: LaneId; label: string }> = [
  { id: "A1B1", label: "A1 / B1" },
  { id: "A2", label: "A2" },
  { id: "B1", label: "B1" }
];

export const RANKS = [1, 2, 3, 4, 5, 6] as const;

export const SLOT_FIELDS: Array<keyof Pick<SlotPayload, "name" | "player" | "club" | "age" | "expiring" | "videoUrl">> = [
  "name",
  "player",
  "club",
  "age",
  "expiring",
  "videoUrl"
];

export const FIELD_LABELS: Record<(typeof SLOT_FIELDS)[number], string> = {
  name: "Name",
  player: "Player",
  club: "Club",
  age: "Age",
  expiring: "Expiring",
  videoUrl: "Video"
};

export const EMPTY_SLOT_PAYLOAD: SlotPayload = {
  name: "",
  player: "",
  club: "",
  age: "",
  expiring: "",
  videoUrl: "",
  playerId: "",
  playerInternalId: "",
  playerImageUrl: "",
  teamId: "",
  competitionId: ""
};

export const POSITION_SET = new Set<PositionId>(POSITIONS.map((p) => p.id));
export const SCENARIO_SET = new Set<ScenarioId>(SCENARIOS.map((s) => s.id));
export const LANE_SET = new Set<LaneId>(LANES.map((l) => l.id));
