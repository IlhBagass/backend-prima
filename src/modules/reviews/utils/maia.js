const safeJsonParse = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

export const callMaiaJson = async ({ task, user_payload, schema_hint, disclaimer }) => {
  const baseUrl = (process.env.MAIA_URL || "").replace(/\/+$/, "");
  if (!baseUrl) throw new Error("MAIA_URL belum diset");
  if (!process.env.MAIA_API_KEY) throw new Error("MAIA_API_KEY belum diset");

  const model = (process.env.MAIA_MODEL || "openai/gpt-4o-mini").trim();

  const system = `
Kamu adalah AI Sentiment & Review Assistant.
Jawab dalam format JSON valid saja (tanpa markdown, tanpa teks tambahan).
Gunakan Bahasa Indonesia.

Task: ${task}

Keluaran harus mengikuti bentuk seperti schema_hint (sebagai contoh struktur, bukan strict typing):
${JSON.stringify(schema_hint, null, 2)}

Disclaimer wajib:
${disclaimer}
`.trim();

  const userText = JSON.stringify(user_payload, null, 2);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MAIA_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userText },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`MAIA LLM error (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  const parsed = safeJsonParse(text);
  if (!parsed) throw new Error("Gagal parse JSON dari MAIA LLM");

  if (!parsed.disclaimer) parsed.disclaimer = disclaimer;
  return parsed;
};

