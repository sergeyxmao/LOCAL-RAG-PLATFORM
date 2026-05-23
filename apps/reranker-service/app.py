"""Локальный reranker-сервис LOCAL-RAG-PLATFORM.

Эндпоинты:
- GET  /health  — проверка живости и того, что модель загружена.
- POST /rerank  — вход и выход совместимы с Jina /v1/rerank
  (query + documents -> relevance_score),
  чтобы kb-api использовал единый формат для облачного и локального режимов.

Модель и устройство задаются через переменные окружения:
- MODEL       — имя модели sentence-transformers (по умолчанию BAAI/bge-reranker-base).
                На более мощном железе можно задать BAAI/bge-reranker-v2-m3
                без правок кода.
- DEVICE      — cpu (по умолчанию) либо cuda, mps и т.п. На слабом ноутбуке — cpu.
- MAX_LENGTH  — максимум токенов на пару query/document (по умолчанию 512).
- HOST/PORT   — где слушать HTTP (по умолчанию 0.0.0.0:8090).
"""

from __future__ import annotations

import logging
import os
import threading
import time
from typing import List, Optional, Union

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s reranker %(message)s",
)
logger = logging.getLogger("reranker")

MODEL_NAME = os.environ.get("MODEL", "BAAI/bge-reranker-base").strip() or "BAAI/bge-reranker-base"
DEVICE = os.environ.get("DEVICE", "cpu").strip() or "cpu"
try:
    MAX_LENGTH = int(os.environ.get("MAX_LENGTH", "512"))
except ValueError:
    MAX_LENGTH = 512

app = FastAPI(title="LOCAL-RAG reranker", version="1.0.0")

# Модель грузится лениво при первом запросе или фоном после старта,
# чтобы /health отвечал сразу и docker-compose не считал сервис мёртвым.
_model = None
_model_lock = threading.Lock()
_model_load_error: Optional[str] = None
_model_load_started_at: Optional[float] = None
_model_loaded_at: Optional[float] = None


def _load_model() -> "object":
    """Загружает CrossEncoder. Кэшируется в глобальной переменной."""
    global _model, _model_load_error, _model_load_started_at, _model_loaded_at
    if _model is not None:
        return _model
    with _model_lock:
        if _model is not None:
            return _model
        try:
            _model_load_started_at = time.time()
            logger.info("loading model %s on %s (max_length=%s)", MODEL_NAME, DEVICE, MAX_LENGTH)
            # Импорт внутри функции — чтобы /health работал, пока модель грузится.
            from sentence_transformers import CrossEncoder  # type: ignore

            _model = CrossEncoder(MODEL_NAME, max_length=MAX_LENGTH, device=DEVICE)
            _model_loaded_at = time.time()
            _model_load_error = None
            elapsed = _model_loaded_at - _model_load_started_at
            logger.info("model loaded in %.1fs", elapsed)
            return _model
        except Exception as exc:  # noqa: BLE001
            _model_load_error = f"{type(exc).__name__}: {exc}"
            logger.exception("failed to load model")
            raise


def _warmup_async() -> None:
    """Фоновый прогрев модели — чтобы первый /rerank не упирался в скачивание."""

    def _runner() -> None:
        try:
            _load_model()
        except Exception:  # noqa: BLE001
            # Ошибка уже залогирована, бросать не нужно — фоновый поток.
            pass

    threading.Thread(target=_runner, daemon=True, name="reranker-warmup").start()


@app.on_event("startup")
def _on_startup() -> None:
    logger.info("starting reranker service: model=%s device=%s", MODEL_NAME, DEVICE)
    _warmup_async()


class RerankDocumentObject(BaseModel):
    text: str


class RerankRequest(BaseModel):
    query: str = Field(..., min_length=1)
    documents: List[Union[str, RerankDocumentObject]] = Field(default_factory=list)
    top_n: Optional[int] = None
    # model — игнорируется, оставлено для совместимости с Jina-клиентами.
    model: Optional[str] = None
    return_documents: Optional[bool] = False


class RerankResultItem(BaseModel):
    index: int
    relevance_score: float
    document: Optional[dict] = None


class RerankResponse(BaseModel):
    model: str
    results: List[RerankResultItem]


def _normalize_documents(documents: List[Union[str, RerankDocumentObject]]) -> List[str]:
    out: List[str] = []
    for doc in documents:
        if isinstance(doc, RerankDocumentObject):
            out.append(doc.text or "")
        elif isinstance(doc, str):
            out.append(doc)
        elif isinstance(doc, dict):
            out.append(str(doc.get("text", "")))
        else:
            out.append(str(doc) if doc is not None else "")
    return out


@app.get("/health")
def health() -> dict:
    status = "ok"
    if _model is None and _model_load_error:
        status = "error"
    elif _model is None:
        status = "loading"
    return {
        "ok": status == "ok",
        "status": status,
        "model": MODEL_NAME,
        "device": DEVICE,
        "max_length": MAX_LENGTH,
        "model_loaded": _model is not None,
        "model_load_error": _model_load_error,
        "model_load_seconds": (
            round(_model_loaded_at - _model_load_started_at, 2)
            if _model_loaded_at and _model_load_started_at
            else None
        ),
    }


@app.post("/rerank", response_model=RerankResponse)
def rerank(req: RerankRequest) -> RerankResponse:
    documents = _normalize_documents(req.documents)
    if not documents:
        return RerankResponse(model=MODEL_NAME, results=[])

    try:
        model = _load_model()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=503,
            detail=f"reranker model not available: {type(exc).__name__}: {exc}",
        ) from exc

    pairs = [(req.query, doc) for doc in documents]
    try:
        raw_scores = model.predict(pairs)
    except Exception as exc:  # noqa: BLE001
        logger.exception("reranker prediction failed")
        raise HTTPException(status_code=500, detail=f"prediction failed: {exc}") from exc

    scores = [float(s) for s in (raw_scores.tolist() if hasattr(raw_scores, "tolist") else list(raw_scores))]
    ranked = sorted(
        ({"index": idx, "relevance_score": score} for idx, score in enumerate(scores)),
        key=lambda item: item["relevance_score"],
        reverse=True,
    )
    if req.top_n is not None and req.top_n > 0:
        ranked = ranked[: req.top_n]

    if req.return_documents:
        for item in ranked:
            item["document"] = {"text": documents[item["index"]]}

    return RerankResponse(
        model=MODEL_NAME,
        results=[RerankResultItem(**item) for item in ranked],
    )
