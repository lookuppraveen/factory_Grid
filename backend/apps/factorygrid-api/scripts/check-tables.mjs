import pg from 'pg';
async function main() {
  process.loadEnvFile('backend/apps/factorygrid-api/.env');
  const dbUrl = process.env.DATABASE_URL || 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid';
  const pool = new pg.Pool({ connectionString: dbUrl });
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('PostgreSQL Tables:', res.rows.map(r => r.table_name));
  await pool.end();
}
main().catch(err => { console.error(err); process.exit(1); });
