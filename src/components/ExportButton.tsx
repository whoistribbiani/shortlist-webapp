import { useState } from "react";

interface ExportButtonProps {
  onExport: () => Promise<void>;
  onExportPdf?: () => Promise<void>;
  disabled?: boolean;
}

export function ExportButton({ onExport, onExportPdf, disabled }: ExportButtonProps): JSX.Element {
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleExportPdf(): Promise<void> {
    if (!onExportPdf) return;
    setPdfLoading(true);
    try {
      await onExportPdf();
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="export-btn-group">
      <button
        type="button"
        className="export-btn"
        disabled={disabled}
        onClick={() => {
          void onExport();
        }}
      >
        Export XLSX
      </button>

      {onExportPdf ? (
        <button
          type="button"
          className="export-btn export-btn--pdf"
          disabled={disabled || pdfLoading}
          onClick={() => {
            void handleExportPdf();
          }}
        >
          {pdfLoading ? "Generando…" : "Export PDF"}
        </button>
      ) : null}
    </div>
  );
}
