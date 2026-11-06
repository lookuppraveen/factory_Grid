import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://factorygrid:factorygrid@localhost:5442/factorygrid' });

async function migrate() {
  console.log('Applying DDL for brands and manufacturer_registrations...');

  // 1. Create brands table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS brands (
      id VARCHAR(50) PRIMARY KEY,
      brand_id VARCHAR(50) UNIQUE NOT NULL,
      brand_code VARCHAR(50) UNIQUE NOT NULL,
      brand_name VARCHAR(150) NOT NULL,
      description VARCHAR(500),
      lifecycle_status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
      created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_brands_brand_code ON brands(brand_code);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_brands_brand_name ON brands(brand_name);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_brands_lifecycle_status ON brands(lifecycle_status);`);

  // 2. Add columns to manufacturer_registrations if they don't exist
  await pool.query(`ALTER TABLE manufacturer_registrations ADD COLUMN IF NOT EXISTS description VARCHAR(500);`);
  await pool.query(`ALTER TABLE manufacturer_registrations ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL;`);
  await pool.query(`ALTER TABLE manufacturer_registrations ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ(6);`);
  await pool.query(`ALTER TABLE manufacturer_registrations ADD COLUMN IF NOT EXISTS discontinued_on TIMESTAMPTZ(6);`);

  // 3. Seed canonical brands
  const canonicalBrands = [
    {
      id: 'brd_sunbio',
      brand_id: 'brd_sunbio',
      brand_code: 'SUNBIO',
      brand_name: 'SunBio',
      description: 'Specialized high-potency formulations and biosimilar brand',
      lifecycle_status: 'ACTIVE'
    },
    {
      id: 'brd_cipla',
      brand_id: 'brd_cipla',
      brand_code: 'CIPLA',
      brand_name: 'Cipla Partner',
      description: 'Alliance brand for therapeutic and respiratory care solutions',
      lifecycle_status: 'ACTIVE'
    },
    {
      id: 'brd_exbr',
      brand_id: 'brd_exbr',
      brand_code: 'EXBR',
      brand_name: 'Example Brand',
      description: 'Commercial demo and validation product catalogue brand',
      lifecycle_status: 'INACTIVE'
    },
    {
      id: 'brd_lupin',
      brand_id: 'brd_lupin',
      brand_code: 'LUPIN',
      brand_name: 'Lupin Alliance',
      description: 'Global generic and specialty branded formulations',
      lifecycle_status: 'ACTIVE'
    },
    {
      id: 'brd_biocure',
      brand_id: 'brd_biocure',
      brand_code: 'BIOCURE',
      brand_name: 'BioCure Pharma',
      description: 'Specialty oncology and immunosuppressant drug line',
      lifecycle_status: 'ACTIVE'
    }
  ];

  for (const b of canonicalBrands) {
    await pool.query(`
      INSERT INTO brands (id, brand_id, brand_code, brand_name, description, lifecycle_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (brand_code) DO UPDATE SET
        brand_name = EXCLUDED.brand_name,
        description = EXCLUDED.description,
        lifecycle_status = EXCLUDED.lifecycle_status,
        updated_at = NOW();
    `, [b.id, b.brand_id, b.brand_code, b.brand_name, b.description, b.lifecycle_status]);
  }

  // 4. Also ensure top manufacturers have manufacturer_code and description populated
  await pool.query(`
    UPDATE manufacturer_registrations
    SET lifecycle_status = 'ACTIVE',
        description = COALESCE(description, 'Certified pharmaceutical manufacturing facility and contract manufacturing organization.')
    WHERE lifecycle_status IS NULL OR lifecycle_status = '';
  `);

  const brandRows = await pool.query('SELECT * FROM brands');
  console.log(`Brands in DB: ${brandRows.rowCount}`);
  console.table(brandRows.rows);

  await pool.end();
  console.log('Migration completed successfully.');
}

migrate().catch(console.error);
