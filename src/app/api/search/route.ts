import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const rol = (session.user as any).rol;

  if (!q) return NextResponse.json([]);

  // Si es solo dígitos (típico de un código de barras) usamos `startsWith`,
  // que sí puede aprovechar el índice de la columna. `contains` (LIKE %x%)
  // no usa índice y se vuelve más lento a medida que crece el catálogo.
  const esNumerico = /^\d+$/.test(q);

  const productos = await prisma.product.findMany({
    where: {
      activo: true,
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        esNumerico ? { barcode: { startsWith: q } } : { barcode: { contains: q } },
      ],
    },
    take: 20,
    orderBy: { nombre: "asc" },
  });

  // El trabajador no ve costo/utilidad, solo precio de venta y stock
  const data = productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    barcode: p.barcode,
    precioVenta: p.precioVenta,
    stock: p.stock,
    imagenUrl: p.imagenUrl,
    ...(rol === "ADMIN" ? { costo: p.costo } : {}),
  }));

  return NextResponse.json(data);
}
