import pg from 'pg';
async function main() {
  process.loadEnvFile('backend/apps/factorygrid-api/.env');
  const dbUrl = process.env.DATABASE_URL || 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid';
  const pool = new pg.Pool({ connectionString: dbUrl });
  const countRes = await pool.query("SELECT COUNT(*) FROM categories");
  console.log('Categories count in Postgres:', countRes.rows[0].count);
  const sample = await pool.query("SELECT category_id, category, sub_category, sub_sub_category, category_code FROM categories LIMIT 5");
  console.log('Sample rows:', sample.rows);
  await pool.end();
}
main().catch(err => { console.error(err); process.exit(1); });
