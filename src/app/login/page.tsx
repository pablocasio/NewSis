"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setCargando(false);
    if (res?.error) {
      setError("Credenciales inválidas");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      {/* formas decorativas sutiles, sin exceso de color */}
      <div className="animate-float-slow pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="animate-float-slow-reverse pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-slate-500/20 blur-3xl" />

      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
            <Store className="h-6 w-6 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Sistema de Venta General</h1>
            <p className="text-sm text-gray-400">Ingresa con tus credenciales para continuar</p>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Correo
            </label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="tucorreo@negocio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Contraseña
            </label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          disabled={cargando}
          className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
          type="submit"
        >
          {cargando ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
