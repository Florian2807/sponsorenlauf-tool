# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 AS dependencies
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm_config_build_from_source=true npm ci

FROM dependencies AS development
WORKDIR /app
ENV APP_ENV=development \
    NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY . .
RUN printf '%s-source-v1\n' "$(sha256sum package-lock.json | cut -d ' ' -f 1)" > node_modules/.sponsorenlauf-lock-hash
EXPOSE 3000
CMD ["sh", "scripts/start-development-container.sh"]

FROM node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 AS production-dependencies
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm_config_build_from_source=true npm ci --omit=dev \
    && npm cache clean --force

FROM node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 AS runner
WORKDIR /app

ARG APP_VERSION=development

ENV NODE_ENV=production \
    APP_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    SPONSORENLAUF_DATABASE_PATH=/data/database.db \
    SPONSORENLAUF_BACKUP_DIRECTORY=/data/backups \
    SPONSORENLAUF_RUNTIME=production \
    SPONSORENLAUF_VERSION=${APP_VERSION}

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/initDB.js ./initDB.js
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --chown=node:node scripts/start-container.sh ./scripts/start-container.sh
COPY --chown=node:node scripts/cli.mjs ./scripts/cli.mjs

RUN mkdir -p /data/backups && chown -R node:node /data

USER node
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/setupStatus').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["./scripts/start-container.sh"]
