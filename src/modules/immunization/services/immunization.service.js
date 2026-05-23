import { sql } from "../../../config/db.js"
import crypto from "crypto"

export async function createImmunization(payload) {
    const id = crypto.randomUUID()

    const create = await sql`
        INSERT INTO immunizations (
            id,
            pasien_id,
            doctor_id,
            nama_vaksin,
            jenis_vaksin,
            dosis_ke,
            tanggal_vaksin,
            lokasi,
            catatan,
            tanggal_berikutnya
        )
        VALUES (
            ${id},
            ${payload.pasien_id},
            ${payload.doctor_id},
            ${payload.nama_vaksin},
            ${payload.jenis_vaksin},
            ${payload.dosis_ke},
            ${payload.tanggal_vaksin},
            ${payload.lokasi},
            ${payload.catatan},
            ${payload.tanggal_berikutnya}
        )
        RETURNING *
    `
    
    return create[0]
}

export async function getImmunizations() {
    const immunizations = await sql`
        SELECT * FROM immunizations
    `
    return immunizations
}

export async function getImmunizationById(id) {
    const immunization = await sql`
        SELECT * FROM immunizations WHERE id = ${id}
    `
    return immunization[0]
}

export async function updateImmunization(id, payload) {
    const update = await sql`
        UPDATE immunizations
        SET
            pasien_id = ${payload.pasien_id},
            doctor_id = ${payload.doctor_id},
            nama_vaksin = ${payload.nama_vaksin},
            jenis_vaksin = ${payload.jenis_vaksin},
            dosis_ke = ${payload.dosis_ke},
            tanggal_vaksin = ${payload.tanggal_vaksin},
            lokasi = ${payload.lokasi},
            catatan = ${payload.catatan},
            tanggal_berikutnya = ${payload.tanggal_berikutnya}
        WHERE id = ${id}
        RETURNING *
    `
    
    return update[0]
}

export async function deleteImmunization(id) {
    const deleteImmunization = await sql`
        DELETE FROM immunizations WHERE id = ${id}
    `
    return deleteImmunization[0]
}
