import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permissions";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol;
  if (!session || !puede(rol, "gestionarUsuarios")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const usuarios = await prisma.user.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol;
  if (!session || !puede(rol, "gestionarUsuarios")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { nombre, email, password, rol: nuevoRol } = await req.json();
  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await prisma.user.create({
    data: { nombre, email, passwordHash, rol: nuevoRol },
  });
  return NextResponse.json(usuario, { status: 201 });
}
