import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Factory, Cpu, ShieldCheck, CheckCircle2, Clock, Package,
  AlertTriangle, FileText, ChevronRight, X, Play,
  CheckSquare, Square, Download, Thermometer, Layers,
  Calendar, User, Check, RefreshCw, ArrowRight, ArrowLeft, Truck, Search
} from 'lucide-react';

interface ProductionExecutionModuleProps {
  onNavigateTab?: (tabId: string) => void;
}

export type ProductionStage =
  | 'PO_ACCEPTED'
  | 'SCHEDULED'
  | 'IN_PRODUCTION'
  | 'QUALITY_INSPECTION'
  | 'QUALITY_HOLD'
  | 'PACKAGING'
  | 'READY_TO_DISPATCH';

export const UNIFIED_STORAGE_KEY = 'factorygrid_unified_suborders_v12';

// Safe Number Formatter
export const formatNumber = (val: number | undefined | null, fallback = '0'): string => {
  if (val == null || isNaN(val)) return fallback;
  return val.toLocaleString();
};

export const ProductionExecutionModule: React.FC<ProductionExecutionModuleProps> = ({ onNavigateTab }) => {
  const { manufacturers, addAuditLog, setActiveTab, orders } = useApp();

  const myMfg = (manufacturers && manufacturers[0]) || null;
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';

  // Dynamic Sub-Orders Store Synced with AppContext Master Orders
  const syncSubOrdersWithContext = (saved: any) => {
    const defaultStore: Record<string, any> = {};

    defaultStore['SO-1001-01'] = {
      subOrderNumber: 'SO-1001-01',
      poNumber: 'PO-2026-1001-01',
      masterOrderNumber: 'MO-2026-1001',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Paracetamol 500mg & Azithromycin 500mg Tablets',
      totalQuantity: 12000,
      orderValue: 195300,
      requiredDeliveryDate: '2026-09-02',
      leadTimeDays: 14,
      productionStatus: 'ARTWORK',
      batchNumber: '',
      manufacturingLine: '',
      plannedStartDate: '',
      expectedCompletionDate: '',
      progressPercent: 0,
      shipment: null
    };

    defaultStore['SO-2026-5361-01'] = {
      subOrderNumber: 'SO-2026-5361-01',
      poNumber: 'PO-SO-2026-5361-01',
      masterOrderNumber: 'MO-2026-5361',
      customerName: 'SunBio LifeSciences Ltd',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Paracetamol 500mg & Azithromycin 500mg Tablets',
      totalQuantity: 12000,
      orderValue: 195300,
      requiredDeliveryDate: '2026-09-01',
      leadTimeDays: 10,
      productionStatus: 'ARTWORK',
      batchNumber: '',
      manufacturingLine: '',
      plannedStartDate: '',
      expectedCompletionDate: '',
      progressPercent: 0,
      shipment: null
    };

    defaultStore['SO-2026-5230-01'] = {
      subOrderNumber: 'SO-2026-5230-01',
      poNumber: 'PO-SO-2026-5230-01',
      masterOrderNumber: 'MO-2026-5230',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Amoxyclav 625mg Tablets',
      totalQuantity: 5000,
      orderValue: 252000,
      requiredDeliveryDate: '2026-09-05',
      productionStatus: 'ARTWORK',
      batchNumber: '',
      manufacturingLine: '',
      plannedStartDate: '',
      expectedCompletionDate: '',
      progressPercent: 0,
      shipment: null
    };

    defaultStore['SO-2026-5229-01'] = {
      subOrderNumber: 'SO-2026-5229-01',
      poNumber: 'PO-SO-2026-5229-01',
      masterOrderNumber: 'MO-2026-5229',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Paracetamol 650mg ER Tablets',
      totalQuantity: 10000,
      orderValue: 128800,
      requiredDeliveryDate: '2026-09-08',
      productionStatus: 'ARTWORK',
      batchNumber: '',
      manufacturingLine: '',
      plannedStartDate: '',
      expectedCompletionDate: '',
      progressPercent: 0,
      shipment: null
    };

    defaultStore['SO-2026-5231-01'] = {
      subOrderNumber: 'SO-2026-5231-01',
      poNumber: 'PO-SO-2026-5231-01',
      masterOrderNumber: 'MO-2026-5231',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Ciprofloxacin 500mg Tablets',
      totalQuantity: 8000,
      orderValue: 161280,
      requiredDeliveryDate: '2026-09-03',
      productionStatus: 'ARTWORK',
      batchNumber: '',
      manufacturingLine: '',
      plannedStartDate: '',
      expectedCompletionDate: '',
      progressPercent: 0,
      shipment: null
    };

    defaultStore['SO-2026-5228-01'] = {
      subOrderNumber: 'SO-2026-5228-01',
      poNumber: 'PO-SO-2026-5228-01',
      masterOrderNumber: 'MO-2026-5228',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Azithromycin 500mg Tablets',
      totalQuantity: 2000,
      orderValue: 26880,
      requiredDeliveryDate: '2026-08-28',
      productionStatus: 'ARTWORK',
      batchNumber: '',
      manufacturingLine: '',
      plannedStartDate: '',
      expectedCompletionDate: '',
      progressPercent: 0,
      shipment: null
    };

    defaultStore['SO-2026-5228-02'] = {
      subOrderNumber: 'SO-2026-5228-02',
      poNumber: 'PO-SO-2026-5228-02',
      masterOrderNumber: 'MO-2026-5228',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules',
      totalQuantity: 3000,
      orderValue: 48720,
      requiredDeliveryDate: '2026-09-10',
      productionStatus: 'PO_ACCEPTED',
      batchNumber: '',
      manufacturingLine: '',
      plannedStartDate: '',
      expectedCompletionDate: '',
      progressPercent: 0,
      shipment: null,
      demoOrder: true  // ← Active demo order: always shown at top in PO_ACCEPTED state
    };

    defaultStore['SO-2026-5232-01'] = {
      subOrderNumber: 'SO-2026-5232-01',
      poNumber: 'PO-SO-2026-5232-01',
      masterOrderNumber: 'MO-2026-5232',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Ceftriaxone 1g Injection',
      totalQuantity: 1200,
      orderValue: 114240,
      requiredDeliveryDate: '2026-08-27',
      productionStatus: 'ARTWORK',
      batchNumber: '',
      manufacturingLine: '',
      plannedStartDate: '',
      expectedCompletionDate: '',
      progressPercent: 0,
      shipment: null
    };

    defaultStore['SO-2026-5233-01'] = {
      subOrderNumber: 'SO-2026-5233-01',
      poNumber: 'PO-SO-2026-5233-01',
      masterOrderNumber: 'MO-2026-5233',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'Cipla Partner Formulations Ltd',
      productName: 'Metformin 500mg SR Tablets',
      totalQuantity: 20000,
      orderValue: 145600,
      requiredDeliveryDate: '2026-08-26',
      productionStatus: 'ARTWORK',
      batchNumber: '',
      manufacturingLine: '',
      plannedStartDate: '',
      expectedCompletionDate: '',
      progressPercent: 0,
      shipment: null
    };

    defaultStore['SO-2026-5234-01'] = {
      subOrderNumber: 'SO-2026-5234-01',
      poNumber: 'PO-SO-2026-5234-01',
      masterOrderNumber: 'MO-2026-5234',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Telmisartan 40mg Tablets',
      totalQuantity: 15000,
      orderValue: 154560,
      requiredDeliveryDate: '2026-08-24',
      productionStatus: 'ARTWORK',
      batchNumber: '',
      manufacturingLine: '',
      plannedStartDate: '',
      expectedCompletionDate: '',
      progressPercent: 0,
      shipment: null
    };

    // Merge saved user updates over default seeds so state changes persist
    const store: Record<string, any> = { ...defaultStore, ...(saved || {}) };

    // Always re-stamp demoOrder:true on the primary demo order so sorting works
    // correctly even when the user's saved copy of this order doesn't have the flag.
    if (store['SO-2026-5228-02']) {
      store['SO-2026-5228-02'] = { ...store['SO-2026-5228-02'], demoOrder: true };
    }

    if (Array.isArray(orders)) {
      orders.forEach(mo => {
        if (Array.isArray(mo.subOrders)) {
          mo.subOrders.forEach(so => {
            const subNum = so.subOrderNumber;
            if (subNum && !store[subNum]) {
              store[subNum] = {
                subOrderNumber: subNum,
                poNumber: `PO-${subNum}`,
                masterOrderNumber: mo.orderNumber,
                customerName: mo.customerName,
                manufacturerName: so.manufacturerName || myMfgName,
                productName: so.lines?.[0]?.productName || 'Pharmaceutical Product',
                totalQuantity: so.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 10000,
                orderValue: so.totalAmount || 150000,
                requiredDeliveryDate: mo.expectedDeliveryDate || '2026-09-02',
                leadTimeDays: 14,
                productionStatus: 'PO_ACCEPTED',
                batchNumber: '',
                manufacturingLine: '',
                plannedStartDate: '',
                expectedCompletionDate: '',
                progressPercent: 0,
                rawMaterialIssued: false,
                manufacturingStarted: false,
                shipment: null,
                invoice: null
              };
            }
          });
        }
      });
    }

    return store;
  };

  const getInitialStore = () => {
    try {
      const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      return syncSubOrdersWithContext(parsed);
    } catch (e) {
      console.error('Failed to parse unified suborders store', e);
      return syncSubOrdersWithContext({});
    }
  };

  const [subOrdersState, setSubOrdersState] = useState<Record<string, any>>(getInitialStore);

  // ── DEMO ARTWORK SEED FOR SEEDED ORDERS ──────────────────────────────────
  // Pre-seed artwork for default demo orders so demo flow opens with Artwork Ready.
  // New orders created from scratch start with empty artwork until Buyer uploads.
  React.useEffect(() => {
    try {
      const ART_KEY = 'factorygrid_product_artworks_v1';
      const saved = localStorage.getItem(ART_KEY);
      const store = saved ? JSON.parse(saved) : {};

      const demoOrders = ['SO-2026-5228-02', 'SO-2026-5232-01', 'SO-2026-5233-01', 'SO-2026-5234-01'];
      let hasChanges = false;

      demoOrders.forEach(code => {
        if (!store[code] || (Array.isArray(store[code]) && store[code].length === 0)) {
          store[code] = [{
            id: `demo_art_${code}`,
            fileName: `Packaging_Artwork_${code}.png`,
            fileType: 'PNG Image (.png)',
            fileSize: '3.1 MB',
            uploadedAt: '25 Aug 2026, 10:30 AM',
            status: 'UPLOADED',
            url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'
          }];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem(ART_KEY, JSON.stringify(store));
      }
    } catch (e) { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // View state: 'list' (Landing List View) | 'detail' (Selected Sub-Order Execution Detail)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  // Listing layout: 'table' | 'card' (EXACTLY ONE TOGGLE ON LANDING PAGE)
  const [listingLayout, setListingLayout] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  const [selectedOrderCode, setSelectedOrderCode] = useState<string>(() => {
    try {
      const target = localStorage.getItem('factorygrid_target_suborder');
      if (target) return target;
    } catch (e) {}
    const keys = Object.keys(getInitialStore());
    return keys[keys.length - 1] || 'SO-1001-01';
  });

  // Eligible Sub-Orders for Production Planning
  const eligibleSubOrders = useMemo(() => {
    return Object.values(subOrdersState).filter((ord: any) => {
      if (!ord || !ord.subOrderNumber) return false;
      const isMyMfg = ord.mfgId === 'm1' || ord.manufacturerId === 'm1' ||
        (ord.manufacturerName && ord.manufacturerName.toLowerCase().includes('sunbio')) ||
        (ord.mfgName && ord.mfgName.toLowerCase().includes('sunbio'));
      return isMyMfg || ord.subOrderNumber.includes('1001') || ord.subOrderNumber.includes('5361') || ord.subOrderNumber.includes('5228');
    });
  }, [subOrdersState]);

  const filteredSubOrders = useMemo(() => {
    const raw = eligibleSubOrders.filter((ord: any) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (ord.subOrderNumber && ord.subOrderNumber.toLowerCase().includes(q)) ||
        (ord.customerName && ord.customerName.toLowerCase().includes(q)) ||
        (ord.poNumber && ord.poNumber.toLowerCase().includes(q)) ||
        (ord.productName && ord.productName.toLowerCase().includes(q));

      const matchesStage = stageFilter === 'ALL' || ord.productionStatus === stageFilter;

      return matchesSearch && matchesStage;
    });

    // ── STAGE-RANK PRIORITY SORT (PO_ACCEPTED & ARTWORK top priority) ──
    const getStageWeight = (status: string) => {
      switch (status) {
        case 'PO_ACCEPTED': return 1;
        case 'ARTWORK': return 2;
        case 'SCHEDULED': return 3;
        case 'IN_PRODUCTION': return 4;
        case 'QUALITY_INSPECTION': case 'QUALITY_HOLD': return 5;
        case 'PACKAGING': return 6;
        case 'READY_TO_DISPATCH': return 7;
        default: return 5;
      }
    };

    return [...raw].sort((a: any, b: any) => {
      const weightA = getStageWeight(a.productionStatus);
      const weightB = getStageWeight(b.productionStatus);

      if (weightA !== weightB) {
        return weightA - weightB;
      }

      // Demo order first among same stage priority
      if (a.demoOrder && !b.demoOrder) return -1;
      if (!a.demoOrder && b.demoOrder) return 1;

      return 0;
    });
  }, [eligibleSubOrders, searchQuery, stageFilter]);

  const handleOpenSubOrderDetail = (subCode: string) => {
    setSelectedOrderCode(subCode);
    try {
      localStorage.setItem('factorygrid_target_suborder', subCode);
    } catch (e) {}
    setViewMode('detail');
  };

  // Synchronize state automatically on window focus & storage update
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        const merged = syncSubOrdersWithContext(parsed);
        setSubOrdersState(merged);

        const target = localStorage.getItem('factorygrid_target_suborder');
        if (target && merged[target]) {
          setSelectedOrderCode(target);
        } else if (!merged[selectedOrderCode]) {
          const keys = Object.keys(merged);
          if (keys.length > 0) setSelectedOrderCode(keys[keys.length - 1]);
        }
      } catch (e) { console.error(e); }
    };

    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('focus', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, [orders]);

  // Persist State Changes
  useEffect(() => {
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(subOrdersState));
    } catch (e) {
      console.error('Failed to save suborders store', e);
    }
  }, [subOrdersState]);

  // Robust Sub-Order Record Resolution (NEVER fall back to old completed state for a new order)
  const activeOrder = subOrdersState[selectedOrderCode] || {
    subOrderNumber: selectedOrderCode,
    poNumber: `PO-${selectedOrderCode}`,
    masterOrderNumber: 'MO-2026-1002',
    customerName: 'B2B Client Partner',
    manufacturerName: myMfgName,
    productName: 'Pharmaceutical Products',
    totalQuantity: 10000,
    orderValue: 150000,
    requiredDeliveryDate: '2026-09-02',
    leadTimeDays: 14,

    // FRESH PRODUCTION WORKFLOW — PO_ACCEPTED
    productionStatus: 'PO_ACCEPTED',
    batchNumber: '',
    manufacturingLine: '',
    plannedStartDate: '',
    expectedCompletionDate: '',
    progressPercent: 0,
    rawMaterialIssued: false,
    manufacturingStarted: false,
    shipment: null,
    invoice: null
  };

  // Modal Control States
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showQcModal, setShowQcModal] = useState<boolean>(false);
  const [showPackagingModal, setShowPackagingModal] = useState<boolean>(false);

  // Dynamic Artwork Resolver for Sub-Order (Consistently Returns Demo Artwork for Demo Flow)
  const getSubOrderArtworkFiles = (subCode: string) => {
    try {
      const saved = localStorage.getItem('factorygrid_product_artworks_v1');
      if (saved) {
        const store = JSON.parse(saved);
        const subObj = store[subCode];
        if (subObj) {
          if (Array.isArray(subObj) && subObj.length > 0) {
            const uploaded = subObj.filter((f: any) => f.status === 'UPLOADED');
            if (uploaded.length > 0) return uploaded;
          } else if (!Array.isArray(subObj)) {
            const uploaded = Object.values(subObj).flatMap((arr: any) => arr).filter((f: any) => f.status === 'UPLOADED');
            if (uploaded.length > 0) return uploaded;
          }
        }
      }
    } catch (e) {
      /* ignore */
    }

    // Default demo artwork for demo flow so every sub-order at ARTWORK stage consistently shows Artwork Ready
    return [{
      id: `demo_art_${subCode}`,
      fileName: `Packaging_Artwork_${subCode}.png`,
      fileType: 'PNG Image (.png)',
      fileSize: '3.1 MB',
      uploadedAt: '25 Aug 2026, 10:30 AM',
      status: 'UPLOADED',
      url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'
    }];
  };

  const uploadedArtworkFiles = getSubOrderArtworkFiles(selectedOrderCode);
  const isArtworkUploaded = uploadedArtworkFiles.length > 0;

  // Supplier View Artwork Modal States
  const [showSupplierArtworkModal, setShowSupplierArtworkModal] = useState<boolean>(false);
  const [activeSupplierLightboxIdx, setActiveSupplierLightboxIdx] = useState<number | null>(null);

  // Form States for Modals
  const [schedLine, setSchedLine] = useState(activeOrder.manufacturingLine || 'Line A - Solid Oral Dosages');
  const [schedStartDate, setSchedStartDate] = useState(activeOrder.plannedStartDate || '2026-08-16');
  const [schedFinishDate, setSchedFinishDate] = useState(activeOrder.expectedCompletionDate || '2026-08-28');

  // QC Form States
  const [qcTestedQty, setQcTestedQty] = useState(activeOrder.totalQuantity || 12000);
  const [qcPassedQty, setQcPassedQty] = useState(activeOrder.totalQuantity || 12000);
  const [qcFailedQty, setQcFailedQty] = useState(0);
  const [qcRemarksText, setQcRemarksText] = useState('Assay 99.8%, Dissolution compliant with IP specifications. COA attached.');
  const [coaFile, setCoaFile] = useState<{ name: string; uploadedAt?: string } | null>(activeOrder.coaDocument || null);

  // Packaging Form States
  const [packSize, setPackSize] = useState('10x10 Alu-Alu Blister Strip');
  const [masterCartons, setMasterCartons] = useState(120);

  // NOTE: Manufacturer does NOT upload artwork.
  // Artwork is the Buyer's responsibility and is uploaded from the Buyer / Master Order page.
  // Manufacturer Production Planning only reads artwork status from factorygrid_product_artworks_v1.




  // Synchronous Store Saver & Storage Event Dispatcher
  const saveAndSyncStore = (newStore: Record<string, any>) => {
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(newStore));
    } catch (e) {
      console.error('Failed to write suborders store to localStorage', e);
    }
    setSubOrdersState(newStore);
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to dispatch storage event', e);
    }
  };

  // Step 1 -> Step 2: PROCEED TO ARTWORK STAGE
  const handleProceedToArtwork = () => {
    const updated = {
      ...activeOrder,
      productionStatus: 'ARTWORK'
    };
    const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
    saveAndSyncStore(newStore);
    addAuditLog('Production Engine', `Confirmed Purchase Order for ${selectedOrderCode} and advanced to Step 02: Artwork Stage`);
    alert(`✔ Purchase Order Confirmed!\n\nManufacturing Lifecycle: STEP 02 — ARTWORK STAGE`);
  };

  // Step 2 -> Step 3: SCHEDULE PRODUCTION
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!schedLine.trim() || !schedStartDate || !schedFinishDate) {
      alert('⚠ Missing Required Fields!\n\nPlease fill in Manufacturing Line, Start Date, and Expected Finish Date to schedule production.');
      return;
    }

    const updated = {
      ...activeOrder,
      productionStatus: 'SCHEDULED',
      manufacturingLine: schedLine.trim(),
      plannedStartDate: schedStartDate,
      expectedCompletionDate: schedFinishDate
    };

    const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
    saveAndSyncStore(newStore);
    setShowScheduleModal(false);
    addAuditLog('Production Engine', `Scheduled Production for ${selectedOrderCode}. Line: ${schedLine.trim()}`);
    alert(`✔ Production Scheduled!\n\nManufacturing Stage: SCHEDULED (Step 03)\nLine: ${schedLine.trim()}`);
  };

  // Step 2 -> Step 3: START PRODUCTION
  const handleStartProduction = () => {
    const updated = {
      ...activeOrder,
      productionStatus: 'IN_PRODUCTION',
      progressPercent: 35,
      rawMaterialIssued: true,
      manufacturingStarted: true
    };
    const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
    saveAndSyncStore(newStore);
    addAuditLog('Production Engine', `Started Manufacturing Execution for ${selectedOrderCode}`);
    alert(`✔ Manufacturing Started!\n\nManufacturing Stage: IN PRODUCTION`);
  };

  // Step 3 -> Step 4: COMPLETE PRODUCTION RUN
  const handleCompleteProduction = () => {
    const updated = {
      ...activeOrder,
      productionStatus: 'QUALITY_INSPECTION',
      progressPercent: 100
    };
    const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
    saveAndSyncStore(newStore);
    addAuditLog('Production Engine', `Completed Manufacturing Run for ${selectedOrderCode}`);
    alert(`✔ Manufacturing Run Complete!\n\nManufacturing Stage: QUALITY INSPECTION`);
  };

  // Step 4 -> Step 5 or QUALITY HOLD: QC INSPECTION
  const handleQcSubmit = (e: React.FormEvent, result: 'PASS' | 'HOLD') => {
    e.preventDefault();
    if (result === 'PASS') {
      const activeCoa = coaFile || activeOrder.coaDocument;
      if (!activeCoa) {
        alert('⚠ Certificate of Analysis (COA) Document Required!\n\nYou must upload a Certificate of Analysis (COA) document before you can accept/complete the QA Inspection step.');
        return;
      }

      if (qcPassedQty + qcFailedQty !== qcTestedQty) {
        alert(`⚠ QC Validation Error!\n\nPassed Quantity (${qcPassedQty.toLocaleString()}) + Failed Quantity (${qcFailedQty.toLocaleString()}) must equal Tested Quantity (${qcTestedQty.toLocaleString()}).`);
        return;
      }

      const updated = {
        ...activeOrder,
        productionStatus: 'PACKAGING',
        qcInspectionResult: 'PASS',
        qcTestedQuantity: qcTestedQty,
        qcPassedQuantity: qcPassedQty,
        qcFailedQuantity: qcFailedQty,
        qcRemarks: qcRemarksText,
        coaDocument: activeCoa
      };
      const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
      saveAndSyncStore(newStore);
      setShowQcModal(false);
      addAuditLog('QC Laboratory', `QC Passed for ${selectedOrderCode} with Certificate of Analysis (COA) document attached`);
      alert(`✔ QC Assay Inspection PASSED!\n\nAttached COA Document: ${activeCoa.name || activeCoa.fileName}\nManufacturing Stage: PACKAGING`);
    } else {
      const updated = {
        ...activeOrder,
        productionStatus: 'QUALITY_HOLD',
        qcInspectionResult: 'HOLD',
        qcRemarks: qcRemarksText,
        coaDocument: coaFile || activeOrder.coaDocument
      };
      const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
      saveAndSyncStore(newStore);
      setShowQcModal(false);
      addAuditLog('QC Laboratory', `QC Placed on HOLD for ${selectedOrderCode}`);
      alert(`⚠ QC Placed on HOLD!\n\nShipment creation is blocked until QC issue is resolved.`);
    }
  };

  // Step 5 -> Step 6: COMPLETE PACKAGING -> READY_TO_DISPATCH
  const handlePackagingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...activeOrder,
      productionStatus: 'READY_TO_DISPATCH',
      packagingPackSize: packSize,
      packagingMasterCartons: masterCartons
    };
    const newStore = { ...subOrdersState, [selectedOrderCode]: updated };
    saveAndSyncStore(newStore);
    setShowPackagingModal(false);
    addAuditLog('Packaging Desk', `Packaging Completed for ${selectedOrderCode}`);
    alert(`✔ Packaging Completed!\n\nManufacturing Stage: READY TO DISPATCH\n\nShipment creation is now available in Dispatch & Tracking.`);
  };

  // Switch tab to Dispatch & Tracking
  const handleGoToDispatch = () => {
    try {
      localStorage.setItem('factorygrid_target_suborder', activeOrder.subOrderNumber);
    } catch (e) { console.error(e); }

    if (onNavigateTab) {
      onNavigateTab('shipments');
    } else if (setActiveTab) {
      setActiveTab('shipments');
    } else {
      alert(`Navigating to Dispatch & Tracking for Sub-Order ${activeOrder.subOrderNumber}...`);
    }
  };

  // Sequential Step Index Calculator (Strictly 7 Production Stages)
  const getManufacturingStepIndex = (stage: string) => {
    switch (stage) {
      case 'PO_ACCEPTED': return 1;
      case 'ARTWORK': return 2;
      case 'SCHEDULED': return 3;
      case 'IN_PRODUCTION': return 4;
      case 'QUALITY_INSPECTION': case 'QUALITY_HOLD': return 5;
      case 'PACKAGING': return 6;
      case 'READY_TO_DISPATCH': return 7;
      default: return 1;
    }
  };

  const currentMfgStep = getManufacturingStepIndex(activeOrder.productionStatus || 'PO_ACCEPTED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* ─────────────────────────────────────────────────────────────
          1. PRODUCTION PLANNING LANDING LIST PAGE (viewMode === 'list')
         ───────────────────────────────────────────────────────────── */}
      {viewMode === 'list' ? (
        <>
          {/* Command Header */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                <span>FactoryGrid</span>
                <span>/</span>
                <span>Supplier</span>
                <span>/</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>Production Planning</span>
              </div>
              <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                PRODUCTION PLANNING & MANUFACTURING EXECUTION
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                Select an assigned sub-order below to manage manufacturing execution, artwork validation, and batch scheduling for <strong style={{ color: '#0F766E' }}>{myMfgName}</strong>
              </p>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Sub-Orders</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{eligibleSubOrders.length}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Assigned manufacturing orders</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PO Accepted</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 4 }}>
                {eligibleSubOrders.filter((o: any) => o.productionStatus === 'PO_ACCEPTED').length}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Awaiting artwork stage</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Artwork Stage</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: 4 }}>
                {eligibleSubOrders.filter((o: any) => o.productionStatus === 'ARTWORK').length}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Packaging verification</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Scheduled / In Prod</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#7C3AED', fontFamily: 'monospace', marginTop: 4 }}>
                {eligibleSubOrders.filter((o: any) => ['SCHEDULED', 'IN_PRODUCTION', 'QUALITY_INSPECTION', 'PACKAGING'].includes(o.productionStatus)).length}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Active line execution</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Ready To Dispatch</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 4 }}>
                {eligibleSubOrders.filter((o: any) => o.productionStatus === 'READY_TO_DISPATCH' || o.productionStatus === 'COMPLETED').length}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Execution complete</div>
            </div>
          </div>

          {/* Search, Stage Filter & EXACTLY ONE Table/Card View Toggle Bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
              {/* Search input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 12px', minWidth: 260, flex: 1 }}>
                <Search size={16} style={{ color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Search by Sub-Order #, Customer, Product, PO..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: '100%', color: '#0F172A' }}
                />
              </div>

              {/* Stage Filter */}
              <select
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                style={{ padding: '8px 12px', fontSize: 12.5, borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontWeight: 700, cursor: 'pointer' }}
              >
                <option value="ALL">All Stages</option>
                <option value="PO_ACCEPTED">Step 01: PO Accepted</option>
                <option value="ARTWORK">Step 02: Artwork</option>
                <option value="SCHEDULED">Step 03: Scheduled</option>
                <option value="IN_PRODUCTION">Step 04: In Production</option>
                <option value="QUALITY_INSPECTION">Step 05: Quality Inspection</option>
                <option value="PACKAGING">Step 06: Packaging</option>
                <option value="READY_TO_DISPATCH">Step 07: Ready To Dispatch</option>
              </select>
            </div>

            {/* SINGLE TABLE / CARD VIEW TOGGLE */}
            <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 8, padding: 3, border: '1px solid #CBD5E1' }}>
              <button
                onClick={() => setListingLayout('table')}
                style={{
                  padding: '7px 14px', borderRadius: 6,
                  background: listingLayout === 'table' ? '#FFFFFF' : 'transparent',
                  color: listingLayout === 'table' ? '#0F766E' : '#64748B',
                  fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer',
                  boxShadow: listingLayout === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Table View
              </button>
              <button
                onClick={() => setListingLayout('card')}
                style={{
                  padding: '7px 14px', borderRadius: 6,
                  background: listingLayout === 'card' ? '#FFFFFF' : 'transparent',
                  color: listingLayout === 'card' ? '#0F766E' : '#64748B',
                  fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer',
                  boxShadow: listingLayout === 'card' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Card View
              </button>
            </div>
          </div>

          {/* LISTING CONTENT: TABLE OR CARD VIEW */}
          {listingLayout === 'table' ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 16px' }}>Sub-Order Code</th>
                      <th style={{ padding: '12px 16px' }}>Customer / Buyer</th>
                      <th style={{ padding: '12px 16px' }}>PO Reference</th>
                      <th style={{ padding: '12px 16px' }}>Product(s)</th>
                      <th style={{ padding: '12px 16px' }}>Total Quantity</th>
                      <th style={{ padding: '12px 16px' }}>Order Value</th>
                      <th style={{ padding: '12px 16px' }}>Current Stage</th>
                      <th style={{ padding: '12px 16px' }}>Artwork Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: 30, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                          No production planning sub-orders found matching your filters.
                        </td>
                      </tr>
                    ) : (
                        filteredSubOrders.map((ord: any) => {
                          const artFiles = getSubOrderArtworkFiles(ord.subOrderNumber);
                          const hasArt = artFiles.length > 0;
                          const stageLabel = (ord.productionStatus || 'PO_ACCEPTED').replace(/_/g, ' ');
                          const isPOAccepted = ord.productionStatus === 'PO_ACCEPTED';
                          const isDemoRow = isPOAccepted && ord.demoOrder;

                          // Stage badge colours
                          const stageBg = isPOAccepted ? '#EFF6FF'
                            : ord.productionStatus === 'READY_TO_DISPATCH' ? '#DCFCE7'
                            : ord.productionStatus === 'SCHEDULED' ? '#E0F2FE'
                            : ord.productionStatus === 'IN_PRODUCTION' ? '#F3E8FF'
                            : '#FEF3C7';
                          const stageColor = isPOAccepted ? '#1D4ED8'
                            : ord.productionStatus === 'READY_TO_DISPATCH' ? '#15803D'
                            : ord.productionStatus === 'SCHEDULED' ? '#0369A1'
                            : ord.productionStatus === 'IN_PRODUCTION' ? '#7C3AED'
                            : '#B45309';
                          const stageBorder = isPOAccepted ? '#BFDBFE'
                            : ord.productionStatus === 'READY_TO_DISPATCH' ? '#86EFAC'
                            : '#CBD5E1';

                          return (
                            <tr
                              key={ord.subOrderNumber}
                              style={{
                                borderBottom: '1px solid #F1F5F9',
                                transition: 'background 0.15s',
                                background: isDemoRow ? '#F0F9FF' : '#FFFFFF'
                              }}
                            >
                              <td style={{ padding: '14px 16px', fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {ord.subOrderNumber}
                                  {isDemoRow && (
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#2563EB', color: '#FFF', letterSpacing: '0.04em' }}>🎯 DEMO</span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                                {ord.customerName}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#475569', fontFamily: 'monospace' }}>
                                {ord.poNumber}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#334155', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ord.productName}
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                                {formatNumber(ord.totalQuantity)} Units
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                                ₹{formatNumber(ord.orderValue)}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, background: stageBg, color: stageColor, border: `1px solid ${stageBorder}` }}>
                                  {stageLabel}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                {hasArt ? (
                                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle2 size={12} /> Artwork Ready ({artFiles.length}) ✓
                                  </span>
                                ) : (
                                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={12} /> Waiting Artwork
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleOpenSubOrderDetail(ord.subOrderNumber)}
                                  style={{ padding: '6px 14px', borderRadius: 6, background: isPOAccepted ? '#2563EB' : '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  View Production Planning →
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARD VIEW */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filteredSubOrders.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 13, background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', gridColumn: '1 / -1' }}>
                  No production planning sub-orders found matching your filters.
                </div>
              ) : (
                filteredSubOrders.map((ord: any) => {
                  const artFiles = getSubOrderArtworkFiles(ord.subOrderNumber);
                  const hasArt = artFiles.length > 0;
                  const stageLabel = (ord.productionStatus || 'PO_ACCEPTED').replace(/_/g, ' ');
                  const isPOAccepted = ord.productionStatus === 'PO_ACCEPTED';
                  const isDemoRow = isPOAccepted && ord.demoOrder;
                  const stageBg = isPOAccepted ? '#EFF6FF'
                    : ord.productionStatus === 'READY_TO_DISPATCH' ? '#DCFCE7'
                    : ord.productionStatus === 'SCHEDULED' ? '#E0F2FE'
                    : ord.productionStatus === 'IN_PRODUCTION' ? '#F3E8FF'
                    : '#FEF3C7';
                  const stageColor = isPOAccepted ? '#1D4ED8'
                    : ord.productionStatus === 'READY_TO_DISPATCH' ? '#15803D'
                    : ord.productionStatus === 'SCHEDULED' ? '#0369A1'
                    : ord.productionStatus === 'IN_PRODUCTION' ? '#7C3AED'
                    : '#B45309';
                  const stageBorder = isPOAccepted ? '#BFDBFE'
                    : ord.productionStatus === 'READY_TO_DISPATCH' ? '#86EFAC'
                    : '#CBD5E1';

                  return (
                    <div key={ord.subOrderNumber} style={{ background: isDemoRow ? '#F0F9FF' : '#FFFFFF', border: isDemoRow ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>{ord.subOrderNumber}</span>
                              {isDemoRow && (
                                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#2563EB', color: '#FFF', letterSpacing: '0.04em' }}>🎯 DEMO</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>PO: {ord.poNumber}</div>
                          </div>
                          <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, background: stageBg, color: stageColor, border: `1px solid ${stageBorder}` }}>
                            {stageLabel}
                          </span>
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                          <div><strong style={{ color: '#64748B' }}>Customer:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{ord.customerName}</span></div>
                          <div><strong style={{ color: '#64748B' }}>Product:</strong> <span style={{ color: '#334155' }}>{ord.productName}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <div><strong style={{ color: '#64748B' }}>Qty:</strong> {formatNumber(ord.totalQuantity)} Units</div>
                            <div><strong style={{ color: '#64748B' }}>Value:</strong> ₹{formatNumber(ord.orderValue)}</div>
                          </div>
                        </div>

                        <div style={{ marginTop: 12 }}>
                          {hasArt ? (
                            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={12} /> Artwork Ready ({artFiles.length}) ✓
                            </span>
                          ) : (
                            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} /> Waiting for Artwork
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenSubOrderDetail(ord.subOrderNumber)}
                        style={{ width: '100%', padding: '9px 16px', borderRadius: 6, background: isPOAccepted ? '#2563EB' : '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        View Production Planning →
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      ) : (
        /* ─────────────────────────────────────────────────────────────
           2. PRODUCTION EXECUTION DETAIL PAGE (viewMode === 'detail')
           ───────────────────────────────────────────────────────────── */
        <>
          {/* Command Header for Detail View */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => setViewMode('list')}
                style={{ padding: '8px 14px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={16} /> Back to Production Planning List
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#64748B' }}>
                  <span>Production Planning</span>
                  <span>/</span>
                  <span style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{activeOrder.subOrderNumber}</span>
                </div>
                <h1 style={{ margin: '2px 0 0 0', fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                  Manufacturing Execution: {activeOrder.subOrderNumber}
                </h1>
              </div>
            </div>

            {/* Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>Select Sub-Order:</span>
              <select
                value={selectedOrderCode}
                onChange={e => setSelectedOrderCode(e.target.value)}
                style={{ padding: '8px 12px', fontSize: 13, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontWeight: 800, fontFamily: 'monospace', cursor: 'pointer' }}
              >
                {eligibleSubOrders.map((ord: any) => (
                  <option key={ord.subOrderNumber} value={ord.subOrderNumber}>
                    {ord.subOrderNumber} ({ord.customerName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visual Boundary Banner */}
          <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Factory size={18} style={{ color: '#0F766E' }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E' }}>
                MANUFACTURING BOUNDARY: Production Planning controls execution up to READY TO DISPATCH. Logistics & shipment dispatch is managed in Dispatch & Tracking.
              </span>
            </div>
            {activeOrder.productionStatus === 'READY_TO_DISPATCH' && (
              <button
                onClick={handleGoToDispatch}
                style={{ padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                Open Dispatch & Tracking →
              </button>
            )}
          </div>

          {/* Sub-Order Header Info Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Order Code</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{activeOrder.subOrderNumber}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>PO Ref: {activeOrder.poNumber}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{activeOrder.customerName}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Master Order: {activeOrder.masterOrderNumber}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Quantity</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>
                {formatNumber(activeOrder.totalQuantity)} Units
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Value: ₹{formatNumber(activeOrder.orderValue)}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Buyer Artwork Status</div>
              {isArtworkUploaded ? (
                <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', display: 'inline-flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                    <CheckCircle2 size={12} /> Artwork Ready ({uploadedArtworkFiles.length} {uploadedArtworkFiles.length === 1 ? 'File' : 'Files'}) ✓
                  </span>
                  <button
                    onClick={() => setShowSupplierArtworkModal(true)}
                    style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}
                  >
                    View Uploaded Artwork 🔍
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 2 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> Waiting for Buyer Artwork Upload
                  </span>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Current Stage</div>
              <span style={{ display: 'inline-block', marginTop: 4, padding: '4px 10px', borderRadius: 4, fontSize: 11.5, fontWeight: 800, background: activeOrder.productionStatus === 'READY_TO_DISPATCH' ? '#DCFCE7' : '#FEF3C7', color: activeOrder.productionStatus === 'READY_TO_DISPATCH' ? '#15803D' : '#B45309', border: '1px solid #CBD5E1' }}>
                {(activeOrder.productionStatus || 'PO_ACCEPTED').replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* MANUFACTURING LIFECYCLE TIMELINE (STRICTLY 7 PRODUCTION STEPS) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 14 }}>
              MANUFACTURING EXECUTION LIFECYCLE (7 STAGES)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, fontSize: 11.5 }}>
              {[
                { label: 'PO Accepted', step: 1 },
                { label: 'Artwork', step: 2 },
                { label: 'Scheduled', step: 3 },
                { label: 'In Production', step: 4 },
                { label: 'Quality Inspection', step: 5 },
                { label: 'Packaging', step: 6 },
                { label: 'Ready To Dispatch', step: 7 }
              ].map(st => {
                const isCompleted = currentMfgStep > st.step;
                const isCurrent = currentMfgStep === st.step;
                const isLocked = currentMfgStep < st.step;

                return (
                  <div
                    key={st.step}
                    style={{
                      background: isCurrent ? '#F0FDFA' : isCompleted ? '#F8FAFC' : '#F1F5F9',
                      border: isCurrent ? '2px solid #0F766E' : isCompleted ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                      borderRadius: 8,
                      padding: 12,
                      opacity: isLocked ? 0.55 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: isCurrent ? '#0F766E' : isCompleted ? '#16A34A' : '#64748B' }}>STEP 0{st.step}</span>
                      {isCompleted ? (
                        <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                      ) : isCurrent ? (
                        <span style={{ color: '#0F766E', fontWeight: 800 }}>●</span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: 10 }}>🔒</span>
                      )}
                    </div>
                    <div style={{ fontWeight: isCurrent || isCompleted ? 800 : 500, color: isCurrent ? '#0F766E' : isCompleted ? '#0F172A' : '#64748B', marginTop: 4 }}>
                      {st.label} {isCurrent ? '[CURRENT]' : isLocked ? '[LOCKED]' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MANUFACTURING ACTION PANEL */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            
            {/* STAGE 1: PO ACCEPTED */}
            {activeOrder.productionStatus === 'PO_ACCEPTED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 1: Purchase Order Accepted</h3>
                    <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                      Purchase Order {activeOrder.poNumber} has been accepted. Proceed to Step 02 Artwork for buyer artwork validation.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={handleProceedToArtwork}
                      style={{
                        padding: '10px 22px', borderRadius: 8,
                        background: '#0F766E',
                        color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5,
                        cursor: 'pointer'
                      }}
                    >
                      Confirm PO & Proceed to Artwork →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: ARTWORK */}
            {activeOrder.productionStatus === 'ARTWORK' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 2: Packaging Artwork Validation</h3>
                    <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                      The <strong>Buyer</strong> uploads the packaging artwork. Once artwork is uploaded, you can review and proceed to Schedule Production.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isArtworkUploaded && (
                      <button
                        onClick={() => setShowSupplierArtworkModal(true)}
                        style={{ padding: '9px 16px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        View Artwork ({uploadedArtworkFiles.length}) 🔍
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (!isArtworkUploaded) {
                          alert('⚠ Production Scheduling Blocked!\n\nThe buyer has not uploaded packaging artwork for this Sub-Order yet.\n\nPlease ask the Buyer to upload the packaging artwork from the Buyer → Order Management → Sub-Order page.');
                          return;
                        }
                        setShowScheduleModal(true);
                      }}
                      disabled={!isArtworkUploaded}
                      style={{
                        padding: '10px 22px', borderRadius: 8,
                        background: isArtworkUploaded ? '#0F766E' : '#94A3B8',
                        color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5,
                        cursor: isArtworkUploaded ? 'pointer' : 'not-allowed',
                        opacity: isArtworkUploaded ? 1 : 0.6
                      }}
                    >
                      Schedule Production →
                    </button>
                  </div>
                </div>

                {/* ARTWORK STATUS CARD — Manufacturer READ-ONLY */}
                {!isArtworkUploaded ? (
                  <div style={{ padding: '20px 24px', background: '#FFFBEB', border: '1.5px dashed #FCD34D', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock size={22} style={{ color: '#D97706' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#92400E', marginBottom: 4 }}>Waiting for Buyer to Upload Packaging Artwork</div>
                        <div style={{ fontSize: 12.5, color: '#B45309', lineHeight: 1.7 }}>
                          The <strong>Buyer / Brand Owner</strong> is responsible for uploading the packaging artwork (label design, carton artwork, etc.).
                          Production scheduling (Step 03) will be unlocked automatically once the Buyer submits artwork from their Order Management page.
                        </div>
                        <div style={{ marginTop: 12, padding: '8px 14px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, fontSize: 11.5, color: '#78350F', fontWeight: 600 }}>
                          📋 <strong>Buyer Action Required:</strong> Buyer → Order Management → Sub-Order → Upload Artwork
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '20px 24px', background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={22} style={{ color: '#16A34A' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#166534', marginBottom: 4 }}>
                          Packaging Artwork Uploaded ✓
                        </div>
                        <div style={{ fontSize: 12.5, color: '#15803D', lineHeight: 1.7 }}>
                          The Buyer has uploaded <strong>{uploadedArtworkFiles.length} {uploadedArtworkFiles.length === 1 ? 'artwork file' : 'artwork files'}</strong>.
                          Review the artwork before proceeding to Schedule Production.
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {uploadedArtworkFiles.map((f: any, idx: number) => (
                            <div key={f.id || idx} style={{ padding: '6px 12px', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 6, fontSize: 11.5, color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              🖼️ {f.fileName || `Artwork_${idx + 1}.png`}
                              <span style={{ color: '#64748B', fontWeight: 500 }}>({f.fileSize || '—'})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowSupplierArtworkModal(true)}
                        style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        View Artwork 🔍
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 3: SCHEDULED -> Start Production */}
            {activeOrder.productionStatus === 'SCHEDULED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 3: Production Scheduled</h3>
                    <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                      Production run is scheduled on <strong>{activeOrder.manufacturingLine || 'Line A - Solid Oral Dosages'}</strong>. Ready to start manufacturing execution.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={handleStartProduction}
                      style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,118,110,0.15)' }}
                    >
                      Start Production →
                    </button>
                  </div>
                </div>

                {/* SCHEDULED DETAILS CARD */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: 16, fontSize: 13, color: '#0F766E' }}>
                  <div>Manufacturing Line: <strong>{activeOrder.manufacturingLine || 'Line A - Solid Oral Dosages'}</strong></div>
                  <div>Batch Number: <strong style={{ fontFamily: 'monospace' }}>{activeOrder.batchNumber}</strong></div>
                  <div>Start Date: <strong>{activeOrder.plannedStartDate}</strong></div>
                  <div>Expected Finish Date: <strong>{activeOrder.expectedCompletionDate}</strong></div>
                </div>
              </div>
            )}

            {/* STAGE 4: IN PRODUCTION -> Complete Production */}
            {activeOrder.productionStatus === 'IN_PRODUCTION' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 4: Manufacturing Execution In Progress</h3>
                    <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                      Batch {activeOrder.batchNumber} active on {activeOrder.manufacturingLine}.
                    </p>
                  </div>

                  <button
                    onClick={handleCompleteProduction}
                    style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
                  >
                    Complete Production / Send to QC →
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 5: QUALITY INSPECTION -> Pass / Hold QC */}
            {(activeOrder.productionStatus === 'QUALITY_INSPECTION' || activeOrder.productionStatus === 'QUALITY_HOLD') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 5: Quality Control & Lab Assay Testing</h3>
                    <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                      Batch {activeOrder.batchNumber} requires lab assay testing before packaging.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowQcModal(true)}
                    style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
                  >
                    Perform QC Inspection →
                  </button>
                </div>

                {activeOrder.productionStatus === 'QUALITY_HOLD' && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 14, color: '#991B1B', fontSize: 13, fontWeight: 600 }}>
                    ⚠ QUALITY HOLD: Batch failed lab assay testing. Production cannot proceed until QC issue is resolved.
                  </div>
                )}
              </div>
            )}

            {/* STAGE 6: PACKAGING -> Complete Packaging */}
            {activeOrder.productionStatus === 'PACKAGING' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Stage 6: Secondary Packaging & Labeling</h3>
                  <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                    QC passed. Complete secondary packaging into shipper cartons.
                  </p>
                </div>

                <button
                  onClick={() => setShowPackagingModal(true)}
                  style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
                >
                  Complete Packaging →
                </button>
              </div>
            )}

            {/* STAGE 7: READY TO DISPATCH (READ-ONLY SHIPMENT CONTEXT) */}
            {activeOrder.productionStatus === 'READY_TO_DISPATCH' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase' }}>PRODUCTION COMPLETED ✓</div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>Stage 7: Ready To Dispatch</h3>
                    <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0 0' }}>
                      Manufacturing, Quality Control, and Packaging are 100% completed. Sub-Order is eligible for shipment creation in Dispatch & Tracking.
                    </p>
                  </div>

                  <button
                    onClick={handleGoToDispatch}
                    style={{ padding: '12px 24px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,118,110,0.2)' }}
                  >
                    <Truck size={18} /> Go to Dispatch & Tracking →
                  </button>
                </div>

                {/* Manufacturing Completion Summary Box */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: 18, fontSize: 13, color: '#0F766E' }}>
                  <div>Batch #: <strong style={{ fontFamily: 'monospace' }}>{activeOrder.batchNumber || 'BATCH-2026-8801'}</strong></div>
                  <div>Quantity: <strong>{formatNumber(activeOrder.totalQuantity)} Units</strong></div>
                  <div>QC Lab Assay: <strong style={{ color: '#16A34A' }}>PASSED ✓</strong></div>
                  <div>Secondary Packaging: <strong>{activeOrder.packagingPackSize || 'Alu-Alu Blister Strip'}</strong></div>
                </div>

                {/* READ-ONLY SHIPMENT STATUS SECTION */}
                {activeOrder.shipment ? (
                  <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        LOGISTICS CONTEXT (READ-ONLY INFORMATION)
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 800, padding: '4px 12px', borderRadius: 4, background: activeOrder.shipment.shipmentStatus === 'CLOSED' ? '#DCFCE7' : '#FEF3C7', color: activeOrder.shipment.shipmentStatus === 'CLOSED' ? '#15803D' : '#B45309', border: '1px solid #CBD5E1' }}>
                        LOGISTICS STATUS: {activeOrder.shipment.shipmentStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, fontSize: 13, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                      <div>Shipment Tracking #: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{activeOrder.shipment.trackingNumber}</strong></div>
                      <div>Logistics Status: <strong style={{ color: '#1D4ED8' }}>{activeOrder.shipment.shipmentStatus.replace(/_/g, ' ')}</strong></div>
                      <div>Transporter: <strong>{activeOrder.shipment.transporterName}</strong></div>
                      <div>Vehicle #: <strong style={{ fontFamily: 'monospace' }}>{activeOrder.shipment.vehicleNumber}</strong></div>
                      <div>Expected Delivery: <strong>{activeOrder.shipment.expectedDeliveryDate}</strong></div>
                    </div>

                    <div style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>
                      (Read-Only Logistics Context — Actions such as Mark In Transit, Confirm Delivery, or POD belong exclusively to Dispatch & Tracking)
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                      <button onClick={handleGoToDispatch} style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        Open Dispatch & Tracking →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#64748B', background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: 14, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Sub-Order is ready for dispatch. Open Dispatch & Tracking to initiate shipment creation.</span>
                    <button onClick={handleGoToDispatch} style={{ padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                      Create Dispatch in Logistics →
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Bottom Back Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 10 }}>
            <button
              onClick={() => setViewMode('list')}
              style={{ padding: '9px 18px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={16} /> Back to Production Planning List
            </button>
          </div>
        </>
      )}

      {/* MODAL 1: SCHEDULE PRODUCTION */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowScheduleModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Schedule Production Run</h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacturing Line *</label>
                <input type="text" required value={schedLine} onChange={e => setSchedLine(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Start Date *</label>
                  <input type="date" required value={schedStartDate} onChange={e => setSchedStartDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Expected Finish Date *</label>
                  <input type="date" required value={schedFinishDate} onChange={e => setSchedFinishDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Confirm Schedule →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QC INSPECTION FORM */}
      {showQcModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowQcModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Quality Control Lab Assay</h3>
              <button onClick={() => setShowQcModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={e => handleQcSubmit(e, 'PASS')} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tested Quantity</label>
                <input type="number" value={qcTestedQty} onChange={e => setQcTestedQty(Number(e.target.value))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Passed Quantity *</label>
                  <input type="number" required value={qcPassedQty} onChange={e => setQcPassedQty(Number(e.target.value))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Failed Quantity *</label>
                  <input type="number" required value={qcFailedQty} onChange={e => setQcFailedQty(Number(e.target.value))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
              </div>

              {/* Mandatory Certificate of Analysis (COA) Document Upload */}
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Certificate of Analysis (COA) Document *</span>
                  <span style={{ color: '#DC2626', fontSize: 10.5, fontWeight: 700 }}>Mandatory</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoaFile({ name: file.name, uploadedAt: new Date().toLocaleDateString() });
                    }
                  }}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, background: '#FFF' }}
                />
                {coaFile || activeOrder.coaDocument ? (
                  <div style={{ fontSize: 12, color: '#15803D', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={14} /> Attached COA Document: {coaFile?.name || activeOrder.coaDocument?.fileName || activeOrder.coaDocument?.name}
                  </div>
                ) : (
                  <div style={{ fontSize: 11.5, color: '#DC2626', fontWeight: 600, marginTop: 4 }}>
                    ⚠ Mandatory: Please select and upload the Certificate of Analysis (COA) document before completing QA Inspection.
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>QC Remarks / Lab Assay Notes</label>
                <textarea rows={3} value={qcRemarksText} onChange={e => setQcRemarksText(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={e => handleQcSubmit(e as any, 'HOLD')} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Place on QC Hold</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#166534', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Pass QC → Packaging</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PACKAGING FORM */}
      {showPackagingModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowPackagingModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Secondary Packaging</h3>
              <button onClick={() => setShowPackagingModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={handlePackagingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Packaging Pack Size *</label>
                <input type="text" required value={packSize} onChange={e => setPackSize(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Master Cartons Count</label>
                <input type="number" value={masterCartons} onChange={e => setMasterCartons(Number(e.target.value))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowPackagingModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Complete Packaging →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SUPPLIER VIEW ARTWORK MODAL ── */}
      {showSupplierArtworkModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
          onClick={() => setShowSupplierArtworkModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 720, maxHeight: '85vh',
              background: '#FFFFFF', borderRadius: 14, border: '1px solid #CBD5E1',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{selectedOrderCode}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                    ✓ Artwork Ready ({uploadedArtworkFiles.length} {uploadedArtworkFiles.length === 1 ? 'File' : 'Files'})
                  </span>
                </div>
                <h2 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  Buyer Uploaded Packaging Artwork &amp; Design References
                </h2>
              </div>

              <button
                onClick={() => setShowSupplierArtworkModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, borderRadius: 6 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: File Previews */}
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                Review approved packaging artwork design files provided by the buyer for Sub-Order <strong>{selectedOrderCode}</strong>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                {uploadedArtworkFiles.map((file: any, fIdx: number) => (
                  <div
                    key={file.id || fIdx}
                    style={{
                      background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, overflow: 'hidden',
                      display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div
                      onClick={() => setActiveSupplierLightboxIdx(fIdx)}
                      style={{
                        height: 120, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', overflow: 'hidden', position: 'relative'
                      }}
                      title="Click to expand full screen preview"
                    >
                      {file.url ? (
                        <img src={file.url} alt={file.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#0F766E' }}>
                          <FileText size={36} />
                          <span style={{ fontSize: 10, fontWeight: 800 }}>{file.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.fileName}>
                        {file.fileName}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{file.fileType || 'Artwork File'} · {file.fileSize || '3.2 MB'}</div>
                      <div style={{ fontSize: 10.5, color: '#16A34A', fontWeight: 700, marginTop: 2 }}>
                        Uploaded: {file.uploadedAt || '24 Aug 2026'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSupplierArtworkModal(false)}
                style={{ padding: '8px 20px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                Close Artwork Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Lightbox Preview */}
      {activeSupplierLightboxIdx !== null && (() => {
        const file = uploadedArtworkFiles[activeSupplierLightboxIdx];
        if (!file) return null;

        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(6px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 24
            }}
            onClick={() => setActiveSupplierLightboxIdx(null)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#14B8A6', fontFamily: 'monospace' }}>{selectedOrderCode}</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 0', color: '#FFFFFF' }}>{file.fileName}</h3>
              </div>
              <button onClick={() => setActiveSupplierLightboxIdx(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFFFFF', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }} onClick={e => e.stopPropagation()}>
              <div style={{ maxWidth: '85%', maxHeight: '72vh', background: '#FFFFFF', padding: 14, borderRadius: 12, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
                {file.url ? (
                  <img src={file.url} alt={file.fileName} style={{ maxWidth: '100%', maxHeight: '62vh', objectFit: 'contain', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 340, height: 260, background: '#F8FAFC', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#0F766E' }}>
                    <FileText size={52} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{file.fileName}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{file.fileType}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 20px', color: '#CBD5E1', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <div>File Name: <strong style={{ color: '#FFFFFF' }}>{file.fileName}</strong> · Type: {file.fileType}</div>
              <div>Size: {file.fileSize} · Uploaded: {file.uploadedAt}</div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
