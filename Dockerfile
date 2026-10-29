# Multi-stage Dockerfile for @charan-interiors/backend
# Stage 1: Build
FROM node:24-trixie-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy root workspace manifests
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install dependencies deterministically
RUN npm ci

# Copy contract and backend sources
COPY packages/contracts/ packages/contracts/
COPY backend/ backend/

# Build runtime-neutral contracts before bundling the backend
WORKDIR /app
RUN npm run --workspace=@charan-interiors/contracts build

# Build backend bundle
WORKDIR /app/backend
RUN npm run build

# Stage 2: Production Runtime
FROM node:24-trixie-slim AS runner

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000
ENV OPENEDUP_CONTAINER_RUNTIME=1
ENV PATH="/opt/pdf-venv/bin:${PATH}"

# PyMuPDF publishes Linux wheels for glibc-based images, not Alpine's musl libc.
# Keep Python packages isolated from Debian's system Python environment.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl docker-cli libstdc++6 python3 python3-venv \
  && python3 -m venv /opt/pdf-venv \
  && /opt/pdf-venv/bin/python -m pip install --no-cache-dir --only-binary=:all: pymupdf pypdf \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /var/lib/openedup/skills /var/lib/openedup/sandboxes \
  && chown -R node:node /var/lib/openedup

# Copy built artifacts, both workspace dependency locations, and the contracts package.
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/contracts /app/packages/contracts
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/node_modules ./node_modules
COPY python/ /app/python/

# Run as unprivileged node user
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1

CMD ["node", "dist/server.js"]
