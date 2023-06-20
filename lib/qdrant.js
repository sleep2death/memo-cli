import { QdrantClient } from "@qdrant/js-client-rest";

import { v4 as uuid } from "uuid";
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });

export async function addPoints(collection_name, embeddings, docs) {
  const points = embeddings.map((embedding, idx) => ({
    id: uuid(),
    vector: embedding,
    payload: {
      content: docs[idx].content,
      metadata: docs[idx].metadata,
    },
  }));

  await qdrant.upsert(collection_name, {
    wait: true,
    points: points,
  });
}

export async function scrollPoints(collection_name, offset, limit) {
  return await qdrant.scroll(collection_name, { offset, limit });
}

export async function ensureCollection(collection_name) {
  try {
    await qdrant.getCollection(collection_name);
    return false;
  } catch (e) {
    if (e.status !== 404) {
      throw e;
    }
    // if collection not exist, create one
    await qdrant.createCollection(collection_name, {
      vectors: {
        size: 1536,
        distance: "Cosine",
      },
    });
    return true;
  }
}
