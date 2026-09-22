# Production runtime stage
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Ensure data directory exists
RUN mkdir -p /app/data

EXPOSE 5000

CMD ["npm", "start"]
