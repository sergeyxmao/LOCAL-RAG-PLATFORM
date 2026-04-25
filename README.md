# Local RAG Platform

Local-first knowledge base and document assistant built around Ollama, Open WebUI, PostgreSQL, and Qdrant.

## Current Models

- Chat: `qwen3:4b`
- Embeddings: `qwen3-embedding:0.6b`

## Project Layout

- `apps/` application services
- `config/` runtime configuration
- `data/` raw documents, parsed outputs, chunks, exports, backups
- `infra/` Docker Compose and infrastructure bootstrap
- `docs/` project documentation
- `scripts/` PowerShell operational scripts
- `workspace/` local persistent service data

## Next Boot

1. Install Docker Desktop.
2. Copy `infra/.env.example` to `infra/.env` if it does not exist.
3. Start Ollama locally.
4. Run `scripts/start.ps1`.
