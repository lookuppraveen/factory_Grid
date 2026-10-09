import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Manufacturer, Product, ManufacturerProductMapping } from '../../types';
import {
  Search, Eye, Package, Plus, X, Edit3, Trash2, ShieldCheck, CheckCircle2, AlertTriangle, Filter,
  Download, UploadCloud, FileSpreadsheet, CheckCheck, RefreshCw, FileText
} from 'lucide-react';

// ── Client-specified Category → Sub-category hierarchy ───────────────────────
const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  'Drugs': [
    'Tablets', 'Effervescent Tablets', 'Soft Gelatin Capsule', 'Hard Gelatin Capsule',
    'Liquid Injections', 'Dry Injections', 'I.V.', 'Syrup', 'Suspension',
    'Ointments/Gel/Cream', 'Powder/Sachets', 'Eye/Ear Drops', 'Solutions'
  ],
  'Nutraceuticals/Food': [
    'Tablets', 'Effervescent Tablets', 'Soft Gelatin Capsule', 'Hard Gelatin Capsule',
    'Syrup', 'Suspension', 'Gel/Cream', 'Powder/Sachets', 'Granules'
  ],
  'Cosmetics': [
    'Serums', 'Gel', 'Cream', 'Powder', 'Shampoo', 'Lotions', 'Patches'
  ],
  'Ayur/Herbal': [
    'Syrup', 'Juices', 'Malt', 'Powder', 'Gel', 'Cream', 'Granules'
  ],
  'Surgical': [
    'Gloves', 'Kits', 'Canula', 'IV sets', 'Syringes', 'Hospital beds', 'Consumable', 'Equipments'
  ]
};
const MAIN_5_CATEGORIES = [
  'Drugs',
  'Nutraceuticals/Food',
  'Cosmetics',
  'Ayur/Herbal',
  'Surgical'
];
const ALL_MAIN_CATEGORIES = MAIN_5_CATEGORIES;

interface ManufacturerProductCatalogTabProps {
  manufacturer: Manufacturer;
  mappings?: ManufacturerProductMapping[];
  products?: Product[];
  onSelectProductForDetail?: (product: Product) => void;
}

export const ManufacturerProductCatalogTab: React.FC<ManufacturerProductCatalogTabProps> = ({
  manufacturer,
  onSelectProductForDetail
}) => {
  const {
    products: contextProducts,
    mappings: contextMappings,
    addMapping,
    updateMapping,
    removeMapping,
    addAuditLog,
    categories,
    subCategories,
    subSubCategories,
    addProductMaster,
    updateProductMaster
  } = useApp();

  const mfgDisplayName = manufacturer?.companyName || manufacturer?.name || 'SunBio LifeSciences Ltd.';
  const mfgId = manufacturer?.id || 'm1';
  const mfgCode = manufacturer?.code || 'SUNBIO01';

  // Compute products mapped to THIS manufacturer
  const mfgMappings = useMemo(() => {
    return (contextMappings || []).filter(m =>
      !m.manufacturerId ||
      m.manufacturerId === mfgId ||
      m.manufacturerCode === mfgCode ||
      (m.manufacturerName && m.manufacturerName.toLowerCase() === mfgDisplayName.toLowerCase())
    );
  }, [contextMappings, mfgId, mfgCode, mfgDisplayName]);

  // Map each mapping to its central ProductMaster
  const mappedProductsList = useMemo(() => {
    return mfgMappings.map(m => {
      const prd = (contextProducts || []).find(p => p.id === m.productId || p.code === m.mfgProductCode);
      // Fallback if product identity exists in mapping
      const fallbackPrd: Product = prd || {
        id: m.productId || `prd_${m.mfgProductCode}`,
        code: m.mfgProductCode || 'PRD-0001',
        name: m.mfgProductCode || 'Pharmaceutical Formulation',
        genericName: 'Compendial Formulation',
        saltCombination: 'Active Pharmaceutical Ingredient',
        dosageForm: 'Tablet',
        strength: 'Standard',
        packSize: '10 x 10 Strip',
        uom: 'Strip',
        category: 'Analgesics',
        description: 'Standard product specification',
        manufacturersCount: 1
      };
      return {
        mapping: m,
        product: fallbackPrd,
        status: (m as any).status || prd?.status || 'Active'
      };
    });
  }, [mfgMappings, contextProducts]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDosage, setSelectedDosage] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleToggleCategory = (cat: string) => {
    if (expandedCategory === cat) {
      setExpandedCategory(null);
      setSelectedCategory('ALL');
      setSelectedDosage('ALL');
    } else {
      setExpandedCategory(cat);
      setSelectedCategory(cat);
      setSelectedDosage('ALL');
    }
  };

  const handleSelectSubCategory = (cat: string, sub: string) => {
    setSelectedCategory(cat);
    if (selectedDosage === sub) {
      setSelectedDosage('ALL');
    } else {
      setSelectedDosage(sub);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return mappedProductsList.filter(({ product, mapping, status }) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (product.name || '').toLowerCase().includes(q) ||
        (product.genericName || '').toLowerCase().includes(q) ||
        (product.saltCombination || '').toLowerCase().includes(q) ||
        (product.code || '').toLowerCase().includes(q) ||
        (mapping.mfgProductCode || '').toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || product.category === selectedCategory;
      const matchesDosage =
        selectedDosage === 'ALL' ||
        product.dosageForm === selectedDosage ||
        (product.dosageForm || '').toLowerCase() === selectedDosage.toLowerCase() ||
        ((product.dosageForm || '').toLowerCase().includes(selectedDosage.toLowerCase().replace(/s$/, ''))) ||
        ((product as any).subCategory && (product as any).subCategory === selectedDosage);
      const matchesStatus = selectedStatus === 'ALL' || (status && status.toString().trim().toUpperCase() === selectedStatus.toString().trim().toUpperCase());

      return matchesSearch && matchesCat && matchesDosage && matchesStatus;
    });
  }, [mappedProductsList, searchQuery, selectedCategory, selectedDosage, selectedStatus]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'CREATE' | 'MAP' | 'UPLOAD'>('CREATE');
  const [selectedCentralProduct, setSelectedCentralProduct] = useState<Product | null>(null);
  const [centralSearchQuery, setCentralSearchQuery] = useState('');
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // Bulk Upload State for Products
  interface BulkUploadProductRow {
    rowNum: number;
    name: string;
    sku: string;
    genericName: string;
    saltComposition: string;
    strength: string;
    dosageForm: string;
    packSize: string;
    uom: string;
    description?: string;
    category: string;
    subCategory: string;
    subSubCategory?: string;
    moq: number;
    leadTimeDays: number;
    certificationsStr?: string;
    basePrice?: number;
    isValid: boolean;
    errors: string[];
  }

  const [bulkProductRows, setBulkProductRows] = useState<BulkUploadProductRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState<string>('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkSuccessCount, setBulkSuccessCount] = useState<number | null>(null);

  // CSV parsing & validation for bulk products
  const parseAndValidateProductCSV = (csvText: string, fileName = 'Upload.csv') => {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      setAddFormError('Uploaded file has no data rows.');
      return;
    }

    const parseCsvRow = (text: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result.map(s => s.replace(/^["']|["']$/g, '').trim());
    };

    const header = parseCsvRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const findIndex = (keys: string[]) => header.findIndex(h => keys.some(k => h.includes(k)));
    const idxName = findIndex(['productname', 'name', 'title']);
    const idxSku = findIndex(['sku', 'productcode', 'code']);
    const idxGeneric = findIndex(['generic', 'activeingredient', 'molecule']);
    const idxSalt = findIndex(['salt', 'composition']);
    const idxStrength = findIndex(['strength', 'concentration', 'dose']);
    const idxDosage = findIndex(['dosage', 'form', 'dosageform']);
    const idxPack = findIndex(['pack', 'packsize', 'packaging']);
    const idxUom = findIndex(['uom', 'unit']);
    const idxCat = findIndex(['category']);
    const idxSub = findIndex(['subcategory', 'subcat']);
    const idxSubSub = findIndex(['subsubcategory', 'subsub']);
    const idxMoq = findIndex(['moq', 'minimumorder']);
    const idxLead = findIndex(['leadtime', 'lead', 'deliverydays', 'days']);
    const idxCerts = findIndex(['cert', 'certifications']);
    const idxPrice = findIndex(['price', 'baseprice', 'rate']);
    const idxDesc = findIndex(['desc', 'description']);

    const existingSkus = new Set(contextProducts.map(p => (p.sku || p.code || '').toLowerCase().trim()));
    const existingMfgCodes = new Set(mfgMappings.map(m => m.mfgProductCode.toLowerCase().trim()));
    const seenSkusInFile = new Set<string>();

    const rows: BulkUploadProductRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvRow(lines[i]);
      if (cols.length === 0 || cols.every(c => !c)) continue;

      const name = cols[idxName !== -1 ? idxName : 0] || '';
      const sku = (cols[idxSku !== -1 ? idxSku : 1] || '').toUpperCase();
      const genericName = cols[idxGeneric !== -1 ? idxGeneric : 2] || name;
      const saltComposition = cols[idxSalt !== -1 ? idxSalt : 3] || genericName;
      const strength = cols[idxStrength !== -1 ? idxStrength : 4] || 'Standard';
      const dosageForm = cols[idxDosage !== -1 ? idxDosage : 5] || 'Tablets';
      const packSize = cols[idxPack !== -1 ? idxPack : 6] || '10 × 10 Strip';
      const uom = cols[idxUom !== -1 ? idxUom : 7] || 'Boxes';
      const category = cols[idxCat !== -1 ? idxCat : 8] || 'Drugs';
      const subCategory = cols[idxSub !== -1 ? idxSub : 9] || dosageForm;
      const subSubCategory = idxSubSub !== -1 ? cols[idxSubSub] : '';
      const moqRaw = cols[idxMoq !== -1 ? idxMoq : 11] || '1000';
      const leadRaw = cols[idxLead !== -1 ? idxLead : 12] || '14';
      const certs = idxCerts !== -1 ? cols[idxCerts] : 'WHO-GMP, CDSCO Form 25/28';
      const priceRaw = idxPrice !== -1 ? cols[idxPrice] : '100';
      const desc = idxDesc !== -1 ? cols[idxDesc] : '';

      const errors: string[] = [];

      if (!name) errors.push('Product Name is required');
      if (!sku) errors.push('SKU / Product Code is required');
      if (!genericName) errors.push('Generic Name is required');
      if (!saltComposition) errors.push('Salt / Composition is required');
      if (!strength) errors.push('Strength is required');
      if (!dosageForm) errors.push('Dosage Form is required');
      if (!packSize) errors.push('Pack Size is required');
      if (!uom) errors.push('UOM is required');
      if (!category) errors.push('Category is required');
      if (!subCategory) errors.push('Sub-Category is required');

      const moq = parseInt(moqRaw.replace(/[^0-9]/g, ''), 10);
      if (isNaN(moq) || moq <= 0) errors.push('MOQ must be a positive number');

      const leadTimeDays = parseInt(leadRaw.replace(/[^0-9]/g, ''), 10);
      if (isNaN(leadTimeDays) || leadTimeDays <= 0) errors.push('Delivery Lead Time must be a positive number of days');

      const basePrice = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || 100;

      const cleanSkuLower = sku.toLowerCase().trim();
      if (cleanSkuLower) {
        if (existingSkus.has(cleanSkuLower)) {
          errors.push(`SKU "${sku}" already exists in Central Master`);
        } else if (existingMfgCodes.has(cleanSkuLower)) {
          errors.push(`SKU "${sku}" already in ${mfgDisplayName}'s catalog`);
        } else if (seenSkusInFile.has(cleanSkuLower)) {
          errors.push(`Duplicate SKU "${sku}" within this upload file`);
        } else {
          seenSkusInFile.add(cleanSkuLower);
        }
      }

      rows.push({
        rowNum: i,
        name,
        sku,
        genericName,
        saltComposition,
        strength,
        dosageForm,
        packSize,
        uom,
        description: desc,
        category,
        subCategory,
        subSubCategory,
        moq: isNaN(moq) ? 0 : moq,
        leadTimeDays: isNaN(leadTimeDays) ? 0 : leadTimeDays,
        certificationsStr: certs,
        basePrice,
        isValid: errors.length === 0,
        errors
      });
    }

    setBulkFileName(fileName);
    setBulkProductRows(rows);
    setAddFormError(null);
  };

  const handleDownloadProductTemplate = () => {
    const headers = [
      'Product Name*',
      'SKU / Product Code*',
      'Generic Name*',
      'Salt Composition*',
      'Strength*',
      'Dosage Form*',
      'Pack Size*',
      'UOM*',
      'Category*',
      'Sub-Category*',
      'Sub-Sub-Category',
      'MOQ*',
      'Delivery Lead Time (Days)*',
      'Certifications',
      'Estimated Base Price (INR)',
      'Description'
    ];
    const sampleRows = [
      [
        'Telmisartan 40mg Tablets',
        'TEL-40-TAB',
        'Telmisartan',
        'Telmisartan IP 40mg',
        '40mg',
        'Tablets',
        '10 x 10 Strip',
        'Boxes',
        'Drugs',
        'Tablets',
        'Cardiovascular',
        '1000',
        '14',
        'WHO-GMP, CDSCO Form 25/28',
        '26.50',
        'Antihypertensive formulation for blood pressure management'
      ],
      [
        'Montelukast 10mg + Levocetirizine 5mg Tablets',
        'MON-LEVO-TAB',
        'Montelukast + Levocetirizine',
        'Montelukast 10mg + Levocetirizine 5mg',
        '15mg',
        'Tablets',
        '10 x 10 Alu-Alu',
        'Boxes',
        'Drugs',
        'Tablets',
        'Respiratory',
        '1500',
        '15',
        'WHO-GMP, ISO 9001',
        '38.00',
        'Dual action antiallergic and bronchodilator formulation'
      ]
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...sampleRows.map(r => r.map(f => `"${f.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FactoryGrid_Manufacturer_Product_Upload_Template_${mfgId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSampleProductsCSV = () => {
    const sampleCSV = `Product Name,SKU / Product Code,Generic Name,Salt Composition,Strength,Dosage Form,Pack Size,UOM,Category,Sub-Category,Sub-Sub-Category,MOQ,Delivery Lead Time (Days),Certifications,Estimated Base Price (INR),Description
Telmisartan 40mg Tablets,TEL-40-TAB,Telmisartan,Telmisartan IP 40mg,40mg,Tablets,10 x 10 Strip,Boxes,Drugs,Tablets,Cardiovascular,1000,12,WHO-GMP, CDSCO Form 25/28,24.00,Antihypertensive formulation
Montelukast 10mg + Levocetirizine 5mg,MON-LEVO-TAB,Montelukast + Levocetirizine,Montelukast 10mg + Levocetirizine 5mg,15mg,Tablets,10 x 10 Alu-Alu,Boxes,Drugs,Tablets,Respiratory,1500,14,WHO-GMP, ISO 9001,36.50,Dual action antiallergic
Albendazole 400mg Chewable Tablets,ALB-400-CHEW,Albendazole,Albendazole IP 400mg,400mg,Tablets,1 x 1 Blister,Boxes,Drugs,Tablets,Anthelmintic,2000,10,WHO-GMP, Schedule M,8.50,Chewable deworming tablets`;
    parseAndValidateProductCSV(sampleCSV, 'Sample_Manufacturer_Products.csv');
  };

  const handleConfirmBulkProductImport = () => {
    const validRows = bulkProductRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsProcessingBulk(true);
    let imported = 0;

    validRows.forEach((row, idx) => {
      const cleanSku = row.sku.trim().toUpperCase();
      const newProductId = `prd_${cleanSku.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${idx}`;
      const certsArray = row.certificationsStr
        ? row.certificationsStr.split(',').map(c => c.trim()).filter(Boolean)
        : ['WHO-GMP', 'CDSCO Form 25/28'];

      const newPrd: Product = {
        id: newProductId,
        code: cleanSku,
        sku: cleanSku,
        name: row.name.trim(),
        category: row.category.trim(),
        subCategory: row.subCategory.trim(),
        subSubCategory: row.subSubCategory ? row.subSubCategory.trim() : undefined,
        genericName: row.genericName.trim(),
        saltCombination: row.saltComposition.trim(),
        composition: row.saltComposition.trim(),
        strength: row.strength.trim(),
        dosageForm: row.dosageForm.trim(),
        packSize: row.packSize.trim(),
        uom: row.uom.trim(),
        description: row.description?.trim() || `${row.name} formulation`,
        moq: row.moq,
        basePrice: row.basePrice || 100,
        status: 'Active',
        registeredCount: 1,
        manufacturersCount: 1,
        regulatoryInfo: ['WHO-GMP Required', 'CDSCO Applicable']
      };
      addProductMaster(newPrd);

      const newMapping: ManufacturerProductMapping = {
        id: `map-${mfgId}-${newProductId}`,
        productId: newProductId,
        manufacturerId: mfgId,
        manufacturerCode: mfgCode,
        manufacturerName: mfgDisplayName,
        mfgProductCode: cleanSku,
        moq: row.moq,
        standardLeadTimeDays: row.leadTimeDays,
        unitPriceEstimate: row.basePrice,
        packaging: row.packSize.trim(),
        productSpecificCertifications: certsArray,
        status: 'Active',
        marginStatus: 'Pending'
      };
      addMapping(newMapping);
      imported++;
    });

    addAuditLog(
      'BULK_UPLOAD_MANUFACTURER_PRODUCTS',
      `Imported ${imported} products into ${mfgDisplayName}'s catalog from ${bulkFileName || 'CSV upload'}`
    );

    setIsProcessingBulk(false);
    setBulkSuccessCount(imported);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setBulkProductRows([]);
      setBulkFileName('');
      setBulkSuccessCount(null);
    }, 1200);
  };

  // New Product Creation Form State
  const [createProductForm, setCreateProductForm] = useState({
    name: '',
    category: 'Drugs',
    subCategory: 'Tablets',
    subSubCategory: '',
    subSubCategoryId: '',
    sku: '',
    genericName: '',
    saltCombination: '',
    strength: '',
    dosageForm: 'Tablets',
    packSize: '10 × 1 × 10 Strip',
    uom: 'Strip',
    packaging: '10 × 1 × 10 Strip',
    moq: 1000,
    standardLeadTimeDays: 14,
    basePrice: 100,
    certificationsStr: 'WHO-GMP, CDSCO Form 25/28',
    description: '',
    status: 'Active'
  });

  // Active Categories from Category Master (strictly active)
  const activeCategoriesList = useMemo(() => {
    const fromMaster = (categories || [])
      .filter(c => c.status === 'Active')
      .map(c => c.name);
    if (fromMaster.length > 0) {
      return Array.from(new Set(fromMaster));
    }
    return ALL_MAIN_CATEGORIES;
  }, [categories]);

  // Sub-categories available for createProductForm based on selected category (strictly ACTIVE)
  const createAvailableSubCategories = useMemo(() => {
    if (!createProductForm.category) return [];
    const catNameLower = createProductForm.category.toLowerCase().trim();
    const matchedCategory = (categories || []).find(c => c.name.toLowerCase().trim() === catNameLower);
    const liveSubs = (subCategories || [])
      .filter(s =>
        s.status === 'Active' &&
        (
          (matchedCategory && s.categoryId === matchedCategory.id) ||
          s.parentCategory.toLowerCase().trim() === catNameLower ||
          (catNameLower.includes('nutraceutical') && s.parentCategory.toLowerCase().includes('nutraceutical'))
        )
      )
      .map(s => s.name);
    if (liveSubs.length > 0) return Array.from(new Set(liveSubs));
    return CATEGORY_SUBCATEGORIES[createProductForm.category] || [];
  }, [createProductForm.category, categories, subCategories]);

  // Sub-sub-categories available for createProductForm based on selected subCategory (strictly ACTIVE)
  const createAvailableSubSubCategories = useMemo(() => {
    const currentSub = (createProductForm.subCategory || createProductForm.dosageForm || '').toLowerCase().trim();
    if (!currentSub) return [];
    const matchedSub = (subCategories || []).find(
      s => s.name.toLowerCase().trim() === currentSub &&
      (!createProductForm.category || s.parentCategory.toLowerCase().trim() === createProductForm.category.toLowerCase().trim())
    );
    return (subSubCategories || []).filter(ss =>
      ss.status === 'Active' &&
      (
        (matchedSub && ss.subCategoryId === matchedSub.id) ||
        (ss.parentSubCategory && ss.parentSubCategory.toLowerCase().trim() === currentSub)
      )
    );
  }, [createProductForm.subCategory, createProductForm.dosageForm, createProductForm.category, subCategories, subSubCategories]);

  // Mapping Form State
  const [mappingFormData, setMappingFormData] = useState({
    mfgProductCode: '',
    moq: 1000,
    standardLeadTimeDays: 14,
    packaging: '10 × 1 × 10 Strip',
    certificationsStr: 'WHO-GMP, CDSCO Applicable',
    status: 'Active'
  });

  // View / Edit Drawer State for Product Details
  const [activeDrawerItem, setActiveDrawerItem] = useState<{ mapping: ManufacturerProductMapping; product: Product; status: string } | null>(null);
  const [drawerFormData, setDrawerFormData] = useState({
    code: '',
    name: '',
    genericName: '',
    saltCombination: '',
    strength: '',
    dosageForm: 'Tablets',
    packSize: '',
    uom: 'Strip',
    packaging: '',
    description: '',
    category: 'Drugs',
    mfgProductCode: '',
    moq: 1000,
    standardLeadTimeDays: 14,
    status: 'Active'
  });
  const [drawerSaveSuccess, setDrawerSaveSuccess] = useState(false);
  const [drawerFormError, setDrawerFormError] = useState<string | null>(null);
  const [drawerEditMode, setDrawerEditMode] = useState(false);

  // Remove confirmation state
  const [confirmRemoveItem, setConfirmRemoveItem] = useState<{ mapping: ManufacturerProductMapping; product: Product } | null>(null);

  // Handle Remove product (unmap from this manufacturer's catalog only)
  const handleConfirmRemove = () => {
    if (!confirmRemoveItem) return;
    removeMapping(confirmRemoveItem.product.id, mfgId);
    addAuditLog('REMOVE_MANUFACTURER_PRODUCT', `Removed ${confirmRemoveItem.product.name} from ${mfgDisplayName}'s catalog`);
    setConfirmRemoveItem(null);
  };

  const handleOpenAddModal = () => {
    setSelectedCentralProduct(null);
    setCentralSearchQuery('');
    setAddFormError(null);
    setAddModalTab('CREATE');
    const defaultCat = (categories || []).find(c => c.status === 'Active')?.name || 'Drugs';
    const defaultSub = (CATEGORY_SUBCATEGORIES[defaultCat] || [])[0] || '';
    setCreateProductForm({
      name: '',
      category: defaultCat,
      subCategory: defaultSub,
      subSubCategory: '',
      subSubCategoryId: '',
      sku: '',
      genericName: '',
      saltCombination: '',
      strength: '',
      dosageForm: defaultSub,
      packSize: '10 × 1 × 10 Strip',
      uom: 'Strip',
      packaging: '10 × 1 × 10 Strip',
      moq: 1000,
      standardLeadTimeDays: 14,
      basePrice: 100,
      certificationsStr: 'WHO-GMP, CDSCO Form 25/28',
      description: '',
      status: 'Active'
    });
    setMappingFormData({
      mfgProductCode: '',
      moq: 1000,
      standardLeadTimeDays: 14,
      packaging: '10 × 1 × 10 Strip',
      certificationsStr: 'WHO-GMP, CDSCO Applicable',
      status: 'Active'
    });
    setIsAddModalOpen(true);
  };

  // Search Central Products for Modal
  const centralProductResults = useMemo(() => {
    const q = centralSearchQuery.toLowerCase().trim();
    if (!q) return contextProducts;
    return (contextProducts || []).filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.genericName.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.saltCombination.toLowerCase().includes(q)
    );
  }, [contextProducts, centralSearchQuery]);

  // Select a Central Product Master in Modal
  const handleSelectCentralProduct = (prd: Product) => {
    // Check if duplicate mapping exists for this manufacturer
    // Only consider "Already Mapped" if the mapping still exists (not removed). Inactive products are still mapped.
    const isAlreadyMapped = mfgMappings.some(m => m.productId === prd.id);
    if (isAlreadyMapped) {
      setAddFormError(`Product "${prd.name}" already exists in ${mfgDisplayName}'s catalog.`);
      return;
    }

    setAddFormError(null);
    setSelectedCentralProduct(prd);
    const codePrefix = mfgCode.length > 4 ? mfgCode.substring(0, 4) : mfgCode;
    const prdSlug = prd.code.replace(/[^a-zA-Z0-9]/g, '');
    setMappingFormData({
      mfgProductCode: `${codePrefix}-${prdSlug}`,
      moq: prd.moq || 1000,
      standardLeadTimeDays: 14,
      packaging: prd.packSize || '10 × 1 × 10 Strip',
      certificationsStr: (prd.regulatoryInfo || ['WHO-GMP', 'CDSCO Applicable']).join(', '),
      status: 'Active'
    });
  };

  // Save New Manufacturer Mapping
  const handleSaveAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentralProduct) {
      setAddFormError('Please select an existing Product Master product.');
      return;
    }

    if (!mappingFormData.mfgProductCode.trim()) {
      setAddFormError('Manufacturer Product Code / SKU is required.');
      return;
    }
    if (!mappingFormData.packaging.trim()) {
      setAddFormError('Packaging details are required (e.g. 10 × 1 × 10 Strip).');
      return;
    }
    if (!mappingFormData.moq || mappingFormData.moq <= 0) {
      setAddFormError('Valid Minimum Order Quantity (MOQ) is required.');
      return;
    }
    if (!mappingFormData.standardLeadTimeDays || mappingFormData.standardLeadTimeDays <= 0) {
      setAddFormError('Valid Standard Delivery Schedule (Days) is required.');
      return;
    }

    const certsArray = mappingFormData.certificationsStr.split(',').map(c => c.trim()).filter(Boolean);

    const newMapping: ManufacturerProductMapping = {
      productId: selectedCentralProduct.id,
      manufacturerId: mfgId,
      manufacturerCode: mfgCode,
      manufacturerName: mfgDisplayName,
      mfgProductCode: mappingFormData.mfgProductCode,
      moq: mappingFormData.moq,
      standardLeadTimeDays: mappingFormData.standardLeadTimeDays,
      packaging: mappingFormData.packaging,
      productSpecificCertifications: certsArray,
      ...({ status: mappingFormData.status } as any)
    };

    addMapping(newMapping);
    addAuditLog('MAP_MANUFACTURER_PRODUCT', `Mapped ${selectedCentralProduct.name} to ${mfgDisplayName}`);
    setIsAddModalOpen(false);
  };

  // Save Direct Product Creation (Requirement 4: Product Name, Category, SKU + Existing Fields)
  const handleSaveCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Classification Hierarchy Validation
    if (!createProductForm.category.trim()) {
      setAddFormError('Category is required.');
      return;
    }
    const currentSub = createProductForm.subCategory.trim() || createProductForm.dosageForm.trim();
    if (createAvailableSubCategories.length > 0 && !currentSub) {
      setAddFormError('Sub-Category is required.');
      return;
    }
    if (currentSub && createAvailableSubCategories.length > 0 && !createAvailableSubCategories.includes(currentSub)) {
      setAddFormError(`Sub-Category "${currentSub}" is invalid for Category "${createProductForm.category}".`);
      return;
    }
    if (createProductForm.subSubCategory.trim() && createAvailableSubSubCategories.length > 0) {
      const isValidSubSub = createAvailableSubSubCategories.some(s => s.name.toLowerCase() === createProductForm.subSubCategory.toLowerCase());
      if (!isValidSubSub) {
        setAddFormError(`Sub-Sub-Category "${createProductForm.subSubCategory}" is invalid for Sub-Category "${currentSub}".`);
        return;
      }
    }

    // 2. Product Details Validation
    if (!createProductForm.sku.trim()) {
      setAddFormError('Product Code / SKU is required (e.g. PCM-650).');
      return;
    }
    if (!createProductForm.name.trim()) {
      setAddFormError('Product Name is required.');
      return;
    }
    if (!createProductForm.packaging.trim()) {
      setAddFormError('Packaging details are required (e.g. 10 × 1 × 10 Strip).');
      return;
    }
    if (!createProductForm.moq || createProductForm.moq <= 0) {
      setAddFormError('Valid Minimum Order Quantity (MOQ) is required.');
      return;
    }
    if (!createProductForm.standardLeadTimeDays || createProductForm.standardLeadTimeDays <= 0) {
      setAddFormError('Valid Delivery Schedule (Days) is required.');
      return;
    }

    const cleanSku = createProductForm.sku.trim().toUpperCase();
    const newProductId = `prd_${cleanSku.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    const certsArray = createProductForm.certificationsStr
      ? createProductForm.certificationsStr.split(',').map(c => c.trim()).filter(Boolean)
      : ['WHO-GMP', 'CDSCO Form 25/28'];

    // 1. Create in Central Product Master
    const newPrd: Product = {
      id: newProductId,
      code: cleanSku,
      sku: cleanSku,
      name: createProductForm.name.trim(),
      category: createProductForm.category.trim(),
      subCategory: currentSub,
      subSubCategory: createProductForm.subSubCategory ? createProductForm.subSubCategory.trim() : undefined,
      subSubCategoryId: createProductForm.subSubCategoryId ? createProductForm.subSubCategoryId : undefined,
      genericName: createProductForm.genericName.trim() || createProductForm.name.trim(),
      saltCombination: createProductForm.saltCombination.trim() || createProductForm.name.trim(),
      composition: createProductForm.saltCombination.trim() || createProductForm.name.trim(),
      strength: createProductForm.strength.trim() || 'Standard',
      dosageForm: createProductForm.dosageForm || currentSub || 'Standard',
      packSize: createProductForm.packSize.trim() || createProductForm.packaging.trim() || '10 × 1 × 10 Strip',
      uom: createProductForm.uom,
      description: createProductForm.description.trim() || `${createProductForm.name} pharmaceutical formulation`,
      moq: createProductForm.moq,
      basePrice: createProductForm.basePrice || 100,
      status: createProductForm.status as any,
      registeredCount: 1,
      manufacturersCount: 1,
      regulatoryInfo: ['WHO-GMP Required', 'CDSCO Applicable']
    };

    addProductMaster(newPrd);

    // 2. Create Manufacturer Mapping
    const newMapping: ManufacturerProductMapping = {
      productId: newProductId,
      manufacturerId: mfgId,
      manufacturerCode: mfgCode,
      manufacturerName: mfgDisplayName,
      mfgProductCode: cleanSku,
      moq: createProductForm.moq,
      standardLeadTimeDays: createProductForm.standardLeadTimeDays,
      packaging: createProductForm.packaging.trim(),
      productSpecificCertifications: certsArray.length > 0 ? certsArray : ['WHO-GMP', 'CDSCO Form 25/28'],
      ...({ status: createProductForm.status } as any)
    };

    addMapping(newMapping);
    addAuditLog('CREATE_MANUFACTURER_PRODUCT', `${mfgDisplayName} created product "${newPrd.name}" with Category "${newPrd.category}", Sub-Category "${currentSub}" and SKU "${newPrd.sku}"`);
    setIsAddModalOpen(false);
  };

  // Open View Drawer in Full Editable Mode
  const handleOpenDrawer = (item: { mapping: ManufacturerProductMapping; product: Product; status: string }) => {
    setActiveDrawerItem(item);
    setDrawerSaveSuccess(false);
    setDrawerFormError(null);
    setDrawerEditMode(false); // Always open in VIEW mode
    setDrawerFormData({
      code: item.product.code || '',
      name: item.product.name || '',
      genericName: item.product.genericName || '',
      saltCombination: item.product.saltCombination || item.product.composition || '',
      strength: item.product.strength || '',
      dosageForm: item.product.dosageForm || 'Tablet',
      packSize: item.product.packSize || '',
      uom: item.product.uom || 'Strip',
      packaging: item.mapping.packaging || item.product.packSize || '10 × 1 × 10 Strip',
      description: item.product.description || '',
      category: item.product.category || 'Tablets',
      mfgProductCode: item.mapping.mfgProductCode || item.product.sku || '',
      moq: item.mapping.moq || 1000,
      standardLeadTimeDays: item.mapping.standardLeadTimeDays || 14,
      status: item.status || 'Active'
    });
  };

  // Save Drawer Form Edits
  const handleSaveDrawerForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrawerItem) return;

    if (!drawerFormData.name.trim()) {
      setDrawerFormError('Product Name is required.');
      return;
    }
    if (!drawerFormData.code.trim()) {
      setDrawerFormError('Product Code is required.');
      return;
    }
    if (!drawerFormData.mfgProductCode.trim()) {
      setDrawerFormError('Manufacturer Product Code / SKU is required.');
      return;
    }
    if (!drawerFormData.moq || drawerFormData.moq <= 0) {
      setDrawerFormError('Valid MOQ is required.');
      return;
    }
    if (!drawerFormData.standardLeadTimeDays || drawerFormData.standardLeadTimeDays <= 0) {
      setDrawerFormError('Valid Delivery Schedule is required.');
      return;
    }

    // 1. Update Manufacturer Mapping
    updateMapping(activeDrawerItem.product.id, mfgId, {
      mfgProductCode: drawerFormData.mfgProductCode,
      moq: drawerFormData.moq,
      standardLeadTimeDays: drawerFormData.standardLeadTimeDays,
      packaging: drawerFormData.packaging,
      ...({ status: drawerFormData.status } as any)
    });

    // 2. Update Central Product Master
    updateProductMaster(activeDrawerItem.product.id, {
      code: drawerFormData.code,
      name: drawerFormData.name,
      sku: drawerFormData.mfgProductCode,
      category: drawerFormData.category,
      genericName: drawerFormData.genericName,
      saltCombination: drawerFormData.saltCombination,
      composition: drawerFormData.saltCombination,
      strength: drawerFormData.strength,
      dosageForm: drawerFormData.dosageForm,
      packSize: drawerFormData.packSize,
      uom: drawerFormData.uom,
      description: drawerFormData.description
    });

    addAuditLog('EDIT_MANUFACTURER_PRODUCT', `Updated product details for ${drawerFormData.name} (${drawerFormData.mfgProductCode})`);
    setDrawerSaveSuccess(true);
    setDrawerFormError(null);

    setActiveDrawerItem(prev => prev ? {
      ...prev,
      mapping: {
        ...prev.mapping,
        mfgProductCode: drawerFormData.mfgProductCode,
        moq: drawerFormData.moq,
        standardLeadTimeDays: drawerFormData.standardLeadTimeDays,
        packaging: drawerFormData.packaging,
        status: drawerFormData.status
      },
      status: drawerFormData.status
    } : null);

    setTimeout(() => {
      setActiveDrawerItem(null);
      setDrawerSaveSuccess(false);
    }, 1200);
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Enterprise Catalog Header ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={22} style={{ color: '#0F766E' }} />
            PRODUCT CATALOG
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Products manufactured by <strong>{mfgDisplayName}</strong>.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{ padding: '10px 18px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(15,118,110,0.2)' }}
        >
          <Plus size={16} /> + Add Product
        </button>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>

        {/* Search Input — supports full text and first 4-5 character prefix */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search by name, code, generic name, or first 4–5 characters..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              outline: 'none',
              background: '#FFFFFF',
              color: '#0F172A'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Active Filter Indicator Badge */}
        {(selectedCategory !== 'ALL' || selectedDosage !== 'ALL') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDFA', border: '1px solid #99F6E4', padding: '6px 12px', borderRadius: 6, fontSize: 12, color: '#0F766E', fontWeight: 600 }}>
            <span>Filtered: <strong>{selectedCategory}</strong>{selectedDosage !== 'ALL' ? ` › ${selectedDosage}` : ''}</span>
            <button
              onClick={() => { setSelectedCategory('ALL'); setSelectedDosage('ALL'); setExpandedCategory(null); }}
              style={{ background: 'none', border: 'none', color: '#0F766E', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}
              title="Clear category filter"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending Compliance">Pending Compliance</option>
          </select>
        </div>
      </div>

      {/* ── Main Catalog Grid: Left Category Hierarchy Tree + Right Table ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── CATEGORY Hierarchical Tree ─────────────────────────────── */}
        <div style={{
          width: 250,
          minWidth: 250,
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '16px 14px',
          flexShrink: 0
        }}>
          {/* Header */}
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '0.06em',
            paddingBottom: 10,
            marginBottom: 10,
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>CATEGORY</span>
            {(selectedCategory !== 'ALL' || selectedDosage !== 'ALL') && (
              <button
                onClick={() => { setSelectedCategory('ALL'); setSelectedDosage('ALL'); setExpandedCategory(null); }}
                style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                title="Reset category filter"
              >
                Reset
              </button>
            )}
          </div>

          {/* Tree Root Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {MAIN_5_CATEGORIES.map(cat => {
              const isExpanded = expandedCategory === cat;
              const isCatActive = selectedCategory === cat;
              const subList = CATEGORY_SUBCATEGORIES[cat] || [];

              return (
                <div key={cat} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Main Category Row */}
                  <div
                    onClick={() => handleToggleCategory(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: isCatActive || isExpanded ? 700 : 600,
                      color: isCatActive ? '#0F766E' : '#334155',
                      background: (isCatActive && selectedDosage === 'ALL') ? '#CCFBF1' : isExpanded ? '#F1F5F9' : 'transparent',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 120ms ease'
                    }}
                  >
                    {/* Small Expand/Collapse Arrow */}
                    <span style={{ fontSize: 11, width: 14, color: isExpanded ? '#0F766E' : '#64748B', display: 'inline-flex', alignItems: 'center' }}>
                      {isExpanded ? '▾' : '▸'}
                    </span>
                    <span style={{ flex: 1 }}>{cat}</span>
                  </div>

                  {/* Sub-categories: Shown ONLY when this category is expanded */}
                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 22, marginTop: 2, marginBottom: 6, gap: 1 }}>
                      {subList.map(sub => {
                        const isSubActive = selectedCategory === cat && selectedDosage === sub;
                        return (
                          <div
                            key={sub}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSubCategory(cat, sub);
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: isSubActive ? 700 : 500,
                              color: isSubActive ? '#0F766E' : '#475569',
                              background: isSubActive ? '#E6FFFA' : 'transparent',
                              cursor: 'pointer',
                              userSelect: 'none',
                              transition: 'all 120ms ease'
                            }}
                          >
                            {sub}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Table View ────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, overflowX: 'auto', borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CATEGORY</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DOSAGE FORM & STRENGTH</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PACKAGING</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MANUFACTURER PRODUCT CODE</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STANDARD MOQ</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>TYPICAL DELIVERY SCHEDULE</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', background: '#F8FAFC' }}>
                  <Package size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No products found in this manufacturer's catalog.</div>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4, marginBottom: 14 }}>
                    Click "+ Add Product" to map existing central Product Master products to {mfgDisplayName}.
                  </div>
                  <button
                    onClick={handleOpenAddModal}
                    style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                  >
                    + Add Product
                  </button>
                </td>
              </tr>
            ) : (
              filteredProducts.map((item, idx) => {
                const { product, mapping, status } = item;
                return (
                  <tr
                    key={product.id || idx}
                    onClick={() => handleOpenDrawer(item)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                  >
                    {/* 1. PRODUCT */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{product.name}</div>
                      <div style={{ fontSize: 11, color: '#0F766E', fontWeight: 700, marginTop: 2, fontFamily: 'monospace' }}>
                        Central Code: {product.code}
                      </div>
                    </td>

                    {/* 2. CATEGORY */}
                    <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                      {product.category}
                    </td>

                    {/* 3. DOSAGE FORM & STRENGTH */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                          {product.dosageForm}
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F766E' }}>
                          {product.strength}
                        </span>
                      </div>
                    </td>

                    {/* 4. PACKAGING */}
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
                      {mapping.packaging || product.packSize || '10 × 1 × 10 Strip'}
                    </td>

                    {/* 5. MANUFACTURER PRODUCT CODE */}
                    <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {mapping.mfgProductCode}
                    </td>

                    {/* 6. STANDARD MOQ */}
                    <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {mapping.moq.toLocaleString()} Units
                    </td>

                    {/* 7. TYPICAL LEAD TIME */}
                    <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 800, color: '#0F766E' }}>
                      {mapping.standardLeadTimeDays} Days
                    </td>

                    {/* 8. STATUS */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                        background: status === 'Active' ? '#DCFCE7' : status === 'Inactive' ? '#FEE2E2' : '#FEF3C7',
                        color: status === 'Active' ? '#15803D' : status === 'Inactive' ? '#B91C1C' : '#B45309',
                        border: status === 'Active' ? '1px solid #86EFAC' : status === 'Inactive' ? '1px solid #FCA5A5' : '1px solid #FDE68A'
                      }}>
                        {status}
                      </span>
                    </td>

                    {/* 9. ACTION */}
                    <td onClick={e => e.stopPropagation()} style={{ padding: '12px 14px', textAlign: 'right', paddingRight: 16 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => handleOpenDrawer(item)}
                          style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)', color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => setConfirmRemoveItem({ mapping, product })}
                          style={{ padding: '5px 10px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: 'rgba(185, 28, 28, 0.06)', border: '1px solid rgba(185, 28, 28, 0.25)', color: '#B91C1C', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Remove from catalog"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      </div>

      {/* ── MODAL: ADD PRODUCT TO CATALOG ─────────────────────────── */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsAddModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Add Product to Catalog</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Catalog management for <strong>{mfgDisplayName}</strong>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Error Alert */}
            {addFormError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#B91C1C', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} />
                  <span>{addFormError}</span>
                </div>
              </div>
            )}

            {/* Modal Tabs: Create New Product vs Bulk Upload vs Map from Master */}
            <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => { setAddModalTab('CREATE'); setAddFormError(null); }}
                style={{
                  padding: '7px 16px', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  border: addModalTab === 'CREATE' ? '1px solid #0F766E' : '1px solid #CBD5E1',
                  background: addModalTab === 'CREATE' ? '#0F766E' : '#F8FAFC',
                  color: addModalTab === 'CREATE' ? '#FFFFFF' : '#475569'
                }}
              >
                + Create New Product (Manual)
              </button>
              <button
                type="button"
                onClick={() => { setAddModalTab('UPLOAD'); setAddFormError(null); }}
                style={{
                  padding: '7px 16px', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  border: addModalTab === 'UPLOAD' ? '1px solid #0F766E' : '1px solid #CBD5E1',
                  background: addModalTab === 'UPLOAD' ? '#0F766E' : '#F8FAFC',
                  color: addModalTab === 'UPLOAD' ? '#FFFFFF' : '#475569',
                  display: 'inline-flex', alignItems: 'center', gap: 6
                }}
              >
                <FileSpreadsheet size={14} /> Bulk Upload (Excel/CSV)
              </button>
              <button
                type="button"
                onClick={() => { setAddModalTab('MAP'); setAddFormError(null); }}
                style={{
                  padding: '7px 16px', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  border: addModalTab === 'MAP' ? '1px solid #0F766E' : '1px solid #CBD5E1',
                  background: addModalTab === 'MAP' ? '#0F766E' : '#F8FAFC',
                  color: addModalTab === 'MAP' ? '#FFFFFF' : '#475569'
                }}
              >
                Map Existing Master Product
              </button>
            </div>

            {/* SUB-FLOW 1: CREATE NEW PRODUCT */}
            {addModalTab === 'CREATE' ? (
              <form onSubmit={handleSaveCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1. CLASSIFICATION HIERARCHY */}
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Filter size={14} /> 1. CLASSIFICATION HIERARCHY
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {/* Category */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Category *
                    </label>
                    <select
                      required
                      value={createProductForm.category}
                      onChange={e => {
                        const newCat = e.target.value;
                        setCreateProductForm({
                          ...createProductForm,
                          category: newCat,
                          subCategory: '',
                          dosageForm: '',
                          subSubCategory: '',
                          subSubCategoryId: ''
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none', background: '#F0FDFA', color: '#0F766E' }}
                    >
                      <option value="" disabled>-- Select Category * --</option>
                      {activeCategoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Category */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Sub-Category *
                    </label>
                    <select
                      required={createAvailableSubCategories.length > 0}
                      disabled={!createProductForm.category || createAvailableSubCategories.length === 0}
                      value={createProductForm.subCategory || createProductForm.dosageForm}
                      onChange={e => {
                        const newSub = e.target.value;
                        setCreateProductForm({
                          ...createProductForm,
                          subCategory: newSub,
                          dosageForm: newSub,
                          subSubCategory: '',
                          subSubCategoryId: ''
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: (!createProductForm.category || createAvailableSubCategories.length === 0) ? '#F8FAFC' : '#FFFFFF' }}
                    >
                      {!createProductForm.category ? (
                        <option value="">-- Select Category First --</option>
                      ) : createAvailableSubCategories.length === 0 ? (
                        <option value="">Not Applicable (No sub-categories)</option>
                      ) : (
                        <>
                          <option value="">-- Select Sub-Category * --</option>
                          {createAvailableSubCategories.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Sub-Sub-Category */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Sub-Sub-Category <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>
                    </label>
                    <select
                      disabled={(!createProductForm.subCategory && !createProductForm.dosageForm) || createAvailableSubSubCategories.length === 0}
                      value={createProductForm.subSubCategory}
                      onChange={e => {
                        const val = e.target.value;
                        const matched = createAvailableSubSubCategories.find(s => s.name === val);
                        setCreateProductForm({
                          ...createProductForm,
                          subSubCategory: val,
                          subSubCategoryId: matched?.id || ''
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: ((!createProductForm.subCategory && !createProductForm.dosageForm) || createAvailableSubSubCategories.length === 0) ? '#F8FAFC' : '#FFFFFF' }}
                    >
                      {(!createProductForm.subCategory && !createProductForm.dosageForm) ? (
                        <option value="">-- Select Sub-Category First --</option>
                      ) : createAvailableSubSubCategories.length === 0 ? (
                        <option value="">Not Applicable (None for this Sub-Category)</option>
                      ) : (
                        <>
                          <option value="">-- Select Sub-Sub-Category (Optional) --</option>
                          {createAvailableSubSubCategories.map(ss => (
                            <option key={ss.id} value={ss.name}>{ss.name} ({ss.code})</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* 2. PRODUCT INFORMATION */}
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Package size={14} /> 2. PRODUCT INFORMATION
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Product Code / SKU *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PCM-650"
                      value={createProductForm.sku}
                      onChange={e => setCreateProductForm({ ...createProductForm, sku: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paracetamol 650mg Tablets"
                      value={createProductForm.name}
                      onChange={e => setCreateProductForm({ ...createProductForm, name: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Generic Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol Extended Release"
                      value={createProductForm.genericName}
                      onChange={e => setCreateProductForm({ ...createProductForm, genericName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Salt Combination / Composition
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol IP 650mg"
                      value={createProductForm.saltCombination}
                      onChange={e => setCreateProductForm({ ...createProductForm, saltCombination: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Strength
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 650mg"
                      value={createProductForm.strength}
                      onChange={e => setCreateProductForm({ ...createProductForm, strength: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Packaging / Pack Size *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10 × 1 × 10 Strip"
                      value={createProductForm.packaging}
                      onChange={e => setCreateProductForm({ ...createProductForm, packaging: e.target.value, packSize: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      UOM
                    </label>
                    <select
                      value={createProductForm.uom}
                      onChange={e => setCreateProductForm({ ...createProductForm, uom: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                    >
                      <option value="Strip">Strip</option>
                      <option value="Box">Box</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Vial">Vial</option>
                      <option value="Pack">Pack</option>
                      <option value="Units">Units</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Product Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter manufacturing specifications, compliance details..."
                    value={createProductForm.description}
                    onChange={e => setCreateProductForm({ ...createProductForm, description: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {/* 3. MANUFACTURER SPECIFICATIONS & MAPPING */}
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <ShieldCheck size={14} /> 3. MANUFACTURER SPECIFICATIONS & MAPPING
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Manufacturing Source:</span>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{mfgDisplayName} ({mfgCode})</div>
                    </div>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 700 }}>
                      Verified Supplier
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        Minimum Order Qty (MOQ) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={createProductForm.moq}
                        onChange={e => setCreateProductForm({ ...createProductForm, moq: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        Delivery Lead Time (Days) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={createProductForm.standardLeadTimeDays}
                        onChange={e => setCreateProductForm({ ...createProductForm, standardLeadTimeDays: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        Est. Base Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={createProductForm.basePrice}
                        onChange={e => setCreateProductForm({ ...createProductForm, basePrice: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Certifications (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="WHO-GMP, CDSCO Form 25/28, ISO 9001"
                      value={createProductForm.certificationsStr}
                      onChange={e => setCreateProductForm({ ...createProductForm, certificationsStr: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                    />
                  </div>
                </div>

                {/* 4. SAVE PRODUCT */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '9px 24px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}
                  >
                    Save Product & Add to My Catalog
                  </button>
                </div>
              </form>
            ) : addModalTab === 'UPLOAD' ? (
              /* SUB-FLOW 2: BULK UPLOAD EXCEL/CSV */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {bulkSuccessCount !== null ? (
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: 24, textAlign: 'center' }}>
                    <CheckCheck size={40} color="#059669" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 800, color: '#065F46' }}>
                      Successfully Imported {bulkSuccessCount} Products!
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, color: '#047857' }}>
                      Products have been added to Central Product Master and mapped to {mfgDisplayName} with Pending Margin status.
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <UploadCloud size={16} /> Bulk Product Upload (Excel / CSV)
                      </div>
                      <div style={{ fontSize: 12, color: '#115E59' }}>
                        Upload multiple products for <strong>{mfgDisplayName}</strong>. Each product must include SKU, generic name, composition, dosage form, pack size, category, sub-category, MOQ, and lead time. Admin will configure margins after import.
                      </div>
                    </div>

                    {/* Action Bar: Download Template & Load Sample */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <button
                        type="button"
                        onClick={handleDownloadProductTemplate}
                        style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Download size={14} /> Download Sample CSV Template
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadSampleProductsCSV}
                        style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <RefreshCw size={13} /> Load Demo Sample Data (3 Products)
                      </button>
                    </div>

                    {/* File Dropzone */}
                    <div
                      style={{
                        border: '2px dashed #94A3B8',
                        borderRadius: 10,
                        padding: '24px 20px',
                        textAlign: 'center',
                        background: '#F8FAFC',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        const fileInput = document.getElementById('fg-product-file-input');
                        if (fileInput) fileInput.click();
                      }}
                    >
                      <input
                        id="fg-product-file-input"
                        type="file"
                        accept=".csv, .txt, .xlsx, .xls"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = evt => {
                            const text = evt.target?.result as string;
                            if (text) {
                              parseAndValidateProductCSV(text, file.name);
                            }
                          };
                          reader.readAsText(file);
                        }}
                      />
                      <UploadCloud size={36} color="#0F766E" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {bulkFileName ? `Loaded: ${bulkFileName}` : 'Click to select or drag & drop CSV file here'}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                        Supported formats: .CSV, .TXT (Comma-separated UTF-8)
                      </div>
                    </div>

                    {/* Validation Preview */}
                    {bulkProductRows.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Summary Badges */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ padding: '6px 12px', background: '#F1F5F9', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                            Total Rows: {bulkProductRows.length}
                          </div>
                          <div style={{ padding: '6px 12px', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#15803D' }}>
                            ✓ Valid: {bulkProductRows.filter(r => r.isValid).length}
                          </div>
                          {bulkProductRows.some(r => !r.isValid) && (
                            <div style={{ padding: '6px 12px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#B91C1C' }}>
                              ⚠ Errors: {bulkProductRows.filter(r => !r.isValid).length}
                            </div>
                          )}
                        </div>

                        {/* Preview Table */}
                        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                            <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, borderBottom: '1px solid #CBD5E1' }}>
                              <tr>
                                <th style={{ padding: '8px 10px', color: '#475569' }}>#</th>
                                <th style={{ padding: '8px 10px', color: '#475569' }}>Status</th>
                                <th style={{ padding: '8px 10px', color: '#475569' }}>SKU</th>
                                <th style={{ padding: '8px 10px', color: '#475569' }}>Product Name</th>
                                <th style={{ padding: '8px 10px', color: '#475569' }}>Form / Pack</th>
                                <th style={{ padding: '8px 10px', color: '#475569' }}>MOQ / Days</th>
                                <th style={{ padding: '8px 10px', color: '#475569' }}>Base Price</th>
                                <th style={{ padding: '8px 10px', color: '#475569' }}>Validation Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkProductRows.map((r, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: r.isValid ? '#FFFFFF' : '#FFF5F5' }}>
                                  <td style={{ padding: '8px 10px', color: '#64748B' }}>{r.rowNum}</td>
                                  <td style={{ padding: '8px 10px' }}>
                                    <span style={{
                                      fontSize: 10.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                                      background: r.isValid ? '#DCFCE7' : '#FEE2E2',
                                      color: r.isValid ? '#15803D' : '#B91C1C'
                                    }}>
                                      {r.isValid ? 'VALID' : 'INVALID'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0F766E' }}>{r.sku || '—'}</td>
                                  <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0F172A' }}>{r.name}</td>
                                  <td style={{ padding: '8px 10px', color: '#475569' }}>{r.dosageForm} ({r.packSize})</td>
                                  <td style={{ padding: '8px 10px', color: '#475569' }}>{r.moq} / {r.leadTimeDays}d</td>
                                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>₹{r.basePrice?.toFixed(2)}</td>
                                  <td style={{ padding: '8px 10px', color: r.isValid ? '#15803D' : '#B91C1C' }}>
                                    {r.isValid ? 'Ready for import' : r.errors.join('; ')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Modal Footer for Bulk Import */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setBulkProductRows([]);
                              setBulkFileName('');
                              setIsAddModalOpen(false);
                            }}
                            style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={bulkProductRows.filter(r => r.isValid).length === 0 || isProcessingBulk}
                            onClick={handleConfirmBulkProductImport}
                            style={{
                              padding: '9px 24px',
                              borderRadius: 6,
                              border: 'none',
                              background: bulkProductRows.filter(r => r.isValid).length > 0 ? '#0F766E' : '#94A3B8',
                              color: '#FFF',
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: bulkProductRows.filter(r => r.isValid).length > 0 ? 'pointer' : 'not-allowed',
                              boxShadow: '0 1px 3px rgba(15,118,110,0.2)'
                            }}
                          >
                            {isProcessingBulk ? 'Importing Products...' : `Import ${bulkProductRows.filter(r => r.isValid).length} Valid Products`}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : !selectedCentralProduct ? (
              /* SUB-FLOW 2: MAP EXISTING CENTRAL PRODUCT */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                    SELECT PRODUCT MASTER
                  </div>

                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input
                    type="text"
                    placeholder="Search product name, generic name or product code..."
                    value={centralSearchQuery}
                    onChange={e => setCentralSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#F8FAFC' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                  {centralProductResults.map(prd => {
                    const isAlreadyMapped = mfgMappings.some(m => m.productId === prd.id);
                    return (
                      <div
                        key={prd.id}
                        onClick={() => handleSelectCentralProduct(prd)}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          border: isAlreadyMapped ? '1px solid #E2E8F0' : '1px solid #CBD5E1',
                          background: isAlreadyMapped ? '#F8FAFC' : '#FFFFFF',
                          cursor: isAlreadyMapped ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          opacity: isAlreadyMapped ? 0.7 : 1,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{prd.name}</div>
                          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                            <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{prd.code}</strong> · {prd.genericName} · {prd.dosageForm} ({prd.strength})
                          </div>
                        </div>

                        {isAlreadyMapped ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '3px 8px', borderRadius: 4 }}>
                            Already Mapped
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSelectCentralProduct(prd); }}
                            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer' }}
                          >
                            Select →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* STEP 2: ENTER MANUFACTURER-SPECIFIC DETAILS FOR MAPPING */
              <form onSubmit={handleSaveAddMapping} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* READ-ONLY CENTRAL PRODUCT INFO */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                      PRODUCT INFORMATION (READ-ONLY MASTER)
                    </div>
                    <button type="button" onClick={() => setSelectedCentralProduct(null)} style={{ background: 'none', border: 'none', color: '#0F766E', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Change Product
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                    <div>Product Code: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{selectedCentralProduct.code}</strong></div>
                    <div>Product Name: <strong style={{ color: '#0F172A' }}>{selectedCentralProduct.name}</strong></div>
                    <div>Generic Name: <strong>{selectedCentralProduct.genericName}</strong></div>
                    <div>Dosage & Strength: <strong>{selectedCentralProduct.dosageForm} {selectedCentralProduct.strength}</strong></div>
                  </div>
                </div>

                {/* EDITABLE MANUFACTURER PRODUCT DETAILS */}
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                  MANUFACTURER PRODUCT DETAILS
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacturer</label>
                  <input type="text" readOnly value={mfgDisplayName} style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, background: '#F1F5F9', color: '#334155', fontWeight: 700 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacturer Product Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SUN-PCM-650"
                      value={mappingFormData.mfgProductCode}
                      onChange={e => setMappingFormData({ ...mappingFormData, mfgProductCode: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                    />
                    <span style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, display: 'block' }}>Does not replace central code {selectedCentralProduct.code}</span>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Status</label>
                    <select
                      value={mappingFormData.status}
                      onChange={e => setMappingFormData({ ...mappingFormData, status: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending Compliance">Pending Compliance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Packaging Details *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10 × 1 × 10 Strip or 1 x 100 ml Bottle"
                    value={mappingFormData.packaging}
                    onChange={e => setMappingFormData({ ...mappingFormData, packaging: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                  <span style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, display: 'block' }}>Manufacturer packaging specification</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Minimum Order Quantity (MOQ) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={mappingFormData.moq}
                      onChange={e => setMappingFormData({ ...mappingFormData, moq: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Standard Delivery Schedule (Days) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={mappingFormData.standardLeadTimeDays}
                      onChange={e => setMappingFormData({ ...mappingFormData, standardLeadTimeDays: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product-Specific Certifications</label>
                  <input
                    type="text"
                    placeholder="WHO-GMP, CDSCO Applicable, ISO 9001:2015"
                    value={mappingFormData.certificationsStr}
                    onChange={e => setMappingFormData({ ...mappingFormData, certificationsStr: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save to Product Catalog</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW / EDIT PRODUCT DRAWER ────────────────────────────── */}
      {activeDrawerItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }} onClick={() => setActiveDrawerItem(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, height: '100%', background: '#FFFFFF', borderLeft: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.15)' }}>

            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  {drawerEditMode ? 'EDIT PRODUCT DETAILS' : 'PRODUCT DETAILS'} · {drawerFormData.code}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {drawerFormData.name || activeDrawerItem.product.name}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!drawerEditMode && (
                  <button
                    onClick={() => setDrawerEditMode(true)}
                    style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #0F766E', background: 'rgba(15,118,110,0.07)', color: '#0F766E', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Edit3 size={13} /> Edit Product
                  </button>
                )}
                <button onClick={() => setActiveDrawerItem(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSaveDrawerForm} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Alerts */}
                {drawerSaveSuccess && (
                  <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 8, padding: '10px 14px', color: '#15803D', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} />
                    <span>Product details updated successfully!</span>
                  </div>
                )}

                {drawerFormError && (
                  <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', color: '#B91C1C', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} />
                    <span>{drawerFormError}</span>
                  </div>
                )}

                {/* PRODUCT DETAILS TABLE */}
                <div style={{ borderRadius: 8, border: '1px solid #CBD5E1', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                    <tbody>

                      {/* Product Code — always read-only */}
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC', width: '38%' }}>Product Code</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#0F766E', background: '#F0FDFA' }}>{drawerFormData.code}</td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Product Name</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <input type="text" required value={drawerFormData.name} onChange={e => setDrawerFormData({ ...drawerFormData, name: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontWeight: 700, outline: 'none' }} />
                          ) : (
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', padding: '3px 4px', display: 'block' }}>{drawerFormData.name}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Category</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <select
                              value={drawerFormData.category}
                              onChange={e => setDrawerFormData({ ...drawerFormData, category: e.target.value, dosageForm: (CATEGORY_SUBCATEGORIES[e.target.value] || [])[0] || drawerFormData.dosageForm })}
                              style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontWeight: 600, outline: 'none' }}
                            >
                              {ALL_MAIN_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E', padding: '3px 4px', display: 'block' }}>{drawerFormData.category}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Generic Name</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <input type="text" value={drawerFormData.genericName} onChange={e => setDrawerFormData({ ...drawerFormData, genericName: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }} />
                          ) : (
                            <span style={{ fontSize: 12.5, color: '#334155', padding: '3px 4px', display: 'block' }}>{drawerFormData.genericName || '—'}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Salt Combination</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <input type="text" value={drawerFormData.saltCombination} onChange={e => setDrawerFormData({ ...drawerFormData, saltCombination: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }} />
                          ) : (
                            <span style={{ fontSize: 12.5, color: '#334155', padding: '3px 4px', display: 'block' }}>{drawerFormData.saltCombination || '—'}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Strength</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <input type="text" value={drawerFormData.strength} onChange={e => setDrawerFormData({ ...drawerFormData, strength: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }} />
                          ) : (
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F766E', padding: '3px 4px', display: 'block' }}>{drawerFormData.strength || '—'}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Sub-Category / Dosage Form</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <select value={drawerFormData.dosageForm} onChange={e => setDrawerFormData({ ...drawerFormData, dosageForm: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontWeight: 600, outline: 'none' }}>
                              {(CATEGORY_SUBCATEGORIES[drawerFormData.category] || []).length > 0 ? (
                                (CATEGORY_SUBCATEGORIES[drawerFormData.category] || []).map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))
                              ) : (
                                <option value={drawerFormData.dosageForm}>{drawerFormData.dosageForm || '(No sub-categories defined)'}</option>
                              )}
                            </select>
                          ) : (
                            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', margin: '3px 4px' }}>{drawerFormData.dosageForm}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Pack Size</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <input type="text" value={drawerFormData.packSize} onChange={e => setDrawerFormData({ ...drawerFormData, packSize: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }} />
                          ) : (
                            <span style={{ fontSize: 12.5, color: '#334155', padding: '3px 4px', display: 'block' }}>{drawerFormData.packSize || '—'}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>UOM</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <select value={drawerFormData.uom} onChange={e => setDrawerFormData({ ...drawerFormData, uom: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontWeight: 600, outline: 'none' }}>
                              <option value="Strip">Strip</option>
                              <option value="Box">Box</option>
                              <option value="Bottle">Bottle</option>
                              <option value="Vial">Vial</option>
                              <option value="Pack">Pack</option>
                              <option value="Units">Units</option>
                            </select>
                          ) : (
                            <span style={{ fontSize: 12.5, color: '#334155', padding: '3px 4px', display: 'block' }}>{drawerFormData.uom}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Packaging</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <input type="text" value={drawerFormData.packaging} onChange={e => setDrawerFormData({ ...drawerFormData, packaging: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }} />
                          ) : (
                            <span style={{ fontSize: 12.5, color: '#334155', padding: '3px 4px', display: 'block' }}>{drawerFormData.packaging || '—'}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Description</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <textarea rows={2} value={drawerFormData.description} onChange={e => setDrawerFormData({ ...drawerFormData, description: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none', resize: 'vertical' }} />
                          ) : (
                            <span style={{ fontSize: 12.5, color: '#475569', padding: '3px 4px', display: 'block', lineHeight: 1.6 }}>{drawerFormData.description || '—'}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Manufacturer Product Code</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <input type="text" required value={drawerFormData.mfgProductCode} onChange={e => setDrawerFormData({ ...drawerFormData, mfgProductCode: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontFamily: 'monospace', fontWeight: 700, outline: 'none' }} />
                          ) : (
                            <span style={{ fontSize: 12.5, fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', padding: '3px 4px', display: 'block' }}>{drawerFormData.mfgProductCode}</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Minimum Order Quantity (MOQ)</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <input type="number" min="1" required value={drawerFormData.moq} onChange={e => setDrawerFormData({ ...drawerFormData, moq: Number(e.target.value) || 0 })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }} />
                          ) : (
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', padding: '3px 4px', display: 'block' }}>{(drawerFormData.moq || 0).toLocaleString()} Units</span>
                          )}
                        </td>
                      </tr>

                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Standard Delivery Schedule (Days)</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <input type="number" min="1" required value={drawerFormData.standardLeadTimeDays} onChange={e => setDrawerFormData({ ...drawerFormData, standardLeadTimeDays: Number(e.target.value) || 0 })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }} />
                          ) : (
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E', padding: '3px 4px', display: 'block' }}>{drawerFormData.standardLeadTimeDays} Days</span>
                          )}
                        </td>
                      </tr>

                      <tr>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', background: '#F8FAFC' }}>Status</td>
                        <td style={{ padding: '6px 10px' }}>
                          {drawerEditMode ? (
                            <select value={drawerFormData.status} onChange={e => setDrawerFormData({ ...drawerFormData, status: e.target.value })} style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontWeight: 600, outline: 'none' }}>
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          ) : (
                            <span style={{ display: 'inline-block', margin: '3px 4px', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: drawerFormData.status === 'Active' ? '#DCFCE7' : '#FEE2E2', color: drawerFormData.status === 'Active' ? '#15803D' : '#B91C1C', border: drawerFormData.status === 'Active' ? '1px solid #86EFAC' : '1px solid #FCA5A5' }}>
                              {drawerFormData.status}
                            </span>
                          )}
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

              {/* Drawer Footer */}
              <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                {drawerEditMode ? (
                  <>
                    <button type="button" onClick={() => { setDrawerEditMode(false); setDrawerFormError(null); }} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Cancel Edit
                    </button>
                    <button type="submit" style={{ padding: '9px 22px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}>
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setActiveDrawerItem(null)} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Close
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REMOVE PRODUCT CONFIRMATION DIALOG ────────────────────── */}
      {confirmRemoveItem && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setConfirmRemoveItem(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', borderRadius: 14, padding: 28, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)', border: '1px solid #CBD5E1' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={18} style={{ color: '#B91C1C' }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Remove Product?</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>This action removes the product from your catalog only.</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#334155', margin: '0 0 6px 0', lineHeight: 1.6 }}>
              Are you sure you want to remove <strong style={{ color: '#0F172A' }}>{confirmRemoveItem.product.name}</strong> from your Product Catalog?
            </p>
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#92400E', marginBottom: 20 }}>
              ⚠️ This will <strong>only unmap</strong> the product from <strong>{mfgDisplayName}'s</strong> catalog. The Central Product Master will remain untouched. You can add it back later.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setConfirmRemoveItem(null)}
                style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#B91C1C', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} /> Remove Product
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
