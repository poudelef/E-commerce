FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="mysql://root:build@127.0.0.1:3306/laxmi_kirana"
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "docker-entrypoint.mjs"]
