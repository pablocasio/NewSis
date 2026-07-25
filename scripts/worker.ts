import cron from "node-cron";
import { generarYEnviarReporteDiario } from "./dailyReport";
import { ping } from "./keepAlive";

// Reporte diario de ventas por correo, a las 22:00 (hora del servidor).
cron.schedule("0 22 * * *", () => {
  generarYEnviarReporteDiario().catch((e) => console.error("Error en reporte diario:", e));
});

// Ping cada 4 minutos en horario de atención para evitar que la base de
// datos (Neon u otro Postgres serverless) se "duerma" y la primera consulta
// del día se sienta lenta.
cron.schedule("*/4 * * * *", () => {
  ping().catch((e) => console.error("Error en keep-alive:", e));
});

console.log("Worker de tareas programadas iniciado: reporte diario 22:00, keep-alive cada 4 min.");
