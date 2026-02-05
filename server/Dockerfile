# Development Stage (for hot-reload with volume mounts)
FROM node:22-alpine AS dev-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build Stage
FROM dev-stage AS build
RUN npm run build

# Production Stage
FROM node:22-alpine AS production-stage

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/pixie-api.yaml ./

EXPOSE 3000
CMD ["npm", "start"]
