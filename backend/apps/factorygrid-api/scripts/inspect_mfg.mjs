import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid' });

async function run() {
  const res = await pool.query(`
    SELECT mp.id, mp.registration_id, mp.product_id, cp.name as product_name, mr.company_name as mfg_name, mp.is_preferred, mp.lifecycle_status
    FROM manufacturer_products mp
    LEFT JOIN catalog_products cp ON cp.id = mp.product_id
    LEFT JOIN manufacturer_registrations mr ON mr.id = mp.registration_id
    LIMIT 10
  `);
  console.log('Sample mappings in DB:');
  console.table(res.rows);
  await pool.end();
}

run().catch(console.error);
