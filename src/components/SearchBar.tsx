"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Package } from "lucide-react";

type Producto = {
  id: string;
  nombre: string;
  barcode: string;
  precioVenta: string;
  stock: number;
  imagenUrl?: string | null;
};

export default function SearchBar({ onSelect }: { onSelect: (p: Producto) => void }) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [buscando, setBuscando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query) {
      setResultados([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const timeout = setTimeout(async () => {
      // Cancela la búsqueda anterior si todavía estaba en vuelo, para que una
      // respuesta lenta y vieja no sobrescriba resultados más nuevos.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) setResultados(await res.json());
      } catch (e) {
        // ignorar aborts
      } finally {
        setBuscando(false);
      }
    }, 180); // debounce corto: se siente instantáneo sin saturar la BD
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={1.75} />
        <input
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-8 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Buscar por nombre o código de barras..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {buscando && (
          <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
        )}
      </div>
      {resultados.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-gray-100 bg-white shadow-lg">
          {resultados.map((p) => (
            <li
              key={p.id}
              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-indigo-50"
              onClick={() => {
                onSelect(p);
                setQuery("");
                setResultados([]);
              }}
            >
              {p.imagenUrl ? (
                <img src={p.imagenUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                  <Package className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
                </span>
              )}
              <span className="flex-1 truncate font-medium text-gray-700">{p.nombre}</span>
              <span className="whitespace-nowrap text-sm text-gray-400">
                S/ {p.precioVenta} · stock {p.stock}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
