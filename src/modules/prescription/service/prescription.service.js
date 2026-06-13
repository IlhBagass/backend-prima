import { sql } from "../../../config/db.js";
import crypto, { randomUUID } from "crypto";

export async function createPrescription(payload) {
    const id = crypto.randomUUID();

    const result = await sql`
        INSERT INTO prescriptions (
            id,
            patient_id,
            doctor_id,
            booking_id,
            notes
        )
        VALUES (
            ${id},
            ${payload.patient_id},
            ${payload.doctor_id},
            ${payload.booking_id},
            ${payload.notes}
        )
        RETURNING *;
    `;
    
    return result[0];
}

export async function getPrescriptionById(id) {

    const result = await sql`
        SELECT
            p.*,

            patient.name AS patient_name,
            patient.email AS patient_email,

            doctor.name AS doctor_name,
            doctor.email AS doctor_email

        FROM prescriptions p

        LEFT JOIN users patient
            ON patient.id = p.patient_id

        LEFT JOIN users doctor
            ON doctor.id = p.doctor_id

        WHERE p.id = ${id};
    `;

    if (result.length === 0) {
        return null;
    }

    const items = await sql`
        SELECT *
        FROM prescription_items
        WHERE prescription_id = ${id};
    `;

    return {
        ...result[0],
        items,
    };
}

export async function updatePrescription(id, payload) {
    const result = await sql`
        UPDATE prescriptions
        SET 
            patient_id = ${payload.patient_id},
            doctor_id = ${payload.doctor_id},
            booking_id = ${payload.booking_id},
            notes = ${payload.notes}
        WHERE id = ${id}
        RETURNING *;
    `;
    
    return result[0];
}

export async function deletePrescription(id) {
    const result = await sql`
        DELETE FROM prescriptions WHERE id = ${id};
    `;
    
    return result;
}

export async function getAllPrescription() {
    const prescriptions = await sql`
        SELECT * FROM prescriptions;
    `;

    const items = await sql`
        SELECT * FROM prescription_items;
    `;

    const result = prescriptions.map((prescription) => {
        const prescriptionItems = items.filter(
            (item) => item.prescription_id === prescription.id
        );

        return {
            ...prescription,
            items: prescriptionItems,
        };
    });

    return result;
}
//TODO: Create items prescription
export async function createItemsPrescription(payload) {
    const id = crypto.randomUUID();

    const create = await sql`
        INSERT INTO prescription_items (
            id,
            prescription_id,
            medicine_name,
            dosage,
            frequency,
            duration,
            quantity,
            instructions
        )
        VALUES (
            ${id},
            ${payload.prescription_id},
            ${payload.medicine_name},
            ${payload.dosage},
            ${payload.frequency},
            ${payload.duration},
            ${payload.quantity},
            ${payload.instructions}
        )
        RETURNING *;
    `;
    
    return create[0];
}

export async function deleteItemsPrescription(payload) {
    const id = typeof payload === "object" ? payload.id : payload;
    const result = await sql`
        DELETE FROM prescription_items WHERE id = ${id};
    `;
    
    return result;
}

export async function updateItemsPrescription(id, payload) {
    const result = await sql`
        UPDATE prescription_items
        SET 
            medicine_name = ${payload.medicine_name},
            dosage = ${payload.dosage},
            frequency = ${payload.frequency},
            duration = ${payload.duration},
            quantity = ${payload.quantity},
            instructions = ${payload.instructions}
        WHERE id = ${id}
        RETURNING *;
    `;
    
    return result[0];
}
