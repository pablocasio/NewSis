"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Clock,
  BarChart3,
  Users,
  Store,
  LogOut,
} from "lucide-react";
import AttendanceTimer from "./AttendanceTimer";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/pos", label: "Venta", Icon: ShoppingCart },
  { href: "/inventory", label: "Inventario", Icon: Package },
  { href: "/shifts", label: "Turnos", Icon: Clock },
];

const LINKS_ADMIN = [
  { href: "/reports", label: "Reportes", Icon: BarChart3 },
  { href: "/users", label: "Usuarios", Icon: Users },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const rol = (session?.user as any)?.rol;
  const links = rol === "ADMIN" ? [...LINKS, ...LINKS_ADMIN] : LINKS;

  return (
    <>
      {/* Barra superior */}
      <nav className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-y-2 gap-x-3 bg-slate-900 px-4 py-3 shadow-md md:px-6">
        <div className="flex flex-shrink-0 items-center gap-2">
          <Store className="h-5 w-5 text-indigo-300" strokeWidth={1.75} />
          <span className="hidden font-semibold text-white sm:inline">POS Abarrotes</span>
        </div>

        {/* Enlaces: solo en pantallas medianas o más grandes */}
        <div className="hidden flex-1 flex-wrap gap-1 md:flex">
          {links.map(({ href, label, Icon }) => {
            const activo = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activo ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <AttendanceTimer />
          <div className="hidden text-right text-xs leading-tight text-slate-300 sm:block">
            <p className="font-semibold text-white">{session?.user?.name}</p>
            <p className="uppercase tracking-wide">{rol}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1 rounded-md bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-red-600 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </nav>

      {/* Barra de navegación inferior tipo app, solo en móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden">
        {links.map(({ href, label, Icon }) => {
          const activo = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                activo ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
