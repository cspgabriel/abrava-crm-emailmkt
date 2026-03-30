FROM node:18-slim

WORKDIR /usr/src/app

# Install dependencies first for better caching
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy source
COPY . ./

ENV PORT=8788

EXPOSE 8788

CMD ["node", "server.js"]
