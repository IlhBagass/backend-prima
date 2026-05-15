import { 
    createPrescription, getPrescriptionById,
    updatePrescription,
    deletePrescription,
    getAllPrescription,
    createItemsPrescription,
    updateItemsPrescription,
    deleteItemsPrescription
} from "../service/prescription.service.js";

import { generatePrescriptionPdf } from "../pdf/generatePDF.js";

export async function createPrescriptionController(req, reply) {
    try {
        const prescription = await createPrescription(req.body);
        return reply.code(201).send({
            success: true,
            message: "Resep berhasil dibuat",
            data: prescription,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function getPrescriptionByIdController(req, reply) {
    try {
        const prescription = await getPrescriptionById(req.params.id);
        return reply.code(200).send({
            success: true,
            message: "Resep berhasil diambil",
            data: prescription,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function updatePrescriptionByIdController(req, reply) {
    try {
        const prescription = await updatePrescription(req.params.id, req.body);
        return reply.code(200).send({
            success: true,
            message: "Resep berhasil diupdate",
            data: prescription,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function deletePrescriptionByIdController(req, reply) {
    try {
        const prescription = await deletePrescription(req.params.id);
        return reply.code(200).send({
            success: true,
            message: "Resep berhasil dihapus",
            data: prescription,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function getAllPrescriptionController(req,reply) {
    try {
        const prescription = await getAllPrescription();
        return reply.code(200).send({
            success: true,
            message: "Resep berhasil diambil",
            data: prescription,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}
//TODO: Create items prescription
export async function createItemsPrescriptionController(req, reply) {
    try {
        const prescription = await createItemsPrescription(req.body);
        return reply.code(201).send({
            success: true,
            message: "Item resep berhasil dibuat",
            data: prescription,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function deleteItemsPrescriptionController(req, reply) {
    try {
        const prescription = await deleteItemsPrescription(req.params.id);
        return reply.code(200).send({
            success: true,
            message: "Item resep berhasil dihapus",
            data: prescription,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function updateItemsPrescriptionController(req, reply) {
    try {
        const prescription = await updateItemsPrescription(req.params.id, req.body);
        return reply.code(200).send({
            success: true,
            message: "Item resep berhasil diupdate",
            data: prescription,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}
//generatePDF
export async function downloadPrescriptionPdfController(req, reply) {
    try {
        const prescription = await getPrescriptionById(req.params.id);

        if (!prescription) {
            return reply.code(404).send({
                success: false,
                message: "Resep tidak ditemukan",
            });
        }

        const pdfBuffer = await generatePrescriptionPdf(prescription);

        reply
            .header("Content-Type", "application/pdf")
            .header(
                "Content-Disposition",
                `attachment; filename=prescription-${prescription.id}.pdf`
            );

        return reply.send(pdfBuffer);

    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}


