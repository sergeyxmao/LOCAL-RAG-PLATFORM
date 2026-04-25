import { QdrantClient } from "@qdrant/js-client-rest";

export class QdrantProvider {
  constructor({ url, collectionName }) {
    this.client = new QdrantClient({ url });
    this.collectionName = collectionName;
    this.postgresProvider = null;
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
  }

  async upsertChunks(chunks) {
    if (chunks.length === 0) {
      return;
    }

    await this.ensureCollection(chunks[0].vector.length);

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

  async deletePoints(pointIds) {
    if (!Array.isArray(pointIds) || pointIds.length === 0) {
      return;
    }

    await this.client.delete(this.collectionName, {
      wait: true,
      points: pointIds,
    });
  }

  async search(queryVector, limit = 6) {
    await this.ensureCollection(queryVector.length);

    return this.client.search(this.collectionName, {
      vector: queryVector,
      limit,
      with_payload: true,
    });
  }
}
