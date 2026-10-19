# Study Bible: web app + optional account/sync server (Node 22+, no native dependencies).
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8787 HOST=0.0.0.0 DB_PATH=/data/studybible.sqlite STATIC_DIR=/app/dist
COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force
COPY server ./server
COPY tsconfig.json ./
COPY --from=build /app/dist ./dist
VOLUME /data
EXPOSE 8787
# Put an HTTPS reverse proxy in front and set COOKIE_SECURE=true.
CMD ["npx", "tsx", "server/index.ts"]
