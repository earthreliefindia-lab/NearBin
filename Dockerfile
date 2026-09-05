# Production Dockerfile for NearBin Backend API
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY server ./server

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "server/index.js"]
