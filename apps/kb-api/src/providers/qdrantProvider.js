import { QdrantClient } from "@qdrant/js-client-rest";

export class QdrantProvider {
  constructor({ url, collectionName }) {
    this.client = new QdrantClient({ url });
    this.collectionName = collectionName;
    this.postgresProvider = null;
    this.payloadIndexesEnsured = false;
  }

  async ensureCollection(vectorSize) {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (collection) => collection.name === this.collectionName
    );

    if (exists) {
      return;
    }

    await this.client.createCollection(this.collectionName, {
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    });

    await this.ensurePayloadIndexes();
  }

  async ensurePayloadIndexes() {
    if (this.payloadIndexesEnsured) {
      return;
    }

    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (collection) => collection.name === this.collectionName
    );
    if (!exists) {
      return;
    }

    const collection = await this.client.getCollection(this.collectionName);
    const payloadSchema = collection.payload_schema ?? collection.payloadSchema ?? {};
    const indexes = [
      ["document_id", "keyword"],
      ["node_ids", "keyword"],
      ["node_scope_ids", "keyword"],
      ["primary_node_id", "keyword"],
      ["node_paths", "keyword"],
      ["categories", "keyword"],
      ["resource_type", "keyword"],
      ["asset_class", "keyword"],
      ["engineering_topics", "keyword"],
      ["signal_tags", "keyword"],
      ["payload_version", "integer"],
    ];

    for (const [fieldName, fieldSchema] of indexes) {
      if (payloadSchema[fieldName]) {
        continue;
      }

      try {
        await this.client.createPayloadIndex(this.collectionName, {
          wait: true,
          field_name: fieldName,
          field_schema: fieldSchema,
        });
      } catch (error) {
        const message = String(error?.message ?? "");
        if (!message.toLowerCase().includes("already exists")) {
          throw error;
        }
      }
    }

    this.payloadIndexesEnsured = true;
  }

  async collectionExists() {
    const collections = await this.client.getCollections();
    return collections.collections.some(
      (collection) => collection.name === this.collectionName
    );
  }

  async recreateCollection(vectorSize) {
    const exists = await this.collectionExists();
    if (exists) {
      await this.client.deleteCollection(this.collectionName);
    }

    await this.client.createCollection(this.collectionName, {
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    });
    this.payloadIndexesEnsured = false;
    await this.ensurePayloadIndexes();
  }

  async getCollectionStatus() {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(
      (collection) => collection.name === this.collectionName
    );

    if (!exists) {
      return {
        exists: false,
        pointsCount: 0,
      };
    }

    const collection = await this.client.getCollection(this.collectionName);
    const payloadSchema = collection.payload_schema ?? collection.payloadSchema ?? {};
    return {
      exists: true,
      status: collection.status ?? null,
      pointsCount: Number(collection.points_count ?? collection.pointsCount ?? 0),
      vectorsCount: Number(collection.vectors_count ?? collection.vectorsCount ?? 0),
      payloadIndexedFields: Object.keys(payloadSchema).sort(),
    };
  }

  async upsertChunks(chunks) {
    if (chunks.length === 0) {
      return;
    }

    await this.ensureCollection(chunks[0].vector.length);
    await this.ensurePayloadIndexes();

    await this.client.upsert(this.collectionName, {
      wait: true,
      points: chunks.map((chunk) => ({
        id: chunk.id,
        vector: chunk.vector,
        payload: chunk.payload,
      })),
    });
  }

  async setPayload(pointIds, payload) {
    if (!Array.isArray(pointIds) || pointIds.length === 0) {
      return;
    }

    await this.client.setPayload(this.collectionName, {
      wait: true,
      payload,
      points: pointIds,
    });
  }

  buildDocumentFilter(documentId) {
    return {
      must: [
        {
          key: "document_id",
          match: { value: documentId },
        },
      ],
    };
  }

  async countDocumentPoints(documentId) {
    const result = await this.client.count(this.collectionName, {
      exact: true,
      filter: this.buildDocumentFilter(documentId),
    });

    return Number(result?.count ?? 0);
  }

  async countPointsByPayload({ key, value } = {}) {
    if (!key || value === undefined || value === null) {
      return 0;
    }

    const result = await this.client.count(this.collectionName, {
      exact: true,
      filter: {
        must: [{ key, match: { value } }],
      },
    });

    return Number(result?.count ?? 0);
  }

  async setDocumentPayload(documentId, payload) {
    await this.client.setPayload(this.collectionName, {
      wait: true,
      payload,
      filter: this.buildDocumentFilter(documentId),
    });
  }

  async deletePoints(pointIds) {
    if (!Array.isArray(pointIds) || pointIds.length === 0) {
      return;
    }

    await this.client.delete(this.collectionName, {
      wait: true,
      points: pointIds,
    });
  }

  async clearCollection() {
    const exists = await this.collectionExists();
    if (!exists) {
      return {
        existed: false,
        pointsDeleted: 0,
      };
    }

    const before = await this.getCollectionStatus();
    await this.client.delete(this.collectionName, {
      wait: true,
      filter: {
        must: [],
      },
    });
    this.payloadIndexesEnsured = false;
    await this.ensurePayloadIndexes();

    return {
      existed: true,
      pointsDeleted: Number(before.pointsCount ?? 0),
    };
  }

  async search(queryVector, limit = 6, { filter = undefined } = {}) {
    await this.ensureCollection(queryVector.length);
    await this.ensurePayloadIndexes();

    return this.client.search(this.collectionName, {
      vector: queryVector,
      limit,
      with_payload: true,
      filter,
    });
  }
}
