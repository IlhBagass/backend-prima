const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);

async function check() {
  try {
    const res = await sql`SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'health_documents_status_check'`;
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
check();
