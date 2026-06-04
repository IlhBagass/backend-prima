import {
  createReviewService,
  getDoctorInsightService,
  getReviewByIdService,
  listReviewsByDoctorService,
  listReviewsByPasienService,
} from "../service/review.service.js";

const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
};

export const createReviewController = async (req, reply) => {
  try {
    const payload = req.body || {};

    if (!payload.pasien_id) return reply.code(400).send({ success: false, message: "pasien_id wajib diisi" });
    if (!payload.doctor_id) return reply.code(400).send({ success: false, message: "doctor_id wajib diisi" });

    const rating = toInt(payload.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return reply.code(400).send({ success: false, message: "rating wajib 1-5" });
    }

    const ulasan = (payload.ulasan || "").toString().trim();
    if (!ulasan) return reply.code(400).send({ success: false, message: "ulasan wajib diisi" });

    const data = await createReviewService({
      pasien_id: payload.pasien_id,
      doctor_id: payload.doctor_id,
      booking_id: payload.booking_id ?? null,
      rating,
      ulasan,
    });

    return reply.code(201).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const listReviewsByDoctorController = async (req, reply) => {
  try {
    const { doctor_id } = req.params || {};
    const { sentiment, rating_min, limit, offset } = req.query || {};

    const ratingMin = rating_min === undefined ? undefined : toInt(rating_min);
    if (ratingMin !== undefined && Number.isFinite(ratingMin) && (ratingMin < 1 || ratingMin > 5)) {
      return reply.code(400).send({ success: false, message: "rating_min harus 1-5" });
    }

    const data = await listReviewsByDoctorService(doctor_id, {
      sentiment,
      rating_min: Number.isFinite(ratingMin) ? ratingMin : undefined,
      limit,
      offset,
    });

    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const listReviewsByPasienController = async (req, reply) => {
  try {
    const { pasien_id } = req.params || {};
    const { limit, offset } = req.query || {};

    const data = await listReviewsByPasienService(pasien_id, { limit, offset });
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const getReviewByIdController = async (req, reply) => {
  try {
    const { id } = req.params || {};
    const data = await getReviewByIdService(id);
    if (!data) return reply.code(404).send({ success: false, message: "Ulasan tidak ditemukan" });
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const getDoctorInsightController = async (req, reply) => {
  try {
    const { doctor_id } = req.params || {};
    const data = await getDoctorInsightService(doctor_id);
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

