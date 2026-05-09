import fetch from "node-fetch";

function getBaseUrl() {
  const base = process.env.MAIA_OPENAI_BASE_URL || process.env.MAIA_URL;
  if (!base) return null;
  // Users sometimes accidentally set the base URL to a *full endpoint* like
  // `.../v1/embeddings`. Normalize that back to a base path so we don't end up
  // requesting `.../v1/embeddings/embeddings` or `.../v1/embeddings/v1/embeddings`.
  const trimmed = base.replace(/\/+$/, "");
  const normalized = trimmed.replace(/\/embeddings$/i, "");
  return normalized.replace(/\/+$/, "");
}

export function hasRemoteEmbeddingsConfig() {
  return Boolean(getBaseUrl() && process.env.MAIA_API_KEY && (process.env.MAIA_EMBED_MODEL || process.env.MAIA_MODEL));
}

function buildCandidateBaseUrls(baseUrl) {
  const candidates = [];
  if (baseUrl) candidates.push(baseUrl);

  // Many routers expose OpenAI-compatible endpoints under `/openai/v1`.
  // If user sets MAIA_URL to `/v1`, we can try `/openai/v1` automatically.
  const strip = (s) => s.replace(/\/+$/, "");
  const b = strip(baseUrl || "");

  if (b.endsWith("/v1")) {
    candidates.push(b.replace(/\/v1$/, "/openai/v1"));
  }
  if (b.endsWith("/openai/v1")) {
    candidates.push(b.replace(/\/openai\/v1$/, "/v1"));
  }

  // If baseUrl doesn't end with v1 path, try appending common variants.
  if (!b.endsWith("/v1") && !b.endsWith("/openai/v1")) {
    candidates.push(`${b}/openai/v1`);
    candidates.push(`${b}/v1`);
  }

  // Deduplicate while preserving order
  return [...new Set(candidates)];
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
    let res;
    let lastText = "";
    let usedUrl = "";

    const candidates = buildCandidateBaseUrls(baseUrl);
    for (const candidate of candidates) {
      usedUrl = `${candidate}/embeddings`;
      res = await fetch(usedUrl, {
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

      // If 404, try next candidate base URL (common when base path is wrong)
      if (res.status === 404) {
        lastText = await res.text().catch(() => "");
        continue;
      }
      break;
    }

    if (!res.ok) {
      const text = lastText || (await res.text().catch(() => ""));

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

      throw new Error(`Embeddings Error: ${res.status} ${text}`.trim() + (usedUrl ? ` (url: ${usedUrl})` : ""));
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
