const fs = require('fs');
const path = 'frontend/src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

// Fix the useState declaration
code = code.replace(
  `  const [brands,
    refreshBrands,
    refreshManufacturers,
    refreshMappings, setBrands] = useState<Brand[]>(() => {`,
  `  const [brands, setBrands] = useState<Brand[]>(() => {`
);

// Fix export in value={{ ... }}
code = code.replace(
  `        brands,\n        customers,`,
  `        brands,
        refreshBrands,
        refreshManufacturers,
        refreshMappings,
        customers,`
);

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed useState declaration and value export in AppContext.tsx');
