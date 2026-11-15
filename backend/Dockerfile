FROM node:20-alpine
ARG SERVICE
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
ENV SERVICE=${SERVICE}
EXPOSE 3001-3005
CMD ["sh", "-c", "node dist/services/${SERVICE}/main.js"]
