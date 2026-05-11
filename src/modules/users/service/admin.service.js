import { sql } from "../../../config/db.js";
import bcrypt from "bcrypt";
import { generateHexId } from "../../../utils/id.js";

export const registerAdminService = async ({
  name,
  email,
  password,
  jenis_kelamin,
  no_telepon,
  kota,
  provinsi,
}) => {

  const emailCheck = await sql`
    SELECT id FROM users 
    WHERE email = ${email} 
    AND deleted_at IS NULL
  `;
  if (emailCheck.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  let id = generateHexId(5); 
  for (let i = 0; i < 5; i++) {
    const exists = await sql`
      SELECT id FROM users
      WHERE id = ${id}
      LIMIT 1
    `;
    if (exists.length === 0) break;
    id = generateHexId(5);
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await sql`
    INSERT INTO users (
      id, name, email, password, role,
      status, email_verified_at,
      jenis_kelamin, no_telepon, kota, provinsi,
      created_at, updated_at
    ) VALUES (
      ${id}, ${name}, ${email}, ${hashedPassword}, 'admin',
      'aktif', CURRENT_TIMESTAMP,
      ${jenis_kelamin}, ${no_telepon}, ${kota}, ${provinsi},
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id, name, email, role, status, created_at
  `;

  return result[0];
};
