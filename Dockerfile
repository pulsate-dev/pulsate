# Stage 1: Base with pnpm
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# Stage 2: Install dependencies
FROM base AS prod-deps
# Use --ignore-scripts to skip postinstall scripts (lefthook is a dev dependency)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# Stage 3: Build the application
FROM base AS build
COPY . .
COPY --from=prod-deps /app/node_modules ./node_modules
# Use --ignore-scripts to skip postinstall scripts
RUN pnpm run prepare && pnpm run build

# Stage 4: Final slim image
FROM node:22-slim
WORKDIR /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/prisma /app/prisma

EXPOSE 3000

ENV NODE_ENV=production
CMD [ "node", "--enable-source-maps", "./build/main.js" ]
