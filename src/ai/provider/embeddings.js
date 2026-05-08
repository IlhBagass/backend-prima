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
  const [embedding] = await getRemoteEmbeddings([input]);
  return embedding;
}

export async function getRemoteEmbeddings(inputs) {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new Error("MAIA_URL belum diset");
  if (!process.env.MAIA_API_KEY) throw new Error("MAIA_API_KEY belum diset");
  const model = process.env.MAIA_EMBED_MODEL || process.env.MAIA_MODEL;
  if (!model) throw new Error("MAIA_EMBED_MODEL belum diset (atau fallback MAIA_MODEL juga belum diset)");

  const maxRetries = Number(process.env.EMBEDDINGS_MAX_RETRIES || 6);
  let attempt = 0;

  while (true) {
    const res = await fetch(`${baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MAIA_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: inputs,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");

      // Rate limit handling
      if (res.status === 429 && attempt < maxRetries) {
        attempt += 1;
        const retryAfterHeader = res.headers.get("retry-after");
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
        const backoffMs = retryAfterMs && Number.isFinite(retryAfterMs)
          ? retryAfterMs
          : Math.min(30_000, 1000 * Math.pow(2, attempt));
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      throw new Error(`Embeddings Error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const rows = data?.data;
    if (!Array.isArray(rows) || rows.length !== inputs.length) {
      throw new Error("Response embeddings tidak valid");
    }
    const embeddings = rows.map((r) => r?.embedding).filter((e) => Array.isArray(e));
    if (embeddings.length !== inputs.length) {
      throw new Error("Response embeddings tidak valid");
    }
    return embeddings;
  }
}
