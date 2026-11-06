const fs = require('fs');
const path = 'frontend/src/context/AppContext.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update AppContextType to add refresh methods if not present
if (!code.includes('refreshBrands: () => Promise<void>;')) {
  code = code.replace(
    'brands: Brand[];',
    `brands: Brand[];
  refreshBrands: () => Promise<void>;
  refreshManufacturers: () => Promise<void>;
  refreshMappings: () => Promise<void>;`
  );
}

// 2. Update background hydration useEffect
const oldHydration = `        const [liveProds, liveCats, livePrices, liveTaxes, liveUoms, liveSegs] = await Promise.all([
          catalogApi.listProducts({ size: 100, sort: 'createdAt,desc' }).catch(() => null),
          catalogApi.listCategories({ size: 100, sort: 'createdAt,desc' }).catch(() => null),
          catalogApi.listPrices({ size: 100, sort: 'createdAt,desc' }).catch(() => null),
          catalogApi.listTaxes({ size: 100, sort: 'createdAt,desc' }).catch(() => null),
          catalogApi.listUoms({ size: 100, sort: 'createdAt,desc' }).catch(() => null),
          catalogApi.listCustomerSegments().catch(() => null),
        ]);`;

const newHydration = `        const [liveProds, liveCats, livePrices, liveTaxes, liveUoms, liveSegs, liveBrands, liveMfgs, liveMappings] = await Promise.all([
          catalogApi.listProducts({ size: 100, sort: 'createdAt,desc' }).catch(() => null),
          catalogApi.listCategories({ size: 100, sort: 'createdAt,desc' }).catch(() => null),
          catalogApi.listPrices({ size: 100, sort: 'createdAt,desc' }).catch(() => null),
          catalogApi.listTaxes({ size: 100, sort: 'createdAt,desc' }).catch(() => null),
          catalogApi.listUoms({ size: 100, sort: 'createdAt,desc' }).catch(() => null),
          catalogApi.listCustomerSegments().catch(() => null),
          catalogApi.listBrands({ size: 100 }).catch(() => null),
          catalogApi.listManufacturers({ size: 100 }).catch(() => null),
          catalogApi.listMappings({ size: 200 }).catch(() => null),
        ]);`;

code = code.replace(oldHydration, newHydration);

// Also set liveBrands, liveMfgs, liveMappings in hydration effect
const oldHydrationApply = `        if (liveSegs && Array.isArray(liveSegs) && liveSegs.length > 0) {
          setCustomerSegments(liveSegs);
        }`;

const newHydrationApply = `        if (liveSegs && Array.isArray(liveSegs) && liveSegs.length > 0) {
          setCustomerSegments(liveSegs);
        }
        if (liveBrands && Array.isArray(liveBrands) && liveBrands.length > 0) {
          setBrands(liveBrands);
        }
        if (liveMfgs && Array.isArray(liveMfgs) && liveMfgs.length > 0) {
          setManufacturers(liveMfgs);
        }
        if (liveMappings && Array.isArray(liveMappings) && liveMappings.length > 0) {
          setMappings(liveMappings);
        }`;

code = code.replace(oldHydrationApply, newHydrationApply);

// 3. Update Brands CRUD block (around line 2880)
const oldBrandsBlock = `  const addBrand = (newBrand: Brand) => {
    setBrands(prev => [newBrand, ...prev.filter(b => b.brand_id !== newBrand.brand_id)]);
    addAuditLog('Brand Master', \`Added brand \${newBrand.brand_name} (\${newBrand.brand_code})\`);
  };

  const updateBrand = (id: string, updates: Partial<Brand>) => {
    setBrands(prev => prev.map(b => (b.brand_id === id || b.id === id) ? { ...b, ...updates, updated_at: new Date().toISOString() } : b));
    addAuditLog('Brand Master', \`Updated brand ID \${id}\`);
  };

  const deleteBrand = (id: string) => {
    const b = brands.find(item => item.brand_id === id || item.id === id);
    setBrands(prev => prev.filter(item => item.brand_id !== id && item.id !== id));
    if (b) {
      addAuditLog('Brand Master', \`Deleted brand \${b.brand_name || b.name} (\${b.brand_code || b.code})\`);
    }
  };

  const toggleBrandStatus = (id: string) => {
    setBrands(prev => prev.map(b => {
      if (b.brand_id === id || b.id === id) {
        const newStatus: LifecycleStatus = (b.lifecycle_status === 'ACTIVE' || b.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
        return { ...b, lifecycle_status: newStatus, status: newStatus, updated_at: new Date().toISOString() };
      }
      return b;
    }));
  };`;

const newBrandsBlock = `  const refreshBrands = useCallback(async () => {
    try {
      const data = await catalogApi.listBrands({ size: 100 });
      if (Array.isArray(data)) {
        setBrands(data);
        try { localStorage.setItem('fg_brands', JSON.stringify(data)); } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to refresh brands from API:', err);
    }
  }, []);

  const addBrand = async (newBrand: Brand) => {
    setBrands(prev => [newBrand, ...prev.filter(b => b.brand_id !== newBrand.brand_id && b.id !== newBrand.id)]);
    try {
      const saved = await catalogApi.createBrand(newBrand);
      setBrands(prev => [saved, ...prev.filter(b => b.brand_id !== saved.brand_id && b.id !== saved.id)]);
      addAuditLog('Brand Master', \`Created Brand \${saved.brand_name || newBrand.brand_name} (\${saved.brand_code || newBrand.brand_code}) in database\`);
      return saved;
    } catch (err) {
      console.error('Failed to create brand in database:', err);
      addAuditLog('Brand Master', \`Added brand \${newBrand.brand_name} (\${newBrand.brand_code}) locally\`);
    }
  };

  const updateBrand = async (id: string, updates: Partial<Brand>) => {
    setBrands(prev => prev.map(b => (b.brand_id === id || b.id === id) ? { ...b, ...updates, updated_at: new Date().toISOString() } : b));
    try {
      const saved = await catalogApi.updateBrand(id, updates);
      setBrands(prev => prev.map(b => (b.brand_id === id || b.id === id) ? { ...b, ...saved } : b));
      addAuditLog('Brand Master', \`Updated brand ID \${id} in database\`);
      return saved;
    } catch (err) {
      console.error('Failed to update brand in database:', err);
      addAuditLog('Brand Master', \`Updated brand ID \${id} locally\`);
    }
  };

  const deleteBrand = async (id: string) => {
    const b = brands.find(item => item.brand_id === id || item.id === id);
    setBrands(prev => prev.filter(item => item.brand_id !== id && item.id !== id));
    try {
      await catalogApi.deleteBrand(id);
      addAuditLog('Brand Master', \`Deleted brand \${b?.brand_name || id} from database\`);
    } catch (err) {
      console.error('Failed to delete brand from database:', err);
    }
  };

  const toggleBrandStatus = async (id: string) => {
    setBrands(prev => prev.map(b => {
      if (b.brand_id === id || b.id === id) {
        const newStatus: LifecycleStatus = (b.lifecycle_status === 'ACTIVE' || b.status === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
        return { ...b, lifecycle_status: newStatus, status: newStatus, updated_at: new Date().toISOString() };
      }
      return b;
    }));
    try {
      const saved = await catalogApi.toggleBrandStatus(id);
      setBrands(prev => prev.map(b => (b.brand_id === id || b.id === id) ? { ...b, ...saved } : b));
      addAuditLog('Brand Master', \`Toggled brand \${id} status in database\`);
      return saved;
    } catch (err) {
      console.error('Failed to toggle brand status in database:', err);
    }
  };`;

code = code.replace(oldBrandsBlock, newBrandsBlock);

// 4. Update Manufacturers CRUD block (around line 1245)
const oldMfgBlock = `  const addManufacturer = (newMfg: Manufacturer) => {
    setManufacturers(prev => {
      const cleanCode = (newMfg.manufacturer_code || newMfg.code || '').toUpperCase().trim();
      const exists = prev.some(m => (m.manufacturer_code || m.code || '').toUpperCase().trim() === cleanCode);
      if (exists) return prev;
      return [newMfg, ...prev];
    });
    addAuditLog('CREATE_MANUFACTURER', \`Created Manufacturer: \${newMfg.manufacturer_name || newMfg.companyName} (\${newMfg.manufacturer_code || newMfg.code})\`);
  };

  const updateManufacturer = (id: string, updates: Partial<Manufacturer>) => {
    setManufacturers(prev => prev.map(m => (m.id === id || m.manufacturer_id === id) ? {
      ...m,
      ...updates,
      companyName: updates.manufacturer_name || updates.companyName || m.companyName,
      name: updates.manufacturer_name || updates.name || m.name,
      code: updates.manufacturer_code || updates.code || m.code,
      updated_at: new Date().toISOString().split('T')[0]
    } : m));
    addAuditLog('UPDATE_MANUFACTURER', \`Updated Manufacturer ID: \${id}\`);
  };

  const deleteManufacturer = (id: string) => {
    setManufacturers(prev => prev.filter(m => m.id !== id && m.manufacturer_id !== id));
    addAuditLog('DELETE_MANUFACTURER', \`Deleted Manufacturer ID: \${id}\`);
  };

  const toggleManufacturerStatus = (id: string) => {
    setManufacturers(prev => prev.map(m => {
      if (m.id === id || m.manufacturer_id === id) {
        const current = m.lifecycle_status || (m.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
        const next: 'ACTIVE' | 'INACTIVE' = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        return {
          ...m,
          lifecycle_status: next,
          status: next,
          updated_at: new Date().toISOString().split('T')[0]
        };
      }
      return m;
    }));
  };`;

const newMfgBlock = `  const refreshManufacturers = useCallback(async () => {
    try {
      const data = await catalogApi.listManufacturers({ size: 100 });
      if (Array.isArray(data)) {
        setManufacturers(data);
        try { localStorage.setItem('fg_manufacturers_v3', JSON.stringify(data)); } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to refresh manufacturers from API:', err);
    }
  }, []);

  const addManufacturer = async (newMfg: Manufacturer) => {
    setManufacturers(prev => {
      const cleanCode = (newMfg.manufacturer_code || newMfg.code || '').toUpperCase().trim();
      const exists = prev.some(m => (m.manufacturer_code || m.code || '').toUpperCase().trim() === cleanCode);
      if (exists) return prev;
      return [newMfg, ...prev];
    });
    try {
      const saved = await catalogApi.createManufacturer(newMfg);
      setManufacturers(prev => [saved, ...prev.filter(m => m.id !== saved.id && m.manufacturer_id !== saved.manufacturer_id && (m.manufacturer_code || m.code) !== (saved.manufacturer_code || saved.code))]);
      addAuditLog('CREATE_MANUFACTURER', \`Created Manufacturer: \${saved.companyName || newMfg.companyName} (\${saved.code || newMfg.code}) in database\`);
      return saved;
    } catch (err) {
      console.error('Failed to persist manufacturer in database:', err);
      addAuditLog('CREATE_MANUFACTURER', \`Created Manufacturer: \${newMfg.manufacturer_name || newMfg.companyName} (\${newMfg.manufacturer_code || newMfg.code}) locally\`);
    }
  };

  const updateManufacturer = async (id: string, updates: Partial<Manufacturer>) => {
    setManufacturers(prev => prev.map(m => (m.id === id || m.manufacturer_id === id) ? {
      ...m,
      ...updates,
      companyName: updates.manufacturer_name || updates.companyName || m.companyName,
      name: updates.manufacturer_name || updates.name || m.name,
      code: updates.manufacturer_code || updates.code || m.code,
      updated_at: new Date().toISOString().split('T')[0]
    } : m));
    try {
      const saved = await catalogApi.updateManufacturer(id, updates);
      setManufacturers(prev => prev.map(m => (m.id === id || m.manufacturer_id === id) ? { ...m, ...saved } : m));
      addAuditLog('UPDATE_MANUFACTURER', \`Updated Manufacturer ID: \${id} in database\`);
      return saved;
    } catch (err) {
      console.error('Failed to update manufacturer in database:', err);
      addAuditLog('UPDATE_MANUFACTURER', \`Updated Manufacturer ID: \${id} locally\`);
    }
  };

  const deleteManufacturer = async (id: string) => {
    setManufacturers(prev => prev.filter(m => m.id !== id && m.manufacturer_id !== id));
    try {
      await catalogApi.deleteManufacturer(id);
      addAuditLog('DELETE_MANUFACTURER', \`Deleted Manufacturer ID: \${id} from database\`);
    } catch (err) {
      console.error('Failed to delete manufacturer from database:', err);
      addAuditLog('DELETE_MANUFACTURER', \`Deleted Manufacturer ID: \${id} locally\`);
    }
  };

  const toggleManufacturerStatus = async (id: string) => {
    setManufacturers(prev => prev.map(m => {
      if (m.id === id || m.manufacturer_id === id) {
        const current = m.lifecycle_status || (m.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
        const next: 'ACTIVE' | 'INACTIVE' = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        return {
          ...m,
          lifecycle_status: next,
          status: next,
          updated_at: new Date().toISOString().split('T')[0]
        };
      }
      return m;
    }));
    try {
      const saved = await catalogApi.toggleManufacturerStatus(id);
      setManufacturers(prev => prev.map(m => (m.id === id || m.manufacturer_id === id) ? { ...m, ...saved } : m));
      addAuditLog('TOGGLE_MANUFACTURER_STATUS', \`Toggled Manufacturer ID: \${id} status in database\`);
      return saved;
    } catch (err) {
      console.error('Failed to toggle manufacturer status in database:', err);
    }
  };`;

code = code.replace(oldMfgBlock, newMfgBlock);

// 5. Update Mappings CRUD block (around line 2095)
const oldMappingsBlock = `  const addMapping = (newMapping: ManufacturerProductMapping) => {
    setMappings(prev => {
      // Check duplicate for same manufacturer & product
      const targetPid = newMapping.product_id || newMapping.productId;
      const targetMid = newMapping.manufacturer_id || newMapping.manufacturerId;
      const exists = prev.some(m => {
        const mPid = m.product_id || m.productId;
        const mMid = m.manufacturer_id || m.manufacturerId;
        return mPid === targetPid && (mMid === targetMid || m.manufacturerName === newMapping.manufacturerName);
      });
      if (exists) return prev;
      return [newMapping, ...prev];
    });
  };

  const updateMapping = (productId: string, manufacturerId: string, updatedFields: Partial<ManufacturerProductMapping>) => {
    setMappings(prev => prev.map(m => {
      const matchPid = m.productId === productId || m.product_id === productId;
      const matchMid = m.manufacturerId === manufacturerId || m.manufacturer_id === manufacturerId || !m.manufacturerId;
      return (matchPid && matchMid) ? { ...m, ...updatedFields } : m;
    }));
  };

  const removeMapping = (productId: string, manufacturerId: string) => {
    setMappings(prev => prev.filter(m => {
      const matchPid = m.productId === productId || m.product_id === productId;
      const matchMid = m.manufacturerId === manufacturerId || m.manufacturer_id === manufacturerId || !m.manufacturerId;
      return !(matchPid && matchMid);
    }));
  };`;

const newMappingsBlock = `  const refreshMappings = useCallback(async () => {
    try {
      const data = await catalogApi.listMappings({ size: 200 });
      if (Array.isArray(data)) {
        setMappings(data);
        try { localStorage.setItem('fg_mappings_v3', JSON.stringify(data)); } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to refresh mappings from API:', err);
    }
  }, []);

  const addMapping = async (newMapping: ManufacturerProductMapping) => {
    setMappings(prev => {
      const targetPid = newMapping.product_id || newMapping.productId;
      const targetMid = newMapping.manufacturer_id || newMapping.manufacturerId;
      const exists = prev.some(m => {
        const mPid = m.product_id || m.productId;
        const mMid = m.manufacturer_id || m.manufacturerId;
        return mPid === targetPid && (mMid === targetMid || m.manufacturerName === newMapping.manufacturerName);
      });
      if (exists) return prev;
      return [newMapping, ...prev];
    });
    try {
      const saved = await catalogApi.createMapping(newMapping);
      setMappings(prev => [saved, ...prev.filter(m => m.id !== saved.id && m.product_manufacturer_id !== saved.product_manufacturer_id)]);
      addAuditLog('CREATE_PRODUCT_MANUFACTURER', \`Created mapping \${saved.productName} -> \${saved.manufacturerName} in database\`);
      return saved;
    } catch (err) {
      console.error('Failed to persist mapping in database:', err);
    }
  };

  const updateMapping = async (productId: string, manufacturerId: string, updatedFields: Partial<ManufacturerProductMapping>) => {
    setMappings(prev => prev.map(m => {
      const matchPid = m.productId === productId || m.product_id === productId;
      const matchMid = m.manufacturerId === manufacturerId || m.manufacturer_id === manufacturerId || !m.manufacturerId;
      return (matchPid && matchMid) ? { ...m, ...updatedFields } : m;
    }));
    try {
      const target = mappings.find(m => (m.productId === productId || m.product_id === productId) && (m.manufacturerId === manufacturerId || m.manufacturer_id === manufacturerId));
      if (target) {
        const targetId = target.id || target.product_manufacturer_id;
        const saved = await catalogApi.updateMapping(targetId, updatedFields);
        setMappings(prev => prev.map(m => (m.id === targetId || m.product_manufacturer_id === targetId) ? { ...m, ...saved } : m));
      }
    } catch (err) {
      console.error('Failed to update mapping in database:', err);
    }
  };

  const removeMapping = async (productId: string, manufacturerId: string) => {
    const target = mappings.find(m => (m.productId === productId || m.product_id === productId) && (m.manufacturerId === manufacturerId || m.manufacturer_id === manufacturerId));
    setMappings(prev => prev.filter(m => {
      const matchPid = m.productId === productId || m.product_id === productId;
      const matchMid = m.manufacturerId === manufacturerId || m.manufacturer_id === manufacturerId || !m.manufacturerId;
      return !(matchPid && matchMid);
    }));
    try {
      if (target) {
        const targetId = target.id || target.product_manufacturer_id;
        await catalogApi.deleteMapping(targetId);
      }
    } catch (err) {
      console.error('Failed to delete mapping from database:', err);
    }
  };`;

code = code.replace(oldMappingsBlock, newMappingsBlock);

// 6. Update setPreferredManufacturer (around line 1285)
const oldSetPreferred = `  const setPreferredManufacturer = (productId: string, manufacturerId: string) => {
    setMappings(prev => prev.map(map => {
      const matchProduct = map.productId === productId || map.product_id === productId;
      if (!matchProduct) return map;
      const matchMfg = map.manufacturerId === manufacturerId || map.manufacturer_id === manufacturerId;
      return {
        ...map,
        isPreferred: matchMfg,
        is_preferred: matchMfg,
        updated_at: new Date().toISOString()
      };
    }));
    addAuditLog('SET_PREFERRED_MANUFACTURER', \`Set preferred manufacturer for Product \${productId} to Manufacturer \${manufacturerId}\`);
  };`;

const newSetPreferred = `  const setPreferredManufacturer = async (productId: string, manufacturerId: string) => {
    setMappings(prev => prev.map(map => {
      const matchProduct = map.productId === productId || map.product_id === productId;
      if (!matchProduct) return map;
      const matchMfg = map.manufacturerId === manufacturerId || map.manufacturer_id === manufacturerId;
      return {
        ...map,
        isPreferred: matchMfg,
        is_preferred: matchMfg,
        updated_at: new Date().toISOString()
      };
    }));
    try {
      const target = mappings.find(m => (m.productId === productId || m.product_id === productId) && (m.manufacturerId === manufacturerId || m.manufacturer_id === manufacturerId));
      if (target) {
        const targetId = target.id || target.product_manufacturer_id;
        await catalogApi.setPreferredMapping(targetId);
      }
    } catch (err) {
      console.error('Failed to set preferred manufacturer in database:', err);
    }
    addAuditLog('SET_PREFERRED_MANUFACTURER', \`Set preferred manufacturer for Product \${productId} to Manufacturer \${manufacturerId}\`);
  };`;

code = code.replace(oldSetPreferred, newSetPreferred);

// 7. Export refreshBrands, refreshManufacturers, refreshMappings in context value
code = code.replace(
  'brands,',
  `brands,
    refreshBrands,
    refreshManufacturers,
    refreshMappings,`
);

fs.writeFileSync(path, code, 'utf8');
console.log('AppContext.tsx updated successfully with PostgreSQL persistence for Brand, Manufacturer, and Mapping.');
