import { getEmbedding } from "./embedding.js";
import { retrieveRelevantChunks } from "./retriever/index.js";
import { formatAIResponse } from "../formatters/index.js";

export async function ragPipeline({ question, documentId, llm }) {

  const queryEmbedding = await getEmbedding(question);

  const chunks = await retrieveRelevantChunks(queryEmbedding, documentId);

  const context = chunks.join("\n---\n");

  const prompt = `
  Kamu adalah AI kesehatan berbasis dokumen.
  IbaratKan Kamu adalah dokter virtual untuk membantu pasien.

  Gunakan hanya informasi dari context.

  Context:
  ${context}

  Pertanyaan:
  ${question}

  TUGAS:
  - Analisis pertanyaan user
  - Ambil informasi relevan dari context
  - Jawab dengan satu atau dua paragraf sederhana. JANGAN pakai format markdown. JANGAN pakai JSON. JANGAN pakai list bullet point.
  - Tambahkan disclaimer di akhir paragraf: "Informasi ini hanya sebagai panduan awal dan bukan pengganti diagnosis medis."

  ATURAN:
  - JANGAN ulang pertanyaan
  - JANGAN mengarang di luar context
  `;

  const raw = await llm(prompt);

  const formatted = formatAIResponse("health", raw);

  return {
    data: formatted,
    sources: chunks
  };
}