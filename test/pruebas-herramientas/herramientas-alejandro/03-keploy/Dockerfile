# Backend de FuBanking + Keploy en el mismo contenedor (Linux).
# En Windows el binario nativo de Keploy lo bloquea el antivirus; aquí se usa el
# binario de la imagen oficial ghcr.io/keploy/keploy en modo nativo (eBPF), y
# el backend corre como proceso hijo de `keploy record` / `keploy test`.
# Contexto de build: la raíz del repo.
FROM ghcr.io/keploy/keploy:latest AS keploy

FROM node:22-bookworm
COPY --from=keploy /app/keploy /usr/local/bin/keploy

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build && npm prune --omit=dev

WORKDIR /keploy-data
EXPOSE 3001
