import { 
    createImmunization, 
    getImmunizations, 
    getImmunizationById, 
    updateImmunization,
    deleteImmunization 
} from "../services/immunization.service.js"

export async function createImmunizationController(req, reply) {
    try {
        const immunization = await createImmunization(req.body)

        return reply.code(201).send({
            success: true,
            message: "Imunisasi berhasil dibuat",
            data: immunization,
        })
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        })
    }
}

export async function getImmunizationsController(req, reply) {
    try {
        const immunizations = await getImmunizations()
        return reply.code(200).send({
            success: true,
            message: "Imunisasi berhasil diambil",
            data: immunizations,
        })
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        })
    }
}

export async function getImmunizationByIdController(req, reply) {
    try {
        const immunization = await getImmunizationById(req.params.id)
        return reply.code(200).send({
            success: true,
            message: "Imunisasi berhasil diambil",
            data: immunization,
        })
    } catch (error) {
        return reply.code(500).json({
            success: false,
            message: error.message,
        })
    }
}

export async function updateImmunizationController(req, reply) {
    try {
        const immunization = await updateImmunization(req.params.id, req.body)
        return reply.code(200).send({
            success: true,
            message: "Imunisasi berhasil diupdate",
            data: immunization,
        })
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        })
    }
}

export async function deleteImmunizationController(req, reply) {
    try {
        const immunization = await deleteImmunization(req.params.id)
        return reply.code(200).send({
            success: true,
            message: "Imunisasi berhasil dihapus",
            data: immunization,
        })
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        })
    }
}

