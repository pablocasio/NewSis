"use client";

import { useEffect, useState } from "react";
import { Wallet, Smartphone, CreditCard, Shuffle, Package, X, Lock } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import BarcodeInput from "@/components/BarcodeInput";
import AddToCartModal from "@/components/AddToCartModal";
import { beep } from "@/lib/sound";

type Item = {
  productId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  imagenUrl?: string | null;
};

type ProductoBusqueda = {
  id: string;
  nombre: string;
  precioVenta: string | number;
  stock: number;
  imagenUrl?: string | null;
};

const METODOS = [
  { valor: "EFECTIVO", label: "Efectivo", Icon: Wallet },
  { valor: "YAPE", label: "Yape", Icon: Smartphone },
  { valor: "TARJETA", label: "Tarjeta", Icon: CreditCard },
  { valor: "MIXTO", label: "Mixto", Icon: Shuffle },
] as const;

export default function PosPage() {
  const [turno, setTurno] = useState<any>(null);
  const [montoApertura, setMontoApertura] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [metodoPago, setMetodoPago] = useState<"EFECTIVO" | "YAPE" | "TARJETA" | "MIXTO">("EFECTIVO");
  const [yapeCodigo, setYapeCodigo] = useState("");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ultimaVentaId, setUltimaVentaId] = useState<string | null>(null);
  const [productoParaAgregar, setProductoParaAgregar] = useState<ProductoBusqueda | null>(null);

  useEffect(() => {
    fetch("/api/shifts").then((r) => r.json()).then(setTurno);
  }, []);

  async function abrirTurno() {
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montoApertura: Number(montoApertura) }),
    });
    if (res.ok) setTurno(await res.json());
  }

  // Al escanear o buscar, primero se muestra el panel de cantidad — así el
  // cajero no necesita escanear el mismo producto varias veces.
  function confirmarAgregar(cantidad: number) {
    if (!productoParaAgregar) return;
    const p = productoParaAgregar;
    setItems((prev) => {
      const existe = prev.find((i) => i.productId === p.id);
      if (existe) {
        return prev.map((i) => (i.productId === p.id ? { ...i, cantidad: i.cantidad + cantidad } : i));
      }
      return [
        ...prev,
        {
          productId: p.id,
          nombre: p.nombre,
          cantidad,
          precioUnitario: Number(p.precioVenta),
          imagenUrl: p.imagenUrl,
        },
      ];
    });
    setProductoParaAgregar(null);
  }

  async function buscarPorCodigo(codigo: string) {
    // Búsqueda exacta e indexada por código de barras: más rápida y
    // confiable que filtrar por texto libre.
    const res = await fetch(`/api/products?barcode=${encodeURIComponent(codigo)}`);
    const data = await res.json();
    if (data[0]) {
      beep(true);
      setProductoParaAgregar(data[0]);
      setMensaje("");
    } else {
      beep(false);
      setMensaje(`No se encontró producto con código ${codigo}`);
    }
  }

  function cambiarCantidad(productId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    );
  }

  function quitarItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const total = items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0);
  const vuelto = metodoPago === "EFECTIVO" && montoRecibido ? Number(montoRecibido) - total : null;

  async function cobrar() {
    if (metodoPago === "YAPE" && !yapeCodigo) {
      setMensaje("Ingresa el código de operación de Yape");
      return;
    }
    if (metodoPago === "EFECTIVO" && vuelto !== null && vuelto < 0) {
      setMensaje("El monto recibido es menor al total");
      return;
    }
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftId: turno.id,
        metodoPago,
        yapeCodigo: metodoPago === "YAPE" ? yapeCodigo : undefined,
        items: items.map((i) => ({ productId: i.productId, cantidad: i.cantidad, precioUnitario: i.precioUnitario })),
      }),
    });
    if (res.ok) {
      const venta = await res.json();
      setItems([]);
      setYapeCodigo("");
      setMontoRecibido("");
      setMensaje("Venta registrada correctamente.");
      setUltimaVentaId(venta.id);
      window.open(`/receipt/${venta.id}`, "_blank");
    } else {
      const err = await res.json();
      setMensaje(err.error || "Error al registrar la venta");
    }
  }

  if (!turno) {
    return (
      <div className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-600" strokeWidth={1.75} />
          <h2 className="text-lg font-semibold text-gray-800">Abrir turno de caja</h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">Necesitas abrir tu turno antes de registrar ventas.</p>
        <input
          className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Monto de apertura (S/)"
          value={montoApertura}
          onChange={(e) => setMontoApertura(e.target.value)}
        />
        <button
          onClick={abrirTurno}
          className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          Abrir turno
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <BarcodeInput onScan={buscarPorCodigo} />
        <SearchBar onSelect={(p) => setProductoParaAgregar(p as ProductoBusqueda)} />

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          {items.length === 0 ? (
            <p className="p-8 text-center text-gray-400">El carrito está vacío. Escanea o busca un producto.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="p-3">Producto</th>
                  <th className="p-3">Cant.</th>
                  <th className="p-3">P. Unit.</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.productId} className="border-b last:border-0">
                    <td className="flex items-center gap-2 p-3 font-medium text-gray-800">
                      {i.imagenUrl ? (
                        <img src={i.imagenUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                          <Package className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
                        </span>
                      )}
                      {i.nombre}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => cambiarCantidad(i.productId, -1)}
                          className="h-7 w-7 rounded-lg bg-gray-100 font-bold text-gray-600 transition hover:bg-gray-200 active:scale-95"
                        >
                          −
                        </button>
                        <span className="w-6 text-center">{i.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(i.productId, 1)}
                          className="h-7 w-7 rounded-lg bg-gray-100 font-bold text-gray-600 transition hover:bg-gray-200 active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="p-3">S/ {i.precioUnitario.toFixed(2)}</td>
                    <td className="p-3 font-semibold">S/ {(i.cantidad * i.precioUnitario).toFixed(2)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => quitarItem(i.productId)}
                        className="text-gray-300 transition hover:text-red-500"
                        title="Quitar"
                      >
                        <X className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div>
          <p className="text-sm text-gray-500">Total a cobrar</p>
          <p className="text-3xl font-bold text-gray-800">S/ {total.toFixed(2)}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {METODOS.map((m) => (
            <button
              key={m.valor}
              onClick={() => setMetodoPago(m.valor)}
              className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium transition ${
                metodoPago === m.valor
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <m.Icon className="h-4 w-4" strokeWidth={1.75} />
              {m.label}
            </button>
          ))}
        </div>

        {metodoPago === "YAPE" && (
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Código de operación Yape"
            value={yapeCodigo}
            onChange={(e) => setYapeCodigo(e.target.value)}
          />
        )}

        {metodoPago === "EFECTIVO" && (
          <div className="space-y-2">
            <input
              type="number"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Monto recibido del cliente"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
            />
            {vuelto !== null && (
              <div
                className={`flex justify-between rounded-xl px-3 py-2 text-sm font-semibold ${
                  vuelto < 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <span>{vuelto < 0 ? "Falta" : "Vuelto"}</span>
                <span>S/ {Math.abs(vuelto).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={cobrar}
          className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
          disabled={items.length === 0}
        >
          Cobrar
        </button>

        {mensaje && <p className="text-center text-sm text-gray-600">{mensaje}</p>}
        {ultimaVentaId && (
          <a
            href={`/receipt/${ultimaVentaId}`}
            target="_blank"
            className="block text-center text-sm font-medium text-indigo-600 underline-offset-2 hover:underline"
          >
            Ver / reimprimir boleta
          </a>
        )}
      </div>

      {productoParaAgregar && (
        <AddToCartModal
          producto={productoParaAgregar}
          onConfirm={confirmarAgregar}
          onClose={() => setProductoParaAgregar(null)}
        />
      )}
    </div>
  );
}
