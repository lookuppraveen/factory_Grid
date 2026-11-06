import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid' });

async function migrate() {
  console.log('--- Migrating Margin Engine Tables into PostgreSQL ---');

  // 1. category_margin_configs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS category_margin_configs (
      id VARCHAR(50) PRIMARY KEY,
      category_id VARCHAR(50) UNIQUE NOT NULL,
      category_name VARCHAR(150) NOT NULL,
      margin_mode VARCHAR(30) DEFAULT 'PERCENTAGE' NOT NULL,
      margin_value NUMERIC(12, 2) NOT NULL,
      effective_from TIMESTAMPTZ(6),
      effective_to TIMESTAMPTZ(6),
      status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL,
      created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      created_by VARCHAR(100) DEFAULT 'Admin',
      updated_by VARCHAR(100) DEFAULT 'Admin'
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cat_margin_cat_id ON category_margin_configs(category_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cat_margin_status ON category_margin_configs(status);`);

  // 2. manufacturer_margin_configs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS manufacturer_margin_configs (
      id VARCHAR(50) PRIMARY KEY,
      manufacturer_id VARCHAR(50) UNIQUE NOT NULL,
      manufacturer_name VARCHAR(150) NOT NULL,
      margin_mode VARCHAR(30) DEFAULT 'PERCENTAGE' NOT NULL,
      margin_value NUMERIC(12, 2) NOT NULL,
      effective_from TIMESTAMPTZ(6),
      effective_to TIMESTAMPTZ(6),
      status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL,
      created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      created_by VARCHAR(100) DEFAULT 'Admin',
      updated_by VARCHAR(100) DEFAULT 'Admin'
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_mfg_margin_mfg_id ON manufacturer_margin_configs(manufacturer_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_mfg_margin_status ON manufacturer_margin_configs(status);`);

  // 3. product_margin_configs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_margin_configs (
      id VARCHAR(50) PRIMARY KEY,
      product_id VARCHAR(50) NOT NULL,
      sku VARCHAR(100),
      product_name VARCHAR(250),
      manufacturer_id VARCHAR(50),
      manufacturer_name VARCHAR(150),
      margin_mode VARCHAR(30) DEFAULT 'PERCENTAGE' NOT NULL,
      margin_value NUMERIC(12, 2) NOT NULL,
      effective_from TIMESTAMPTZ(6),
      effective_to TIMESTAMPTZ(6),
      status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL,
      created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      created_by VARCHAR(100) DEFAULT 'Admin',
      updated_by VARCHAR(100) DEFAULT 'Admin',
      CONSTRAINT uq_product_manufacturer_margin UNIQUE NULLS NOT DISTINCT (product_id, manufacturer_id)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_prod_margin_prod_id ON product_margin_configs(product_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_prod_margin_mfg_id ON product_margin_configs(manufacturer_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_prod_margin_status ON product_margin_configs(status);`);

  // 4. platform_fee_configs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_fee_configs (
      id VARCHAR(50) PRIMARY KEY,
      fee_mode VARCHAR(30) DEFAULT 'PERCENTAGE' NOT NULL,
      fee_value NUMERIC(12, 2) DEFAULT 2.0 NOT NULL,
      fee_name VARCHAR(150) DEFAULT 'Platform Facilitation & Escrow Fee' NOT NULL,
      effective_from TIMESTAMPTZ(6),
      effective_to TIMESTAMPTZ(6),
      status VARCHAR(30) DEFAULT 'Active' NOT NULL,
      created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      created_by VARCHAR(100) DEFAULT 'Admin',
      updated_by VARCHAR(100) DEFAULT 'Admin'
    );
  `);

  // Seed default Platform Fee if none exists
  const existingFee = await pool.query('SELECT * FROM platform_fee_configs LIMIT 1');
  if (existingFee.rows.length === 0) {
    await pool.query(`
      INSERT INTO platform_fee_configs (id, fee_mode, fee_value, fee_name, status, created_at, updated_at)
      VALUES ('pf_default', 'PERCENTAGE', 2.00, 'Platform Facilitation & Escrow Fee', 'Active', NOW(), NOW());
    `);
    console.log('✓ Seeded default Platform Fee (2.0%).');
  }

  // Seed Canonical Category Margins (Drugs, Nutraceuticals, Cosmetics, Ayur/Herbal, Veterinary, Surgical)
  const canonicalCategories = [
    { id: 'cat_drugs', name: 'Drugs', marginMode: 'PERCENTAGE', marginValue: 10.0 },
    { id: 'cat_nutra', name: 'Nutraceuticals/Food', marginMode: 'PERCENTAGE', marginValue: 12.0 },
    { id: 'cat_cosmetics', name: 'Cosmetics', marginMode: 'PERCENTAGE', marginValue: 15.0 },
    { id: 'cat_ayur', name: 'Ayur/Herbal', marginMode: 'PERCENTAGE', marginValue: 12.0 },
    { id: 'cat_vet', name: 'Veterinary', marginMode: 'PERCENTAGE', marginValue: 10.0 },
    { id: 'cat_surgical', name: 'Surgical', marginMode: 'PERCENTAGE', marginValue: 8.0 },
  ];

  for (const c of canonicalCategories) {
    await pool.query(`
      INSERT INTO category_margin_configs (id, category_id, category_name, margin_mode, margin_value, status, created_at, updated_at)
      VALUES ($1, $1, $2, $3, $4, 'ACTIVE', NOW(), NOW())
      ON CONFLICT (category_id) DO UPDATE SET
        category_name = EXCLUDED.category_name,
        margin_mode = EXCLUDED.margin_mode,
        margin_value = EXCLUDED.margin_value,
        updated_at = NOW();
    `, [c.id, c.name, c.marginMode, c.marginValue]);
  }
  console.log('✓ Seeded Canonical Category Margins.');

  // Seed Canonical Manufacturer Margins
  const canonicalMfgs = [
    { id: '1', name: 'moonLifeSciences Pvt. Ltd.', marginMode: 'PERCENTAGE', marginValue: 10.0 },
    { id: '10', name: 'Test Pharma Ltd', marginMode: 'PERCENTAGE', marginValue: 8.0 },
    { id: '5', name: 'SunBio LifeSciences Pvt. Ltd.', marginMode: 'PERCENTAGE', marginValue: 10.0 },
    { id: '11', name: 'Apex Health Formulations Ltd', marginMode: 'PERCENTAGE', marginValue: 9.5 },
    { id: '3', name: 'Apex Biopharma Ltd', marginMode: 'PERCENTAGE', marginValue: 12.0 },
    { id: 'mfg_fg_direct', name: 'FactoryGrid Direct / Generic Supply', marginMode: 'PERCENTAGE', marginValue: 8.0 },
  ];

  for (const m of canonicalMfgs) {
    await pool.query(`
      INSERT INTO manufacturer_margin_configs (id, manufacturer_id, manufacturer_name, margin_mode, margin_value, status, created_at, updated_at)
      VALUES ($1, $1, $2, $3, $4, 'ACTIVE', NOW(), NOW())
      ON CONFLICT (manufacturer_id) DO UPDATE SET
        manufacturer_name = EXCLUDED.manufacturer_name,
        margin_mode = EXCLUDED.margin_mode,
        margin_value = EXCLUDED.margin_value,
        updated_at = NOW();
    `, [m.id, m.name, m.marginMode, m.marginValue]);
  }
  console.log('✓ Seeded Canonical Manufacturer Margins.');

  // Seed Canonical Product Margins (linking sample products to manufacturers)
  const canonicalProdMargins = [
    { id: 'pm_p1_1', productId: 'p1', sku: 'AMX-625', productName: 'Amoxyclav 625mg Tablets', manufacturerId: '1', manufacturerName: 'moonLifeSciences Pvt. Ltd.', marginMode: 'PERCENTAGE', marginValue: 15.0 },
    { id: 'pm_p2_1', productId: 'p2', sku: 'PCM-650', productName: 'Paracetamol 650mg ER Tablets', manufacturerId: '1', manufacturerName: 'moonLifeSciences Pvt. Ltd.', marginMode: 'PERCENTAGE', marginValue: 12.0 },
    { id: 'pm_p3_1', productId: 'p3', sku: 'AZI-500', productName: 'Azithromycin 500mg Tablets', manufacturerId: '1', manufacturerName: 'moonLifeSciences Pvt. Ltd.', marginMode: 'PERCENTAGE', marginValue: 14.0 },
    { id: 'pm_p4_3', productId: 'p4', sku: 'PAN-D', productName: 'Pantoprazole 40mg + Domperidone 30mg SR', manufacturerId: '3', manufacturerName: 'Apex Biopharma Ltd', marginMode: 'FIXED_RATE', marginValue: 25.0 },
    { id: 'pm_p5_3', productId: 'p5', sku: 'MET-500', productName: 'Metformin SR 500mg Tablets', manufacturerId: '3', manufacturerName: 'Apex Biopharma Ltd', marginMode: 'PERCENTAGE', marginValue: 10.0 },
  ];

  for (const pm of canonicalProdMargins) {
    await pool.query(`
      INSERT INTO product_margin_configs (id, product_id, sku, product_name, manufacturer_id, manufacturer_name, margin_mode, margin_value, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', NOW(), NOW())
      ON CONFLICT (product_id, manufacturer_id) DO UPDATE SET
        sku = EXCLUDED.sku,
        product_name = EXCLUDED.product_name,
        margin_mode = EXCLUDED.margin_mode,
        margin_value = EXCLUDED.margin_value,
        updated_at = NOW();
    `, [pm.id, pm.productId, pm.sku, pm.productName, pm.manufacturerId, pm.manufacturerName, pm.marginMode, pm.marginValue]);
  }
  console.log('✓ Seeded Canonical Product Margins.');

  const catCount = await pool.query('SELECT count(*) FROM category_margin_configs');
  const mfgCount = await pool.query('SELECT count(*) FROM manufacturer_margin_configs');
  const prodCount = await pool.query('SELECT count(*) FROM product_margin_configs');
  const feeCount = await pool.query('SELECT count(*) FROM platform_fee_configs');
  console.log(`Summary Counts in DB -> Categories: ${catCount.rows[0].count}, Manufacturers: ${mfgCount.rows[0].count}, Products: ${prodCount.rows[0].count}, PlatformFee: ${feeCount.rows[0].count}`);

  await pool.end();
  console.log('Margin Engine migration completed successfully.');
}

migrate().catch(console.error);

