# Multi-stage Dockerfile for Gendash (Frontend + Backend)

# Stage 1: Build Next.js frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY gendash-frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY gendash-frontend/ ./

# Build the Next.js app
RUN npm run build

# Stage 2: Setup Python backend
FROM python:3.12-slim AS backend-setup

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY gendash-engine/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY gendash-engine/ ./

# Stage 3: Final runtime image
FROM python:3.12-slim

WORKDIR /app

# Install Node.js for running Next.js in production
RUN apt-get update && apt-get install -y \
    curl \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from backend-setup stage
COPY --from=backend-setup /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-setup /usr/local/bin /usr/local/bin

# Copy backend application
COPY --from=backend-setup /app/backend /app/backend

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/package*.json /app/frontend/
COPY --from=frontend-builder /app/frontend/node_modules /app/frontend/node_modules

# Copy Next.js config files
COPY gendash-frontend/next.config.ts /app/frontend/
COPY gendash-frontend/tsconfig.json /app/frontend/

# Create supervisor config to run both services
RUN mkdir -p /var/log/supervisor

COPY <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:backend]
command=python -m gunicorn -w 4 -b 0.0.0.0:5000 app:app
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log

[program:frontend]
command=npm start
directory=/app/frontend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/frontend.err.log
stdout_logfile=/var/log/supervisor/frontend.out.log
environment=PORT=3000
EOF

# Expose ports
EXPOSE 3000 5000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start supervisor to manage both processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
