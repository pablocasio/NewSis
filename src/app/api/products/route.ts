import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permissions";
import { z } from "zod";

// Solo `barcode` y `stock` (cantidad) son realmente obligatorios: el flujo de
// "escanear y agregar" permite crear un producto rápido con lo mínimo y
// completar el resto (nombre, precio, foto, etc.) después con "Editar".
const productoSchema = z.object({
  nombre: z.string().min(1).default("Producto sin nombre"),
  barcode: z.string().min(1),
  precioVenta: z.number().nonnegative().default(0),
  costo: z.number().nonnegative().default(0),
  stock: z.number().int().nonnegative().default(0),
  stockMinimo: z.number().int().nonnegative().default(5),
  unidad: z.string().optional(),
  imagenUrl: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const barcode = req.nextUrl.searchParams.get("barcode");

  const productos = await prisma.product.findMany({
    where: { activo: true, ...(barcode ? { barcode } : {}) },
    include: { category: true, supplier: true },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(productos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol;
  if (!session || !puede(rol, "editarStock")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = productoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const producto = await prisma.product.create({ data: parsed.data });
  return NextResponse.json(producto, { status: 201 });
}
