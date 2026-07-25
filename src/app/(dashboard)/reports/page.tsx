"use client";

import { useState } from "react";
import { BarChart3, Mail } from "lucide-react";

export default function ReportsPage() {
  const [resultado, setResultado] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  async function enviarReporte() {
    setCargando(true);
    const res = await fetch("/api/reports/send", { method: "POST" });
    setResultado(await res.json());
    setCargando(false);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-indigo-600" strokeWidth={1.75} />
        <h1 className="text-2xl font-semibold text-gray-800">Reportes</h1>
      </div>
      <p className="text-sm text-gray-500">
        Los reportes diarios se envían automáticamente por correo. También puedes enviarlo manualmente:
      </p>
      <button
        onClick={enviarReporte}
        disabled={cargando}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
      >
        <Mail className="h-4 w-4" strokeWidth={1.75} />
        {cargando ? "Enviando..." : "Enviar reporte ahora"}
      </button>
      {resultado && (
        <div className="space-y-2 rounded-xl bg-white p-5 text-sm shadow-sm ring-1 ring-gray-100">
          <div className="flex justify-between">
            <span className="text-gray-500">Ventas hoy</span>
            <span className="font-semibold text-gray-800">
              {resultado.ventas} (S/ {resultado.totalVentas?.toFixed?.(2)})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Productos con stock bajo</span>
            <span className="font-semibold text-rose-600">{resultado.stockBajo}</span>
          </div>
        </div>
      )}
    </div>
  );
}
