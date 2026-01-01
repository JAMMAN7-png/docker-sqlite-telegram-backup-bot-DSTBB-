FROM oven/bun:1.0.21-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN bun install --production

# Copy source code
COPY src ./src

# Create data directory for database
RUN mkdir -p /data

# Run the bot
CMD ["bun", "run", "src/index.ts"]
