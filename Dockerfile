# Production Dockerfile for NearBin Backend API
FROM node:20-alpine

WORKDIR /app

# Install lightweight backend dependencies (express, cors)
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy server code and persistent JSON data
COPY server ./

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "index.js"]
