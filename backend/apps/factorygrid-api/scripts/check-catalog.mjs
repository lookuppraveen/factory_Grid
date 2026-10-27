import pg from 'pg';
async function main() {
  process.loadEnvFile('backend/apps/factorygrid-api/.env');
  const dbUrl = process.env.DATABASE_URL || 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid';
  const pool = new pg.Pool({ connectionString: dbUrl });
  const res = await pool.query("SELECT id, product_code, name, generic_name, dosage_form, category FROM catalog_products");
  console.log('Catalog products count:', res.rows.length);
  console.log(res.rows);
  await pool.end();
}
main().catch(err => { console.error(err); process.exit(1); });
