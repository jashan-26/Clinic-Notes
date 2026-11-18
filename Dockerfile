# Production Multi-Stage Dockerfile for ClinicNotes
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build frontend
COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --omit=dev

# Copy server and built static frontend assets
COPY server/ ./server/
COPY eval/ ./eval/
COPY --from=build /app/dist ./dist

EXPOSE 5000

CMD ["node", "server/server.js"]
