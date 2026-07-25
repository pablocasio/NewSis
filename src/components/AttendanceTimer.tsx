"use client";

import { useEffect, useState } from "react";

function formatearDuracion(ms: number) {
  const totalSeg = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function AttendanceTimer() {
  const [asistencia, setAsistencia] = useState<any>(null);
  const [ahora, setAhora] = useState(Date.now());
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    const res = await fetch("/api/attendance");
    if (res.ok) setAsistencia(await res.json());
  }

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function marcarEntrada() {
    setCargando(true);
    const res = await fetch("/api/attendance", { method: "POST" });
    if (res.ok) setAsistencia(await res.json());
    setCargando(false);
  }

  async function marcarSalida() {
    if (!asistencia) return;
    setCargando(true);
    const res = await fetch("/api/attendance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceId: asistencia.id }),
    });
    if (res.ok) setAsistencia(null);
    setCargando(false);
  }

  if (!asistencia) {
    return (
      <button
        onClick={marcarEntrada}
        disabled={cargando}
        className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
        <span className="hidden sm:inline">Marcar entrada</span>
      </button>
    );
  }

  const transcurrido = ahora - new Date(asistencia.entrada).getTime();

  return (
    <div className="flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="tabular-nums">{formatearDuracion(transcurrido)}</span>
      <button
        onClick={marcarSalida}
        disabled={cargando}
        className="rounded-md bg-red-600/90 px-2 py-1 font-medium text-white transition hover:bg-red-600 active:scale-95 disabled:opacity-50"
      >
        Salida
      </button>
    </div>
  );
}
