import './src/config/env.js';
import { sql, initDatabase } from './src/config/db.js';

async function check() {
  await initDatabase();
  const users = await sql`SELECT email, role FROM users`;
  console.log(users);
  process.exit(0);
}

check();
