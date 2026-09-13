# Build context is the repository root, not backend/ — the API depends on the shared
# workspace and on the root lockfile, and neither is reachable from inside backend/.
#
#   docker build -f backend/Dockerfile -t rokdajob-api .

# ---------------------------------------------------------------------- build
FROM node:22-alpine AS build
WORKDIR /repo

# Manifests first, so a source-only change reuses the cached install layer.
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/

# Only the two workspaces the API needs. Installing the whole repo would drag in Next.js
# and the admin panel for an image that never runs either.
RUN npm ci --workspace @rokdajob/shared --workspace @rokdajob/backend --include-workspace-root

COPY shared/ shared/
COPY backend/ backend/

RUN npm run build --workspace @rokdajob/shared \
 && npm run build --workspace @rokdajob/backend

# -------------------------------------------------------------------- runtime
FROM node:22-alpine AS runtime
WORKDIR /repo

ENV NODE_ENV=production
ENV PORT=5000

# A second install rather than copying node_modules from the build stage: this one omits
# dev dependencies, which is most of the weight.
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
RUN npm ci --omit=dev \
      --workspace @rokdajob/shared \
      --workspace @rokdajob/backend \
      --include-workspace-root \
 && npm cache clean --force

COPY --from=build /repo/shared/dist shared/dist
COPY --from=build /repo/backend/dist backend/dist

# The base image ships an unprivileged `node` user; nothing here needs root.
USER node

EXPOSE 5000

# The platform's own health check should point at this too.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/dist/server.js"]
