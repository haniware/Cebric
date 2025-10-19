# Multi-stage Dockerfile for F1 Data Application
FROM node:20-alpine AS builder

# Install system dependencies and pre-built Python packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    py3-pandas \
    py3-matplotlib \
    build-base \
    python3-dev \
    linux-headers \
    libffi-dev \
    musl-dev \
    gcc \
    g++ \
    make

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies (all, including dev deps for build)
RUN npm ci && npm cache clean --force

# Install FastF1 only (numpy/pandas already from Alpine)
RUN pip3 install --no-cache-dir --break-system-packages \
    fastf1>=3.6.1

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies with pre-built packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    py3-pandas \
    py3-matplotlib

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production Node.js dependencies only
RUN npm ci --only=production && npm cache clean --force

# Install FastF1 (lightweight)
RUN pip3 install --no-cache-dir --break-system-packages \
    fastf1>=3.6.1

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client ./client
COPY --from=builder /app/python ./python
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules

# Create symlink for python scripts
RUN ln -s /app/python /python

# Create FastF1 cache directory
RUN mkdir -p /app/fastf1_cache && chmod 777 /app/fastf1_cache

# Environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    FASTF1_CACHE_DIR=/app/fastf1_cache

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/index.js"]