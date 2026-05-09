import { getEmbedding } from "./embedding.js";
import { retrieveRelevantChunks } from "./retriever/index.js";
import { formatAIResponse } from "../formatters/index.js";

export async function ragPipeline({ question, documentId, llm }) {

  const queryEmbedding = await getEmbedding(question);

  const chunks = await retrieveRelevantChunks(queryEmbedding, documentId);

  const context = chunks.join("\n---\n");

  const prompt = `
  Kamu adalah AI kesehatan berbasis dokumen.
  Dan IbaratKan Kamu adalah dokter virtual untuk membantu pasien.

  Gunakan hanya informasi dari context.

  Context:
  ${context}

  Pertanyaan:
  ${question}

  TUGAS:
  - Analisis pertanyaan user
  - Ambil informasi relevan dari context
  - Isi SEMUA field JSON

  FORMAT WAJIB:

  {
    "user_message": "Jawaban jelas dan menjelaskan pertanyaan user",
    "possible_conditions": [
      {
        "name": "nama penyakit dari context",
        "likelihood": "Rendah/Sedang/Tinggi/Perlu diwaspadai"
      }
    ],
    "what_you_can_do_now": ["ambil dari bagian solusi jika ada"],
    "when_to_see_doctor": ["ambil dari bagian 'Segera ke IGD' jika ada"],
    "recommended_checks": ["jika tidak ada isi []"],
    "health_insight": {
      "title": "ringkasan",
      "description": "penjelasan tambahan dari context"
    },
    "who_context": {
      "indicator": "",
      "value": null,
      "unit": "",
      "country": "",
      "year": null
    },
    "disclaimer": "Informasi ini hanya sebagai panduan awal dan bukan pengganti diagnosis medis."
  }

  ATURAN:
  - JANGAN kosongkan field jika ada data di context
  - JANGAN ulang pertanyaan
  - JANGAN mengarang di luar context
  - WAJIB JSON VALID
  - Jika ada question yang masuk ke dalam when_to_see_doctor masukkan ke dalam user message
  `;

  const raw = await llm(prompt);

  const formatted = formatAIResponse("health", raw);

  return {
    data: formatted,
    sources: chunks
  };
}