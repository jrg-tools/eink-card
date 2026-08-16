# Build stage
FROM node:26.7-slim AS builder

WORKDIR /app

# Set CI environment for pnpm
ENV CI=true

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the SvelteKit app
RUN pnpm build

# Production stage
FROM node:26.7-slim

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built app from builder stage
COPY --from=builder /app/build ./build

# Start the application
CMD ["node", "build"]
