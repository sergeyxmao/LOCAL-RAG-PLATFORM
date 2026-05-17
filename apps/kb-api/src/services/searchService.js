import {
  expandTagSearchVariants,
  normalizeTagForCompare,
  parseTagList,
} from "../utils/tags.js";

export class SearchService {
  constructor({ embeddingProvider, qdrantProvider, retrievalConfig, appSettingsService = null }) {
    this.embeddingProvider = embeddingProvider;
    this.qdrantProvider = qdrantProvider;
    this._retrievalDefaults = retrievalConfig;
    this.appSettingsService = appSettingsService;
  }

  get retrievalConfig() {
    if (this.appSettingsService && typeof this.appSettingsService.getRetrievalConfigSync === "function") {
      return this.appSettingsService.getRetrievalConfigSync() || this._retrievalDefaults;
    }
    return this._retrievalDefaults;
  }

  isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(value ?? "")
    );
  }

  normalizeBoolean(value, defaultValue = true) {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    return ["1", "true", "yes", "on", "да"].includes(String(value).toLowerCase());
  }

  normalizeDocumentIds(documentId, documentIds = []) {
    const ids = Array.isArray(documentIds)
      ? documentIds.map((id) => String(id ?? "").trim()).filter(Boolean)
      : [];

    if (ids.length === 0 && documentId) {
      ids.push(String(documentId).trim());
    }

    return Array.from(new Set(ids));
  }

  normalizeTags(values = []) {
    return parseTagList(values);
  }

  normalizeTagForCompare(value) {
    return normalizeTagForCompare(value);
  }

  qdrantMatchCondition(key, values) {
    const normalizedValues = Array.from(
      new Set((Array.isArray(values) ? values : [values]).map((value) => String(value ?? "").trim()).filter(Boolean))
    );

    if (normalizedValues.length === 0) {
      return null;
    }

    if (normalizedValues.length === 1) {
      return {
        key,
        match: { value: normalizedValues[0] },
      };
    }

    return {
      key,
      match: { any: normalizedValues },
    };
  }

  normalizeNodeIds(nodeId, nodeIds = []) {
    const sources = Array.isArray(nodeIds) ? nodeIds : [];
    const combined = sources
      .map((id) => String(id ?? "").trim())
      .filter(Boolean);
    if (nodeId) {
      const single = String(nodeId).trim();
      if (single) combined.push(single);
    }
    return Array.from(new Set(combined));
  }

  buildQdrantFilter({
    nodeId = null,
    nodeIds = [],
    includeChildren = true,
    scope = "all",
    assetClass = "all",
    engineeringTopic = "all",
    signalTag = "all",
    documentId = null,
    documentIds = [],
    selectedTags = [],
  } = {}) {
    const must = [];
    const selectedDocumentIds = this.normalizeDocumentIds(documentId, documentIds);
    const normalizedSelectedTags = this.normalizeTags(selectedTags);
    const qdrantSelectedTags = expandTagSearchVariants(normalizedSelectedTags);
    const normalizedNodeIds = this.normalizeNodeIds(nodeId, nodeIds);

    if (normalizedNodeIds.length > 0) {
      must.push(
        this.qdrantMatchCondition(
          includeChildren ? "node_scope_ids" : "node_ids",
          normalizedNodeIds
        )
      );
    }

    const documentCondition = this.qdrantMatchCondition("document_id", selectedDocumentIds);
    if (documentCondition) {
      must.push(documentCondition);
    }

    const tagCondition = this.qdrantMatchCondition("categories", qdrantSelectedTags);
    if (tagCondition) {
      must.push(tagCondition);
    }

    if (scope === "assets") {
      must.push({
        key: "resource_type",
        match: { value: "asset" },
      });
    }

    if (assetClass && assetClass !== "all") {
      must.push({
        key: "asset_class",
        match: { value: assetClass },
      });
    }

    if (engineeringTopic && engineeringTopic !== "all") {
      must.push(this.qdrantMatchCondition("engineering_topics", engineeringTopic));
    }

    const normalizedSignalTag = String(signalTag ?? "").trim().toUpperCase();
    if (normalizedSignalTag && normalizedSignalTag !== "ALL") {
      must.push(this.qdrantMatchCondition("signal_tags", normalizedSignalTag));
    }

    const compactMust = must.filter(Boolean);
    if (compactMust.length === 0) {
      return undefined;
    }

    return { must: compactMust };
  }

  async resolveNodeScope({ nodeId = null, includeChildren = true } = {}) {
    const normalizedNodeId = String(nodeId ?? "").trim();
    if (!normalizedNodeId) {
      return {
        nodeId: null,
        includeChildren: this.normalizeBoolean(includeChildren, true),
        node: null,
      };
    }

    if (!this.isUuid(normalizedNodeId)) {
      throw Object.assign(new Error("Некорректный UUID раздела"), {
        statusCode: 400,
      });
    }

    const node = await this.qdrantProvider.postgresProvider.getKnowledgeNodeById(normalizedNodeId);
    if (!node) {
      throw Object.assign(new Error("Раздел не найден"), {
        statusCode: 404,
      });
    }

    return {
      nodeId: normalizedNodeId,
      includeChildren: this.normalizeBoolean(includeChildren, true),
      node,
    };
  }

  async resolveNodeScopes({ nodeId = null, nodeIds = [], includeChildren = true } = {}) {
    const incoming = this.normalizeNodeIds(nodeId, nodeIds);
    const includeChildrenResolved = this.normalizeBoolean(includeChildren, true);
    if (incoming.length === 0) {
      return {
        nodeIds: [],
        primaryNodeId: null,
        includeChildren: includeChildrenResolved,
        node: null,
      };
    }

    for (const id of incoming) {
      if (!this.isUuid(id)) {
        throw Object.assign(new Error("Некорректный UUID раздела"), {
          statusCode: 400,
        });
      }
    }

    const provider = this.qdrantProvider.postgresProvider;
    const nodes = [];
    for (const id of incoming) {
      const node = await provider.getKnowledgeNodeById(id);
      if (!node) {
        throw Object.assign(new Error("Раздел не найден"), { statusCode: 404 });
      }
      nodes.push(node);
    }

    return {
      nodeIds: incoming,
      primaryNodeId: incoming[0],
      includeChildren: includeChildrenResolved,
      node: nodes[0],
      nodes,
    };
  }

  enrichResult(item) {
    if (item.resource_type !== "asset" || !item.document_id) {
      return item;
    }

    const enriched = {
      ...item,
      asset_preview_url: item.page_number
        ? `/documents/${item.document_id}/pages/${item.page_number}/preview`
        : null,
    };

    if (item.file_name) {
      enriched.asset_url = `/documents/${item.document_id}/assets/${encodeURIComponent(item.file_name)}`;
    }

    return enriched;
  }

  filterItemsByScope(items, scope = "all") {
    if (scope === "assets") {
      return items.filter((item) => item.resource_type === "asset");
    }

    if (scope === "chunks") {
      return items.filter((item) => item.resource_type !== "asset");
    }

    return items;
  }

  filterItemsByAssetClass(items, assetClass = "all") {
    if (!assetClass || assetClass === "all") {
      return items;
    }

    return items.filter((item) => item.resource_type === "asset" && item.asset_class === assetClass);
  }

  filterItemsByDocument(items, documentId, documentIds = []) {
    const selectedDocumentIds = Array.isArray(documentIds)
      ? documentIds.map((id) => String(id).trim()).filter(Boolean)
      : [];

    if (selectedDocumentIds.length > 0) {
      return items.filter((item) => selectedDocumentIds.includes(String(item.document_id)));
    }

    if (!documentId) {
      return items;
    }

    return items.filter((item) => item.document_id === documentId);
  }

  filterItemsByTags(items, selectedTags = []) {
    const normalizedSelectedTags = this.normalizeTags(selectedTags)
      .map((tag) => this.normalizeTagForCompare(tag))
      .filter(Boolean);

    if (normalizedSelectedTags.length === 0) {
      return items;
    }

    return items.filter((item) => {
      const categories = Array.isArray(item.categories) ? item.categories : [];
      return categories.some((category) =>
        normalizedSelectedTags.includes(this.normalizeTagForCompare(category))
      );
    });
  }

  filterItemsByEngineeringTopic(items, engineeringTopic = "all") {
    if (!engineeringTopic || engineeringTopic === "all") {
      return items;
    }

    return items.filter((item) => {
      if (item.resource_type !== "asset") {
        return false;
      }

      const topics = Array.isArray(item.engineering_topics)
        ? item.engineering_topics
        : Array.isArray(item.engineeringTopics)
          ? item.engineeringTopics
          : [];

      return topics.includes(engineeringTopic);
    });
  }

  filterItemsBySignalTag(items, signalTag = "all") {
    const normalizedFilter = String(signalTag ?? "").trim().toUpperCase();
    if (!normalizedFilter || normalizedFilter === "ALL") {
      return items;
    }

    return items.filter((item) => {
      if (item.resource_type !== "asset") {
        return false;
      }

      const tags = Array.isArray(item.signal_tags)
        ? item.signal_tags
        : Array.isArray(item.signalTags)
          ? item.signalTags
          : [];

      return tags.some((tag) => String(tag).toUpperCase() === normalizedFilter);
    });
  }

  async semanticSearch(query, limit, { filter = undefined } = {}) {
    const [vector] = await this.embeddingProvider.embed(query);
    const topK = limit || this.retrievalConfig.fusion.top_k_final || 6;
    const results = await this.qdrantProvider.search(vector, topK, { filter });

    return results.map((result) =>
      this.enrichResult({
        score: result.score,
        ...result.payload,
      })
    );
  }

  reciprocalRankFusion(lists, topK) {
    const fusionConstant = 60;
    const merged = new Map();

    for (const { method, items } of lists) {
      items.forEach((item, index) => {
        const key = item.chunk_id ?? `${item.document_id}:${item.chunk_index}`;
        const normalizedKey = item.asset_id ?? key;

        if (!merged.has(normalizedKey)) {
          merged.set(normalizedKey, {
            ...this.enrichResult(item),
            methods: [],
            semantic_score: null,
            lexical_score: null,
            fusion_score: 0,
          });
        }

        const current = merged.get(normalizedKey);
        current.fusion_score += 1 / (fusionConstant + index + 1);

        if (!current.methods.includes(method)) {
          current.methods.push(method);
        }

        if (method === "semantic") {
          current.semantic_score = item.score ?? null;
        }

        if (method === "lexical") {
          current.lexical_score = item.lexical_score ?? null;
        }
      });
    }

    return Array.from(merged.values())
      .sort((a, b) => b.fusion_score - a.fusion_score)
      .slice(0, topK);
  }

  normalizeQueryTerms(query) {
    return String(query ?? "")
      .toLowerCase()
      .split(/[^a-z0-9а-яё-]+/i)
      .map((term) => term.trim())
      .filter(Boolean);
  }

  identifierTerms(queryTerms) {
    return queryTerms.filter((term) => /\d/.test(term) || term.includes("-"));
  }

  itemMatchesQueryTerms(query, item) {
    const haystack = String(item.text_with_context ?? item.text ?? "").toLowerCase();
    const title = String(item.title ?? "").toLowerCase();
    const normalizedQuery = String(query ?? "").trim().toLowerCase();
    const queryTerms = this.normalizeQueryTerms(query);
    const matchedTerms = queryTerms.filter((term) => haystack.includes(term) || title.includes(term));
    const identifierTerms = this.identifierTerms(queryTerms);
    const matchedIdentifierTerms = identifierTerms.filter(
      (term) => haystack.includes(term) || title.includes(term)
    );

    return {
      normalizedQuery,
      queryTerms,
      matchedTerms,
      identifierTerms,
      matchedIdentifierTerms,
      hasExactQuery: normalizedQuery ? haystack.includes(normalizedQuery) || title.includes(normalizedQuery) : false,
      lexicalHit: Number(item.lexical_score ?? 0) > 0,
    };
  }

  computeRerankScore(query, item) {
    const haystack = String(item.text_with_context ?? item.text ?? "").toLowerCase();
    const title = String(item.title ?? "").toLowerCase();
    const {
      normalizedQuery,
      queryTerms,
      matchedTerms,
      identifierTerms,
      matchedIdentifierTerms,
      hasExactQuery,
    } = this.itemMatchesQueryTerms(query, item);

    let score = 0;

    score += (item.fusion_score ?? 0) * 100;
    score += (item.semantic_score ?? item.score ?? 0) * 10;
    score += (item.lexical_score ?? 0) * 30;

    if (hasExactQuery) {
      score += 12;
    }

    if (normalizedQuery && title.includes(normalizedQuery)) {
      score += 6;
    }

    if (queryTerms.length > 0) {
      score += (matchedTerms.length / queryTerms.length) * 10;
    }

    for (const term of matchedIdentifierTerms) {
      if (haystack.includes(term) || title.includes(term)) {
        score += 8;
      }
    }

    if (item.resource_type === "asset") {
      score += 4;
      if (typeof item.page_number === "number") {
        score += 1;
      }
    }

    return score;
  }

  filterItemsByQueryRelevance(query, items) {
    const queryTerms = this.normalizeQueryTerms(query);
    if (queryTerms.length === 0) {
      return items;
    }

    return items.filter((item) => {
      const {
        matchedTerms,
        identifierTerms,
        matchedIdentifierTerms,
        hasExactQuery,
        lexicalHit,
      } = this.itemMatchesQueryTerms(query, item);

      if (lexicalHit || hasExactQuery) {
        return true;
      }

      if (identifierTerms.length > 0) {
        return matchedIdentifierTerms.length > 0;
      }

      return matchedTerms.length > 0;
    });
  }

  rerankItems(query, items, finalTopK) {
    const enabled = this.retrievalConfig.reranking?.enabled ?? false;
    if (!enabled) {
      return {
        items: items.slice(0, finalTopK),
        reranking: {
          enabled: false,
          mode: "disabled",
        },
      };
    }

    const reranked = items
      .map((item) => ({
        ...item,
        rerank_score: this.computeRerankScore(query, item),
      }))
      .sort((a, b) => b.rerank_score - a.rerank_score)
      .slice(0, finalTopK);

    return {
      items: reranked,
      reranking: {
        enabled: true,
        mode: this.retrievalConfig.reranking?.mode ?? "heuristic",
      },
    };
  }

  async hybridSearch(
    query,
    {
      semanticSearch,
      lexicalSearch,
      limit,
      scope = "all",
      assetClass = "all",
      engineeringTopic = "all",
      signalTag = "all",
      documentId = null,
      documentIds = [],
      selectedTags = [],
      nodeId = null,
      nodeIds = [],
      includeChildren = true,
    } = {}
  ) {
    const nodeScope = await this.resolveNodeScopes({ nodeId, nodeIds, includeChildren });
    const normalizedSelectedTags = this.normalizeTags(selectedTags);
    const semanticTopK =
      semanticSearch ??
      this.retrievalConfig.semantic?.top_k ??
      12;

    const lexicalTopK =
      lexicalSearch ??
      this.retrievalConfig.bm25?.top_k ??
      12;

    const finalTopK =
      limit ??
      this.retrievalConfig.fusion?.top_k_final ??
      6;

    const candidatePool =
      this.retrievalConfig.reranking?.candidate_pool ??
      Math.max(finalTopK * 2, 8);

    const qdrantFilter = this.buildQdrantFilter({
      nodeIds: nodeScope.nodeIds,
      includeChildren: nodeScope.includeChildren,
      scope,
      assetClass,
      engineeringTopic,
      signalTag,
      documentId,
      documentIds,
      selectedTags: normalizedSelectedTags,
    });

    let semanticError = null;
    const [rawSemanticItems, rawLexicalItems] = await Promise.all([
      this.semanticSearch(query, semanticTopK, { filter: qdrantFilter }).catch((error) => {
        semanticError = error;
        return [];
      }),
      this.qdrantProvider.postgresProvider.lexicalSearch(query, lexicalTopK, {
        nodeId: nodeScope.primaryNodeId,
        nodeIds: nodeScope.nodeIds,
        includeChildren: nodeScope.includeChildren,
        includeUnlinked: nodeScope.node?.is_system === true,
        scope,
        assetClass,
        engineeringTopic,
        signalTag,
        documentId,
        documentIds,
        selectedTags: normalizedSelectedTags,
      }),
    ]);

    const semanticItems = this.filterItemsByTags(
      this.filterItemsByDocument(
        this.filterItemsBySignalTag(
          this.filterItemsByEngineeringTopic(
            this.filterItemsByAssetClass(
              this.filterItemsByScope(rawSemanticItems, scope),
              assetClass
            ),
            engineeringTopic
          ),
          signalTag
        ),
        documentId,
        documentIds
      ),
      normalizedSelectedTags
    );
    const lexicalItems = this.filterItemsByTags(
      this.filterItemsByDocument(
        this.filterItemsBySignalTag(
          this.filterItemsByEngineeringTopic(
            this.filterItemsByAssetClass(
              this.filterItemsByScope(
                rawLexicalItems.map((item) => this.enrichResult(item)),
                scope
              ),
              assetClass
            ),
            engineeringTopic
          ),
          signalTag
        ),
        documentId,
        documentIds
      ),
      normalizedSelectedTags
    );

    const fusedItems = this.reciprocalRankFusion(
      [
        { method: "semantic", items: semanticItems },
        { method: "lexical", items: lexicalItems },
      ],
      candidatePool
    );

    const relevantItems = this.filterItemsByQueryRelevance(query, fusedItems);

    const reranked = this.rerankItems(query, relevantItems, finalTopK);

    return {
      items: reranked.items.map((item) => this.enrichResult(item)),
      debug: {
        semantic_count: semanticItems.length,
        lexical_count: lexicalItems.length,
        fused_count: fusedItems.length,
        relevant_count: relevantItems.length,
        scope,
        asset_class: assetClass,
        engineering_topic: engineeringTopic,
        signal_tag: signalTag,
        document_id: documentId,
        document_ids: Array.isArray(documentIds) ? documentIds : [],
        selected_tags: normalizedSelectedTags,
        node_id: nodeScope.primaryNodeId,
        node_ids: nodeScope.nodeIds,
        include_children: nodeScope.includeChildren,
        node_name: nodeScope.node?.name ?? null,
        qdrant_filter: qdrantFilter ?? null,
        semantic_error: semanticError?.message ?? null,
        reranking: reranked.reranking,
      },
    };
  }
}
