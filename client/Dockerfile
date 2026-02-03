# Active LTS 2026
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force
RUN npm install

COPY . .

EXPOSE 5173

# Fondamentale: --host permette al browser del tuo PC di vedere Vite dentro Docker
CMD ["npm", "run", "dev", "--", "--host"]
