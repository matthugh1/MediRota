FROM node:20-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN npm ci || yarn install || pnpm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

