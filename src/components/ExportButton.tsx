interface ExportButtonProps {
  onExport: () => Promise<void>;
  disabled?: boolean;
}

export function ExportButton({ onExport, disabled }: ExportButtonProps): JSX.Element {
  return (
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
  );
}
