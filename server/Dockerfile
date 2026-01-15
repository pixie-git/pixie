# Active LTS 2026
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

# Pulizia cache per evitare errori strani su Docker
RUN npm cache clean --force
RUN npm install

# Nodemon per hot-reload
RUN npm install -g nodemon

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
