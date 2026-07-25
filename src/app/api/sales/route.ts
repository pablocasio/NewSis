import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ventaSchema = z.object({
  shiftId: z.string(),
  metodoPago: z.enum(["EFECTIVO", "YAPE", "TARJETA", "MIXTO"]),
  yapeCodigo: z.string().optional(),
  yapeCapturaUrl: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        cantidad: z.number().int().positive(),
        precioUnitario: z.number().positive(),
        descuento: z.number().nonnegative().default(0),
      })
    )
    .min(1),
});

// Registra una venta completa (items + descuenta stock) en una transacción.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json();
  const parsed = ventaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { shiftId, metodoPago, yapeCodigo, yapeCapturaUrl, items } = parsed.data;

  if (metodoPago === "YAPE" && !yapeCodigo) {
    return NextResponse.json(
      { error: "Debes registrar el código de operación de Yape" },
      { status: 400 }
    );
  }

  const total = items.reduce(
    (acc, it) => acc + it.cantidad * it.precioUnitario - it.descuento,
    0
  );

  const venta = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        userId,
        shiftId,
        total,
        metodoPago,
        yapeCodigo,
        yapeCapturaUrl,
        items: {
          create: items.map((it) => ({
            productId: it.productId,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            descuento: it.descuento,
          })),
        },
      },
      include: { items: true },
    });

    for (const it of items) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.cantidad } },
      });
      await tx.stockMove.create({
        data: {
          productId: it.productId,
          tipo: "SALIDA",
          cantidad: it.cantidad,
          userId,
          motivo: `Venta ${sale.id}`,
        },
      });
    }

    return sale;
  });

  return NextResponse.json(venta, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ventas = await prisma.sale.findMany({
    include: { items: { include: { product: true } }, user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(ventas);
}
