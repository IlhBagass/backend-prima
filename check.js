import { sql } from './src/config/db.js';
async function run() {
  try {
    const res = await sql`SELECT pg_get_constraintdef(c.oid) AS def FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE c.conname = 'medical_records_type_check'`;
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
run();
