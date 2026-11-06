import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid' });

async function run() {
  const count = await pool.query('SELECT count(*) FROM manufacturer_registrations');
  const countApproved = await pool.query("SELECT count(*) FROM manufacturer_registrations WHERE status='APPROVED'");
  const sample = await pool.query('SELECT id, registration_code, company_name, contact_person, email, phone, status, current_step FROM manufacturer_registrations LIMIT 5');
  console.log('Mfg count:', count.rows[0].count, 'Approved:', countApproved.rows[0].count);
  console.log('Sample mfgs:', sample.rows);

  const mfgProdCount = await pool.query('SELECT count(*) FROM manufacturer_products');
  const mfgProdSample = await pool.query('SELECT * FROM manufacturer_products LIMIT 5');
  console.log('Mfg products count:', mfgProdCount.rows[0].count);
  console.log('Sample mfg products:', mfgProdSample.rows);

  const mfgCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='manufacturer_registrations'");
  console.log('Mfg columns:', mfgCols.rows.map(c => `${c.column_name} (${c.data_type})`));

  await pool.end();
}

run().catch(console.error);
