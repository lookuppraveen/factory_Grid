const fs = require('fs');
const path = 'frontend/src/components/modules/BuyerProductCatalogModule.tsx';
let code = fs.readFileSync(path, 'utf8');

const isCrlf = code.includes('\r\n');
if (isCrlf) {
  code = code.replace(/\r\n/g, '\n');
}

const oldMap = `  // Map of Product ID to manufacturer mappings for fast lookup
  const productMappingsMap = useMemo(() => {
    const map: Record<string, Array<{ mapping: ManufacturerProductMapping; manufacturer: Manufacturer }>> = {};

    (mappings || []).forEach(m => {
      const mfg = (manufacturers || []).find(man => man.id === m.manufacturerId);
      if (mfg) {
        if (!map[m.productId]) {
          map[m.productId] = [];
        }
        map[m.productId].push({ mapping: m, manufacturer: mfg });
      }
    });

    return map;
  }, [mappings, manufacturers]);

  // Mappings for the currently selected product in Drawer
  const selectedProductMappings = useMemo(() => {
    if (!selectedProduct) return [];
    return productMappingsMap[selectedProduct.id] || [];
  }, [selectedProduct, productMappingsMap]);`;

const newMap = `  // Map of Product ID to manufacturer mappings for fast lookup
  const productMappingsMap = useMemo(() => {
    const map: Record<string, Array<{ mapping: ManufacturerProductMapping; manufacturer: Manufacturer }>> = {};

    (mappings || []).forEach(m => {
      const targetMid = m.manufacturer_id || m.manufacturerId;
      const targetPid = m.product_id || m.productId;
      const mfg = (manufacturers || []).find(man =>
        man.id === targetMid ||
        man.manufacturer_id === targetMid ||
        man.code === targetMid ||
        man.manufacturer_code === targetMid ||
        (m.manufacturerName && (man.companyName === m.manufacturerName || man.name === m.manufacturerName))
      );
      if (mfg && targetPid) {
        if (!map[targetPid]) {
          map[targetPid] = [];
        }
        map[targetPid].push({ mapping: m, manufacturer: mfg });
      }
    });

    return map;
  }, [mappings, manufacturers]);

  // Mappings for the currently selected product in Drawer
  const selectedProductMappings = useMemo(() => {
    if (!selectedProduct) return [];
    return productMappingsMap[selectedProduct.id] || (selectedProduct.code ? productMappingsMap[selectedProduct.code] : []) || [];
  }, [selectedProduct, productMappingsMap]);`;

if (code.includes(oldMap)) {
  code = code.replace(oldMap, newMap);
  if (isCrlf) {
    code = code.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(path, code, 'utf8');
  console.log('BuyerProductCatalogModule.tsx updated successfully with robust mapping lookup.');
} else {
  console.log('Target pattern still not found in BuyerProductCatalogModule.tsx');
}
