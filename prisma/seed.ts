import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const workerPass = await bcrypt.hash("trabajador123", 10);

  await prisma.user.upsert({
    where: { email: "admin@negocio.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@negocio.com",
      passwordHash: adminPass,
      rol: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "cajero@negocio.com" },
    update: {},
    create: {
      nombre: "Cajero",
      email: "cajero@negocio.com",
      passwordHash: workerPass,
      rol: "TRABAJADOR",
    },
  });

  const abarrotes = await prisma.category.upsert({
    where: { nombre: "Abarrotes" },
    update: {},
    create: { nombre: "Abarrotes" },
  });

  await prisma.product.upsert({
    where: { barcode: "7750182001019" },
    update: {},
    create: {
      nombre: "Arroz Costeño 1kg",
      barcode: "7750182001019",
      precioVenta: 4.5,
      costo: 3.2,
      stock: 40,
      stockMinimo: 10,
      categoryId: abarrotes.id,
    },
  });

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      nombreNegocio: "Mi Abarrotes",
      correoReportes: process.env.REPORT_EMAIL_TO,
      umbralStockBajo: 5,
    },
  });

  console.log("Seed completo. Usuarios: admin@negocio.com / admin123, cajero@negocio.com / trabajador123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
