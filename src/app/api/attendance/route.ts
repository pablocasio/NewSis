import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: asistencia abierta del usuario actual
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const abierta = await prisma.attendance.findFirst({
    where: { userId, salida: null },
    orderBy: { entrada: "desc" },
  });
  return NextResponse.json(abierta);
}

// POST: marcar entrada
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const yaAbierta = await prisma.attendance.findFirst({ where: { userId, salida: null } });
  if (yaAbierta) return NextResponse.json(yaAbierta);

  const asistencia = await prisma.attendance.create({ data: { userId } });
  return NextResponse.json(asistencia, { status: 201 });
}

// PATCH: marcar salida { attendanceId }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { attendanceId } = await req.json();
  const asistencia = await prisma.attendance.update({
    where: { id: attendanceId },
    data: { salida: new Date() },
  });
  return NextResponse.json(asistencia);
}
