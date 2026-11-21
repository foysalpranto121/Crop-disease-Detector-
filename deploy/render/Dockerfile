# API image for Render (or any Docker host). Build context = repository root:
#   docker build -f deploy/render/Dockerfile -t crop-api .
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=10000 \
    SEED_DEMO_USERS=false

RUN useradd -m -u 1000 app
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install -r backend/requirements.txt

COPY backend backend
# Reference photos: the API lists which disease photos exist
COPY frontend/public/diseases frontend/public/diseases

WORKDIR /app/backend
RUN mkdir -p data && chown -R app:app data
USER app
EXPOSE 10000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
