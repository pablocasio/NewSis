import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permissions";

// POST: suma (o resta) stock a un producto existente y deja registro en StockMove.
// body: { cantidad: number, motivo?: string }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol;
  if (!session || !puede(rol, "editarStock")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const userId = (session!.user as any).id;
  const { cantidad, motivo } = await req.json();

  if (!cantidad || typeof cantidad !== "number" || cantidad === 0) {
    return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
  }

  const producto = await prisma.$transaction(async (tx) => {
    const actualizado = await tx.product.update({
      where: { id: params.id },
      data: { stock: { increment: cantidad } },
    });
    await tx.stockMove.create({
      data: {
        productId: params.id,
        tipo: cantidad > 0 ? "ENTRADA" : "AJUSTE",
        cantidad: Math.abs(cantidad),
        userId,
        motivo: motivo || "Ingreso desde escaneo de inventario",
      },
    });
    return actualizado;
  });

  return NextResponse.json(producto);
}
