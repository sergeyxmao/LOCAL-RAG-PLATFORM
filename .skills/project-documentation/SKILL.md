---
name: project-documentation
description: Use this skill when working with project docs, README, AGENTS.md, PROJECT_CONTEXT, SETUP_STATUS, ROADMAP, OPERATIONS, technical notes, implementation reports, or when code changes require documentation updates.
---

# Project Documentation Skill

## Назначение

Этот skill используется для задач, связанных с документацией проекта LOCAL-RAG-PLATFORM.

Проект развивается пошагово, поэтому документация должна уменьшать количество повторных объяснений в будущих сессиях.

## Главные документы

В первую очередь читать и поддерживать:

- AGENTS.md
- README.md
- docs/PROJECT_CONTEXT.md
- docs/SETUP_STATUS.md
- docs/ROADMAP.md
- docs/OPERATIONS.md
- .skills/README.md

## Когда обновлять документацию

Документацию нужно обновлять, если изменились:

- архитектура проекта;
- pipeline импорта;
- поддерживаемые форматы файлов;
- chunking;
- embeddings;
- Qdrant;
- PostgreSQL metadata;
- search/retrieval;
- answer generation;
- Open WebUI/Ollama integration;
- endpoints;
- UI страницы;
- порядок запуска;
- порядок диагностики;
- ограничения слабого ноутбука;
- известные проблемы;
- roadmap;
- правила работы агента.

## Стиль документации

Документация должна быть:

- на русском языке;
- практичной;
- короткой, но достаточной;
- без лишней теории;
- ориентированной на инженера АСУ ТП;
- с командами и URL для проверки;
- с предупреждениями для опасных операций.

## Правила для Codex

- Перед изменением документации прочитать соответствующий существующий файл.
- Не переписывать большие документы полностью без подтверждения.
- Делать точечные обновления.
- После изменения написать:
  - какие документы изменены;
  - какие разделы добавлены или обновлены;
  - почему это нужно.
- Если код изменён, но документация тоже должна быть обновлена, явно сказать об этом.
