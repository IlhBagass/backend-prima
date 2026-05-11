import { getDoctorDetailService, listDoctorsService } from "../service/doctor.service.js";

export const listDoctors = async (req, reply) => {
  try {
    const { nama, spesialisasi, kota, rating_min, tersedia, limit, offset } = req.query || {};
    const data = await listDoctorsService({ nama, spesialisasi, kota, rating_min, tersedia, limit, offset });
    return reply.send({ success: true, data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const getDoctorDetail = async (req, reply) => {
  try {
    const { id } = req.params;
    const data = await getDoctorDetailService(id);
    if (!data) return reply.code(404).send({ success: false, message: "Dokter tidak ditemukan" });
    return reply.send({ success: true, data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

