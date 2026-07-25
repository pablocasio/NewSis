"use client";

import { useEffect, useState } from "react";
import { Package, AlertTriangle } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import BarcodeInput from "@/components/BarcodeInput";
import CameraScanner from "@/components/CameraScanner";
import ProductPanel from "@/components/ProductPanel";
import EditProductModal from "@/components/EditProductModal";
import RoleGate from "@/components/RoleGate";

export default function InventoryPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [codigoEscaneado, setCodigoEscaneado] = useState<string | null>(null);
  const [productoEditar, setProductoEditar] = useState<any>(null);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/products");
    if (res.ok) setProductos(await res.json());
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    cargar();
  }

  function agregarManual() {
    const codigo = prompt("Ingresa el código de barras del producto:");
    if (codigo?.trim()) setCodigoEscaneado(codigo.trim());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Inventario</h1>
          <p className="text-sm text-gray-500">Escanea un producto para sumar stock o crear uno nuevo al instante.</p>
        </div>
        <RoleGate allow={["ADMIN", "TRABAJADOR"]}>
          <button
            onClick={agregarManual}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-indigo-600 shadow-sm transition hover:bg-indigo-50"
          >
            + Agregar manualmente
          </button>
        </RoleGate>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:grid-cols-2">
        <RoleGate allow={["ADMIN", "TRABAJADOR"]}>
          <BarcodeInput onScan={(codigo) => setCodigoEscaneado(codigo)} />
        </RoleGate>
        <div className="flex items-center gap-3">
          <RoleGate allow={["ADMIN", "TRABAJADOR"]}>
            <CameraScanner onScan={(codigo) => setCodigoEscaneado(codigo)} />
          </RoleGate>
          <span className="text-xs text-gray-400">Lector USB o cámara del celular — funciona igual</span>
        </div>
      </div>

      <SearchBar onSelect={() => {}} />

      {cargando ? (
        <p className="py-10 text-center text-gray-400">Cargando productos...</p>
      ) : productos.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center text-gray-400 shadow-sm ring-1 ring-gray-100">
          Aún no hay productos. Escanea un código para agregar el primero.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productos.map((p) => {
            const stockBajo = p.stock <= p.stockMinimo;
            return (
              <div
                key={p.id}
                className={`rounded-xl bg-white p-4 shadow-sm ring-1 transition hover:shadow-md ${
                  stockBajo ? "ring-red-200" : "ring-gray-100"
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  {p.imagenUrl ? (
                    <img src={p.imagenUrl} alt={p.nombre} className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-50">
                      <Package className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-800">{p.nombre}</p>
                    <p className="truncate font-mono text-xs text-gray-400">{p.barcode}</p>
                  </div>
                </div>

                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-800">S/ {p.precioVenta}</span>
                  <span
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                      stockBajo ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {stockBajo && <AlertTriangle className="h-3 w-3" strokeWidth={2} />}
                    Stock: {p.stock}
                  </span>
                </div>

                <RoleGate allow={["ADMIN"]}>
                  {p.costo !== undefined && (
                    <p className="mb-2 text-xs text-gray-400">Costo: S/ {p.costo}</p>
                  )}
                </RoleGate>

                <div className="flex gap-2">
                  <button
                    onClick={() => setProductoEditar(p)}
                    className="flex-1 rounded-lg bg-gray-100 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-indigo-100 hover:text-indigo-700"
                  >
                    Editar
                  </button>
                  <RoleGate allow={["ADMIN"]}>
                    <button
                      onClick={() => eliminar(p.id)}
                      className="flex-1 rounded-lg bg-gray-100 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-red-100 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </RoleGate>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {codigoEscaneado && (
        <ProductPanel
          barcode={codigoEscaneado}
          onClose={() => setCodigoEscaneado(null)}
          onSaved={cargar}
        />
      )}

      {productoEditar && (
        <EditProductModal
          producto={productoEditar}
          onClose={() => setProductoEditar(null)}
          onSaved={cargar}
        />
      )}
    </div>
  );
}
