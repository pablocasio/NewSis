import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

/**
 * Genera el resumen de ventas del día + alertas de stock bajo y lo envía
 * por correo. Se puede llamar manualmente (API) o programado (node-cron /
 * Vercel Cron ejecutando `npm run cron:report`).
 */
export async function generarYEnviarReporteDiario() {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const ventasHoy = await prisma.sale.findMany({
    where: { createdAt: { gte: inicioDia }, anulada: false },
    include: { items: { include: { product: true } } },
  });

  const totalVentas = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);

  const productosStockBajo = await prisma.product.findMany({
    where: { activo: true },
  });
  const stockBajo = productosStockBajo.filter((p) => p.stock <= p.stockMinimo);

  const settings = await prisma.settings.findFirst();
  const destinatario = settings?.correoReportes || process.env.REPORT_EMAIL_TO || "";

  const html = `
    <h2>Reporte diario - ${new Date().toLocaleDateString("es-PE")}</h2>
    <p><strong>Ventas del día:</strong> ${ventasHoy.length} (S/ ${totalVentas.toFixed(2)})</p>
    <h3>Productos con stock bajo</h3>
    <ul>
      ${stockBajo.map((p) => `<li>${p.nombre}: ${p.stock} unidades (mínimo ${p.stockMinimo})</li>`).join("") || "<li>Ninguno</li>"}
    </ul>
  `;

  if (destinatario) {
    await sendMail(destinatario, `Reporte diario de ventas`, html);
  }

  await prisma.reportLog.create({
    data: {
      tipo: "DIARIO",
      enviadoA: destinatario,
      resumenJson: JSON.stringify({ totalVentas, ventas: ventasHoy.length, stockBajo: stockBajo.length }),
    },
  });

  return { totalVentas, ventas: ventasHoy.length, stockBajo: stockBajo.length };
}

// Permite ejecutar como script: `npm run cron:report`
if (require.main === module) {
  generarYEnviarReporteDiario()
    .then((r) => {
      console.log("Reporte enviado:", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
