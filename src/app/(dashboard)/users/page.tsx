"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle2, XCircle } from "lucide-react";

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [nuevo, setNuevo] = useState({ nombre: "", email: "", password: "", rol: "TRABAJADOR" });

  async function cargar() {
    const res = await fetch("/api/users");
    if (res.ok) setUsuarios(await res.json());
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear() {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo),
    });
    setNuevo({ nombre: "", email: "", password: "", rol: "TRABAJADOR" });
    cargar();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-indigo-600" strokeWidth={1.75} />
        <h1 className="text-2xl font-semibold text-gray-800">Usuarios</h1>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:grid-cols-2 md:grid-cols-5">
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Nombre"
          value={nuevo.nombre}
          onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
        />
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Correo"
          value={nuevo.email}
          onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
        />
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="Contraseña"
          type="password"
          value={nuevo.password}
          onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
        />
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          value={nuevo.rol}
          onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
        >
          <option value="TRABAJADOR">Trabajador</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          onClick={crear}
          className="rounded-lg bg-indigo-600 py-2 font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          Crear
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-3">Nombre</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Activo</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-3 font-medium text-gray-800">{u.nombre}</td>
                <td className="p-3 text-gray-500">{u.email}</td>
                <td className="p-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      u.rol === "ADMIN" ? "bg-slate-100 text-slate-700" : "bg-indigo-50 text-indigo-700"
                    }`}
                  >
                    {u.rol}
                  </span>
                </td>
                <td className="p-3">
                  {u.activo ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-300" strokeWidth={1.75} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
