# ===========================================================================
# DiffWeave — Hugging Face Space Dockerfile (Multi-stage Build)
# ===========================================================================

# Stage 1: Build React 18 Studio Frontend
FROM node:18-bullseye-slim AS frontend-builder
WORKDIR /app/studio
COPY studio/package*.json ./
RUN npm ci
COPY studio ./
RUN npm run build

# Stage 2: Production Python Runtime
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy DiffWeave application package
COPY diffweave ./diffweave
COPY sample_test_docs ./sample_test_docs
COPY README.md ./
COPY pyproject.toml ./

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/studio/dist ./studio/dist

# Set up non-root user (Hugging Face Spaces requirement: UID 1000)
RUN useradd -m -u 1000 user
RUN chown -R user:user /app
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONPATH=/app \
    PORT=7860 \
    HOST=0.0.0.0

EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:7860/healthz || exit 1

# Launch FastAPI Bridge (Serves Studio Web UI + MCP APIs on port 7860)
CMD ["uvicorn", "diffweave.bridge.app:app", "--host", "0.0.0.0", "--port", "7860"]
