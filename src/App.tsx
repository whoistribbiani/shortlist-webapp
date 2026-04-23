import { useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";

import { BoardShell } from "./components/BoardShell";
import { ExportButton } from "./components/ExportButton";
import { PlayerPicker } from "./components/PlayerPicker";
import { PositionTabs } from "./components/PositionTabs";
import { RecapView } from "./components/RecapView";
import { ScenarioGrid } from "./components/ScenarioGrid";
import { POSITIONS } from "./constants/layout";
import { useDebouncedEffect } from "./hooks/useDebouncedEffect";
import { createApiClient } from "./lib/apiClient";
import {
  arrayToBoardState,
  boardStateToArray,
  canAssignPlayerToSlot,
  clearSlotPayload,
  createInitialBoardState,
  moveSlotPayload,
  upsertSlotPayload,
  type BoardState
} from "./lib/boardModel";
import { resolveSeasonIdFromEnv } from "./lib/season";
import { ensureShareTokenInUrl } from "./lib/shareToken";
import { parseSlotKey } from "./lib/slotKey";
import { toAutofillFromApiPlayer } from "./lib/playerTransform";
import type { BoardMeta, PositionId, SlotEntry, SlotPayload } from "./types";

interface AppProps {
  apiBaseUrl: string;
}

function defaultMeta(shareToken: string): BoardMeta {
  const defaultSeason = resolveSeasonIdFromEnv(import.meta.env.VITE_DEFAULT_SEASON_ID, new Date());
  const defaultGender = import.meta.env.VITE_DEFAULT_GENDER === "female" ? "female" : "male";
  return {
    shareToken,
    title: "Scouting ShortList",
    seasonId: defaultSeason,
    gender: defaultGender,
    updatedAt: new Date().toISOString()
  };
}

function payloadForSave(meta: BoardMeta, state: BoardState) {
  return {
    meta: {
      ...meta,
      updatedAt: new Date().toISOString()
    },
    slots: boardStateToArray(state)
  };
}

function duplicateSlotKeysByPosition(state: BoardState, positionId: PositionId): Set<string> {
  const byPlayer = new Map<string, string[]>();
  for (const [slotKey, slot] of Object.entries(state)) {
    if (slot.positionId !== positionId || !slot.playerId) {
      continue;
    }
    const list = byPlayer.get(slot.playerId) ?? [];
    list.push(slotKey);
    byPlayer.set(slot.playerId, list);
  }
  const duplicates = new Set<string>();
  for (const keys of byPlayer.values()) {
    if (keys.length < 2) {
      continue;
    }
    keys.forEach((key) => duplicates.add(key));
  }
  return duplicates;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function App({ apiBaseUrl }: AppProps): JSX.Element {
  const api = useMemo(() => createApiClient(apiBaseUrl), [apiBaseUrl]);
  const [shareToken] = useState(() => ensureShareTokenInUrl());
  const [meta, setMeta] = useState<BoardMeta>(() => defaultMeta(shareToken));
  const [state, setState] = useState<BoardState>(() => createInitialBoardState());
  const [tab, setTab] = useState<PositionId | "RECAP">("1-GK");
  const [pickerSlotKey, setPickerSlotKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [bannerMessage, setBannerMessage] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    let cancelled = false;
    void api
      .getBoard(shareToken)
      .then((board) => {
        if (cancelled) {
          return;
        }
        setMeta((prev) => ({
          ...prev,
          ...board.meta,
          shareToken
        }));
        setState(arrayToBoardState(board.slots));
        setLoadError("");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Errore caricamento board");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHydrated(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, shareToken]);

  useDebouncedEffect(
    () => {
      if (!hydrated) {
        return;
      }
      setSaveState("saving");
      void api
        .putBoard(shareToken, payloadForSave(meta, state))
        .then(() => {
          setSaveState("saved");
        })
        .catch(() => {
          setSaveState("error");
        });
    },
    900,
    [api, hydrated, meta.title, meta.seasonId, meta.gender, shareToken, state]
  );

  const duplicateSlotKeys = useMemo(() => {
    if (tab === "RECAP") {
      return new Set<string>();
    }
    return duplicateSlotKeysByPosition(state, tab);
  }, [state, tab]);

  const activePosition = POSITIONS.find((position) => position.id === tab) ?? POSITIONS[0];

  function patchSlot(slotKey: string, patch: Partial<SlotPayload | SlotEntry>): void {
    setState((prev) => upsertSlotPayload(prev, slotKey, patch));
  }

  function clearSlot(slotKey: string): void {
    setBannerMessage("");
    setState((prev) => clearSlotPayload(prev, slotKey));
  }

  function onApplyPlayer(patch: SlotPayload): void {
    if (!pickerSlotKey) {
      return;
    }
    if (patch.playerId && !canAssignPlayerToSlot(state, pickerSlotKey, patch.playerId)) {
      setBannerMessage("Duplicato non consentito nella stessa posizione.");
      return;
    }
    setBannerMessage("");
    patchSlot(pickerSlotKey, patch);
    setPickerSlotKey(null);
  }

  function onDragEnd(event: DragEndEvent): void {
    const sourceKey = String(event.active.id ?? "");
    const targetKey = String(event.over?.id ?? "");
    if (!sourceKey || !targetKey || sourceKey === targetKey) {
      return;
    }
    const source = parseSlotKey(sourceKey);
    const target = parseSlotKey(targetKey);
    if (!source || !target) {
      return;
    }
    if (source.positionId !== target.positionId) {
      setBannerMessage("Move consentito solo nella stessa posizione.");
      return;
    }
    setBannerMessage("");
    setState((prev) => moveSlotPayload(prev, sourceKey, targetKey));
  }

  async function onExport(): Promise<void> {
    const blob = await api.exportBoard(shareToken, payloadForSave(meta, state));
    downloadBlob(blob, `shortlist-${shareToken}.xlsx`);
  }

  const shareLink = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("token", shareToken);
    return url.toString();
  }, [shareToken]);

  return (
    <BoardShell
      meta={meta}
      saveState={saveState}
      onMetaChange={(patch) => {
        setMeta((prev) => ({ ...prev, ...patch }));
      }}
    >
      <div className="top-toolbar">
        <PositionTabs value={tab} onChange={setTab} />
        <ExportButton onExport={onExport} />
      </div>

      <div className="share-strip">
        <span>Link privato:</span>
        <input value={shareLink} readOnly />
      </div>

      {loadError && <p className="error-banner">{loadError}</p>}
      {bannerMessage && <p className="warning-banner">{bannerMessage}</p>}

      {tab === "RECAP" ? (
        <RecapView state={state} />
      ) : (
        <>
          <h2 className="position-title">
            {activePosition.id} - {activePosition.title}
          </h2>
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <ScenarioGrid
              apiBaseUrl={apiBaseUrl}
              positionId={tab}
              state={state}
              duplicateSlotKeys={duplicateSlotKeys}
              onPatchSlot={(slotKey, patch) => patchSlot(slotKey, patch)}
              onClearSlot={clearSlot}
              onOpenPicker={(slotKey) => {
                setBannerMessage("");
                setPickerSlotKey(slotKey);
              }}
            />
          </DndContext>
        </>
      )}

      <PlayerPicker
        open={!!pickerSlotKey}
        api={api}
        seasonId={meta.seasonId}
        gender={meta.gender}
        onClose={() => setPickerSlotKey(null)}
        onApply={onApplyPlayer}
        toAutofill={toAutofillFromApiPlayer}
      />
    </BoardShell>
  );
}
