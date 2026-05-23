FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/data/hf-cache \
    TRANSFORMERS_CACHE=/data/hf-cache \
    SENTENCE_TRANSFORMERS_HOME=/data/hf-cache

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Ставим CPU-сборку torch отдельно — иначе sentence-transformers тянет GPU/CUDA
# колёса (~2 ГБ) даже если карты нет. На слабом ноутбуке это критично.
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu \
    "torch==2.5.1+cpu"

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./

RUN mkdir -p /data/hf-cache

EXPOSE 8090

ENV MODEL=BAAI/bge-reranker-base \
    DEVICE=cpu \
    MAX_LENGTH=512 \
    HOST=0.0.0.0 \
    PORT=8090

# В compose стоит healthcheck с curl на /health.
CMD ["sh", "-c", "uvicorn app:app --host ${HOST} --port ${PORT} --workers 1 --log-level info"]
