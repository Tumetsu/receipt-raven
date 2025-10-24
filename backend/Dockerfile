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

# Build frontend first (or use pre-built if exists)
WORKDIR /app/frontend
# Check if frontend/dist exists (pre-built locally), otherwise build it
RUN if [ ! -d "dist" ]; then \
      echo "Building frontend in Docker..." && \
      NODE_OPTIONS="--max-old-space-size=4096" npm run build; \
    else \
      echo "Using pre-built frontend from local machine"; \
    fi

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

# Copy .config directory for kysely migrations
COPY --from=builder /app/backend/.config ./.config

# Copy migrations folder
COPY --from=builder /app/backend/migrations ./migrations

# Copy and set up entrypoint script
COPY backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

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

# Start the application (runs migrations first via entrypoint)
CMD ["./entrypoint.sh"]
