import { 
    createImmunization, 
    getImmunizations, 
    getImmunizationById, 
    updateImmunization,
    deleteImmunization 
} from "../services/immunization.service.js"

export async function createImmunizationController(req, res) {
    try {
        const immunization = await createImmunization(req.body)
        return res.status(201).json({
            success: true,
            message: "Imunisasi berhasil dibuat",
            data: immunization,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export async function getImmunizationsController(req, res) {
    try {
        const immunizations = await getImmunizations()
        return res.status(200).json({
            success: true,
            message: "Imunisasi berhasil diambil",
            data: immunizations,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export async function getImmunizationByIdController(req, res) {
    try {
        const immunization = await getImmunizationById(req.params.id)
        return res.status(200).json({
            success: true,
            message: "Imunisasi berhasil diambil",
            data: immunization,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export async function updateImmunizationController(req, res) {
    try {
        const immunization = await updateImmunization(req.params.id, req.body)
        return res.status(200).json({
            success: true,
            message: "Imunisasi berhasil diupdate",
            data: immunization,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

export async function deleteImmunizationController(req, res) {
    try {
        const immunization = await deleteImmunization(req.params.id)
        return res.status(200).json({
            success: true,
            message: "Imunisasi berhasil dihapus",
            data: immunization,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

