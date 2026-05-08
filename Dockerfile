FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9.14.4
WORKDIR /usr/app

FROM base AS deps
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /usr/app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner

WORKDIR /usr/app
ENV NODE_ENV=production

COPY --from=build --chown=node:node /usr/app/dist ./dist
COPY --from=build --chown=node:node /usr/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/app/package.json ./package.json

USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]
