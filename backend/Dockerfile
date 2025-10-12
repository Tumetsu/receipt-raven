# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for both backend and frontend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci

# Copy source code for both applications
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# Build frontend first
WORKDIR /app/frontend
RUN npm run build

# Build backend and copy frontend assets
WORKDIR /app/backend
RUN npm run build
RUN mkdir -p dist/public && cp -r ../frontend/dist/* ./dist/public/

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files from backend
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage (includes frontend in dist/public)
COPY --from=builder /app/backend/dist ./dist

# Create directories for persistent data
RUN mkdir -p /app/data /app/uploads && \
    chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose the application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
