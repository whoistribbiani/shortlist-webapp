import emptyPlayerPlaceholder from "../assets/empty-player-placeholder.png";

interface EmptySlotCardProps {
  onSelect: () => void;
}

export function EmptySlotCard({ onSelect }: EmptySlotCardProps): JSX.Element {
  return (
    <button
      type="button"
      className="empty-slot-card"
      onClick={onSelect}
      data-testid="slot-select"
      aria-label="Seleziona slot vuoto"
      title="Aggiungi giocatore"
    >
      <span className="empty-slot-plus">+</span>
      <span className="empty-slot-label">Aggiungi giocatore</span>
      <span className="empty-slot-ghost" aria-hidden="true">
        <img className="empty-slot-ghost-image" src={emptyPlayerPlaceholder} alt="" />
      </span>
    </button>
  );
}
