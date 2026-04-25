# First Ingestion Slice

## Goal
Deliver the first real vertical slice of ingestion without waiting for the full multimodal pipeline.

## What Works In This Slice
- ingest plain text directly through `POST /documents/ingest-text`
- upload files through `POST /documents/upload`
- ingest `.txt`, `.md`, `.pdf`, `.docx`, `.csv`, `.xlsx`, and `.xls` from `data/raw` through `POST /documents/ingest-file`
- split text into sentence-aware chunks
- split table files into row-level chunks
- build embeddings with local Ollama using `qwen3-embedding:0.6b`
- store document and chunk metadata in PostgreSQL
- store PDF page asset metadata in PostgreSQL as `document_assets`
- store vectors and chunk payloads in Qdrant
- save extracted text into `data/parsed`
- render PDF page previews into `data/assets`
- expose document assets through `GET /documents/:id/assets`
- lazily generate a PNG preview for any indexed page through `GET /documents/:id/pages/:pageNumber/preview`
- retrieve chunks through hybrid search in `POST /search`
- answer grounded questions through `POST /ask`
- search PDF pages only through `POST /search/pages`
- answer using PDF pages only through `POST /ask/pages`
- use a lightweight browser UI at `GET /ui/pages-search`
- restrict page retrieval to a single selected document
- filter PDF pages by page type such as `title`, `contents`, `changelog`, `legal`, `table`, `scheme`, `screen`, `text`

## Why This Slice Matters
This confirms the end-to-end backbone:

document -> chunking -> embeddings -> vector store -> retrieval -> answer

And for PDF visuals:

document -> page text -> page preview PNG -> document_assets metadata -> asset API

And now for page-aware retrieval:

document -> page text + page preview -> asset vectors -> page-only retrieval -> page-grounded answer

And now for typed page retrieval:

document -> page text -> page classification -> filtered page retrieval by document and type

Once this is stable, the next layers can extend the same path:
- table-aware ingestion
- image and scheme ingestion

## Current Limits
- reranking is heuristic, not model-based yet
- PDF previews exist, but no image or scheme retrieval yet
- page classification is heuristic and will need tuning on real industrial documentation
- on weak hardware, model swapping between chat and embeddings can still affect latency
- on weak hardware, grounded answers may fall back to the best source snippet if the local LLM times out

## Expected Next Steps
1. Add Open WebUI-facing upload/invoke workflow.
2. Improve table-aware chunking for larger spreadsheets.
3. Add model-based reranking when hardware allows it.
4. Add image and scheme ingestion metadata into retrieval.
5. Add multimodal retrieval for technical diagrams and equipment photos.
