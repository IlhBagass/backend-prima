import fetch from "node-fetch";

export async function llm(prompt) {
  const res = await fetch(`${process.env.MAIA_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MAIA_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.MAIA_MODEL,
      messages: [
        {
          role: "system",
          content: `
            Kamu adalah AI yang menjawab berdasarkan dokumen.

            Aturan:
            - Jawab hanya dari context
            - Jangan mengarang
            - Jawaban harus spesifik, bukan umum
            - Sertakan poin-poin jika perlu
            - Jika tidak ada, jawab: "Tidak ditemukan dalam dokumen
            - Buatkan format yang bersih tanpa tanda baca yang berlebihan hanya (.,?) saja
            - Hilangkan \n nya
        `
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    })
  });

    if (!res.ok) {
    const errorText = await res.text();
    console.error("LLM ERROR DETAIL:", errorText);
    throw new Error(`LLM Error: ${res.status}`);
    }

  const data = await res.json();

  return data.choices?.[0]?.message?.content || "Tidak ada jawaban";
}