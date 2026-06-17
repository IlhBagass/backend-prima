import { neon } from "@neondatabase/serverless";
import { getEnv } from "./env.js";

const databaseUrl = getEnv("DATABASE_URL");

export const neonSql = databaseUrl
  ? neon(databaseUrl)
  : Object.assign(
      () => { throw new Error("DATABASE_URL belum diset."); },
      { query: () => { throw new Error("DATABASE_URL belum diset."); } }
    );

export const sql = neonSql;

export async function initPgvector() {
  if (!databaseUrl) {
    console.warn("[initPgvector] DATABASE_URL tidak ada.");
    return;
  }

  try {
    // hanya enable extension pgvector
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;

    console.log("[initPgvector] pgvector siap.");
  } catch (err) {
    console.error(
      "[initPgvector] Gagal enable pgvector:",
      err.message
    );
  }
}

export async function initDatabase() {
  if (!databaseUrl) {
    console.warn("[initDatabase] DATABASE_URL tidak ada.");
    return;
  }

  const embeddingDim = (() => {
    const explicit = Number(process.env.EMBEDDING_DIM);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const model = (process.env.MAIA_EMBED_MODEL || process.env.MAIA_MODEL || "").trim();
    if (model.includes("text-embedding-3")) return 1536;
    return 384;
  })();

  await initPgvector();

  await sql`
    CREATE TABLE IF NOT EXISTS public.documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS public.document_chunks (
      id UUID PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      embedding VECTOR(${embeddingDim}),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(document_id, chunk_index)
    );
  `);

  // Schedules module (untuk gen_random_uuid)
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;

  await sql`
    CREATE TABLE IF NOT EXISTS public.schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      doctor_id VARCHAR NOT NULL
        REFERENCES public.users(id)
        ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL
    );
  `;

  // Migration safety: jika table schedules sudah terlanjur dibuat dengan tipe doctor_id UUID,
  // ubah menjadi VARCHAR agar konsisten dengan users.id (yang berupa string/hex).
  try {
    await sql.unsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'schedules'
            AND column_name = 'doctor_id'
            AND data_type = 'uuid'
        ) THEN
          ALTER TABLE public.schedules
            ALTER COLUMN doctor_id TYPE VARCHAR
            USING doctor_id::text;
        END IF;
      END $$;
    `);
  } catch (err) {
    console.warn("[initDatabase] Gagal migrasi schedules.doctor_id:", err.message);
  }

  // Appointments / booking module
  await sql`
    CREATE TABLE IF NOT EXISTS public.appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      doctor_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      pasien_id VARCHAR NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      schedule_id UUID NULL REFERENCES public.schedules(id) ON DELETE SET NULL,
      appointment_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'booked',
      notes TEXT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      cancelled_at TIMESTAMPTZ NULL
    );
  `;

  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_appointments_pasien_date ON public.appointments(pasien_id, appointment_date);`);

  // Migration safety: jika kolom doctor_id/pasien_id sudah terlanjur UUID, ubah menjadi VARCHAR.
  try {
    await sql.unsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='appointments' AND column_name='doctor_id' AND data_type='uuid'
        ) THEN
          ALTER TABLE public.appointments
            ALTER COLUMN doctor_id TYPE VARCHAR
            USING doctor_id::text;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='appointments' AND column_name='pasien_id' AND data_type='uuid'
        ) THEN
          ALTER TABLE public.appointments
            ALTER COLUMN pasien_id TYPE VARCHAR
            USING pasien_id::text;
        END IF;
      END $$;
    `);
  } catch (err) {
    console.warn("[initDatabase] Gagal migrasi appointments doctor/pasien id:", err.message);
  }

  // Consultations
  await sql`
    CREATE TABLE IF NOT EXISTS public.consultations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pasien_id VARCHAR NOT NULL,
      doctor_id VARCHAR NOT NULL,
      booking_id UUID NULL,
      status VARCHAR NOT NULL DEFAULT 'aktif',
      topik TEXT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      ended_at TIMESTAMPTZ NULL,
      deleted_at TIMESTAMPTZ NULL
    );
  `;

  // Messages
  await sql`
    CREATE TABLE IF NOT EXISTS public.messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      consultation_id UUID NOT NULL,
      sender_id VARCHAR NOT NULL,
      message TEXT NULL,
      file_url TEXT NULL,
      type VARCHAR NOT NULL DEFAULT 'text',
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL
    );
  `;

  // Migration safety: ensure consultation_id exists in messages
  try {
    await sql.unsafe(`
      ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS consultation_id UUID;
    `);
  } catch (err) {
    console.warn("[initDatabase] Gagal alter messages:", err.message);
  }

  // Medical Records
  await sql`
    CREATE TABLE IF NOT EXISTS public.medical_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pasien_id VARCHAR NOT NULL,
      doctor_id VARCHAR NULL,
      booking_id UUID NULL,
      type VARCHAR NOT NULL,
      judul VARCHAR NOT NULL,
      deskripsi TEXT NULL,
      catatan_dokter TEXT NULL,
      attachment_url TEXT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL
    );
  `;

  // Drop the constraint that causes issues with dynamic types like "Upload User" or "Tindakan Medis"
  try {
    await sql.unsafe(`ALTER TABLE public.medical_records DROP CONSTRAINT IF EXISTS medical_records_type_check;`);
  } catch (err) {
    console.warn("[initDatabase] Gagal drop constraint medical_records_type_check:", err.message);
  }
  // Health Documents
  await sql`
    CREATE TABLE IF NOT EXISTS public.health_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pasien_id VARCHAR NOT NULL,
      doctor_id VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      keperluan TEXT NULL,
      catatan TEXT NULL,
      catatan_dokter TEXT NULL,
      status VARCHAR NOT NULL DEFAULT 'draft',
      berlaku_dari DATE NULL,
      berlaku_sampai DATE NULL,
      verified_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}
