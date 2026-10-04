# syntax=docker/dockerfile:1

FROM node:25-bookworm-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370 AS node-runtime
FROM postgres:18-bookworm@sha256:3725f4e2499eef5134592b3b4ab79a543ed7f8e533b05b5b637af926630f6650 AS postgres-runtime
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 1000 node && useradd --uid 1000 --gid node --create-home node \
    && ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm

FROM node-runtime AS dependencies
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm_config_build_from_source=true npm ci

FROM postgres-runtime AS development
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
ENV APP_ENV=development \
    NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY . .
RUN printf '%s-source-v1\n' "$(sha256sum package-lock.json | cut -d ' ' -f 1)" > node_modules/.sponsorenlauf-lock-hash
EXPOSE 3000
CMD ["sh", "scripts/start-development-container.sh"]

FROM node-runtime AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node-runtime AS production-dependencies
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm_config_build_from_source=true npm ci --omit=dev \
    && npm cache clean --force

FROM postgres-runtime AS runner
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
COPY --chown=node:node scripts ./scripts

RUN mkdir -p /data/backups && chown -R node:node /data

USER node
VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/setupStatus').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["./scripts/start-container.sh"]
