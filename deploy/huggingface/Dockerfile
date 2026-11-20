# Backend API for a Hugging Face Docker Space (free CPU: 2 vCPU, 16 GB RAM — enough for all 5 models).
# The Space only needs this file and README.md; the code is cloned from GitHub at build time.
# To deploy a new version: Space → Settings → "Factory rebuild".
FROM python:3.12-slim

ARG REPO=https://github.com/foysalpranto121/Crop-disease-Detector-.git
ARG REF=main

RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 user

# Only the backend and the reference photos (used for disease image lists) are needed.
RUN git clone --depth 1 --branch "$REF" "$REPO" /src \
    && mkdir -p /app/frontend/public \
    && mv /src/backend /app/backend \
    && mv /src/frontend/public/diseases /app/frontend/public/diseases \
    && rm -rf /src

WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt \
    && mkdir -p data && chown -R user:user /app/backend/data

USER user
ENV PORT=7860 \
    SEED_DEMO_USERS=false \
    PYTHONUNBUFFERED=1
EXPOSE 7860

# --proxy-headers: the Space sits behind a proxy; this gives the real client IP to the rate limiter.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
