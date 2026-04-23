import type { ReactNode } from "react";

interface PlayerCardProps {
  actionGroup: ReactNode;
  header: ReactNode;
  fields: ReactNode;
  footer: ReactNode;
}

export function PlayerCard({ actionGroup, header, fields, footer }: PlayerCardProps): JSX.Element {
  return (
    <div className="player-card-shell">
      {actionGroup}
      {header}
      {fields}
      {footer}
    </div>
  );
}
