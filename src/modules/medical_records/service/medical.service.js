import { sql } from "../../../config/db.js";
import crypto from "crypto";

export async function createMedicalRecord(payload) {
  const id = crypto.randomUUID();

  const result = await sql`
    INSERT INTO medical_records (
      id,
      pasien_id,
      doctor_id,
      booking_id,
      type,
      judul,
      deskripsi,
      catatan_dokter,
      attachment_url
    )
    VALUES (
      ${id},
      ${payload.pasien_id},
      ${payload.doctor_id || null},
      ${payload.booking_id || null},
      ${payload.type},
      ${payload.judul},
      ${payload.deskripsi || null},
      ${payload.catatan_dokter || null},
      ${payload.attachment_url || null}
    )
    RETURNING *;
  `;

  return result[0];
}

export async function getMedicalRecordsByPasien({
  pasien_id,
  type,
  date_from,
  date_to,
  limit = 10,
  offset = 0,
}) {
  let query = `
    SELECT *
    FROM medical_records
    WHERE pasien_id = $1
      AND deleted_at IS NULL
  `;

  const values = [pasien_id];
  let index = 2;

  if (type) {
    query += ` AND type = $${index}`;
    values.push(type);
    index++;
  }

  if (date_from) {
    query += ` AND created_at >= $${index}`;
    values.push(date_from);
    index++;
  }

  if (date_to) {
    query += ` AND created_at <= $${index}`;
    values.push(date_to);
    index++;
  }

  query += `
    ORDER BY created_at DESC
    LIMIT $${index}
    OFFSET $${index + 1}
  `;

  values.push(limit);
  values.push(offset);

  const result = await sql.query(query, values);
  return result.rows || result;
}

export async function getMedicalRecordsByDoctor({
  doctor_id,
  type,
  date_from,
  date_to,
  limit = 10,
  offset = 0,
}) {
  let query = `
    SELECT *
    FROM medical_records
    WHERE doctor_id = $1
      AND deleted_at IS NULL
  `;

  const values = [doctor_id];
  let index = 2;

  if (type) {
    query += ` AND type = $${index}`;
    values.push(type);
    index++;
  }

  if (date_from) {
    query += ` AND created_at >= $${index}`;
    values.push(date_from);
    index++;
  }

  if (date_to) {
    query += ` AND created_at <= $${index}`;
    values.push(date_to);
    index++;
  }

  query += `
    ORDER BY created_at DESC
    LIMIT $${index}
    OFFSET $${index + 1}
  `;

  values.push(limit);
  values.push(offset);

  const result = await sql.query(query, values);
  return result.rows || result;
}

export async function getMedicalRecordDetail(id) {
  const result = await sql`
    SELECT * FROM medical_records
    WHERE id = ${id} AND deleted_at IS NULL
  `;
  return result[0] || null;
}

export async function updateMedicalRecord(id, payload) {
  const fields = [];
  const values = [];
  let index = 1;

  if (payload.type !== undefined) {
    fields.push(`type = $${index}`);
    values.push(payload.type);
    index++;
  }
  if (payload.judul !== undefined) {
    fields.push(`judul = $${index}`);
    values.push(payload.judul);
    index++;
  }
  if (payload.deskripsi !== undefined) {
    fields.push(`deskripsi = $${index}`);
    values.push(payload.deskripsi);
    index++;
  }
  if (payload.catatan_dokter !== undefined) {
    fields.push(`catatan_dokter = $${index}`);
    values.push(payload.catatan_dokter);
    index++;
  }
  if (payload.attachment_url !== undefined) {
    fields.push(`attachment_url = $${index}`);
    values.push(payload.attachment_url);
    index++;
  }

  if (fields.length === 0) {
    return await getMedicalRecordDetail(id);
  }

  fields.push(`updated_at = NOW()`);
  
  values.push(id);
  const query = `
    UPDATE medical_records
    SET ${fields.join(', ')}
    WHERE id = $${index} AND deleted_at IS NULL
    RETURNING *
  `;

  const result = await sql.query(query, values);
  return (result.rows ? result.rows[0] : result[0]) || null;
}

export async function deleteMedicalRecord(id) {
  const result = await sql`
    UPDATE medical_records
    SET deleted_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *
  `;
  return result[0] || null;
}