FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PROCESSED_DATA_PATH=data/processed/restaurants.parquet

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src
COPY scripts ./scripts
COPY data/processed ./data/processed

EXPOSE 8000

CMD ["sh", "-c", "python scripts/ensure_data.py && uvicorn src.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
