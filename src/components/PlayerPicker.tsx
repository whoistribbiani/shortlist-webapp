import { useEffect, useMemo, useState } from "react";

import type { CompetitionsQuery } from "../lib/apiClient";
import { rankAutocompleteOptions } from "../lib/autocompleteSearch";
import { resolveScoutasticMediaUrl } from "../lib/scoutasticMedia";
import type { PlayerOption, SlotPayload, TeamDetail, TeamOption } from "../types";

interface PlayerPickerApi {
  fetchCompetitions(query: CompetitionsQuery): Promise<Array<{ id: string; name: string; area: string; season: string }>>;
  fetchTeams(query: { competitionId: string; seasonId: string }): Promise<TeamOption[]>;
  fetchTeam(query: { teamId: string; gender: string }): Promise<TeamDetail>;
  fetchPlayers(query: { teamId: string; seasonId: string }): Promise<PlayerOption[]>;
}

interface PlayerPickerProps {
  open: boolean;
  api: PlayerPickerApi;
  seasonId: string;
  gender: "male" | "female";
  onClose: () => void;
  onApply: (slot: SlotPayload) => void;
  toAutofill: (player: PlayerOption, competitionId: string) => SlotPayload;
}

function optionLabel(name: string, area: string, season: string): string {
  const areaPart = area ? ` - ${area}` : "";
  const seasonPart = season ? ` - S${season}` : "";
  return `${name}${areaPart}${seasonPart}`;
}

function playerKey(player: PlayerOption): string {
  return (player.playerId ?? player.id ?? player.internalId ?? "").trim();
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function includesQuery(haystack: string, query: string): boolean {
  const q = normalize(query);
  if (!q) {
    return true;
  }
  return normalize(haystack).includes(q);
}

export function PlayerPicker({
  open,
  api,
  seasonId,
  gender,
  onClose,
  onApply,
  toAutofill
}: PlayerPickerProps): JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [competitions, setCompetitions] = useState<Array<{ id: string; name: string; area: string; season: string }>>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);

  const [competitionId, setCompetitionId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");

  const [competitionQuery, setCompetitionQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [playerQuery, setPlayerQuery] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    setCompetitionId("");
    setTeamId("");
    setPlayerId("");
    setCompetitionQuery("");
    setTeamQuery("");
    setPlayerQuery("");
    setTeams([]);
    setPlayers([]);
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .fetchCompetitions({ seasonId, gender })
      .then((data) => {
        if (!cancelled) {
          setCompetitions(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Errore caricamento competizioni");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, open, seasonId, gender]);

  useEffect(() => {
    if (!competitionId) {
      setTeams([]);
      setTeamId("");
      setPlayerId("");
      setTeamQuery("");
      setPlayerQuery("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setTeamId("");
    setPlayers([]);
    setPlayerId("");
    setTeamQuery("");
    setPlayerQuery("");
    api
      .fetchTeams({ competitionId, seasonId })
      .then((data) => {
        if (!cancelled) {
          setTeams(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Errore caricamento squadre");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, competitionId, seasonId]);

  useEffect(() => {
    if (!teamId) {
      setPlayers([]);
      setPlayerId("");
      setPlayerQuery("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setPlayerId("");
    setPlayerQuery("");
    api
      .fetchPlayers({ teamId, seasonId })
      .then((data) => {
        if (!cancelled) {
          setPlayers(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Errore caricamento giocatori");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, seasonId, teamId]);

  const competitionSuggestions = useMemo(
    () =>
      rankAutocompleteOptions(
        competitions,
        competitionQuery,
        (competition) => `${competition.name} ${competition.area} ${competition.season}`,
        20
      ),
    [competitionQuery, competitions]
  );

  const teamSuggestions = useMemo(
    () => teams.filter((team) => includesQuery(team.teamName, teamQuery)).slice(0, 8),
    [teamQuery, teams]
  );

  const playerSuggestions = useMemo(
    () => players.filter((player) => includesQuery(player.label, playerQuery)).slice(0, 8),
    [playerQuery, players]
  );

  const selectedPlayer = useMemo(() => players.find((item) => playerKey(item) === playerId), [players, playerId]);
  const selectedTeam = useMemo(() => teams.find((item) => item.teamId === teamId), [teamId, teams]);

  async function applySelectedPlayer(): Promise<void> {
    if (!selectedPlayer) {
      return;
    }
    setLoading(true);
    const payload = toAutofill(selectedPlayer, competitionId);
    const effectiveTeamId = payload.teamId || teamId;
    if (selectedTeam?.teamLogoUrl) {
      payload.teamLogoUrl = resolveScoutasticMediaUrl(selectedTeam.teamLogoUrl);
    }
    if (!payload.teamId && effectiveTeamId) {
      payload.teamId = effectiveTeamId;
    }
    try {
      if (effectiveTeamId && !payload.teamLogoUrl) {
        const team = await api.fetchTeam({ teamId: effectiveTeamId, gender });
        if (team.teamLogoUrl) {
          payload.teamLogoUrl = resolveScoutasticMediaUrl(team.teamLogoUrl);
        }
      }
    } catch {
      // keep whatever teamLogoUrl toAutofill already set
    } finally {
      setLoading(false);
    }
    onApply(payload);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="picker-overlay" role="dialog" aria-modal="true">
      <div className="picker-modal">
        <div className="picker-head">
          <h2>Selezione Player</h2>
          <button type="button" onClick={onClose} aria-label="Close picker">
            x
          </button>
        </div>

        <div className="picker-body">
          <label>
            Competizione
            <input
              aria-label="Competizione"
              value={competitionQuery}
              onChange={(event) => {
                setCompetitionQuery(event.target.value);
                setCompetitionId("");
                setTeamId("");
                setPlayerId("");
              }}
              placeholder="Digita competizione"
              autoComplete="off"
            />
          </label>
          <div className="picker-suggest-list" data-testid="competition-suggestions">
            {competitionSuggestions.map((competition) => (
              <button
                key={competition.id}
                type="button"
                className="picker-suggest-item"
                onClick={() => {
                  setCompetitionId(competition.id);
                  setCompetitionQuery(optionLabel(competition.name, competition.area, competition.season));
                }}
              >
                {optionLabel(competition.name, competition.area, competition.season)}
              </button>
            ))}
          </div>

          <label>
            Squadra
            <input
              aria-label="Squadra"
              value={teamQuery}
              onChange={(event) => {
                setTeamQuery(event.target.value);
                setTeamId("");
                setPlayerId("");
              }}
              placeholder="Digita squadra"
              autoComplete="off"
              disabled={!competitionId || loading}
            />
          </label>
          <div className="picker-suggest-list" data-testid="team-suggestions">
            {teamSuggestions.map((team) => (
              <button
                key={team.teamId}
                type="button"
                className="picker-suggest-item"
                onClick={() => {
                  setTeamId(team.teamId);
                  setTeamQuery(team.teamName);
                }}
              >
                {team.teamName}
              </button>
            ))}
          </div>

          <label>
            Giocatore
            <input
              aria-label="Giocatore"
              value={playerQuery}
              onChange={(event) => {
                setPlayerQuery(event.target.value);
                setPlayerId("");
              }}
              placeholder="Digita giocatore"
              autoComplete="off"
              disabled={!teamId || loading}
            />
          </label>
          <div className="picker-suggest-list" data-testid="player-suggestions">
            {playerSuggestions.map((player) => (
              <button
                key={playerKey(player)}
                type="button"
                className="picker-suggest-item"
                onClick={() => {
                  setPlayerId(playerKey(player));
                  setPlayerQuery(player.label);
                }}
              >
                {player.label}
              </button>
            ))}
          </div>

          {selectedPlayer && (
            <div className="picker-preview">
              <strong>{selectedPlayer.label}</strong>
              <span>ID: {playerKey(selectedPlayer)}</span>
            </div>
          )}

          {error && <p className="picker-error">{error}</p>}
        </div>

        <div className="picker-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Annulla
          </button>
          <button
            type="button"
            className="primary"
            disabled={!selectedPlayer || !competitionId || loading}
            onClick={() => {
              void applySelectedPlayer();
            }}
          >
            Applica
          </button>
        </div>
      </div>
    </div>
  );
}
