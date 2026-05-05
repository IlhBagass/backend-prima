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
- `MAIA_URL`
- `MAIA_MODEL`
- `MAIA_API_KEY`

Catatan: jangan commit `.env` (sudah di-include di `.gitignore`).

## Routing
- Request tanpa ekstensi file (mis. `/`, `/auth/...`, `/ai/...`) di-rewrite ke serverless function.
- File statik seperti `/test_ai_management.html` tetap bisa diakses.

## Deploy
1. Push repo ke GitHub/GitLab.
2. Import project di Vercel.
3. Pastikan Framework Preset: “Other”.
4. Deploy.

