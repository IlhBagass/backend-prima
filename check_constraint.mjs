import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function check() {
  try {
    const res = await sql`SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'health_documents_type_check'`;
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
check();
