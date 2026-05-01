import { useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";

import { BoardShell } from "./components/BoardShell";
import { ExportButton } from "./components/ExportButton";
import { PlayerPicker } from "./components/PlayerPicker";
import { PositionTabs } from "./components/PositionTabs";
import { RecapView } from "./components/RecapView";
import { ScenarioGrid } from "./components/ScenarioGrid";
import { ShareLinkBar } from "./components/ShareLinkBar";
import { POSITIONS } from "./constants/layout";
import { useDebouncedEffect } from "./hooks/useDebouncedEffect";
import type { ApiClient } from "./lib/apiClient";
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
import { groupBoardForPdf } from "./lib/pdfGrouping";
import { resolveSeasonIdFromEnv } from "./lib/season";
import { parseSlotKey } from "./lib/slotKey";
import { toAutofillFromApiPlayer } from "./lib/playerTransform";
import type { BoardDocument, BoardMeta, PositionId, SlotEntry, SlotPayload } from "./types";

type BoardZoom = 50 | 67 | 75 | 80 | 90 | 100 | 110 | 125 | 150;

const BOARD_ZOOM_LEVELS: BoardZoom[] = [50, 67, 75, 80, 90, 100, 110, 125, 150];

function zoomLabel(zoom: BoardZoom): string {
  return `${zoom}%`;
}

interface AppProps {
  apiBaseUrl: string;
  api: ApiClient;
  onLogout: () => void;
}

function defaultMeta(): BoardMeta {
  const defaultSeason = resolveSeasonIdFromEnv(import.meta.env.VITE_DEFAULT_SEASON_ID, new Date());
  return {
    shareToken: "",
    title: "Scouting ShortList",
    seasonId: defaultSeason,
    gender: "male",
    updatedAt: new Date().toISOString()
  };
}

function payloadForSave(meta: BoardMeta, state: BoardState): BoardDocument {
  return {
    meta: {
      ...meta,
      gender: "male" as const,
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

function formatSaveTime(value: string): string {
  if (!value) {
    return "--:--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function App({ apiBaseUrl, api, onLogout }: AppProps): JSX.Element {
  const [meta, setMeta] = useState<BoardMeta>(() => defaultMeta());
  const [state, setState] = useState<BoardState>(() => createInitialBoardState());
  const [tab, setTab] = useState<PositionId | "RECAP">("1-GK");
  const [pickerSlotKey, setPickerSlotKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [bannerMessage, setBannerMessage] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [boardZoom, setBoardZoom] = useState<BoardZoom>(100);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    let cancelled = false;
    void api
      .getBoardCurrent()
      .then((board) => {
        if (cancelled) {
          return;
        }
        setMeta((prev) => ({
          ...prev,
          ...board.meta,
          gender: "male"
        }));
        setLastSavedAt(board.meta.updatedAt || "");
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
  }, [api]);

  useDebouncedEffect(
    () => {
      if (!hydrated) {
        return;
      }
      setSaveState("saving");
      void api
        .putBoardCurrent(payloadForSave(meta, state))
        .then(() => {
          const now = new Date().toISOString();
          setLastSavedAt(now);
          setSaveState("saved");
          setMeta((prev) => ({
            ...prev,
            updatedAt: now
          }));
        })
        .catch(() => {
          setSaveState("error");
        });
    },
    900,
    [api, hydrated, meta.title, meta.seasonId, meta.gender, state]
  );

  const duplicateSlotKeys = useMemo(() => {
    if (tab === "RECAP") {
      return new Set<string>();
    }
    return duplicateSlotKeysByPosition(state, tab);
  }, [state, tab]);

  const activePosition = POSITIONS.find((position) => position.id === tab) ?? POSITIONS[0];
  const activePositionTitle = useMemo(() => {
    const parts = activePosition.title.split(" - ");
    if (parts.length <= 1) {
      return activePosition.title;
    }
    return parts.slice(1).join(" - ");
  }, [activePosition.title]);

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
    const blob = await api.exportBoardCurrent(payloadForSave(meta, state));
    downloadBlob(blob, `shortlist-board.xlsx`);
  }

  async function onExportPdf(): Promise<void> {
    const [{ pdf }, { ShortlistPdfDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("./components/pdf/ShortlistPdfDocument"),
    ]);
    const grouped = groupBoardForPdf(state);
    const blob = await pdf(
      <ShortlistPdfDocument meta={meta} grouped={grouped} imageProxyBaseUrl={apiBaseUrl} />
    ).toBlob();
    downloadBlob(blob, `shortlist-${meta.title || "board"}.pdf`);
  }

  const shareLink = useMemo(() => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    return url.toString();
  }, []);

  const saveDisplayTime = useMemo(() => formatSaveTime(lastSavedAt || meta.updatedAt), [lastSavedAt, meta.updatedAt]);
  const boardZoomIndex = BOARD_ZOOM_LEVELS.indexOf(boardZoom);

  function adjustBoardZoom(direction: -1 | 1): void {
    const nextIndex = Math.min(BOARD_ZOOM_LEVELS.length - 1, Math.max(0, boardZoomIndex + direction));
    setBoardZoom(BOARD_ZOOM_LEVELS[nextIndex]);
  }

  return (
    <BoardShell
      meta={meta}
      saveState={saveState}
      onLogout={onLogout}
      onMetaChange={(patch) => {
        setMeta((prev) => ({ ...prev, ...patch, gender: "male" }));
      }}
    >
      <div className="top-toolbar">
        <PositionTabs value={tab} onChange={setTab} />
        <div className="board-zoom-control" aria-label="Zoom board">
          <button
            type="button"
            data-testid="zoom-out"
            aria-label="Riduci zoom board"
            disabled={boardZoomIndex === 0}
            onClick={() => adjustBoardZoom(-1)}
          >
            -
          </button>
          <button
            type="button"
            className="board-zoom-value"
            data-testid="zoom-reset"
            aria-label="Reset zoom board"
            disabled={boardZoom === 100}
            onClick={() => setBoardZoom(100)}
          >
            {zoomLabel(boardZoom)}
          </button>
          <button
            type="button"
            data-testid="zoom-in"
            aria-label="Aumenta zoom board"
            disabled={boardZoomIndex === BOARD_ZOOM_LEVELS.length - 1}
            onClick={() => adjustBoardZoom(1)}
          >
            +
          </button>
        </div>
        <ExportButton onExport={onExport} onExportPdf={onExportPdf} />
      </div>

      <ShareLinkBar shareLink={shareLink} />

      {loadError && <p className="error-banner">{loadError}</p>}
      {bannerMessage && <p className="warning-banner">{bannerMessage}</p>}

      {tab === "RECAP" ? (
        <RecapView state={state} />
      ) : (
        <>
          <h2 className="position-title">
            {activePosition.id} - {activePositionTitle}
          </h2>
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <ScenarioGrid
              apiBaseUrl={apiBaseUrl}
              positionId={tab}
              zoom={boardZoom}
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

          <div className="board-legend-row">
            <div className="board-legend-items">
              <span className="legend-item">
                <span className="legend-dot legend-dot-green" />
                Budget disponibile
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot-orange" />
                Attenzione budget
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot-red" />
                Budget superato
              </span>
              <span className="legend-item legend-drag-hint">Trascina per riordinare</span>
            </div>
            <div className="legend-save-time">Ultimo salvataggio: oggi alle {saveDisplayTime}</div>
          </div>
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
