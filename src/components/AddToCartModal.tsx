"use client";

import { useEffect, useRef, useState } from "react";
import { X, Package } from "lucide-react";

type Producto = {
  id: string;
  nombre: string;
  precioVenta: string | number;
  stock: number;
  imagenUrl?: string | null;
};

/**
 * Panel que aparece al escanear o buscar un producto en la pantalla de
 * Venta. Permite elegir la cantidad de una sola vez (para no tener que
 * escanear el mismo producto varias veces) antes de mandarlo al carrito.
 */
export default function AddToCartModal({
  producto,
  onConfirm,
  onClose,
}: {
  producto: Producto;
  onConfirm: (cantidad: number) => void;
  onClose: () => void;
}) {
  const [cantidad, setCantidad] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function confirmar() {
    if (cantidad > 0) onConfirm(cantidad);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onKeyDown={(e) => {
        if (e.key === "Enter") confirmar();
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center gap-3">
          {producto.imagenUrl ? (
            <img src={producto.imagenUrl} alt={producto.nombre} className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-50">
              <Package className="h-6 w-6 text-indigo-400" strokeWidth={1.5} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-800">{producto.nombre}</p>
            <p className="text-sm text-gray-500">
              S/ {Number(producto.precioVenta).toFixed(2)} · stock {producto.stock}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md bg-gray-100 p-2 text-gray-400 hover:bg-gray-200">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Cantidad</label>
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            className="h-11 w-11 shrink-0 rounded-xl bg-gray-100 text-xl font-bold text-gray-600 transition hover:bg-gray-200 active:scale-95"
          >
            −
          </button>
          <input
            ref={inputRef}
            type="number"
            min={1}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-center text-2xl font-bold focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
          />
          <button
            onClick={() => setCantidad((c) => c + 1)}
            className="h-11 w-11 shrink-0 rounded-xl bg-gray-100 text-xl font-bold text-gray-600 transition hover:bg-gray-200 active:scale-95"
          >
            +
          </button>
        </div>

        <div className="mb-4 flex justify-between rounded-xl bg-indigo-50 px-3 py-2 text-sm">
          <span className="text-indigo-500">Subtotal</span>
          <span className="font-bold text-indigo-700">
            S/ {(Number(producto.precioVenta) * cantidad).toFixed(2)}
          </span>
        </div>

        <button
          onClick={confirmar}
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}
