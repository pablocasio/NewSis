import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: turno abierto del usuario actual (o todos si es ADMIN con ?all=1)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const rol = (session.user as any).rol;
  const all = req.nextUrl.searchParams.get("all");

  if (all && rol === "ADMIN") {
    const turnos = await prisma.shift.findMany({
      include: { user: true, sales: true },
      orderBy: { abiertoEn: "desc" },
      take: 50,
    });
    return NextResponse.json(turnos);
  }

  const turnoAbierto = await prisma.shift.findFirst({
    where: { userId, cerradoEn: null },
  });
  return NextResponse.json(turnoAbierto);
}

// POST: abrir turno { montoApertura }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const existente = await prisma.shift.findFirst({ where: { userId, cerradoEn: null } });
  if (existente) {
    return NextResponse.json({ error: "Ya tienes un turno abierto" }, { status: 400 });
  }

  const { montoApertura } = await req.json();
  const turno = await prisma.shift.create({
    data: { userId, montoApertura },
  });
  return NextResponse.json(turno, { status: 201 });
}

// PATCH: cerrar turno { turnoId, montoCierre }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { turnoId, montoCierre } = await req.json();
  const turno = await prisma.shift.update({
    where: { id: turnoId },
    data: { montoCierre, cerradoEn: new Date() },
  });
  return NextResponse.json(turno);
}
