# Retrieval Pipeline

question -> embedding -> semantic search in Qdrant -> lexical search in PostgreSQL -> fusion -> answer

Current implementation notes:
- semantic retrieval comes from `Qdrant`
- lexical retrieval comes from PostgreSQL full-text search plus exact substring boost
- fusion uses reciprocal rank fusion (RRF)
- CSV/XLSX rows can be retrieved as separate chunks for better tag and parameter lookup
- reranking is currently local heuristic reranking, optimized for weak hardware
