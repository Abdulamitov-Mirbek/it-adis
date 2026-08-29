# syntax=docker/dockerfile:1

# ── deps ──────────────────────────────────────────────────────────────────────
# Separated from the build so a source-only change reuses the cached npm ci
# layer, which is by far the slowest step on a t4g.small.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── build ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── runtime ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# No openssl package, no `prisma generate`, no copied query engine and no
# `prisma` directory in the runtime stage. All four existed to support Prisma's
# native query engine, which was architecture-specific and had to be generated
# inside the image to match. The API now reaches Supabase over HTTPS, so the
# image is plain JavaScript and portable between amd64 and arm64 unchanged.

# node:alpine ships an unprivileged `node` user. Running as root inside a
# container that is reachable from the reverse proxy buys nothing and costs a
# lot if the process is ever compromised.
USER node

EXPOSE 3001
CMD ["node", "dist/main"]
