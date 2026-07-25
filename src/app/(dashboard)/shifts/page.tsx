"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export default function ShiftsPage() {
  const [turno, setTurno] = useState<any>(null);
  const [montoCierre, setMontoCierre] = useState("");

  useEffect(() => {
    fetch("/api/shifts").then((r) => r.json()).then(setTurno);
  }, []);

  async function cerrar() {
    if (!turno) return;
    await fetch("/api/shifts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnoId: turno.id, montoCierre: Number(montoCierre) }),
    });
    setTurno(null);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-indigo-600" strokeWidth={1.75} />
        <h1 className="text-2xl font-semibold text-gray-800">Mi turno</h1>
      </div>
      {!turno ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <p className="text-gray-400">No tienes un turno abierto. Ábrelo desde la pantalla de Venta.</p>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Turno abierto desde {new Date(turno.abiertoEn).toLocaleString("es-PE")}
          </div>
          <p className="text-sm text-gray-500">
            Monto de apertura: <span className="font-semibold text-gray-800">S/ {turno.montoApertura}</span>
          </p>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Monto de cierre (conteo de caja)"
            value={montoCierre}
            onChange={(e) => setMontoCierre(e.target.value)}
          />
          <button
            onClick={cerrar}
            className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
          >
            Cerrar turno
          </button>
        </div>
      )}
    </div>
  );
}
