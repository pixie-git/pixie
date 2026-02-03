# Build Stage
FROM node:24-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Default API URL to empty (relative path) for same-domain proxying in PROD
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Production Stage
FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
