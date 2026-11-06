import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid' });

async function check() {
  const cats = await pool.query("SELECT DISTINCT category_id, category, category_code FROM categories");
  console.log('Categories in DB:');
  console.table(cats.rows);

  const mfgs = await pool.query("SELECT id, registration_code, manufacturer_code, company_name FROM manufacturer_registrations LIMIT 5");
  console.log('Sample Manufacturers in DB:');
  console.table(mfgs.rows);

  const prods = await pool.query("SELECT id, product_code, name, category FROM catalog_products LIMIT 5");
  console.log('Sample Products in DB:');
  console.table(prods.rows);

  await pool.end();
}

check().catch(console.error);
