import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Receipt, Wallet, AlertTriangle, ShoppingCart, Clock, BarChart3 } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol;

  const totalProductos = await prisma.product.count({ where: { activo: true } });
  const productosActivos = await prisma.product.findMany({
    where: { activo: true },
    select: { stock: true, stockMinimo: true },
  });
  const stockBajo = productosActivos.filter((p) => p.stock <= p.stockMinimo).length;

  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);
  const ventasHoy = await prisma.sale.findMany({
    where: { createdAt: { gte: inicioDia }, anulada: false },
  });
  const totalHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);

  const tarjetas = [
    { label: "Productos activos", valor: totalProductos, Icon: Package, color: "bg-indigo-600" },
    { label: "Ventas de hoy", valor: ventasHoy.length, Icon: Receipt, color: "bg-emerald-600" },
    { label: "Total vendido hoy", valor: `S/ ${totalHoy.toFixed(2)}`, Icon: Wallet, color: "bg-slate-700" },
  ];
  if (rol === "ADMIN") {
    tarjetas.push({ label: "Alertas stock bajo", valor: stockBajo, Icon: AlertTriangle, color: "bg-rose-600" });
  }

  const accesos = [
    { href: "/pos", label: "Nueva venta", Icon: ShoppingCart },
    { href: "/inventory", label: "Inventario", Icon: Package },
    { href: "/shifts", label: "Mi turno", Icon: Clock },
  ];
  if (rol === "ADMIN") accesos.push({ href: "/reports", label: "Reportes", Icon: BarChart3 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Hola, {session?.user?.name}</h1>
        <p className="text-sm text-gray-500">Esto es lo que está pasando en tu negocio hoy.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${t.color}`}>
              <t.Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-500">{t.label}</p>
              <p className="text-xl font-bold text-gray-800">{t.valor}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-gray-500">Accesos rápidos</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {accesos.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-2 rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <a.Icon className="h-5 w-5 text-indigo-600" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
