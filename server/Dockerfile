# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
RUN npm prune --production

# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies required by better-sqlite3
RUN apk add --no-cache libstdc++

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Ensure data directory exists
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["npm", "start"]
