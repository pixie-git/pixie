# Development Stage (for hot-reload with volume mounts)
FROM node:22-alpine AS dev-stage

WORKDIR /app

COPY package*.json ./
RUN npm install && npm rebuild

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Build Stage
FROM dev-stage AS build

ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Production Stage
FROM nginx:alpine AS production-stage

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
