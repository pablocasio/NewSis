import cron from "node-cron";
import { prisma } from "@/lib/prisma";

/**
 * Neon (y otros Postgres "serverless") suspenden el cómputo tras unos
 * minutos sin actividad; la primera consulta después de eso tarda varios
 * segundos en "despertar". Este script hace un ping liviano cada 4 minutos
 * en horario de atención para que la base de datos nunca llegue a dormirse
 * mientras el negocio está abierto, y así las búsquedas se sientan rápidas.
 *
 * Ajusta HORA_INICIO / HORA_FIN a tu horario real de atención.
 */
const HORA_INICIO = 7; // 7am
const HORA_FIN = 22; // 10pm

async function ping() {
  const hora = new Date().getHours();
  if (hora < HORA_INICIO || hora >= HORA_FIN) return;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.error("keep-alive falló:", e);
  }
}

if (require.main === module) {
  // Ejecuta un ping inmediato y luego cada 4 minutos.
  ping();
  cron.schedule("*/4 * * * *", ping);
  console.log("Keep-alive de base de datos activo (cada 4 min, horario de atención).");
}

export { ping };
