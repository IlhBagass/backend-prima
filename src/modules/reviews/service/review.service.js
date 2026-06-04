import { sql } from "../../../config/db.js";
import { callMaiaJson } from "../utils/maia.js";

const INSIGHT_DISCLAIMER = "Insight ini dihasilkan oleh AI berdasarkan ulasan pasien.";

const clampLimitOffset = ({ limit = 50, offset = 0 } = {}) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;
  return { safeLimit, safeOffset };
};

const getDoctorProfile = async (doctorId) => {
  const rows = await sql.query(
    `
      SELECT id, name, spesialisasi
      FROM users
      WHERE id = $1
        AND role = 'doctor'
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [doctorId]
  );
  return rows[0] || null;
};

const getPasienProfile = async (pasienId) => {
  const rows = await sql.query(
    `
      SELECT id, name
      FROM users
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [pasienId]
  );
  return rows[0] || null;
};

const analyzeSentimentAi = async ({ rating, ulasan }) => {
  const schema_hint = {
    label: "Positif|Netral|Negatif",
    score: "number (0-1)",
    aspects: {
      positif: ["string"],
      negatif: ["string"],
    },
    disclaimer: "string",
  };

  const ai = await callMaiaJson({
    task: "Analisis Sentimen Ulasan Dokter",
    schema_hint,
    disclaimer: "Analisis ini dibuat oleh AI dan bisa saja tidak akurat.",
    user_payload: { rating, ulasan },
  });

  const labelRaw = String(ai?.label || "").toLowerCase();
  const label = labelRaw.includes("neg") ? "Negatif" : labelRaw.includes("net") ? "Netral" : "Positif";
  const score = Number(ai?.score);
  const normalizedScore = Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : null;

  const sentiment = label === "Negatif" ? "negatif" : label === "Netral" ? "netral" : "positif";

  return {
    sentiment,
    sentiment_score: normalizedScore,
    sentiment_detail: {
      label,
      score: normalizedScore,
      aspects: ai?.aspects || { positif: [], negatif: [] },
    },
  };
};

export const createReviewService = async ({ pasien_id, doctor_id, booking_id, rating, ulasan }) => {
  const pasien = await getPasienProfile(pasien_id);
  if (!pasien) throw new Error("Pasien tidak ditemukan");

  const doctor = await getDoctorProfile(doctor_id);
  if (!doctor) throw new Error("Dokter tidak ditemukan");

  const inserted = await sql.query(
    `
      INSERT INTO reviews
        (pasien_id, doctor_id, booking_id, rating, ulasan)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING id, pasien_id, doctor_id, booking_id, rating, ulasan, sentiment, sentiment_score, sentiment_detail, created_at
    `,
    [pasien_id, doctor_id, booking_id, rating, ulasan]
  );

  const review = inserted[0];
  if (!review) throw new Error("Gagal membuat ulasan");

  const sentiment = await analyzeSentimentAi({ rating, ulasan });

  const updated = await sql.query(
    `
      UPDATE reviews
      SET sentiment = $2,
          sentiment_score = $3,
          sentiment_detail = $4
      WHERE id = $1
      RETURNING id, pasien_id, doctor_id, booking_id, rating, ulasan, sentiment, sentiment_score, sentiment_detail, created_at
    `,
    [review.id, sentiment.sentiment, sentiment.sentiment_score, sentiment.sentiment_detail]
  );

  const finalReview = updated[0] || review;

  return {
    review: {
      ...finalReview,
      sentiment: finalReview.sentiment
        ? {
            label: finalReview.sentiment_detail?.label || (finalReview.sentiment === "positif" ? "Positif" : finalReview.sentiment === "negatif" ? "Negatif" : "Netral"),
            score: finalReview.sentiment_score,
            aspects: finalReview.sentiment_detail?.aspects || { positif: [], negatif: [] },
          }
        : null,
    },
  };
};

export const listReviewsByDoctorService = async (doctorId, { sentiment, rating_min, limit, offset } = {}) => {
  const doctor = await getDoctorProfile(doctorId);
  if (!doctor) throw new Error("Dokter tidak ditemukan");

  const { safeLimit, safeOffset } = clampLimitOffset({ limit, offset });

  const where = ["r.doctor_id = $1"];
  const params = [doctorId];

  if (sentiment) {
    params.push(String(sentiment).toLowerCase());
    where.push(`r.sentiment = $${params.length}`);
  }
  if (rating_min !== undefined) {
    params.push(rating_min);
    where.push(`r.rating >= $${params.length}`);
  }

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const reviews = await sql.query(
    `
      SELECT
        r.id,
        r.pasien_id,
        u_pasien.name AS pasien_name,
        r.doctor_id,
        r.booking_id,
        r.rating,
        r.ulasan,
        r.sentiment,
        r.sentiment_score,
        r.sentiment_detail,
        r.created_at
      FROM reviews r
      LEFT JOIN users u_pasien ON u_pasien.id = r.pasien_id
      WHERE ${where.join(" AND ")}
      ORDER BY r.created_at DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `,
    params
  );

  const stats = await sql.query(
    `
      SELECT
        COUNT(*)::int AS total_ulasan,
        AVG(rating)::float AS rata_rata_rating,
        SUM(CASE WHEN sentiment = 'positif' THEN 1 ELSE 0 END)::int AS positif,
        SUM(CASE WHEN sentiment = 'netral' THEN 1 ELSE 0 END)::int AS netral,
        SUM(CASE WHEN sentiment = 'negatif' THEN 1 ELSE 0 END)::int AS negatif
      FROM reviews
      WHERE doctor_id = $1
    `,
    [doctorId]
  );

  const s = stats[0] || { total_ulasan: 0, rata_rata_rating: null, positif: 0, netral: 0, negatif: 0 };

  return {
    doctor: {
      nama: doctor.name,
      total_ulasan: s.total_ulasan,
      rata_rata_rating: s.rata_rata_rating ? Math.round(s.rata_rata_rating * 10) / 10 : 0,
    },
    sentiment_breakdown: { positif: s.positif, netral: s.netral, negatif: s.negatif },
    reviews,
  };
};

export const listReviewsByPasienService = async (pasienId, { limit, offset } = {}) => {
  const { safeLimit, safeOffset } = clampLimitOffset({ limit, offset });

  const params = [pasienId, safeLimit, safeOffset];
  const reviews = await sql.query(
    `
      SELECT
        r.id,
        r.pasien_id,
        r.doctor_id,
        u_doctor.name AS doctor_name,
        u_doctor.spesialisasi AS doctor_spesialisasi,
        r.booking_id,
        r.rating,
        r.ulasan,
        r.sentiment,
        r.sentiment_score,
        r.sentiment_detail,
        r.created_at
      FROM reviews r
      LEFT JOIN users u_doctor ON u_doctor.id = r.doctor_id
      WHERE r.pasien_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
      OFFSET $3
    `,
    params
  );

  return { reviews };
};

export const getReviewByIdService = async (id) => {
  const rows = await sql.query(
    `
      SELECT
        r.*,
        u_pasien.name AS pasien_name,
        u_doctor.name AS doctor_name,
        u_doctor.spesialisasi AS doctor_spesialisasi
      FROM reviews r
      LEFT JOIN users u_pasien ON u_pasien.id = r.pasien_id
      LEFT JOIN users u_doctor ON u_doctor.id = r.doctor_id
      WHERE r.id = $1
      LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
};

export const getDoctorInsightService = async (doctorId) => {
  const doctor = await getDoctorProfile(doctorId);
  if (!doctor) throw new Error("Dokter tidak ditemukan");

  const stats = await sql.query(
    `
      SELECT
        COUNT(*)::int AS total_ulasan,
        AVG(rating)::float AS rata_rata_rating,
        SUM(CASE WHEN sentiment = 'positif' THEN 1 ELSE 0 END)::int AS positif,
        SUM(CASE WHEN sentiment = 'netral' THEN 1 ELSE 0 END)::int AS netral,
        SUM(CASE WHEN sentiment = 'negatif' THEN 1 ELSE 0 END)::int AS negatif
      FROM reviews
      WHERE doctor_id = $1
    `,
    [doctorId]
  );
  const s = stats[0] || { total_ulasan: 0, rata_rata_rating: null, positif: 0, netral: 0, negatif: 0 };

  // Batasi agar tidak kebanyakan token
  const rawReviews = await sql.query(
    `
      SELECT rating, ulasan, sentiment
      FROM reviews
      WHERE doctor_id = $1
      ORDER BY created_at DESC
      LIMIT 200
    `,
    [doctorId]
  );

  const ai = await callMaiaJson({
    task: "AI Summary Insight Dokter dari Ulasan",
    schema_hint: {
      ringkasan: "string",
      kelebihan: ["string"],
      kekurangan: ["string"],
      saran_perbaikan: ["string"],
      disclaimer: "string",
    },
    disclaimer: INSIGHT_DISCLAIMER,
    user_payload: {
      doctor: { id: doctor.id, nama: doctor.name, spesialisasi: doctor.spesialisasi },
      stats: {
        total_ulasan: s.total_ulasan,
        rata_rata_rating: s.rata_rata_rating,
        sentiment_breakdown: { positif: s.positif, netral: s.netral, negatif: s.negatif },
      },
      reviews: rawReviews,
    },
  });

  return {
    doctor: {
      nama: doctor.name,
      total_ulasan: s.total_ulasan,
      rata_rata_rating: s.rata_rata_rating ? Math.round(s.rata_rata_rating * 10) / 10 : 0,
    },
    sentiment_breakdown: { positif: s.positif, netral: s.netral, negatif: s.negatif },
    insight: {
      ringkasan: ai?.ringkasan ?? "",
      kelebihan: Array.isArray(ai?.kelebihan) ? ai.kelebihan : [],
      kekurangan: Array.isArray(ai?.kekurangan) ? ai.kekurangan : [],
      saran_perbaikan: Array.isArray(ai?.saran_perbaikan) ? ai.saran_perbaikan : [],
    },
    disclaimer: INSIGHT_DISCLAIMER,
  };
};

