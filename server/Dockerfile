# Active LTS 2026
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
