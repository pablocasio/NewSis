import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permissions";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol;
  if (!session || !puede(rol, "editarStock")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const producto = await prisma.product.update({ where: { id: params.id }, data: body });
  return NextResponse.json(producto);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol;
  if (!session || !puede(rol, "eliminarProducto")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.product.update({ where: { id: params.id }, data: { activo: false } });
  return NextResponse.json({ ok: true });
}
