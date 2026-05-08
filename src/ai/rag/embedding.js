import { getRemoteEmbedding, getRemoteEmbeddings, hasRemoteEmbeddingsConfig } from "../provider/embeddings.js";

let localExtractor;

async function getLocalEmbedding(text) {
  if (!localExtractor) {
    const { pipeline } = await import("@xenova/transformers");
    localExtractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const result = await localExtractor(text, { pooling: "mean", normalize: true });
  return Array.from(result.data);
}

export async function getEmbedding(text) {
  // Vercel serverless biasanya tidak cocok untuk download model Xenova (besar) saat cold start.
  // Jadi default-kan remote embeddings jika konfigurasi tersedia.
  if (process.env.VERCEL && !hasRemoteEmbeddingsConfig()) {
    throw new Error(
      "Embeddings di Vercel butuh remote provider. Set MAIA_URL + MAIA_API_KEY + MAIA_EMBED_MODEL (atau fallback MAIA_MODEL)."
    );
  }

  if (hasRemoteEmbeddingsConfig()) {
    return getRemoteEmbedding(text);
  }

  return getLocalEmbedding(text);
}

export async function getEmbeddings(texts) {
  if (!Array.isArray(texts)) throw new Error("getEmbeddings butuh array string");

  if (process.env.VERCEL && !hasRemoteEmbeddingsConfig()) {
    throw new Error(
      "Embeddings di Vercel butuh remote provider. Set MAIA_URL + MAIA_API_KEY + MAIA_EMBED_MODEL (atau fallback MAIA_MODEL)."
    );
  }

  if (hasRemoteEmbeddingsConfig()) {
    return getRemoteEmbeddings(texts);
  }

  // Local fallback: sequential supaya hemat memori
  const out = [];
  for (const t of texts) out.push(await getLocalEmbedding(t));
  return out;
}
