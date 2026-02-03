# Build Stage
FROM node:24-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Production Stage
FROM node:24-alpine AS production-stage

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build-stage /app/dist ./dist
# We also need these for Swagger/OpenAPI if they are read at runtime
COPY --from=build-stage /app/pixie-api.yaml ./

EXPOSE 3000

CMD ["npm", "start"]
