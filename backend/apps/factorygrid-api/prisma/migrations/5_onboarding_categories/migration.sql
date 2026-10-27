-- Add canonical manufacturing categories to catalog_products table
INSERT INTO "catalog_products" ("id", "product_code", "name", "generic_name", "dosage_form", "category", "pack_size") VALUES
  ('cat-tablets', 'CAT-TAB', 'Tablets', 'Oral Solid Dosage - Tablets, Coated & Effervescent', 'Tablet', 'Tablets', 'Standard Batch'),
  ('cat-capsules', 'CAT-CAP', 'Capsules', 'Oral Solid Dosage - Hard & Soft Gelatin Capsules', 'Capsule', 'Capsules', 'Standard Batch'),
  ('cat-injectables', 'CAT-INJ', 'Injectables', 'Sterile Parenterals, Liquid Vials & Ampoules', 'Injection', 'Injectables', 'Standard Batch'),
  ('cat-syrups', 'CAT-SYR', 'Syrups & Oral Liquids', 'Liquid Orals & Pediatric Suspensions', 'Syrup', 'Syrups & Oral Liquids', 'Standard Batch'),
  ('cat-ointments', 'CAT-ONT', 'Ointments & Creams', 'Topical Creams, Gels & Medicated Ointments', 'Topical', 'Ointments & Creams', 'Standard Batch'),
  ('cat-nutraceuticals', 'CAT-NUT', 'Nutraceuticals', 'Dietary Supplements, Herbal Formulations & Vitamins', 'Nutraceutical', 'Nutraceuticals', 'Standard Batch')
ON CONFLICT ("id") DO NOTHING;
