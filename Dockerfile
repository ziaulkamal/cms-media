# syntax=docker/dockerfile:1.7
###############################################################################
# CMS — cms-media (NestJS / Node 20 / Prisma / PostgreSQL)
# Multi-stage:
#   deps      : seluruh dependency (untuk build)
#   build     : prisma generate + nest build  (juga dipakai service migrasi)
#   prod-deps : node_modules produksi saja (ramping)
#   runtime   : image akhir non-root + tini
###############################################################################

FROM node:20-alpine AS deps
WORKDIR /app
# Prisma butuh libssl/openssl untuk schema engine-nya. node:20-alpine tidak
# menyertakannya, sehingga `prisma migrate deploy` gagal dengan:
#   "Prisma failed to detect the libssl/openssl version"
#   "Could not parse schema engine response: ... Error load..."
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Punya prisma CLI → dipakai juga oleh service "cms-migrate" (prisma migrate deploy)
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

FROM deps AS prod-deps
RUN npm prune --omit=dev

# ---- Runtime ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# tini = reaping sinyal yang benar (shutdown bersih, tak ada zombie process)
RUN apk add --no-cache tini wget openssl

COPY --from=prod-deps /app/node_modules ./node_modules
# Prisma client hasil generate (engine + tipe) ditimpa ke node_modules produksi
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint \
 && mkdir -p storage/uploads \
 && chown -R node:node /app
USER node

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/v1/health >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini", "--", "entrypoint"]
CMD ["node", "dist/main"]
