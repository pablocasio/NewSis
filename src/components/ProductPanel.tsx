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

/**
 * Subpanel que aparece justo después de escanear un código (lector USB o
 * cámara). Si el producto ya existe solo pide la cantidad a sumar al stock.
 * Si es nuevo, permite crearlo rápido: únicamente la cantidad es obligatoria,
 * el resto (nombre, precio, costo, categoría, foto) es opcional y se puede
 * completar después con el botón "Editar" en la tabla.
 */
export default function ProductPanel({
  barcode,
  onClose,
  onSaved,
}: {
  barcode: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [producto, setProducto] = useState<any>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [cantidad, setCantidad] = useState("1");
  const [nombre, setNombre] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [costo, setCosto] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [resProd, resCat] = await Promise.all([
        fetch(`/api/products?barcode=${encodeURIComponent(barcode)}`),
        fetch("/api/categories"),
      ]);
      const productos = resProd.ok ? await resProd.json() : [];
      setCategorias(resCat.ok ? await resCat.json() : []);
      setProducto(productos[0] || null);
      setCargando(false);
    })();
  }, [barcode]);

  async function agregarStockExistente() {
    if (!producto) return;
    setGuardando(true);
    setError("");
    const res = await fetch(`/api/products/${producto.id}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantidad: Number(cantidad) }),
    });
    setGuardando(false);
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const err = await res.json();
      setError(err.error || "No se pudo actualizar el stock");
    }
  }

  async function crearProductoNuevo() {
    setGuardando(true);
    setError("");

    let catId = categoryId;
    if (!catId && nuevaCategoria.trim()) {
      const resCat = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevaCategoria.trim() }),
      });
      if (resCat.ok) catId = (await resCat.json()).id;
    }

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barcode,
        stock: Number(cantidad || 0),
        ...(nombre ? { nombre } : {}),
        ...(precioVenta ? { precioVenta: Number(precioVenta) } : {}),
        ...(costo ? { costo: Number(costo) } : {}),
        ...(catId ? { categoryId: catId } : {}),
        ...(imagenUrl ? { imagenUrl } : {}),
      }),
    });
    setGuardando(false);
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const err = await res.json();
      setError(typeof err.error === "string" ? err.error : "No se pudo crear el producto");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">Código escaneado</p>
            <p className="font-mono text-lg font-bold text-gray-800">{barcode}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md bg-gray-100 p-2 text-gray-500 transition hover:bg-gray-200"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {cargando ? (
          <p className="py-8 text-center text-gray-400">Buscando producto...</p>
        ) : producto ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-3">
              {producto.imagenUrl ? (
                <img src={producto.imagenUrl} alt={producto.nombre} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-100">
                  <Package className="h-6 w-6 text-indigo-400" strokeWidth={1.5} />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-800">{producto.nombre}</p>
                <p className="text-sm text-gray-500">Stock actual: {producto.stock}</p>
                <p className="text-sm text-gray-500">S/ {producto.precioVenta}</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-600">
              Cantidad a sumar al stock
              <input
                type="number"
                min={1}
                autoFocus
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={agregarStockExistente}
              disabled={guardando || Number(cantidad) <= 0}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
            >
              {guardando ? "Guardando..." : `+ Agregar ${cantidad || 0} al stock`}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Producto nuevo — solo la cantidad es obligatoria, completa el resto ahora o edítalo después.
            </p>

            <label className="block text-sm font-medium text-gray-600">
              Cantidad (obligatorio)
              <input
                type="number"
                min={0}
                autoFocus
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-gray-600">
              Nombre (opcional)
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Ej. Arroz Costeño 1kg"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm font-medium text-gray-600">
                Precio venta
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                />
              </label>
              <RoleGate allow={["ADMIN"]}>
                <label className="block text-sm font-medium text-gray-600">
                  Costo
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                  />
                </label>
              </RoleGate>
            </div>

            <label className="block text-sm font-medium text-gray-600">
              Categoría (opcional)
              <select
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            {!categoryId && (
              <input
                className="w-full rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="...o escribe una categoría nueva"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
              />
            )}

            <label className="block text-sm font-medium text-gray-600">
              Foto (opcional)
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="mt-1 w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setImagenUrl(await fileToBase64(file));
                }}
              />
            </label>
            {imagenUrl && (
              <img src={imagenUrl} alt="preview" className="h-20 w-20 rounded-xl object-cover" />
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={crearProductoNuevo}
              disabled={guardando || cantidad === ""}
              className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Crear producto"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
