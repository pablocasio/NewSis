"use client";

import { useRef } from "react";
import { Barcode } from "lucide-react";

/**
 * Lectores de código de barras USB actúan como teclado: escriben el código
 * rápido y terminan con Enter. Este input queda siempre enfocado en la
 * pantalla de venta para capturarlo automáticamente.
 */
export default function BarcodeInput({ onScan }: { onScan: (codigo: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const value = (e.target as HTMLInputElement).value.trim();
      if (value) onScan(value);
      (e.target as HTMLInputElement).value = "";
    }
  }

  return (
    <div className="relative">
      <Barcode className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" strokeWidth={1.5} />
      <input
        ref={ref}
        autoFocus
        className="w-full rounded-lg border-2 border-indigo-200 bg-indigo-50/40 py-2.5 pl-10 pr-3 text-lg shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
        placeholder="Escanea el código de barras..."
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
