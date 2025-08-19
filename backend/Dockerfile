FROM node:20-slim
WORKDIR /app

# Install OpenSSL and other required packages for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || yarn install || pnpm install

COPY tsconfig*.json ./
COPY src ./src
COPY prisma ./prisma

RUN npm run prisma:generate && npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "run", "start"]

