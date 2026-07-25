"use client";

import { useEffect, useState } from "react";
import { X, Package } from "lucide-react";
import RoleGate from "./RoleGate";

type Categoria = { id: string; nombre: string };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditProductModal({
  producto,
  onClose,
  onSaved,
}: {
  producto: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState({
    nombre: producto.nombre || "",
    precioVenta: String(producto.precioVenta ?? ""),
    costo: String(producto.costo ?? ""),
    stock: String(producto.stock ?? 0),
    stockMinimo: String(producto.stockMinimo ?? 5),
    categoryId: producto.categoryId || "",
    imagenUrl: producto.imagenUrl || null,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategorias);
  }, []);

  async function guardar() {
    setGuardando(true);
    setError("");
    const res = await fetch(`/api/products/${producto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        precioVenta: Number(form.precioVenta || 0),
        costo: Number(form.costo || 0),
        stock: Number(form.stock || 0),
        stockMinimo: Number(form.stockMinimo || 5),
        categoryId: form.categoryId || null,
        imagenUrl: form.imagenUrl,
      }),
    });
    setGuardando(false);
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      setError("No se pudo guardar el producto");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold text-gray-800">Editar producto</p>
          <button onClick={onClose} className="rounded-md bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {form.imagenUrl ? (
              <img src={form.imagenUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-100">
                <Package className="h-6 w-6 text-indigo-400" strokeWidth={1.5} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setForm({ ...form, imagenUrl: await fileToBase64(file) });
              }}
            />
          </div>

          <label className="block text-sm font-medium text-gray-600">
            Nombre
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-medium text-gray-600">
              Precio venta
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={form.precioVenta}
                onChange={(e) => setForm({ ...form, precioVenta: e.target.value })}
              />
            </label>
            <RoleGate allow={["ADMIN"]}>
              <label className="block text-sm font-medium text-gray-600">
                Costo
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={form.costo}
                  onChange={(e) => setForm({ ...form, costo: e.target.value })}
                />
              </label>
            </RoleGate>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-medium text-gray-600">
              Stock
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium text-gray-600">
              Stock mínimo
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={form.stockMinimo}
                onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-gray-600">
            Categoría
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
