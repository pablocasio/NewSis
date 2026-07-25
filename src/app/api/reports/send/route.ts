import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { puede } from "@/lib/permissions";
import { generarYEnviarReporteDiario } from "@/../scripts/dailyReport";

// Permite disparar el reporte manualmente desde el panel de Admin.
export async function POST() {
  const session = await getServerSession(authOptions);
  const rol = (session?.user as any)?.rol;
  if (!session || !puede(rol, "verReportes")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const resultado = await generarYEnviarReporteDiario();
  return NextResponse.json(resultado);
}
