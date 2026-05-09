# Deploy ke Vercel (Fastify)

## Struktur
- Serverless function entrypoint: `api/index.js`
- Aplikasi Fastify: `src/app.js`

## Environment variables (Vercel Project → Settings → Environment Variables)
Set minimalnya:
- `DATABASE_URL`
- `CLOUD_NAME`
- `CLOUD_API_KEY`
- `CLOUD_API_SECRET`
- `MAIA_URL` (catatan: untuk embeddings, beberapa router butuh base `.../openai/v1`)
- `MAIA_MODEL`
- `MAIA_API_KEY`
- `MAIA_EMBED_MODEL` (opsional; kalau kosong akan fallback ke `MAIA_MODEL`, endpoint `/embeddings`)
- `EMBEDDING_DIM` (opsional; default auto: `text-embedding-3-*` -> 1536, selain itu 384)

Catatan: jangan commit `.env` (sudah di-include di `.gitignore`).

## Routing
- Request tanpa ekstensi file (mis. `/`, `/auth/...`, `/ai/...`) di-rewrite ke serverless function.
- File statik seperti `/test_ai_management.html` tetap bisa diakses.

## Deploy
1. Push repo ke GitHub/GitLab.
2. Import project di Vercel.
3. Pastikan Framework Preset: “Other”.
4. Deploy.

## Catatan Upload PDF di Vercel
- Endpoint `POST /upload/pdf` hanya upload ke Cloudinary (tanpa proses RAG) untuk menghindari `FUNCTION_INVOCATION_TIMEOUT`.
- Untuk proses RAG, panggil `POST /upload/pdf/rag` dengan body `{ "url": "...", "title": "..." }` (atau `{ "public_id": "...", "title": "..." }`).

## Debug DB (opsional)
- Cek apakah tabel `document_chunks` ada: `GET /upload/db/status`
- Paksa re-init schema: `POST /upload/db/init`
- `document_chunks` terbaru punya kolom `created_at` + `embedding VECTOR(dim)` (dim auto dari model / `EMBEDDING_DIM`)
