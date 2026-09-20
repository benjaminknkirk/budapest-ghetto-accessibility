"use client";

export function PrintButton() {
  return (
    <button type="button" className="print-btn" onClick={() => window.print()}>
      Print / save as PDF
    </button>
  );
}
