import pg from 'pg';
async function main() {
  process.loadEnvFile('backend/apps/factorygrid-api/.env');
  const dbUrl = process.env.DATABASE_URL || 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid';
  const pool = new pg.Pool({ connectionString: dbUrl });
  const rows = await pool.query(`
    SELECT DISTINCT product_type_id, category
    FROM categories
    ORDER BY product_type_id, category
  `);
  console.log('Distinct categories per Product Type in DB:');
  console.table(rows.rows);
  await pool.end();
}
main().catch(err => { console.error(err); process.exit(1); });
