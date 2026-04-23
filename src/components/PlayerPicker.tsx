import { useEffect, useMemo, useState } from "react";

import type { CompetitionsQuery } from "../lib/apiClient";
import type { PlayerOption, SlotPayload, TeamOption } from "../types";

interface PlayerPickerApi {
  fetchCompetitions(query: CompetitionsQuery): Promise<Array<{ id: string; name: string; area: string; season: string }>>;
  fetchTeams(query: { competitionId: string; seasonId: string }): Promise<TeamOption[]>;
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
  const areaPart = area ? ` · ${area}` : "";
  const seasonPart = season ? ` · S${season}` : "";
  return `${name}${areaPart}${seasonPart}`;
}

function playerKey(player: PlayerOption): string {
  return (player.playerId ?? player.id ?? player.internalId ?? "").trim();
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

  useEffect(() => {
    if (!open) {
      return;
    }
    setCompetitionId("");
    setTeamId("");
    setPlayerId("");
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
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setTeamId("");
    setPlayers([]);
    setPlayerId("");
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
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setPlayerId("");
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
  }, [api, teamId, seasonId]);

  const selectedPlayer = useMemo(() => players.find((item) => playerKey(item) === playerId), [players, playerId]);

  if (!open) {
    return null;
  }

  return (
    <div className="picker-overlay" role="dialog" aria-modal="true">
      <div className="picker-modal">
        <div className="picker-head">
          <h2>Selezione Player</h2>
          <button type="button" onClick={onClose} aria-label="Close picker">
            ✕
          </button>
        </div>

        <div className="picker-body">
          <label>
            Competizione
            <select value={competitionId} onChange={(event) => setCompetitionId(event.target.value)}>
              <option value="">Seleziona competizione</option>
              {competitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {optionLabel(competition.name, competition.area, competition.season)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Squadra
            <select
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              disabled={!competitionId || loading}
            >
              <option value="">Seleziona squadra</option>
              {teams.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Giocatore
            <select
              value={playerId}
              onChange={(event) => setPlayerId(event.target.value)}
              disabled={!teamId || loading}
            >
              <option value="">Seleziona giocatore</option>
              {players.map((player) => (
                <option key={playerKey(player)} value={playerKey(player)}>
                  {player.label}
                </option>
              ))}
            </select>
          </label>

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
            disabled={!selectedPlayer || !competitionId}
            onClick={() => {
              if (!selectedPlayer) {
                return;
              }
              onApply(toAutofill(selectedPlayer, competitionId));
            }}
          >
            Applica
          </button>
        </div>
      </div>
    </div>
  );
}
