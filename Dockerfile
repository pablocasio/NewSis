FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Imagen del servidor web: usa el build "standalone" de Next.js (liviano,
# solo incluye las dependencias que el servidor realmente necesita).
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "server.js"]

# Imagen para tareas programadas (reporte diario + keep-alive de la base de
# datos). No puede usar el build "standalone" porque ese solo trae lo que
# necesita el servidor Next.js: aquí sí necesitamos node_modules completo
# para correr los scripts con tsx.
FROM base AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json tsconfig.json ./
COPY scripts ./scripts
COPY src ./src

CMD ["npx", "tsx", "scripts/worker.ts"]
