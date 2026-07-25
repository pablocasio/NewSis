# Sistema de Venta General (POS Abarrotes)

Scaffold funcional de un sistema de punto de venta para negocios pequeños/medianos: inventario con código de barras, ventas con pago Yape manual, roles admin/trabajador, turnos de caja y reportes por email. Ver `ARCHITECTURE.md` (carpeta raíz de la entrega) para el detalle completo de arquitectura.

## Requisitos
- Node.js 20+
- PostgreSQL (o Docker)

## Desarrollo local

```bash
cp .env.example .env      # edita credenciales SMTP y base de datos
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Abre http://localhost:3000 — usuarios de prueba creados por el seed:
- Admin: `admin@negocio.com` / `admin123`
- Trabajador: `cajero@negocio.com` / `trabajador123`

## Despliegue con Docker (servidor propio o cualquier VPS/nube)

```bash
cp .env.example .env      # edita valores reales
docker compose up -d --build
```

Esto levanta Postgres, la app Next.js (con migraciones automáticas) y un contenedor liviano que envía el reporte diario por correo.

## Despliegue en la nube sin servidor propio

- Sube el repo a GitHub y conéctalo a Vercel (build automático de Next.js).
- Usa una base de datos gestionada (Neon, Supabase, Railway Postgres) y pon su `DATABASE_URL` en las variables de entorno de Vercel.
- Configura un Vercel Cron Job apuntando a `/api/reports/send` (o similar) para el reporte diario, en vez del contenedor `cron` de docker-compose.

## Estructura

```
prisma/schema.prisma      Modelo de datos completo
src/lib/                  Prisma client, auth (NextAuth), mailer, permisos por rol
src/middleware.ts         Protección de rutas por rol (admin vs trabajador)
src/app/(dashboard)/      Páginas: dashboard, pos, inventory, shifts, reports, users
src/app/api/              Endpoints: products, search, sales, shifts, reports, users, auth
scripts/dailyReport.ts    Genera y envía el reporte diario por email
```

## Notas sobre Yape

Yape no tiene API pública abierta para negocios pequeños sin convenio bancario. El pago se registra manualmente: el cajero anota el código de operación al cobrar (ver pantalla de Venta). Si en el futuro consigues un convenio con Yape Empresas/Interbank, se puede añadir un webhook sin tocar el resto del sistema (queda documentado en `ARCHITECTURE.md`).

## Próximos pasos sugeridos
- Ejecutar `npm run lint` y añadir tests antes de producción.
- Generar PDF/Excel de reportes (actualmente solo HTML por correo).
- Añadir impresión de boleta (térmica) y lectura de código de barras vía cámara para tablets sin lector USB.
