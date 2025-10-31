# ---- build
FROM node:20-slim AS build
WORKDIR /app
# install deps (adjust if you use pnpm/yarn)
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
RUN npm install --no-audit --no-fund
# copy source & build
COPY . .
RUN npm run build

# ---- runtime
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0
# bring in Next standalone output (+ public + static)
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 8080
CMD ["node", "server.js"]
