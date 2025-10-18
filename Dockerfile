# Multi-stage Dockerfile for F1 Data Application
# Stage 1: Build the application
FROM node:20-alpine AS builder

# Install Python and required build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    linux-headers \
    libffi-dev \
    musl-dev \
    gcc \
    g++ \
    make

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pyproject.toml ./

# Install Node.js dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Install Python dependencies
RUN pip3 install --no-cache-dir --break-system-packages -r <(grep -E "^\w+" pyproject.toml | sed 's/.*"\(.*\)".*/\1/' || echo "fastf1>=3.6.1" "numpy>=2.3.3" "pandas>=2.3.3")

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

# Install Python runtime and dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pyproject.toml ./

# Install only production Node.js dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Install Python dependencies
RUN pip3 install --no-cache-dir --break-system-packages \
    fastf1>=3.6.1 \
    numpy>=2.3.3 \
    pandas>=2.3.3

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client ./client
COPY --from=builder /app/python ./python
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server

# Create cache directory for FastF1
RUN mkdir -p /app/fastf1_cache && \
    chmod 777 /app/fastf1_cache

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV FASTF1_CACHE_DIR=/app/fastf1_cache

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["npm", "start"]
