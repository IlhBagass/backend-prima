import {
  exportCsvService,
  exportPdfService,
  reportAppointmentsService,
  reportConsultationsService,
  reportMedicalRecordsService,
  reportRevenueService,
  reportUsersService,
} from "../service/report.service.js";

export const reportUsersController = async (req, reply) => {
  try {
    const data = await reportUsersService(req.query || {});
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const reportAppointmentsController = async (req, reply) => {
  try {
    const data = await reportAppointmentsService(req.query || {});
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const reportConsultationsController = async (req, reply) => {
  try {
    const data = await reportConsultationsService(req.query || {});
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const reportMedicalRecordsController = async (req, reply) => {
  try {
    const data = await reportMedicalRecordsService(req.query || {});
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const reportRevenueController = async (req, reply) => {
  try {
    const data = await reportRevenueService(req.query || {});
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const exportPdfController = async (req, reply) => {
  try {
    const { type, date_from, date_to } = req.query || {};
    const { filename, pdfBuffer } = await exportPdfService({ type, date_from, date_to });

    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);
    return reply.send(pdfBuffer);
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const exportCsvController = async (req, reply) => {
  try {
    const { type, date_from, date_to } = req.query || {};
    const { filename, csvText } = await exportCsvService({ type, date_from, date_to });

    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);
    return reply.send(csvText);
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

