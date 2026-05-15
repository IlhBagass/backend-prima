import { sql } from "../../../config/db.js"
import crypto from "crypto"

export async function createDocument(payload) {
    const id = crypto.randomUUID()
    const create = await sql`
    INSERT INTO health_documents
    (id, pasien_id, doctor_id, type, keperluan, catatan, catatan_dokter, status, berlaku_dari, berlaku_sampai)
    VALUES (
        ${id},
        ${payload.pasien_id},
        ${payload.doctor_id},
        ${payload.type},
        ${payload.keperluan},
        ${payload.catatan},
        ${payload.catatan_dokter},
        ${payload.status},
        ${payload.berlaku_dari},
        ${payload.berlaku_sampai}
    )
    RETURNING *`

    return create[0];
}

export async function getDocumentById(id) {
    const document = await sql`
        SELECT
            p.*,

            patient.name AS pasien_name,
            patient.email AS pasien_email,

            doctor.name AS doctor_name,
            doctor.email AS doctor_email

        FROM health_documents p

        LEFT JOIN users patient
            ON patient.id = p.pasien_id

        LEFT JOIN users doctor
            ON doctor.id = p.doctor_id

        WHERE p.id = ${id};
    `;

    return document[0];
}

export async function getAllDocuments() {
    const documents = await sql`
    SELECT * FROM health_documents`
    return documents;
}

export async function updateDocument(id, payload) {
    const update = await sql`
    UPDATE health_documents
    SET 
        pasien_id = ${payload.pasien_id},
        doctor_id = ${payload.doctor_id},
        type = ${payload.type},
        keperluan = ${payload.keperluan},
        catatan = ${payload.catatan},
        catatan_dokter = ${payload.catatan_dokter},
        status = ${payload.status},
        berlaku_dari = ${payload.berlaku_dari},
        berlaku_sampai = ${payload.berlaku_sampai},
        verified_at = ${payload.verified_at},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *`
    return update[0];
}

export async function deleteDocument(id) {
    const deleteDoc = await sql`
    DELETE FROM health_documents WHERE id = ${id}
    RETURNING *`
    return deleteDoc[0];
}