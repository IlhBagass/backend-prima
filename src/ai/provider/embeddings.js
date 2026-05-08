import fetch from "node-fetch";

function getBaseUrl() {
  const base = process.env.MAIA_URL;
  if (!base) return null;
  return base.replace(/\/+$/, "");
}

export function hasRemoteEmbeddingsConfig() {
  return Boolean(getBaseUrl() && process.env.MAIA_API_KEY && (process.env.MAIA_EMBED_MODEL || process.env.MAIA_MODEL));
}

export async function getRemoteEmbedding(input) {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new Error("MAIA_URL belum diset");
  if (!process.env.MAIA_API_KEY) throw new Error("MAIA_API_KEY belum diset");
  const model = process.env.MAIA_EMBED_MODEL || process.env.MAIA_MODEL;
  if (!model) throw new Error("MAIA_EMBED_MODEL belum diset (atau fallback MAIA_MODEL juga belum diset)");

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MAIA_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      input,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Embeddings Error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error("Response embeddings tidak valid");
  }
  return embedding;
}
