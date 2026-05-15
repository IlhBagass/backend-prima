import {
    createDocument,
    getDocumentById,
    getAllDocuments,
    updateDocument,
    deleteDocument
}from "../service/document.service.js"

import { 
    generatePDFSK,
    generatePDFSR,
    generatePDFSS
} from "../pdf/pdfGenerator.js";

export async function createDocumentsController(req, reply) {
    try {
        const data = await createDocument(req.body);
        return reply.code(201).send({
            success: true,
            message: "Document telah di buat",
            data,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function getIdByDocument(req,reply) {
    try {
        const data = await getDocumentById(req.params.id);
        return reply.code(200).send({
            success: true,
            message: "Document telah di dapat",
            data,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function getAllDocumentsController(req, reply) {
    try {
        const data = await getAllDocuments();
        return reply.code(200).send({
            success: true,
            message: "Document telah di dapat",
            data,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function updateDocumentController(req, reply) {
    try {
        const data = await updateDocument(req.params.id, req.body);
        return reply.code(200).send({
            success: true,
            message: "Document telah di update",
            data,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function deleteDocumentController(req, reply) {
    try {
        const data = await deleteDocument(req.params.id);
        return reply.code(200).send({
            success: true,
            message: "Document telah di delete",
            data,
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

//download document

export async function downloadDocumentSK(req, reply) {
    try {
        const document = await getDocumentById(req.params.id);

        if (!document) {
            return reply.code(404).send({
                success: false,
                message: "Dokumen tidak ditemukan",
            });
        }

        const pdfBuffer = await generatePDFSK(document);

        reply
            .header("Content-Type", "application/pdf")
            .header(
                "Content-Disposition",
                `attachment; filename=document-${document.id}.pdf`
            );

        return reply.send(pdfBuffer);

    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function downloadDocumentSR(req, reply) {
    try {
        const document = await getDocumentById(req.params.id);

        if (!document) {
            return reply.code(404).send({
                success: false,
                message: "Dokumen tidak ditemukan",
            });
        }

        const pdfBuffer = await generatePDFSR(document);

        reply
            .header("Content-Type", "application/pdf")
            .header(
                "Content-Disposition",
                `attachment; filename=document-${document.id}.pdf`
            );

        return reply.send(pdfBuffer);

    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}

export async function downloadDocumentSS(req, reply) {
    try {
        const document = await getDocumentById(req.params.id);

        if (!document) {
            return reply.code(404).send({
                success: false,
                message: "Dokumen tidak ditemukan",
            });
        }

        const pdfBuffer = await generatePDFSS(document);

        reply
            .header("Content-Type", "application/pdf")
            .header(
                "Content-Disposition",
                `attachment; filename=document-${document.id}.pdf`
            );

        return reply.send(pdfBuffer);

    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: error.message,
        });
    }
}