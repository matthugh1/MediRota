FROM node:20-slim
WORKDIR /app

# Install OpenSSL and other required packages for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json* backend/pnpm-lock.yaml* backend/yarn.lock* ./
RUN npm ci || yarn install || pnpm install

COPY backend/tsconfig*.json ./
COPY backend/src ./src
COPY backend/prisma ./prisma

RUN npm run prisma:generate && npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "run", "start"]

