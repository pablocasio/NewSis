# Sistema de Venta General — Arquitectura

Sistema de punto de venta (POS) para negocios pequeños/medianos tipo abarrotes: inventario con código de barras, ventas, pago con Yape (registro manual), roles admin/trabajador, reportes por email, turnos de trabajo. Diseñado para ser ligero, desplegable en servidor propio o en la nube, con una sola base de código para frontend y backend.

## 1. Stack tecnológico

| Capa | Tecnología | Motivo |
|---|---|---|
| Full-stack | Next.js 14 (App Router) | Frontend + backend (Route Handlers) en un solo proyecto y un solo deploy |
| Lenguaje | TypeScript | Tipado end-to-end, menos bugs |
| Base de datos | PostgreSQL | Robusta, gratuita, soportada en cualquier proveedor cloud o servidor propio |
| ORM | Prisma | Migraciones versionadas, tipado automático desde el esquema |
| Auth | NextAuth (Credentials + JWT en cookie httpOnly) | Roles admin/trabajador, sesiones seguras, sin servicio externo |
| UI | Tailwind CSS + shadcn/ui | Ligero, sin dependencias pesadas |
| Email | Nodemailer (SMTP: Gmail/cualquier proveedor) | Reportes y alertas al correo del negocio |
| Tareas programadas | node-cron (self-host) o Vercel Cron (cloud) | Reportes diarios/semanales automáticos |
| Contenedores | Docker + docker-compose | Igual despliegue en servidor propio o en la nube |

Una sola base de código sirve para ambos escenarios de despliegue (self-host o cloud), cambiando solo variables de entorno.

## 2. Módulos

### 2.1 Autenticación y roles
- Login con usuario/contraseña (contraseñas con hash bcrypt).
- Dos roles: `ADMIN` y `TRABAJADOR`.
- Admin: acceso total (usuarios, precios de costo, reportes, eliminar productos/ventas, configuración).
- Trabajador: solo POS/ventas, consulta de stock (sin costos ni utilidades), su propio turno/asistencia. No puede eliminar registros ni ver reportes financieros.
- Middleware de Next.js protege rutas por rol en cada request.

### 2.2 Almacén / Inventario
- Productos: nombre, código de barras (EAN/UPC), precio de venta, costo, stock actual, stock mínimo, categoría, proveedor, unidad de medida.
- Registro y edición vía formulario o escaneo directo de código de barras (lector USB funciona como teclado, o cámara del celular/tablet con `BarcodeDetector`/librería `zxing`).
- Movimientos de stock: entradas (compras), salidas (ventas), ajustes/mermas — todos con historial y usuario responsable.
- Alertas automáticas de stock bajo (por email y en dashboard).
- Categorías y proveedores como catálogos independientes.

### 2.3 Ventas / POS
- Pantalla de venta: escaneo de código de barras agrega producto al carrito automáticamente.
- Métodos de pago: Efectivo, Yape (registro manual: monto + código de operación/número de celular + captura opcional de pantalla), Tarjeta, Mixto.
- Cálculo automático de vuelto, descuentos por línea o por venta.
- Emisión de comprobante (boleta simple, imprimible o descargable en PDF).
- Historial de ventas con filtro por fecha, cajero, método de pago.
- Anulación de venta solo permitida a Admin (con motivo registrado).

### 2.4 Búsqueda
- Barra de búsqueda global (atajo de teclado) para productos por nombre, código de barras o categoría, con resultados instantáneos (debounce + índice en Postgres).
- Búsqueda también dentro de historial de ventas y clientes (si se habilita módulo de clientes a futuro).

### 2.5 Turnos de trabajo
- Apertura/cierre de caja por turno: monto inicial, monto final, ventas totales del turno, diferencia (cuadre de caja).
- Registro de asistencia: marcar entrada/salida de cada trabajador, con reporte de horas trabajadas por Admin.
- Un trabajador no puede vender sin un turno de caja abierto.

### 2.6 Reportes y notificaciones por email
- Reporte diario/semanal automático al correo del administrador: ventas totales, productos más vendidos, productos con stock bajo, cuadre de caja por turno.
- Alertas inmediatas por email cuando un producto llega a stock mínimo.
- Reportes también descargables en PDF/Excel desde el panel.

### 2.7 Panel de administración
- Gestión de usuarios y roles.
- Configuración del negocio (nombre, logo, moneda, correo de reportes, umbral de stock bajo).
- Vista de auditoría: quién hizo qué y cuándo (ventas anuladas, ajustes de stock, cambios de precio).

## 3. Modelo de datos (resumen)

```
User        (id, nombre, email, passwordHash, rol[ADMIN|TRABAJADOR], activo)
Category    (id, nombre)
Supplier    (id, nombre, contacto)
Product     (id, nombre, barcode, precioVenta, costo, stock, stockMinimo, categoryId, supplierId, unidad)
StockMove   (id, productId, tipo[ENTRADA|SALIDA|AJUSTE], cantidad, userId, motivo, createdAt)
Sale        (id, userId, shiftId, total, metodoPago, yapeCodigo?, anulada, motivoAnulacion?, createdAt)
SaleItem    (id, saleId, productId, cantidad, precioUnitario, descuento)
Shift       (id, userId, montoApertura, montoCierre?, abiertoEn, cerradoEn?)
Attendance  (id, userId, entrada, salida)
ReportLog   (id, tipo, enviadoA, enviadoEn, resumenJson)
Settings    (id, nombreNegocio, correoReportes, umbralStockBajo, moneda)
```

Relaciones clave: `Product 1—N StockMove`, `Sale 1—N SaleItem`, `User 1—N Sale`, `User 1—N Shift`, `Shift 1—N Sale`.

## 4. Matriz de permisos

| Acción | Admin | Trabajador |
|---|---|---|
| Registrar venta | ✅ | ✅ |
| Ver precio de costo / utilidad | ✅ | ❌ |
| Anular venta | ✅ | ❌ |
| Crear/editar/eliminar productos | ✅ | Solo crear/editar stock (no eliminar) |
| Ver reportes financieros | ✅ | ❌ |
| Abrir/cerrar su propio turno | ✅ | ✅ |
| Ver turnos de otros usuarios | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ |
| Configuración del negocio | ✅ | ❌ |

## 5. Integración de pago Yape

Yape no ofrece una API pública abierta para negocios pequeños sin convenio bancario (Yape Empresas / Interbank). Por eso el flujo es de **registro manual verificado**:
1. Cliente paga por Yape al número del negocio.
2. Cajero ingresa en el sistema: monto, últimos dígitos del código de operación, y opcionalmente adjunta captura de pantalla del pago.
3. La venta queda marcada como `metodoPago: YAPE` con ese respaldo, auditable por el Admin.
4. Si en el futuro se obtiene convenio con Yape Empresas/Interbank, se puede añadir un webhook de confirmación sin cambiar el resto del sistema.

## 6. Despliegue

Misma base de código para ambos entornos:

**Servidor propio:**
```
docker-compose up -d
```
Incluye contenedor de la app Next.js, Postgres y un contenedor liviano para tareas programadas (reportes).

**Nube:**
- Vercel (app) + Neon/Supabase (Postgres gestionado) — cero mantenimiento de servidores.
- O el mismo `docker-compose` en cualquier VPS (DigitalOcean, AWS Lightsail, Hetzner).

Variables de entorno (`.env`) controlan conexión a base de datos, credenciales SMTP y secretos de sesión — no hay diferencias de código entre entornos.

## 7. Seguridad
- Contraseñas con bcrypt, nunca en texto plano.
- Sesiones JWT en cookies httpOnly + secure.
- Validación de entrada en cada endpoint (zod).
- Rate limiting básico en login.
- Registro de auditoría para acciones sensibles (anulaciones, eliminaciones, cambios de precio).

## 8. Roadmap futuro (no incluido en el scaffold inicial)
- Multi-sucursal.
- Clientes con historial de compras y crédito/fiado.
- Integración real con Yape Empresas si se consigue convenio.
- App móvil nativa para el cajero.
- Reportes con IA (predicción de demanda, reposición automática de stock).
