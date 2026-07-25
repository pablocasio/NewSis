"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-3 py-1 bg-blue-600 text-white rounded"
    >
      Imprimir
    </button>
  );
}
