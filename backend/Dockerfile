# syntax=docker/dockerfile:1

# ── deps ──────────────────────────────────────────────────────────────────────
# Separated from the build so a source-only change reuses the cached npm ci
# layer, which is by far the slowest step on a t4g.small.
FROM node:22-alpine AS deps
WORKDIR /app
# Prisma's query engine is dynamically linked against OpenSSL; without it the
# client throws at runtime with a misleading "unable to detect libssl" error.
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci

# ── build ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# generate before build: the Nest sources import types from @prisma/client.
#
# Running generate INSIDE the image is what makes this arch-portable. Prisma
# picks its query engine from the platform it generates on — linux-musl-openssl
# for amd64 Alpine here — so a client generated on the developer's Windows or
# macOS machine and copied in would fail at runtime. Building on the EC2 host
# means the engine always matches.
RUN npx prisma generate && npm run build

# ── runtime ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The generated client is produced by `prisma generate`, not by npm install, so
# it has to come from the builder rather than being reinstalled here.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
# Needed at runtime by `prisma migrate deploy`, which deploy.sh runs.
COPY prisma ./prisma

# node:alpine ships an unprivileged `node` user. Running as root inside a
# container that is reachable from the reverse proxy buys nothing and costs a
# lot if the process is ever compromised.
USER node

EXPOSE 3001
CMD ["node", "dist/main"]
