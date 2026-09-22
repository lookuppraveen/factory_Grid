import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MasterOrder, SubOrder, SubOrderStatus } from '../../types';
import { RaiseQaModal, getStoredQaRequests } from './RaiseQaModal';
import {
  ShoppingBag, Factory, CheckCircle2, Clock, ChevronRight, ChevronDown, AlertCircle,
  Package, ArrowRight, Layers, FileText, ShieldCheck, Eye, Search, Filter, Check, X, ArrowLeft, FileCheck, Send, Building2,
  MapPin, RefreshCw, Edit, Plus, Upload, Download, Sparkles, Mail, Palette, Phone, Headphones, Info, Receipt
} from 'lucide-react';
import { ProformaInvoiceSection } from '../common/ProformaInvoiceSection';

export const MasterOrderSplittingModule: React.FC = () => {
  const {
    orders, currentRole, manufacturers, setActiveTab, addAuditLog,
    updatePODeliveryAddress, updateSubOrderArtwork, regeneratePO, submitPOToBuyer
  } = useApp();

  // Navigation View Modes:
  // 'LIST' | 'DETAILS' | 'ORIGINAL_QUOTE' | 'SPLIT_PREVIEW' | 'SPLIT_SUCCESS' | 'SUB_ORDERS_LIST' | 'SUB_ORDER_DETAIL' | 'PO_CREATION_LIST' | 'CREATE_PO_FORM' | 'PO_SUCCESS' | 'PO_DETAIL'
  const [viewMode, setViewMode] = useState<
    'LIST' | 'DETAILS' | 'ORIGINAL_QUOTE' | 'SPLIT_PREVIEW' | 'SPLIT_SUCCESS' | 'SUB_ORDERS_LIST' | 'SUB_ORDER_DETAIL' | 'PO_CREATION_LIST' | 'CREATE_PO_FORM' | 'PO_SUCCESS' | 'PO_DETAIL'
  >('LIST');

  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [selectedSubOrderCode, setSelectedSubOrderCode] = useState<string>('SO-1001-01');
  const [targetPoSubOrderCode, setTargetPoSubOrderCode] = useState<string>('SO-1001-01');

  // PO Delivery Address & Control States
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressInputText, setAddressInputText] = useState('');
  const [poBannerMsg, setPoBannerMsg] = useState<string | null>(null);

  // Persisted Created POs State: Record<subOrderCode, { poNumber: string; createdDate: string; status: 'Created' | 'Accepted' | 'Rejected'; rejectionReason?: string }>
  const [createdPos, setCreatedPos] = useState<Record<string, { poNumber: string; createdDate: string; status: 'Created' | 'Accepted' | 'Rejected'; rejectionReason?: string }>>({
    'SO-1001-01': { poNumber: 'PO-2026-1001-01', createdDate: '14 Aug 2026', status: 'Accepted' },
    'SO-1001-02': { poNumber: 'PO-2026-1001-02', createdDate: '14 Aug 2026', status: 'Created' },
    'SO-1001-03': { poNumber: 'PO-2026-1001-03', createdDate: '14 Aug 2026', status: 'Created' },
    'SO-2026-5361-01': { poNumber: 'PO-2026-5361-01', createdDate: '14 Aug 2026', status: 'Accepted' },
    'SO-2026-5361-02': { poNumber: 'PO-2026-5361-02', createdDate: '14 Aug 2026', status: 'Created' },
    'SO-2026-5361-03': { poNumber: 'PO-2026-5361-03', createdDate: '14 Aug 2026', status: 'Created' }
  });

  // List View Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Order Splitting State
  const [isSplitComplete, setIsSplitComplete] = useState<boolean>(true);
  const [showReplaceUploadPo, setShowReplaceUploadPo] = useState<Record<string, boolean>>({});
  const [artworkStateCounter, setArtworkStateCounter] = useState<number>(0);

  // Centered PO Modal & Product-Wise Artwork Modal States
  const [activePoModalSubOrderCode, setActivePoModalSubOrderCode] = useState<string | null>(null);
  const [activeArtworkModalSubOrderCode, setActiveArtworkModalSubOrderCode] = useState<string | null>(null);

  // Product-Wise Artwork Storage: Record<SubOrderCode, Record<ProdKey, Array<{ id: string; fileName: string; fileType: string; fileSize: string; uploadedAt: string; status: 'PENDING' | 'UPLOADING' | 'UPLOADED'; url?: string }>>>
  const ARTWORK_STORAGE_KEY = 'factorygrid_product_artworks_v1';
  const [productArtworksStore, setProductArtworksStore] = useState<Record<string, Record<string, Array<{ id: string; fileName: string; fileType: string; fileSize: string; uploadedAt: string; status: 'PENDING' | 'UPLOADING' | 'UPLOADED'; url?: string }>>>>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_product_artworks_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('factorygrid_product_artworks_v1', JSON.stringify(productArtworksStore));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  }, [productArtworksStore]);

  useEffect(() => {
    const syncArtworksFromStorage = () => {
      try {
        const saved = localStorage.getItem('factorygrid_product_artworks_v1');
        if (saved) setProductArtworksStore(JSON.parse(saved));
        else setProductArtworksStore({});
      } catch (e) {}
    };
    window.addEventListener('storage', syncArtworksFromStorage);
    return () => window.removeEventListener('storage', syncArtworksFromStorage);
  }, []);

  // Lightbox Preview Modal State
  const [activeLightboxData, setActiveLightboxData] = useState<{
    subCode: string;
    prodKey: string;
    files: Array<{ id: string; fileName: string; fileType: string; fileSize: string; uploadedAt: string; status: string; url?: string }>;
    currentIndex: number;
  } | null>(null);

  // Replace Confirmation Target State
  const [replaceConfirmTarget, setReplaceConfirmTarget] = useState<{
    subCode: string;
    prodKey: string;
  } | null>(null);

  // Uploading state per product line: Record<`${subCode}_${prodKey}`, boolean>
  const [artworkUploadingKeys, setArtworkUploadingKeys] = useState<Record<string, boolean>>({});

  // Artwork readiness choice: 'YES' = buyer has artwork (show URL link), 'NO' = buyer needs to upload
  const [artworkReadiness, setArtworkReadiness] = useState<Record<string, 'YES' | 'NO' | 'EMAIL'>>({});

  // File name input state per product (required before selecting a file to upload)
  const [artFileNameInput, setArtFileNameInput] = useState<Record<string, string>>({});

  // Whether to show the email submission panel per product
  const [showEmailPanel, setShowEmailPanel] = useState<Record<string, boolean>>({});

  // 4 Artwork Submission Methods state per key: Record<string, 'FILE' | 'URL' | 'EMAIL' | 'IN_HOUSE_REQUEST'>
  const [artSubmissionMethod, setArtSubmissionMethod] = useState<Record<string, 'FILE' | 'URL' | 'EMAIL' | 'IN_HOUSE_REQUEST'>>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_art_submission_methods_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('factorygrid_art_submission_methods_v1', JSON.stringify(artSubmissionMethod));
    } catch (e) {}
  }, [artSubmissionMethod]);

  // Persisted In-House Artwork Requests: Record<SubOrderCode, Record<ProdKey, { requestId: string; subCode: string; prodKey: string; productName: string; requestedAt: string; status: string }>>
  const [inHouseArtworkRequests, setInHouseArtworkRequests] = useState<Record<string, Record<string, {
    requestId: string;
    subCode: string;
    prodKey: string;
    productName: string;
    requestedAt: string;
    status: string;
  }>>>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_inhouse_artwork_requests_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('factorygrid_inhouse_artwork_requests_v1', JSON.stringify(inHouseArtworkRequests));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  }, [inHouseArtworkRequests]);

  useEffect(() => {
    const syncInHouseRequests = () => {
      try {
        const saved = localStorage.getItem('factorygrid_inhouse_artwork_requests_v1');
        if (saved) setInHouseArtworkRequests(JSON.parse(saved));
        else setInHouseArtworkRequests({});
      } catch (e) {}
    };
    window.addEventListener('storage', syncInHouseRequests);
    return () => window.removeEventListener('storage', syncInHouseRequests);
  }, []);

  const handleRequestInHouseArtwork = (subCode: string, prodKey: string, productName: string) => {
    const currentSubReqs = inHouseArtworkRequests[subCode] || {};
    const existingReq = currentSubReqs[prodKey];
    if (existingReq) {
      alert(`An In-house Artwork Request has already been submitted for ${productName} (Sub-Order: ${subCode}).\n\nRequest ID: ${existingReq.requestId}\nSubmitted on: ${existingReq.requestedAt}`);
      return;
    }

    const nowFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const reqId = `IAR-${subCode.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

    const newRequest = {
      requestId: reqId,
      subCode,
      prodKey,
      productName,
      requestedAt: nowFormatted,
      status: 'IN_HOUSE_REQUESTED'
    };

    setInHouseArtworkRequests(prev => {
      const sReqs = prev[subCode] || {};
      return {
        ...prev,
        [subCode]: {
          ...sReqs,
          [prodKey]: newRequest
        }
      };
    });

    setArtSubmissionMethod(prev => ({
      ...prev,
      [`${subCode}_${prodKey}`]: 'IN_HOUSE_REQUEST'
    }));

    updateSubOrderArtwork(subCode, {
      id: reqId,
      fileName: `In-house Artwork Service Request (${productName})`,
      fileType: 'In-house Design Service',
      fileSize: 'Design Request',
      uploadedAt: nowFormatted,
      status: 'IN_HOUSE_REQUESTED'
    });

    addAuditLog('Artwork Workflow', `Buyer submitted In-house Artwork Request (${reqId}) for ${productName} under Sub-Order ${subCode}`);
    alert(`✔ In-house artwork request submitted successfully!\n\nRequest ID: ${reqId}\nProduct: ${productName}\nSub-Order: ${subCode}\n\nOur in-house packaging design team will prepare the artwork and contact you if needed.`);
  };

  // Artwork URL Input value per key: Record<string, string>
  const [artUrlInputValue, setArtUrlInputValue] = useState<Record<string, string>>({});

  const handleAddUrlLinkForSubOrder = (subCode: string, prodKey: string, urlString: string) => {
    if (!urlString || !urlString.trim()) {
      alert('Please enter a valid artwork URL.');
      return;
    }
    const cleanUrl = urlString.trim();
    const currentSub = productArtworksStore[subCode] || {};
    const currentProdFiles = currentSub[prodKey] || [];

    if (currentProdFiles.length >= 5) {
      alert('You can upload a maximum of 5 artwork files per product. Please remove an existing file to upload a new one.');
      return;
    }

    const newEntry = {
      id: `url_${Date.now()}`,
      fileName: `URL Link: ${cleanUrl.length > 32 ? cleanUrl.substring(0, 32) + '...' : cleanUrl}`,
      fileType: 'URL Link Reference',
      fileSize: 'External URL',
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'UPLOADED' as const,
      url: cleanUrl
    };

    setProductArtworksStore(prev => {
      const cSub = prev[subCode] || {};
      const cProdFiles = cSub[prodKey] || [];
      return {
        ...prev,
        [subCode]: {
          ...cSub,
          [prodKey]: [...cProdFiles, newEntry]
        }
      };
    });

    const targetSubObj = subOrdersDataset.find(s => s.code === subCode);
    const poCodeStr = targetSubObj?.poCode || `PO-${subCode}`;
    updateSubOrderArtwork(subCode, newEntry);
    addAuditLog('Artwork Workflow', `Buyer provided artwork URL link for Purchase Order ${poCodeStr}`);
    alert(`✔ Artwork URL Link Submitted Successfully!\n\nURL: ${cleanUrl}\nSub-Order: ${subCode}`);
    setArtUrlInputValue(prev => ({ ...prev, [`${subCode}_${prodKey}`]: '' }));
  };

  const handleEmailSubmissionInfo = (subCode: string, productName: string) => {
    const subject = encodeURIComponent(`Artwork Submission - Sub-Order ${subCode} (${productName})`);
    const body = encodeURIComponent(`Hello Factory Grid Team,\n\nPlease find attached the packaging artwork files for:\nSub-Order: ${subCode}\nProduct: ${productName}\n\nBest regards,`);
    const mailtoUrl = `mailto:artwork@factorygrid.com?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  };

  // Collapsed state per sub-order card: Record<subCode, boolean>
  const [collapsedSubOrders, setCollapsedSubOrders] = useState<Record<string, boolean>>({});
  const toggleSubOrderCollapse = (soCode: string) => {
    setCollapsedSubOrders(prev => ({ ...prev, [soCode]: !prev[soCode] }));
  };

  // QA Query Modal State
  const [isQaModalOpen, setIsQaModalOpen] = useState(false);
  const [qaModalContext, setQaModalContext] = useState<{ contextType: 'ORDER' | 'SUB_ORDER' | 'PO' | 'PRODUCT'; contextNumber: string; mfgName?: string }>({
    contextType: 'PO',
    contextNumber: 'PO-2026-1001-01'
  });

  const handleAddFilesForSubOrder = (subCode: string, prodKey: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const allowed = ['pdf', 'ai', 'cdr', 'png', 'jpg', 'jpeg', 'webp'];
    const filesArray = Array.from(fileList);

    const currentSub = productArtworksStore[subCode] || {};
    const currentProdFiles = currentSub[prodKey] || [];

    if (currentProdFiles.length >= 5) {
      alert('You can upload a maximum of 5 artwork files per product. Please remove an existing file to upload a new one.');
      return;
    }

    if (currentProdFiles.length + filesArray.length > 5) {
      alert('You can upload a maximum of 5 artwork files per product.');
    }

    const remainingQuota = 5 - currentProdFiles.length;
    const filesToProcess = filesArray.slice(0, remainingQuota);

    const newEntries: Array<{ id: string; fileName: string; fileType: string; fileSize: string; uploadedAt: string; status: 'PENDING' | 'UPLOADING' | 'UPLOADED'; url?: string }> = [];
    let invalidFound = false;

    filesToProcess.forEach((file, idx) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowed.includes(ext)) {
        invalidFound = true;
        return;
      }

      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      const typeStr = ext === 'pdf' ? 'PDF Document (.pdf)'
        : ext === 'ai' ? 'Adobe Illustrator (.ai)'
        : ext === 'cdr' ? 'CorelDRAW (.cdr)'
        : `${ext.toUpperCase()} Image (.${ext})`;

      const previewUrl = ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
        ? URL.createObjectURL(file)
        : undefined;

      newEntries.push({
        id: `file_${Date.now()}_${idx}`,
        fileName: file.name,
        fileType: typeStr,
        fileSize: sizeStr,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'UPLOADED',
        url: previewUrl
      });
    });

    if (invalidFound && newEntries.length === 0) {
      alert('Invalid file format selected. Please choose PNG, JPG, JPEG, WEBP, PDF, AI, or CDR files.');
      return;
    }

    setProductArtworksStore(prev => {
      const cSub = prev[subCode] || {};
      const cProdFiles = cSub[prodKey] || [];
      return {
        ...prev,
        [subCode]: {
          ...cSub,
          [prodKey]: [...cProdFiles, ...newEntries]
        }
      };
    });
  };

  const handleReplaceFileForSubOrder = (subCode: string, prodKey: string, targetFileId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const allowed = ['pdf', 'ai', 'cdr', 'png', 'jpg', 'jpeg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowed.includes(ext)) {
      alert('Invalid file format selected. Please choose PDF, AI, CDR, PNG, or JPG files.');
      return;
    }

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const typeStr = ext === 'pdf' ? 'PDF Document (.pdf)'
      : ext === 'ai' ? 'Adobe Illustrator (.ai)'
      : ext === 'cdr' ? 'CorelDRAW (.cdr)'
      : `${ext.toUpperCase()} Image (.${ext})`;

    setProductArtworksStore(prev => {
      const currentSub = prev[subCode] || {};
      const currentProdFiles = currentSub[prodKey] || [];
      const updated = currentProdFiles.map(f => {
        if (f.id === targetFileId) {
          return {
            ...f,
            fileName: file.name,
            fileType: typeStr,
            fileSize: sizeStr,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'UPLOADED' as const
          };
        }
        return f;
      });

      return {
        ...prev,
        [subCode]: {
          ...currentSub,
          [prodKey]: updated
        }
      };
    });
  };

  const handleDeleteFileForSubOrder = (subCode: string, prodKey: string, fileId: string) => {
    setProductArtworksStore(prev => {
      const currentSub = prev[subCode] || {};
      const currentProdFiles = currentSub[prodKey] || [];
      const updated = currentProdFiles.filter(f => f.id !== fileId);
      return {
        ...prev,
        [subCode]: {
          ...currentSub,
          [prodKey]: updated
        }
      };
    });
  };

  const getUnifiedSubOrder = (subCode: string) => {
    try {
      const UNIFIED_KEY = 'factorygrid_unified_suborders_v12';
      const saved = localStorage.getItem(UNIFIED_KEY);
      const store = saved ? JSON.parse(saved) : {};
      return store[subCode] || null;
    } catch (e) {
      return null;
    }
  };

  const handleUploadPoArtwork = (subCode: string, sampleFileName?: string) => {
    const fileName = sampleFileName || `${subCode}_Packaging_Artwork_v1.pdf`;
    const ext = fileName.split('.').pop()?.toUpperCase() || 'PDF';
    const fileType = ext === 'PDF' ? 'PDF Document (.pdf)' : ext === 'AI' ? 'Adobe Illustrator (.ai)' : ext === 'CDR' ? 'CorelDRAW (.cdr)' : `${ext} Image (.${ext.toLowerCase()})`;
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const artworkFileObj = {
      fileName,
      fileType,
      uploadedAt: nowStr,
      uploadedBy: 'Buyer Procurement Desk',
      fileSize: '3.8 MB'
    };

    updateSubOrderArtwork(subCode, artworkFileObj);

    setShowReplaceUploadPo(prev => ({ ...prev, [subCode]: false }));
    setArtworkStateCounter(prev => prev + 1);

    const poCodeStr = targetPoSubOrderObj?.poCode || `PO-${subCode}`;
    addAuditLog('Artwork Workflow', `Buyer uploaded artwork file ${fileName} for Purchase Order ${poCodeStr}`);
    alert(`✔ Artwork Uploaded Successfully!\n\nPurchase Order: ${poCodeStr}\nSub-Order: ${subCode}\nFile Name: ${fileName}\nStatus: Artwork Uploaded ✓\nSupplier Status: Artwork Received\nDelivery Schedule: Finalized & Commenced`);
  };

  const handleUpdateQaStatus = (
    subCode: string,
    newQaStatus: 'PENDING_QA' | 'UNDER_QA_REVIEW' | 'QA_APPROVED' | 'QA_REJECTED',
    rejectionReason?: string
  ) => {
    const UNIFIED_KEY = 'factorygrid_unified_suborders_v11';
    let store: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(UNIFIED_KEY);
      if (saved) store = JSON.parse(saved);
    } catch (e) {}

    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const targetRec = store[subCode] || {};

    const updatedRec = {
      ...targetRec,
      subOrderNumber: subCode,
      poNumber: targetPoSubOrderObj?.poCode || `PO-${subCode}`,
      masterOrderNumber: 'MO-2026-1001',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: targetPoSubOrderObj?.mfgName || 'SunBio LifeSciences Ltd.',
      qaStatus: newQaStatus,
      qaRejectionReason: newQaStatus === 'QA_REJECTED' ? (rejectionReason || 'Assay purity fell below pharmacopeial standards') : (targetRec.qaRejectionReason || ''),
      qaReviewedAt: nowStr,
      qaReviewedBy: 'Admin Quality Governance Desk'
    };

    store[subCode] = updatedRec;
    try {
      localStorage.setItem(UNIFIED_KEY, JSON.stringify(store));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }

    setArtworkStateCounter(prev => prev + 1);
    addAuditLog('QA Workflow', `Admin updated QA Status for ${subCode} to ${newQaStatus}`);
    alert(`✔ QA Status Updated!\n\nSub-Order: ${subCode}\nQA Status: ${newQaStatus}\nReviewed By: Admin Quality Governance Desk\nRejection Reason: ${updatedRec.qaRejectionReason || 'None'}`);
  };

  const activeMasterOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || orders[0];
  }, [orders, selectedOrderId]);

  // Role Checks
  const isBuyer = currentRole === 'BUYER' || currentRole === 'ADMIN';
  const isManufacturer = currentRole === 'SUPPLIER';

  const myMfg = manufacturers[0];
  const myMfgId = myMfg?.id || 'm1';

  // Sub-orders dataset for active master order
  const subOrdersDataset = useMemo(() => {
    if (activeMasterOrder && Array.isArray(activeMasterOrder.subOrders) && activeMasterOrder.subOrders.length > 0) {
      return activeMasterOrder.subOrders.map((so, idx) => {
        const subCode = so.subOrderNumber || `SO-1001-0${idx + 1}`;
        const poCode = so.poNumber || `PO-2026-${subCode.replace('SO-', '')}`;
        const mfgNameLower = (so.manufacturerName || '').toLowerCase();
        const isSunBio = mfgNameLower.includes('sunbio') || so.manufacturerId === 'm1' || subCode.includes('01');
        const isCipla = mfgNameLower.includes('cipla') || so.manufacturerId === 'm2' || subCode.includes('02');
        const isLupin = mfgNameLower.includes('lupin') || so.manufacturerId === 'm3' || subCode.includes('03');

        let mappedLines = (so.lines && so.lines.length > 0) ? so.lines.map(l => ({
          productName: l.productName || 'Pharmaceutical Product',
          dosageForm: l.dosageForm || 'Tablet',
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          totalCost: l.totalPrice || (l.quantity * l.unitPrice),
          leadTime: '14 Days'
        })) : [];

        if (isSunBio && mappedLines.length === 0) {
          mappedLines = [
            { productName: 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', quantity: 10000, unitPrice: 9.66, totalCost: 96600, leadTime: '14 Days' },
            { productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', quantity: 2000, unitPrice: 15.00, totalCost: 30000, leadTime: '12 Days' }
          ];
        } else if (isCipla && mappedLines.length === 0) {
          mappedLines = [
            { productName: 'Amoxicillin 250mg Tablets', dosageForm: 'Capsule', quantity: 5000, unitPrice: 11.50, totalCost: 57500, leadTime: '10 Days' }
          ];
        } else if (isLupin && mappedLines.length === 0) {
          mappedLines = [
            { productName: 'Metformin 500mg SR Tablets', dosageForm: 'Tablet', quantity: 3000, unitPrice: 14.00, totalCost: 42000, leadTime: '7 Days' }
          ];
        }

        const totalQty = mappedLines.reduce((sum, l) => sum + l.quantity, 0);
        const totalVal = mappedLines.reduce((sum, l) => sum + l.totalCost, 0);

        return {
          code: subCode,
          poCode: poCode,
          mfgId: so.manufacturerId || 'm1',
          mfgName: so.manufacturerName || (isSunBio ? 'SunBio LifeSciences Ltd.' : isCipla ? 'Cipla Partner Formulations Ltd.' : 'Lupin Bio-Tech Labs'),
          mfgCode: 'MFG-PARTNER',
          productsCount: mappedLines.length,
          totalQuantity: totalQty,
          orderValue: totalVal,
          subtotal: totalVal,
          leadTimeDays: isSunBio ? 14 : isCipla ? 10 : 7,
          status: (createdPos[subCode]?.status || so.status) === 'Open' || (createdPos[subCode]?.status || so.status) === 'Created' ? 'PO Generated' : (createdPos[subCode]?.status || so.status || 'PO Generated'),
          lines: mappedLines
        };
      });
    }

    return [
      {
        code: 'SO-1001-01',
        poCode: 'PO-2026-1001-01',
        mfgId: 'm1',
        mfgName: 'SunBio LifeSciences Ltd.',
        mfgCode: 'SUN-PHARM',
        productsCount: 2,
        totalQuantity: 12000,
        orderValue: 126600,
        subtotal: 126600,
        leadTimeDays: 14,
        status: createdPos['SO-1001-01']?.status ? 'PO Generated' : 'PO Generated',
        lines: [
          { productName: 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', quantity: 10000, unitPrice: 9.66, totalCost: 96600, leadTime: '14 Days' },
          { productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', quantity: 2000, unitPrice: 15.00, totalCost: 30000, leadTime: '12 Days' }
        ]
      },
      {
        code: 'SO-1001-02',
        poCode: 'PO-2026-1001-02',
        mfgId: 'm2',
        mfgName: 'Cipla Partner Formulations Ltd.',
        mfgCode: 'CIPLA-PARTNER',
        productsCount: 1,
        totalQuantity: 5000,
        orderValue: 57500,
        subtotal: 57500,
        leadTimeDays: 10,
        status: createdPos['SO-1001-02']?.status ? 'PO Generated' : 'PO Generated',
        lines: [
          { productName: 'Amoxicillin 250mg Tablets', dosageForm: 'Capsule', quantity: 5000, unitPrice: 11.50, totalCost: 57500, leadTime: '10 Days' }
        ]
      },
      {
        code: 'SO-1001-03',
        poCode: 'PO-2026-1001-03',
        mfgId: 'm3',
        mfgName: 'Lupin Bio-Tech Labs',
        mfgCode: 'LUPIN-BIO',
        productsCount: 1,
        totalQuantity: 3000,
        orderValue: 42000,
        subtotal: 42000,
        leadTimeDays: 7,
        status: createdPos['SO-1001-03']?.status ? 'PO Generated' : 'PO Generated',
        lines: [
          { productName: 'Metformin 500mg SR Tablets', dosageForm: 'Tablet', quantity: 3000, unitPrice: 14.00, totalCost: 42000, leadTime: '7 Days' }
        ]
      }
    ];
  }, [activeMasterOrder, createdPos]);

  const activeSubOrderObj = useMemo(() => {
    return subOrdersDataset.find(s => s.code === selectedSubOrderCode) || subOrdersDataset[0];
  }, [subOrdersDataset, selectedSubOrderCode]);

  const targetPoSubOrderObj = useMemo(() => {
    return subOrdersDataset.find(s => s.code === targetPoSubOrderCode) || subOrdersDataset[0];
  }, [subOrdersDataset, targetPoSubOrderCode]);

  // PO Created Count & Status Logic
  const poCreatedCount = Object.keys(createdPos).length;
  const masterPoStatus = useMemo(() => {
    const statuses = Object.values(createdPos).map(p => p.status);
    if (statuses.length === 0) return 'Open';
    if (statuses.every(s => s === 'Accepted')) return 'Processing (All Accepted)';
    if (statuses.some(s => s === 'Accepted')) return 'In Fulfillment';
    if (statuses.some(s => s === 'Rejected')) return 'Attention Required (PO Rejected)';
    return 'POs Created';
  }, [createdPos]);

  // Handle Order Splitting Action
  const handleExecuteSplitOrders = () => {
    setIsSplitComplete(true);
    setViewMode('SPLIT_SUCCESS');
    addAuditLog('Order Engine', `Split Master Order MO-2026-1001 into 2 manufacturer sub-orders.`);
  };

  // Handle Create PO Confirmation Action
  const handleConfirmCreatePO = (subOrderCode: string) => {
    const targetObj = subOrdersDataset.find(s => s.code === subOrderCode) || subOrdersDataset[0];
    setCreatedPos(prev => ({
      ...prev,
      [subOrderCode]: {
        poNumber: targetObj.poCode,
        createdDate: '14 Aug 2026',
        status: 'Created'
      }
    }));
    addAuditLog('PO Engine', `Created Purchase Order ${targetObj.poCode} for Sub-Order ${subOrderCode} (${targetObj.mfgName}).`);
    setViewMode('PO_SUCCESS');
  };

  // Filter Master Orders for List View
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.poNumber && o.poNumber.toLowerCase().includes(q)) ||
        o.customerName.toLowerCase().includes(q) ||
        o.rfqNumber?.toLowerCase().includes(q) ||
        o.subOrders.some(s => s.manufacturerName.toLowerCase().includes(q));

      let matchStatus = true;
      if (statusFilter === 'OPEN') matchStatus = o.status === 'OPEN' || o.status === 'APPROVED' || o.status === 'CREATED' || o.status === 'PROCESSING';
      else if (statusFilter === 'CLOSED') matchStatus = o.status === 'COMPLETED';

      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleRemoveFile = (subCode: string, prodKey: string, fileId: string) => {
    setProductArtworksStore(prev => {
      const currentSub = prev[subCode] || {};
      const currentProdFiles = currentSub[prodKey] || [];
      const updated = currentProdFiles.filter(f => f.id !== fileId);
      return {
        ...prev,
        [subCode]: {
          ...currentSub,
          [prodKey]: updated
        }
      };
    });
  };

  // ── RENDER ALL OVERLAY MODALS (PO MODAL, ARTWORK MODAL, ADDRESS MODAL, QA MODAL) ──
  const renderModals = () => {
    const currentShippingAddr = activeMasterOrder?.shippingAddress || 'Apex Pharma Logistics Depot, Plot 14, Baddi, HP';

    return (
      <>
        {/* ── ADDRESS EDIT MODAL ── */}
      {showAddressModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, maxWidth: 520, width: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} style={{ color: '#0F766E' }} />
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Add / Update Delivery Address</h3>
              </div>
              <button onClick={() => setShowAddressModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                PO Delivery / Shipping Address:
              </label>
              <textarea
                rows={4}
                value={addressInputText}
                onChange={e => setAddressInputText(e.target.value)}
                placeholder="Enter complete shipping address (Plot/Building, Street, Industrial Area, City, State, Pincode)..."
                style={{ width: '100%', padding: 12, fontSize: 13, borderRadius: 8, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 6 }}>
                This updated address will be saved and reflected on the official Purchase Order document.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
              <button onClick={() => setShowAddressModal(false)} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  if (addressInputText.trim()) {
                    const targetId = activeMasterOrder?.id || 'mo-5228';
                    updatePODeliveryAddress(targetId, addressInputText.trim());
                    setShowAddressModal(false);
                    setPoBannerMsg(`✓ Delivery address updated for Purchase Order.`);
                  }
                }}
                style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
              >
                Save &amp; Update Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX ARTWORK PREVIEW MODAL ── */}
      {activeLightboxData && (() => {
        const { subCode, prodKey, files, currentIndex } = activeLightboxData;
        const currentFile = files[currentIndex] || files[0];

        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(6px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 24
            }}
            onClick={() => setActiveLightboxData(null)}
          >
            {/* Lightbox Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#14B8A6', fontFamily: 'monospace' }}>{subCode}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}>
                    Artwork Reference {currentIndex + 1} of {files.length}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '4px 0 0', color: '#FFFFFF' }}>{prodKey}</h3>
              </div>

              <button
                onClick={() => setActiveLightboxData(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFFFFF', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Lightbox Main Preview View */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '20px 0' }} onClick={e => e.stopPropagation()}>
              {files.length > 1 && (
                <button
                  onClick={() => setActiveLightboxData(prev => prev ? { ...prev, currentIndex: (prev.currentIndex - 1 + files.length) % files.length } : null)}
                  style={{
                    position: 'absolute', left: 20, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#FFFFFF', width: 44, height: 44, borderRadius: 8, fontSize: 22, fontWeight: 800, cursor: 'pointer', zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Previous image"
                >
                  ‹
                </button>
              )}

              <div style={{ maxWidth: '85%', maxHeight: '72vh', background: '#FFFFFF', padding: 14, borderRadius: 12, boxShadow: '0 25px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {currentFile?.url ? (
                  <img src={currentFile.url} alt={currentFile.fileName} style={{ maxWidth: '100%', maxHeight: '62vh', objectFit: 'contain', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 340, height: 260, background: '#F8FAFC', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#0F766E' }}>
                    <FileText size={52} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', textAlign: 'center', padding: '0 16px' }}>{currentFile?.fileName}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{currentFile?.fileType}</div>
                  </div>
                )}
              </div>

              {files.length > 1 && (
                <button
                  onClick={() => setActiveLightboxData(prev => prev ? { ...prev, currentIndex: (prev.currentIndex + 1) % files.length } : null)}
                  style={{
                    position: 'absolute', right: 20, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#FFFFFF', width: 44, height: 44, borderRadius: 8, fontSize: 22, fontWeight: 800, cursor: 'pointer', zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Next image"
                >
                  ›
                </button>
              )}
            </div>

            {/* Lightbox Footer Meta Bar */}
            <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 20px', color: '#CBD5E1', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <div>
                File Name: <strong style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{currentFile?.fileName}</strong> · Type: {currentFile?.fileType}
              </div>
              <div>
                Size: {currentFile?.fileSize} · Uploaded: {currentFile?.uploadedAt}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── REPLACE ARTWORK CONFIRMATION MODAL ── */}
      {replaceConfirmTarget && (() => {
        const { subCode, prodKey } = replaceConfirmTarget;

        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
            onClick={() => setReplaceConfirmTarget(null)}
          >
            <div
              style={{
                background: '#FFFFFF', borderRadius: 14, padding: 24, maxWidth: 460, width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #CBD5E1'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', marginBottom: 12 }}>
                <AlertCircle size={22} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  Replace Existing Artwork?
                </h3>
              </div>

              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                The current artwork files for <strong>{prodKey}</strong> will be removed and replaced with new files. Are you sure you want to proceed?
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setReplaceConfirmTarget(null)}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setProductArtworksStore(prev => ({
                      ...prev,
                      [subCode]: {
                        ...(prev[subCode] || {}),
                        [prodKey]: []
                      }
                    }));
                    setReplaceConfirmTarget(null);
                    setTimeout(() => {
                      const inputEl = document.getElementById(`art_input_${subCode}_${prodKey}`);
                      if (inputEl) inputEl.click();
                    }, 100);
                  }}
                  style={{ padding: '8px 18px', borderRadius: 6, background: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                >
                  Replace Artwork
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── CENTERED VIEW PO MODAL (CONTAINING ONLY PO INFO) ── */}
      {activePoModalSubOrderCode && (() => {
        // Find matching sub-order from subOrdersDataset or match by code index/mfg
        const codeClean = activePoModalSubOrderCode.toLowerCase().trim();
        let foundSub = subOrdersDataset.find(s =>
          s.code === activePoModalSubOrderCode ||
          s.poCode === activePoModalSubOrderCode ||
          s.code.replace(/[^0-9]/g, '') === activePoModalSubOrderCode.replace(/[^0-9]/g, '') ||
          codeClean.includes(s.code.toLowerCase()) ||
          s.code.toLowerCase().includes(codeClean)
        );

        // Determine manufacturer identity
        const isCipla = (foundSub?.mfgName || '').toLowerCase().includes('cipla') || codeClean.endsWith('02') || codeClean.includes('-02');
        const isLupin = (foundSub?.mfgName || '').toLowerCase().includes('lupin') || codeClean.endsWith('03') || codeClean.includes('-03');
        const isSunBio = !isCipla && !isLupin;

        // Determine manufacturer name & PO details
        const mfgName = isCipla
          ? (foundSub?.mfgName || 'Cipla Partner Formulations Ltd.')
          : isLupin
          ? (foundSub?.mfgName || 'Lupin Bio-Tech Labs')
          : (foundSub?.mfgName || 'SunBio LifeSciences Ltd.');

        const poCode = foundSub?.poCode || `PO-2026-${activePoModalSubOrderCode.replace('SO-', '')}`;
        const leadTimeDays = isSunBio ? 14 : isCipla ? 10 : 7;
        const status = foundSub?.status || 'PO Generated';

        // Derive product line items dynamically based on manufacturer assignment
        let lines: Array<{
          productName: string;
          dosageForm?: string;
          quantity: number;
          unitPrice: number;
          totalCost: number;
          leadTime?: string;
        }> = foundSub?.lines && foundSub.lines.length > 0 ? [...foundSub.lines] : [];

        if (isSunBio || lines.length < 2) {
          lines = [
            { productName: 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', quantity: 10000, unitPrice: 9.66, totalCost: 96600, leadTime: '14 Days' },
            { productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', quantity: 2000, unitPrice: 15.00, totalCost: 30000, leadTime: '12 Days' }
          ];
        } else if (isCipla && lines.length === 0) {
          lines = [
            { productName: 'Amoxicillin 250mg Tablets', dosageForm: 'Capsule', quantity: 5000, unitPrice: 11.50, totalCost: 57500, leadTime: '10 Days' }
          ];
        } else if (isLupin && lines.length === 0) {
          lines = [
            { productName: 'Metformin 500mg SR Tablets', dosageForm: 'Tablet', quantity: 3000, unitPrice: 14.00, totalCost: 42000, leadTime: '7 Days' }
          ];
        }

        const totalQty = lines.reduce((acc, l) => acc + l.quantity, 0);
        const orderValue = lines.reduce((acc, l) => acc + (l.totalCost || (l.quantity * l.unitPrice)), 0);

        const targetSubOrderObj = {
          code: foundSub?.code || activePoModalSubOrderCode,
          poCode: poCode,
          mfgName: mfgName,
          productsCount: lines.length,
          totalQuantity: totalQty,
          orderValue: orderValue,
          subtotal: orderValue,
          leadTimeDays: leadTimeDays,
          status: status,
          lines: lines
        };

        const badgeStyle = { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };

        const handleDownloadPoPdf = (poObj: any) => {
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            alert('Please allow popups to download the Purchase Order PDF.');
            return;
          }
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>Purchase_Order_${poObj.poCode || 'PO-2026-1001'}</title>
                <style>
                  body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #0F172A; }
                  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0F766E; padding-bottom: 20px; margin-bottom: 24px; }
                  .title { font-size: 24px; font-weight: 800; color: #0F766E; letter-spacing: -0.02em; }
                  .subtitle { font-size: 13px; color: #64748B; margin-top: 4px; }
                  .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; background: #F8FAFC; padding: 18px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #E2E8F0; }
                  .meta-item label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B; margin-bottom: 3px; }
                  .meta-item div { font-size: 12.5px; font-weight: 700; color: #0F172A; }
                  .address-box { background: #FFFFFF; border: 1px solid #CBD5E1; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 12.5px; }
                  .address-box label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: #64748B; display: block; margin-bottom: 4px; }
                  .table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12.5px; text-align: left; }
                  .table th { background: #F8FAFC; padding: 10px 12px; border-bottom: 2px solid #E2E8F0; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; }
                  .table td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; }
                  .total-box { margin-top: 24px; background: #F0FDF4; border: 1px solid #86EFAC; padding: 18px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
                  .total-title { font-size: 11px; font-weight: 800; color: #16A34A; text-transform: uppercase; }
                  .total-amount { font-size: 22px; font-weight: 900; color: #15803D; font-family: monospace; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div>
                    <div class="title">OFFICIAL B2B PURCHASE ORDER</div>
                    <div class="subtitle">FactoryGrid Platform · Commercial Contracting Engine</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 16px; font-weight: 800; color: #0F172A;">Apex Pharma Ltd.</div>
                    <div style="font-size: 12px; color: #64748B;">Connaught Place, New Delhi - 110001</div>
                  </div>
                </div>

                <div class="meta-grid">
                  <div class="meta-item"><label>PO Reference</label><div style="color: #0F766E; font-family: monospace;">${poObj.poCode}</div></div>
                  <div class="meta-item"><label>Supplier / Manufacturer</label><div>${poObj.mfgName} <span style="font-size: 11px; color: #0F766E; font-family: monospace;">(GST Number: 02SUNBI0001A1Z8)</span></div></div>
                  <div class="meta-item"><label>Buyer Entity</label><div>Apex Pharma (Buyer) <span style="font-size: 11px; color: #0F766E; font-family: monospace;">(GST Number: 36APXPH0001A1Z5)</span></div></div>
                  <div class="meta-item"><label>Parent Master Order</label><div style="font-family: monospace;">MO-2026-1001</div></div>
                  <div class="meta-item"><label>Sub-Order Code</label><div style="color: #0F766E; font-family: monospace;">${poObj.code}</div></div>
                  <div class="meta-item"><label>Source Quote</label><div style="font-family: monospace;">QUOTE-1001</div></div>
                  <div class="meta-item"><label>PO Status</label><div style="color: #15803D;">PO Generated ✓</div></div>
                  <div class="meta-item"><label>Delivery Schedule</label><div style="color: #1D4ED8;">${poObj.leadTimeDays || 14} Days</div></div>
                </div>

                <div class="address-box" style="margin-bottom: 10px;">
                  <label>Billing Address</label>
                  <div>Apex Corporate Office, Barakhamba Road, New Delhi - 110001</div>
                  <div style="font-size: 11px; color: #0F766E; font-weight: 700; font-family: monospace; margin-top: 2px;">GST Number: 36APXPH0001A1Z5</div>
                </div>

                <div class="address-box">
                  <label>Delivery / Shipping Address</label>
                  <div>${currentShippingAddr || 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020'}</div>
                </div>

                <h3 style="font-size: 14px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-bottom: 8px;">
                  Purchase Order Product Items (${poObj.lines?.length || 0} Line Items)
                </h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(poObj.lines || []).map((l: any) => `
                      <tr>
                        <td><strong>${l.productName}</strong> ${l.dosageForm ? `(${l.dosageForm})` : ''}</td>
                        <td><strong>${l.quantity.toLocaleString()} Units</strong></td>
                        <td>₹${l.unitPrice.toFixed(2)}</td>
                        <td><strong>₹${l.totalCost.toLocaleString()}</strong></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="total-box">
                  <div>
                    <div class="total-title">GRAND TOTAL PURCHASE ORDER VALUE</div>
                    <div style="font-size: 12px; color: #15803D; margin-top: 2px;">Commercial contract value</div>
                  </div>
                  <div class="total-amount">₹${poObj.orderValue.toLocaleString()}</div>
                </div>

                <script>
                  window.onload = function() { window.print(); }
                </script>
              </body>
            </html>
          `;
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        };

        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
            onClick={() => setActivePoModalSubOrderCode(null)}
          >
            <div
              style={{
                width: '100%', maxWidth: 840, maxHeight: '90vh',
                background: '#FFFFFF', borderRadius: 14, border: '1px solid #CBD5E1',
                boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: '18px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={22} style={{ color: '#0F766E' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                        {targetSubOrderObj.poCode || `PO-2026-${targetSubOrderObj.code}`}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: badgeStyle.bg, color: badgeStyle.text, border: `1px solid ${badgeStyle.border}` }}>
                        PO Generated
                      </span>
                    </div>
                    <h2 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                      Purchase Order Review
                    </h2>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => handleDownloadPoPdf(targetSubOrderObj)}
                    style={{
                      padding: '7px 14px', borderRadius: 6, background: '#0F766E',
                      color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <Download size={14} /> Download PO
                  </button>
                  <button
                    onClick={() => setActivePoModalSubOrderCode(null)}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body - ONLY PO Information */}
              <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* PO Metadata Cards */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>PO Reference</span>
                    <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', fontSize: 13, marginTop: 2 }}>{targetSubOrderObj.poCode || `PO-2026-${targetSubOrderObj.code}`}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Supplier / Manufacturer</span>
                    <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{targetSubOrderObj.mfgName}</div>
                    <div style={{ fontSize: 11, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>GST Number: 02SUNBI0001A1Z8</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Buyer Entity</span>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Apex Pharma (Buyer)</div>
                    <div style={{ fontSize: 11, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>GST Number: 36APXPH0001A1Z5</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Parent Master Order</span>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>MO-2026-1001</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Sub-Order Code</span>
                    <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{targetSubOrderObj.code}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Source Quote</span>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>QUOTE-1001</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>PO Status</span>
                    <div style={{ fontWeight: 800, color: '#15803D', marginTop: 2 }}>PO Generated ✓</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Delivery Schedule</span>
                    <div style={{ fontWeight: 700, color: '#1D4ED8', marginTop: 2 }}>{targetSubOrderObj.leadTimeDays || 14} Days</div>
                  </div>
                </div>


                {/* PO Product Line Items Table */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                    Purchase Order Product Items ({targetSubOrderObj.lines?.length || 0} Line Items)
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F8FAFC' }}>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                          <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                          <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                          <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(targetSubOrderObj.lines || []).map((line: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A' }}>{line.productName}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</td>
                            <td style={{ padding: '10px 12px' }}>₹{line.unitPrice.toFixed(2)}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>₹{line.totalCost.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total PO Value Banner */}
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>GRAND TOTAL PURCHASE ORDER VALUE</div>
                    <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>Commercial contract value</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#15803D', fontFamily: 'monospace' }}>
                    ₹{targetSubOrderObj.orderValue.toLocaleString()}
                  </div>
                </div>

                {/* Proforma Invoice Section (Buyer Read-Only View) */}
                <ProformaInvoiceSection
                  poNumber={targetSubOrderObj.poCode || `PO-${targetSubOrderObj.code}`}
                  subOrderCode={targetSubOrderObj.code}
                  allowUpload={false}
                />
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => handleDownloadPoPdf(targetSubOrderObj)}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#FFF', border: '1px solid #0F766E', color: '#0F766E', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={15} /> Download PO PDF
                </button>
                <button
                  onClick={() => setActivePoModalSubOrderCode(null)}
                  style={{ padding: '8px 18px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Close PO Review
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── SEPARATE PRODUCT-WISE ARTWORK UPLOAD MODAL ── */}
      {activeArtworkModalSubOrderCode && (() => {
        const subCode = activeArtworkModalSubOrderCode;
        const targetSubOrderObj = subOrdersDataset.find(s => s.code === subCode) || {
          code: subCode,
          mfgName: 'SunBio LifeSciences Ltd.',
          lines: [
            { id: 'p6', productName: 'Paracetamol 500mg Tablets', packSize: '10 x 10 Strip', quantity: 10000 },
            { id: 'p3', productName: 'Azithromycin 500mg Tablets', packSize: '10 x 3 Strip', quantity: 2000 }
          ]
        };

        const subArtworks = productArtworksStore[subCode] || {};
        const totalProducts = targetSubOrderObj.lines?.length || 1;
        const uploadedProductsCount = (targetSubOrderObj.lines || []).filter((l: any) => {
          const prodKey = l.id || l.productName;
          const files = subArtworks[prodKey] || [];
          const hasUploaded = files.some(f => f.status === 'UPLOADED');
          const hasInHouse = !!(inHouseArtworkRequests[subCode]?.[prodKey]);
          return hasUploaded || hasInHouse;
        }).length;

        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
            onClick={() => setActiveArtworkModalSubOrderCode(null)}
          >
            <div
              style={{
                width: '100%', maxWidth: 840, maxHeight: '90vh',
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
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{subCode}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                      background: uploadedProductsCount === totalProducts ? '#DCFCE7' : '#FEF3C7',
                      color: uploadedProductsCount === totalProducts ? '#15803D' : '#B45309',
                      border: uploadedProductsCount === totalProducts ? '1px solid #86EFAC' : '1px solid #FCD34D'
                    }}>
                      {uploadedProductsCount === totalProducts ? '✓ All Artworks Uploaded / Requested' : `${uploadedProductsCount} of ${totalProducts} Products Completed`}
                    </span>
                  </div>
                  <h2 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                    Product-Wise Artwork Management ({targetSubOrderObj.mfgName})
                  </h2>
                </div>

                <button
                  onClick={() => setActiveArtworkModalSubOrderCode(null)}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body: Product Lines */}
              <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                  Upload artwork design references for each product (maximum 5 files per product) or request our in-house packaging design team. Supported formats: <strong>PNG, JPG, JPEG, WEBP, PDF, AI, CDR</strong>.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {(targetSubOrderObj.lines || []).map((line: any, pIdx: number) => {
                    const prodKey = line.id || line.productName;
                    const fileList = subArtworks[prodKey] || [];
                    const uploadedCount = fileList.filter(f => f.status === 'UPLOADED').length;
                    const inHouseReq = inHouseArtworkRequests[subCode]?.[prodKey];
                    const hasInHouseRequest = !!inHouseReq;

                    return (
                      <div
                        key={pIdx}
                        style={{
                          background: uploadedCount > 0 || hasInHouseRequest ? '#F0FDF4' : '#F8FAFC',
                          border: uploadedCount > 0 ? '1px solid #86EFAC' : hasInHouseRequest ? '1px solid #BAE6FD' : '1px solid #CBD5E1',
                          borderRadius: 12,
                          padding: 20,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 14
                        }}
                      >
                        {/* Product Line Header & Action Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                              Product {pIdx + 1}: {line.productName}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              Pack Size: {line.packSize || '10 x 10 Strip'} · Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 4,
                              background: uploadedCount > 0 ? '#DCFCE7' : hasInHouseRequest ? '#E0F2FE' : '#FEF3C7',
                              color: uploadedCount > 0 ? '#15803D' : hasInHouseRequest ? '#0369A1' : '#B45309',
                              border: uploadedCount > 0 ? '1px solid #86EFAC' : hasInHouseRequest ? '1px solid #BAE6FD' : '1px solid #FCD34D'
                            }}>
                              {uploadedCount > 0
                                ? `✓ ${uploadedCount} of 5 Files Uploaded`
                                : hasInHouseRequest
                                ? '🎨 In-house Artwork Requested'
                                : 'Pending Upload'}
                            </span>

                            {/* View Artwork Lightbox Trigger */}
                            {uploadedCount > 0 && (
                              <button
                                onClick={() => setActiveLightboxData({ subCode, prodKey, files: fileList, currentIndex: 0 })}
                                style={{ padding: '6px 12px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                View Artwork ({uploadedCount}) 🔍
                              </button>
                            )}

                            {/* Multi-File Upload Input */}
                            {uploadedCount < 5 ? (
                              <>
                                <input
                                  type="file"
                                  multiple
                                  accept=".pdf,.ai,.cdr,.png,.jpg,.jpeg,.webp"
                                  id={`art_input_${subCode}_${prodKey}`}
                                  onChange={e => handleAddFilesForSubOrder(subCode, prodKey, e.target.files)}
                                  style={{ display: 'none' }}
                                />
                                <label
                                  htmlFor={`art_input_${subCode}_${prodKey}`}
                                  style={{
                                    padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF',
                                    fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                                  }}
                                >
                                  <Upload size={13} /> {uploadedCount > 0 ? `+ Add More (${5 - uploadedCount} left)` : '+ Upload Artwork Images'}
                                </label>
                              </>
                            ) : (
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', background: '#E2E8F0', padding: '5px 10px', borderRadius: 6 }}>
                                Maximum 5 files uploaded
                              </span>
                            )}

                            {/* Replace Artwork Trigger */}
                            {uploadedCount > 0 && (
                              <button
                                onClick={() => setReplaceConfirmTarget({ subCode, prodKey })}
                                style={{ padding: '6px 12px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <RefreshCw size={12} /> Replace Artwork
                              </button>
                            )}
                          </div>
                        </div>

                        {/* ── ARTWORK SUBMISSION FLOW: Step-by-Step Choice ── */}
                        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

                          {/* STEP 1 — Ask: Do you have artwork ready? */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 14 }}>🎨</span> Do you have artwork ready?
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {/* YES */}
                              <label
                                htmlFor={`art_ready_yes_${subCode}_${prodKey}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 7,
                                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                                  border: `1.5px solid ${artworkReadiness[`${subCode}_${prodKey}`] === 'YES' ? '#0F766E' : '#CBD5E1'}`,
                                  background: artworkReadiness[`${subCode}_${prodKey}`] === 'YES' ? '#F0FDFA' : '#F8FAFC',
                                  fontWeight: 700, fontSize: 12.5,
                                  color: artworkReadiness[`${subCode}_${prodKey}`] === 'YES' ? '#0F766E' : '#475569',
                                  transition: 'all 0.15s',
                                }}
                              >
                                <input
                                  id={`art_ready_yes_${subCode}_${prodKey}`}
                                  type="radio"
                                  name={`art_ready_${subCode}_${prodKey}`}
                                  value="YES"
                                  checked={artworkReadiness[`${subCode}_${prodKey}`] === 'YES'}
                                  onChange={() => setArtworkReadiness(prev => ({ ...prev, [`${subCode}_${prodKey}`]: 'YES' }))}
                                  style={{ accentColor: '#0F766E', width: 15, height: 15 }}
                                />
                                ✓ Yes, I have artwork
                              </label>

                              {/* NO */}
                              <label
                                htmlFor={`art_ready_no_${subCode}_${prodKey}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 7,
                                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                                  border: `1.5px solid ${artworkReadiness[`${subCode}_${prodKey}`] === 'NO' ? '#D97706' : '#CBD5E1'}`,
                                  background: artworkReadiness[`${subCode}_${prodKey}`] === 'NO' ? '#FFFBEB' : '#F8FAFC',
                                  fontWeight: 700, fontSize: 12.5,
                                  color: artworkReadiness[`${subCode}_${prodKey}`] === 'NO' ? '#B45309' : '#475569',
                                  transition: 'all 0.15s',
                                }}
                              >
                                <input
                                  id={`art_ready_no_${subCode}_${prodKey}`}
                                  type="radio"
                                  name={`art_ready_${subCode}_${prodKey}`}
                                  value="NO"
                                  checked={artworkReadiness[`${subCode}_${prodKey}`] === 'NO'}
                                  onChange={() => setArtworkReadiness(prev => ({ ...prev, [`${subCode}_${prodKey}`]: 'NO' }))}
                                  style={{ accentColor: '#D97706', width: 15, height: 15 }}
                                />
                                ✗ No, I don't have artwork
                              </label>
                            </div>
                          </div>

                          {/* IF YES — Artwork Link (URL) */}
                          {artworkReadiness[`${subCode}_${prodKey}`] === 'YES' && (
                            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FileText size={14} /> Artwork Link (URL)
                              </div>
                              <div style={{ fontSize: 11.5, color: '#0F766E' }}>
                                Google Drive, Dropbox, OneDrive, or other artwork repository link
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <input
                                  type="url"
                                  placeholder="Paste artwork link here"
                                  value={artUrlInputValue[`${subCode}_${prodKey}`] || ''}
                                  onChange={e => setArtUrlInputValue(prev => ({ ...prev, [`${subCode}_${prodKey}`]: e.target.value }))}
                                  style={{
                                    flex: 1, minWidth: 220, padding: '8px 12px',
                                    border: '1.5px solid #5EEAD4', borderRadius: 6, fontSize: 12.5, outline: 'none',
                                    background: '#FFFFFF'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = artUrlInputValue[`${subCode}_${prodKey}`] || '';
                                    if (!url.trim()) { alert('Please paste a valid artwork link before submitting.'); return; }
                                    handleAddUrlLinkForSubOrder(subCode, prodKey, url);
                                  }}
                                  style={{
                                    padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF',
                                    border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: 6
                                  }}
                                >
                                  <Upload size={13} /> Submit Artwork Link
                                </button>
                              </div>
                            </div>
                          )}

                          {/* IF NO — File Name first, then Add New */}
                          {artworkReadiness[`${subCode}_${prodKey}`] === 'NO' && (
                            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Upload size={14} /> Upload Artwork File
                              </div>
                              <div style={{ fontSize: 11.5, color: '#78350F' }}>
                                Enter a file name first, then use <strong>+ Add New</strong> to select and upload your artwork file.
                              </div>

                              {/* File Name input (required before upload) */}
                              {uploadedCount < 5 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                    File Name <span style={{ color: '#DC2626' }}>*</span>
                                  </label>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      placeholder="Enter file name (e.g. Packaging_Artwork_v1)"
                                      value={artFileNameInput[`${subCode}_${prodKey}`] || ''}
                                      onChange={e => setArtFileNameInput(prev => ({ ...prev, [`${subCode}_${prodKey}`]: e.target.value }))}
                                      style={{
                                        flex: 1, minWidth: 200, padding: '8px 12px',
                                        border: `1.5px solid ${artFileNameInput[`${subCode}_${prodKey}`]?.trim() ? '#FCD34D' : '#FCA5A5'}`,
                                        borderRadius: 6, fontSize: 12.5, outline: 'none', background: '#FFFFFF'
                                      }}
                                    />

                                    {/* + Add New — hidden file input tied to file name */}
                                    <input
                                      type="file"
                                      multiple
                                      accept=".pdf,.ai,.cdr,.png,.jpg,.jpeg,.webp"
                                      id={`art_input_${subCode}_${prodKey}`}
                                      onChange={e => {
                                        const fname = artFileNameInput[`${subCode}_${prodKey}`]?.trim();
                                        if (!fname) {
                                          alert('Please enter a File Name before selecting a file to upload.');
                                          e.target.value = '';
                                          return;
                                        }
                                        handleAddFilesForSubOrder(subCode, prodKey, e.target.files);
                                        setArtFileNameInput(prev => ({ ...prev, [`${subCode}_${prodKey}`]: '' }));
                                      }}
                                      style={{ display: 'none' }}
                                    />
                                    <label
                                      htmlFor={`art_input_${subCode}_${prodKey}`}
                                      title={!artFileNameInput[`${subCode}_${prodKey}`]?.trim() ? 'Enter a file name first' : 'Click to select artwork file'}
                                      style={{
                                        padding: '8px 16px', borderRadius: 6,
                                        background: artFileNameInput[`${subCode}_${prodKey}`]?.trim() ? '#0F766E' : '#94A3B8',
                                        color: '#FFFFFF', fontSize: 12.5, fontWeight: 800,
                                        cursor: artFileNameInput[`${subCode}_${prodKey}`]?.trim() ? 'pointer' : 'not-allowed',
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        opacity: artFileNameInput[`${subCode}_${prodKey}`]?.trim() ? 1 : 0.7,
                                        pointerEvents: artFileNameInput[`${subCode}_${prodKey}`]?.trim() ? 'auto' : 'none',
                                      }}
                                    >
                                      <Upload size={13} /> + Add New
                                    </label>
                                  </div>
                                  <div style={{ fontSize: 11, color: '#64748B' }}>
                                    Supported formats: PDF, AI, CDR, PNG, JPG, JPEG, WEBP (Max 25 MB per file, up to 5 files)
                                  </div>
                                </div>
                              )}

                              {uploadedCount >= 5 && (
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', background: '#E2E8F0', padding: '5px 10px', borderRadius: 6, display: 'inline-block' }}>
                                  Maximum 5 files uploaded
                                </span>
                              )}
                            </div>
                          )}

                          {/* EMAIL SUBMISSION — always available as a separate option */}
                          <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: 10 }}>
                            <button
                              type="button"
                              onClick={() => setShowEmailPanel(prev => ({ ...prev, [`${subCode}_${prodKey}`]: !prev[`${subCode}_${prodKey}`] }))}
                              style={{
                                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                fontSize: 12, fontWeight: 700,
                                color: showEmailPanel[`${subCode}_${prodKey}`] ? '#0F766E' : '#475569',
                              }}
                            >
                              <Mail size={13} />
                              {showEmailPanel[`${subCode}_${prodKey}`] ? 'Hide Email Submission ▲' : 'Email Submission ▼'}
                            </button>

                            {showEmailPanel[`${subCode}_${prodKey}`] && (
                              <div style={{ marginTop: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Mail size={14} style={{ color: '#0F766E' }} /> Email Submission
                                </div>
                                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                                  You can send your artwork files directly to:
                                </div>
                                <div style={{
                                  background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 6,
                                  padding: '8px 12px', fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: '#0F766E'
                                }}>
                                  artwork@factorygrid.com
                                </div>
                                <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.5 }}>
                                  Please include your Sub-Order ID <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{subCode}</strong> and Product Name <strong style={{ color: '#0F172A' }}>{line.productName}</strong> in the email so our team can identify your artwork.
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleEmailSubmissionInfo(subCode, line.productName)}
                                    style={{
                                      padding: '7px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF',
                                      border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                                      display: 'inline-flex', alignItems: 'center', gap: 6
                                    }}
                                  >
                                    <Mail size={13} /> Open Email
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`artwork@factorygrid.com`);
                                      alert('✔ Email address copied to clipboard!');
                                    }}
                                    style={{
                                      padding: '7px 14px', borderRadius: 6, background: '#FFFFFF',
                                      border: '1px solid #CBD5E1', color: '#334155', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                                    }}
                                  >
                                    Copy Email
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ── ALWAYS-VISIBLE: In-house Artwork Request checkbox section ── */}
                          <div style={{
                            border: hasInHouseRequest
                              ? '1.5px solid #6EE7B7'
                              : artSubmissionMethod[`${subCode}_${prodKey}`] === 'IN_HOUSE_REQUEST'
                              ? '1.5px solid #0F766E'
                              : '1.5px dashed #CBD5E1',
                            borderRadius: 10,
                            background: hasInHouseRequest ? '#F0FDF4' : artSubmissionMethod[`${subCode}_${prodKey}`] === 'IN_HOUSE_REQUEST' ? '#F0FDFA' : '#FAFAFA',
                            overflow: 'hidden',
                            transition: 'all 0.2s',
                          }}>

                            {/* Checkbox header row — always visible */}
                            <label
                              htmlFor={`inhouse_cb_${subCode}_${prodKey}`}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '11px 14px', cursor: 'pointer',
                                borderBottom: artSubmissionMethod[`${subCode}_${prodKey}`] === 'IN_HOUSE_REQUEST' ? '1px solid #D1FAE5' : 'none',
                              }}
                            >
                              <input
                                id={`inhouse_cb_${subCode}_${prodKey}`}
                                type="checkbox"
                                checked={artSubmissionMethod[`${subCode}_${prodKey}`] === 'IN_HOUSE_REQUEST'}
                                onChange={(e) => {
                                  const next = e.target.checked ? 'IN_HOUSE_REQUEST' : 'FILE';
                                  setArtSubmissionMethod(prev => ({ ...prev, [`${subCode}_${prodKey}`]: next }));
                                }}
                                style={{
                                  width: 17, height: 17, accentColor: '#0F766E', cursor: 'pointer', flexShrink: 0,
                                }}
                              />
                              <Palette size={15} style={{ color: hasInHouseRequest ? '#15803D' : '#0F766E', flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 800, color: hasInHouseRequest ? '#15803D' : '#0F172A' }}>
                                  In-house Artwork Request
                                  {hasInHouseRequest && (
                                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                                      ✓ Requested
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                                  Need help? Let our in-house design team prepare your packaging artwork.
                                </div>
                              </div>
                            </label>

                            {/* Expanded panel — shown only when checkbox is checked */}
                            {artSubmissionMethod[`${subCode}_${prodKey}`] === 'IN_HOUSE_REQUEST' && (
                              <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                                  Need help creating or preparing your packaging artwork? Our in-house design team can assist you.{' '}
                                  Request them to create, format, and prepare regulatory-compliant packaging artwork for{' '}
                                  <strong style={{ color: '#0F172A' }}>{line.productName}</strong>.
                                </div>

                                {/* Submitted confirmation banner */}
                                {hasInHouseRequest && inHouseReq && (
                                  <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 7, padding: '10px 13px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#15803D', display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <CheckCircle2 size={14} /> In-house artwork request submitted successfully.
                                    </div>
                                    <div style={{ fontSize: 11.5, color: '#166534' }}>
                                      Request Ref ID: <strong style={{ fontFamily: 'monospace' }}>{inHouseReq.requestId}</strong>
                                      {' · '}Submitted on: <strong>{inHouseReq.requestedAt}</strong>
                                    </div>
                                  </div>
                                )}

                                {/* Contact info card */}
                                <div style={{
                                  background: '#FFFFFF', border: '1px solid #D1FAE5', borderRadius: 8,
                                  padding: '12px 14px', display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14,
                                }}>
                                  <div>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                                      Design Team Contact
                                    </div>
                                    <div style={{ fontWeight: 700, color: '#0F766E', marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}>
                                      artwork@factorygrid.com
                                    </div>
                                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                                      support@factorygrid.com
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                                      Artwork Helpline
                                    </div>
                                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 4, fontFamily: 'monospace', fontSize: 12 }}>
                                      +91 80 4567 8900
                                    </div>
                                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                                      Mon – Fri · 9:00 AM – 6:00 PM IST
                                    </div>
                                  </div>
                                </div>

                                {/* CTA */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                  {!hasInHouseRequest ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRequestInHouseArtwork(subCode, prodKey, line.productName)}
                                      style={{
                                        padding: '9px 20px', borderRadius: 7, background: '#0F766E', color: '#FFFFFF',
                                        border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 7,
                                        boxShadow: '0 2px 6px rgba(15,118,110,0.28)',
                                      }}
                                    >
                                      <Palette size={15} /> Request In-house Artwork
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        disabled
                                        style={{
                                          padding: '9px 18px', borderRadius: 7, background: '#D1FAE5', color: '#15803D',
                                          border: '1.5px solid #6EE7B7', fontWeight: 700, fontSize: 12.5, cursor: 'not-allowed',
                                          display: 'inline-flex', alignItems: 'center', gap: 6,
                                        }}
                                      >
                                        <CheckCircle2 size={14} /> In-house Artwork Requested
                                      </button>
                                      <span style={{ fontSize: 11.5, color: '#64748B' }}>
                                        Design team is processing your request.
                                      </span>
                                    </>
                                  )}
                                </div>

                              </div>
                            )}
                          </div>

                        </div>

                        {/* Multi-File Thumbnails Grid */}
                        {fileList.length > 0 ? (
                          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Artwork & Reference Previews ({fileList.length} of 5 max)
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                              {fileList.map((file, fIdx) => (
                                <div
                                  key={file.id}
                                  style={{
                                    background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, overflow: 'hidden',
                                    display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative'
                                  }}
                                >
                                  {/* Thumbnail Preview Clickable Box */}
                                  <div
                                    onClick={() => setActiveLightboxData({ subCode, prodKey, files: fileList, currentIndex: fIdx })}
                                    style={{
                                      height: 90, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      cursor: 'pointer', overflow: 'hidden', position: 'relative'
                                    }}
                                    title="Click to view large preview"
                                  >
                                    {file.url ? (
                                      <img src={file.url} alt={file.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#0F766E' }}>
                                        <FileText size={28} />
                                        <span style={{ fontSize: 9.5, fontWeight: 800 }}>{file.fileName.split('.').pop()?.toUpperCase()}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Thumbnail Details & Remove Action */}
                                  <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.fileName}>
                                      {file.fileName}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#64748B' }}>{file.fileSize}</div>

                                    <button
                                      onClick={() => handleDeleteFileForSubOrder(subCode, prodKey, file.id)}
                                      style={{
                                        marginTop: 4, padding: '3px 6px', borderRadius: 4, background: '#FEE2E2', border: '1px solid #FCA5A5',
                                        color: '#B91C1C', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', textAlign: 'center', width: '100%'
                                      }}
                                      title="Remove file"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: 10, padding: 16, textAlign: 'center', color: '#64748B', fontSize: 12.5 }}>
                            No artwork files attached yet for this product. Click <strong>+ Upload Artwork Images</strong> to upload 1 to 5 files (PNG, JPG, WEBP, PDF, AI, CDR).
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setActiveArtworkModalSubOrderCode(null)}
                  style={{ padding: '8px 20px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  Save &amp; Close Artwork Window
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Universal QA Query Raising Modal */}
      <RaiseQaModal
        isOpen={isQaModalOpen}
        onClose={() => setIsQaModalOpen(false)}
        userRole={currentRole === 'BUYER' ? 'BUYER' : 'SUPPLIER'}
      />
    </>
  );
};

  // ── 0. MASTER ORDERS LIST VIEW (`viewMode === 'LIST'`) ─────────────────
  if (viewMode === 'LIST') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>
        
        {/* Command Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Master Orders</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Master Orders Governance &amp; Execution Desk
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Manage, split, and track multi-manufacturer Master Orders across quotes, sub-orders, POs, and artwork.
            </p>
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search MO#, Customer, Quote..."
              style={{ width: '100%', padding: '7px 10px 7px 32px', fontSize: 12.5, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Master Orders Table Container */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                Master Orders Collection ({filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'})
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Select any Master Order to view manufacturer splits, sub-orders, purchase orders, and artwork uploads.
              </div>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
              <ShoppingBag size={36} style={{ color: '#CBD5E1', marginBottom: 10 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No Master Orders Found</div>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>Try clearing your search query or status filter.</div>
              <button onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }} style={{ marginTop: 14, padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ORDER NUMBER</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ORDER DATE</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DELIVERY DATE</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>STATUS</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>RESPONSES</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL VALUE</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCTS</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SUB-ORDERS</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PURCHASE ORDERS</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'center' }}>HOLD COUNT</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const subCount = order.subOrders?.length || 3;
                    const prodCount = order.subOrders?.reduce((acc, s) => acc + (s.lines?.length || 1), 0) || 4;
                    const poCount = order.poNumber ? subCount : (poCreatedCount || subCount);
                    const isCompleted = order.status === 'COMPLETED' || order.status === 'DELIVERED';
                    const displayTotalAmount = order.totalAmount || 297800;
                    const isHeld = order.isOnHold || order.status === 'ON_HOLD';

                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {order.orderNumber}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {order.createdDate || '14 Aug 2026'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>
                          {order.expectedDeliveryDate || '2026-09-02'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                              background: isHeld ? '#FEF2F2' : (isCompleted ? '#DCFCE7' : '#FEF3C7'),
                              color: isHeld ? '#DC2626' : (isCompleted ? '#15803D' : '#B45309'),
                              border: isHeld ? '1px solid #FECACA' : (isCompleted ? '1px solid #86EFAC' : '1px solid #FCD34D')
                            }}
                          >
                            {isHeld ? 'ON_HOLD' : order.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#475569' }}>
                          3 Quotes
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                          ₹{displayTotalAmount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A' }}>
                          {prodCount} {prodCount === 1 ? 'Product' : 'Products'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>
                          {subCount} Sub-Orders
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#15803D' }}>
                          {poCount} / {subCount} POs
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: (order.holdCount || 0) > 0 ? '#FEF2F2' : '#F1F5F9',
                              color: (order.holdCount || 0) > 0 ? '#DC2626' : '#64748B',
                              border: (order.holdCount || 0) > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            {isHeld && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#DC2626' }} />}
                            {order.holdCount || 0}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setViewMode('DETAILS');
                            }}
                            style={{
                              padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF',
                              border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}
                          >
                            View Order →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {renderModals()}
      </div>
    );
  }

  // ── 1. ORIGINAL QUOTE DETAILS READ-ONLY VIEW (`viewMode === 'ORIGINAL_QUOTE'`) ──
  if (viewMode === 'ORIGINAL_QUOTE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Breadcrumb & Command Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('DETAILS')}>MO-2026-1001</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Original Quote Details</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Original Customer Quotation Details (QUOTE-1001)
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Read-Only Source Quotation for Master Order <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>MO-2026-1001</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('DETAILS')} style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Master Order
            </button>
          </div>
        </div>

        {/* Read-Only Quote Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Quote Number</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>QUOTE-1001</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Source RFQ: RFQ-2026-1001</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>Apex Pharma PCD Franchise</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Authorized Procurement Entity</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Quote Status</div>
            <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', display: 'inline-block', marginTop: 4 }}>
              APPROVED
            </span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Dates</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>Created: 14 Aug 2026</div>
            <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>Approved: 14 Aug 2026</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #0F766E', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>Total Quote Value</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>₹2,52,800</div>
            <div style={{ fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>Fixed Commercial Contract</div>
          </div>
        </div>

        {/* Selected Suppliers Allocation Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 12 }}>
            SELECTED SUPPLIERS MATRIX
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5 }}>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>Paracetamol 500mg Tablets</div>
              <div style={{ color: '#0F766E', fontWeight: 800, fontSize: 14, marginTop: 2 }}>→ SunBio LifeSciences Ltd.</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5 }}>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>Amoxicillin 250mg Tablets</div>
              <div style={{ color: '#0F766E', fontWeight: 800, fontSize: 14, marginTop: 2 }}>→ Cipla Partner Formulations Ltd.</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5 }}>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>Azithromycin 500mg Tablets</div>
              <div style={{ color: '#0F766E', fontWeight: 800, fontSize: 14, marginTop: 2 }}>→ SunBio LifeSciences Ltd.</div>
            </div>
          </div>
        </div>

        {/* Read-Only Product Line Items Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>ORIGINAL QUOTATION LINE ITEMS (3 Products)</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Approved commercial baseline. Read-only view.</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>REQUIRED DATE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SELECTED MANUFACTURER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TAX %</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DISCOUNT %</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>FINAL PRICE / UNIT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DELIVERY SCHEDULE</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>Paracetamol 500mg Tablets</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>10,000 Units</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>14 Aug 2026</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>SunBio LifeSciences Ltd.</td>
                  <td style={{ padding: '12px 14px' }}>₹9.66</td>
                  <td style={{ padding: '12px 14px' }}>12%</td>
                  <td style={{ padding: '12px 14px' }}>5%</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹10.28</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>₹1,02,800</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>14 Days</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>Amoxicillin 250mg Tablets</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>5,000 Units</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>14 Aug 2026</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>Cipla Partner Formulations Ltd.</td>
                  <td style={{ padding: '12px 14px' }}>₹11.50</td>
                  <td style={{ padding: '12px 14px' }}>12%</td>
                  <td style={{ padding: '12px 14px' }}>3%</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹12.40</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>₹57,500</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>10 Days</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>Azithromycin 500mg Tablets</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>2,000 Units</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>14 Aug 2026</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>SunBio LifeSciences Ltd.</td>
                  <td style={{ padding: '12px 14px' }}>₹15.00</td>
                  <td style={{ padding: '12px 14px' }}>18%</td>
                  <td style={{ padding: '12px 14px' }}>0%</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹16.80</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, fontFamily: 'monospace' }}>₹92,500</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>12 Days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // ── 2. DEDICATED PURCHASE ORDER DETAIL VIEW (`viewMode === 'PO_DETAIL'`) ──
  if (viewMode === 'PO_DETAIL' && targetPoSubOrderObj) {
    const currentPoStatus = activeMasterOrder?.poStatus || 'AUTO-GENERATED';
    const currentShippingAddr = activeMasterOrder?.shippingAddress || 'Apex Pharma Logistics Depot, Plot 14, Baddi, HP';

    const getStatusLabel = () => {
      if (currentPoStatus === 'REGENERATED') return 'REGENERATED BY ADMIN';
      return 'AUTO-GENERATED';
    };

    const getStatusBadgeStyle = () => {
      if (currentPoStatus === 'REGENERATED') return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' };
      return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
    };

    const badgeStyle = getStatusBadgeStyle();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>

        {/* Notification Banner */}
        {poBannerMsg && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '12px 18px', color: '#15803D', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{poBannerMsg}</span>
            <button onClick={() => setPoBannerMsg(null)} style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
        )}

        {/* Breadcrumb & Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('DETAILS')}>MO-2026-1001</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('PO_CREATION_LIST')}>Purchase Orders</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>PO-2026-1001-01</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              PURCHASE ORDER: PO-2026-1001-01
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Supplier: <strong style={{ color: '#0F766E' }}>{targetPoSubOrderObj.mfgName}</strong> · Parent Master Order: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>MO-2026-1001</strong> · Sub-Order: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{targetPoSubOrderObj.code}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const el = document.getElementById('po_artwork_section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                background: '#F59E0B',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <FileText size={14} /> Artwork 🎨
            </button>
            <button onClick={() => setViewMode('SUB_ORDERS_LIST')} style={{ padding: '8px 14px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              Back to Sub-Orders
            </button>
            <button onClick={() => setViewMode('DETAILS')} style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Master Order
            </button>
          </div>
        </div>

        {/* ── ADMIN PO WORKFLOW CONTROLS ── */}
        {currentRole === 'ADMIN' && (
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ADMIN PO GOVERNANCE &amp; WORKFLOW CONTROLS
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                Review auto-generated PO, regenerate PO parameters, or submit PO to Buyer.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

              {/* 2. Regenerate PO */}
              <button
                onClick={() => {
                  if (activeMasterOrder) {
                    regeneratePO(activeMasterOrder.id);
                    setPoBannerMsg('✓ Purchase Order regenerated successfully with latest quotation parameters.');
                  } else {
                    setPoBannerMsg('✓ Purchase Order regenerated successfully.');
                  }
                }}
                style={{ padding: '8px 14px', borderRadius: 6, background: '#FFFFFF', border: '1px solid #C084FC', color: '#7E22CE', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} /> Regenerate PO
              </button>

            </div>
          </div>
        )}

        {/* ── BUYER PO STATUS BANNER ── */}
        {currentRole === 'BUYER' && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={22} color="#16A34A" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#15803D' }}>
                PO Auto-Generated
              </div>
              <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>
                Master Purchase Order automatically generated from approved customer quotation. Available for tracking &amp; fulfillment.
              </div>
            </div>
          </div>
        )}

        {/* PO Meta Summary Grid */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Supplier / Manufacturer</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', marginTop: 2 }}>{targetPoSubOrderObj.mfgName}</div>
            <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>GST Number: 02SUNBI0001A1Z8</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Buyer Entity</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Apex Pharma PCD Franchise</div>
            <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>GST Number: 36APXPH0001A1Z5</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Parent Master Order</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>MO-2026-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Order Code</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{targetPoSubOrderObj.code}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Source Quote</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>QUOTE-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PO Workflow Status</div>
            <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: badgeStyle.bg, color: badgeStyle.text, border: `1px solid ${badgeStyle.border}`, display: 'inline-block', marginTop: 2 }}>
              {getStatusLabel()}
            </span>
          </div>
        </div>

        {/* ── DYNAMIC BUYER PURCHASE ORDER ARTWORK & BRANDING SECTION ── */}
        {(() => {
          const subCode = targetPoSubOrderObj.code;
          const unifiedRec = getUnifiedSubOrder(subCode);
          const isUploaded = (unifiedRec?.artworkStatus === 'ARTWORK_COMPLETED' || !!unifiedRec?.artworkFile) && !showReplaceUploadPo[subCode];
          const artFile = unifiedRec?.artworkFile;

          return (
            <div id="po_artwork_section" style={{
              background: isUploaded ? '#F0FDF4' : '#FFFBEB',
              border: isUploaded ? '1px solid #86EFAC' : '1px solid #FCD34D',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              {/* Section Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} style={{ color: isUploaded ? '#16A34A' : '#D97706' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: isUploaded ? '#15803D' : '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      BUYER PURCHASE ORDER ARTWORK &amp; BRANDING
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                      Official brand packaging artwork linked to Purchase Order <strong style={{ fontFamily: 'monospace', color: '#0F766E' }}>{targetPoSubOrderObj.poCode}</strong> ({targetPoSubOrderObj.mfgName})
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: 6,
                  background: isUploaded ? '#DCFCE7' : '#FEF3C7',
                  color: isUploaded ? '#15803D' : '#B45309',
                  border: isUploaded ? '1px solid #86EFAC' : '1px solid #FDE68A',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  {isUploaded ? 'Status: Artwork Uploaded ✓' : 'Status: Pending Upload'}
                </span>
              </div>

              {/* Section Body */}
              {isUploaded ? (
                <div style={{ background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: 8, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 12.5 }}>
                      <div>Uploaded File Name: <strong style={{ fontFamily: 'monospace', color: '#0F766E' }}>{artFile?.fileName}</strong></div>
                      <div>Upload Date/Time: <strong>{artFile?.uploadedAt}</strong></div>
                      <div>File Type: <strong>{artFile?.fileType || 'PDF Document (.pdf)'}</strong></div>
                      <div>Delivery Schedule: <strong style={{ color: '#15803D' }}>Finalized &amp; Commenced ✓</strong></div>
                    </div>
                    <div style={{ fontSize: 12, color: '#15803D', fontWeight: 700, marginTop: 8 }}>
                      ✓ Official packaging artwork submitted to manufacturer ({targetPoSubOrderObj.mfgName}). Production scheduling unlocked.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => alert(`Opening Uploaded Artwork File:\n\nPurchase Order: ${targetPoSubOrderObj.poCode}\nSub-Order: ${subCode}\nFile Name: ${artFile?.fileName}\nUpload Date/Time: ${artFile?.uploadedAt}\nFile Type: ${artFile?.fileType}\nStatus: Artwork Uploaded`)}
                      style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Eye size={14} /> View / Download Artwork
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowReplaceUploadPo(prev => ({ ...prev, [subCode]: true }))}
                      style={{ padding: '8px 16px', borderRadius: 6, background: '#FFF', border: '1px solid #CBD5E1', color: '#334155', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <RefreshCw size={14} /> Replace Artwork
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 12.5, color: '#78350F', background: '#FFFFFF', padding: 14, borderRadius: 8, border: '1px solid #FDE68A' }}>
                    <div>
                      Please upload the required packaging artwork for this purchase order.
                    </div>
                  </div>

                  {/* 4 Artwork Submission Methods Selector Box */}
                  <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 8, border: '1px solid #FCD34D', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} /> Artwork Submission Methods (4 Options Available)
                    </div>

                    {/* Method Selector Pills */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setArtSubmissionMethod(prev => ({ ...prev, [`po_${subCode}`]: 'FILE' }))}
                        style={{
                          padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `1px solid ${(artSubmissionMethod[`po_${subCode}`] || 'FILE') === 'FILE' ? '#0F766E' : '#CBD5E1'}`,
                          background: (artSubmissionMethod[`po_${subCode}`] || 'FILE') === 'FILE' ? '#F0FDFA' : '#F8FAFC',
                          color: (artSubmissionMethod[`po_${subCode}`] || 'FILE') === 'FILE' ? '#0F766E' : '#475569',
                          display: 'inline-flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <Upload size={13} /> 1. Direct File Upload
                      </button>

                      <button
                        type="button"
                        onClick={() => setArtSubmissionMethod(prev => ({ ...prev, [`po_${subCode}`]: 'URL' }))}
                        style={{
                          padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `1px solid ${artSubmissionMethod[`po_${subCode}`] === 'URL' ? '#0F766E' : '#CBD5E1'}`,
                          background: artSubmissionMethod[`po_${subCode}`] === 'URL' ? '#F0FDFA' : '#F8FAFC',
                          color: artSubmissionMethod[`po_${subCode}`] === 'URL' ? '#0F766E' : '#475569',
                          display: 'inline-flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <FileText size={13} /> 2. Link (URL)
                      </button>

                      <button
                        type="button"
                        onClick={() => setArtSubmissionMethod(prev => ({ ...prev, [`po_${subCode}`]: 'EMAIL' }))}
                        style={{
                          padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `1px solid ${artSubmissionMethod[`po_${subCode}`] === 'EMAIL' ? '#0F766E' : '#CBD5E1'}`,
                          background: artSubmissionMethod[`po_${subCode}`] === 'EMAIL' ? '#F0FDFA' : '#F8FAFC',
                          color: artSubmissionMethod[`po_${subCode}`] === 'EMAIL' ? '#0F766E' : '#475569',
                          display: 'inline-flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <Mail size={13} /> 3. Email Submission
                      </button>

                      <button
                        type="button"
                        onClick={() => setArtSubmissionMethod(prev => ({ ...prev, [`po_${subCode}`]: 'IN_HOUSE_REQUEST' }))}
                        style={{
                          padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `1px solid ${artSubmissionMethod[`po_${subCode}`] === 'IN_HOUSE_REQUEST' ? '#0F766E' : '#CBD5E1'}`,
                          background: artSubmissionMethod[`po_${subCode}`] === 'IN_HOUSE_REQUEST' ? '#F0FDFA' : '#F8FAFC',
                          color: artSubmissionMethod[`po_${subCode}`] === 'IN_HOUSE_REQUEST' ? '#0F766E' : '#475569',
                          display: 'inline-flex', alignItems: 'center', gap: 5
                        }}
                      >
                        <Palette size={13} /> 4. In-house Artwork Request
                      </button>
                    </div>

                    {/* Method 1: Direct File Upload */}
                    {(artSubmissionMethod[`po_${subCode}`] || 'FILE') === 'FILE' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                        <input
                          type="file"
                          accept=".pdf,.ai,.cdr,.png,.jpg"
                          id={`po_file_input_${subCode}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadPoArtwork(subCode, file.name);
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        <label
                          htmlFor={`po_file_input_${subCode}`}
                          style={{
                            padding: '10px 22px',
                            borderRadius: 6,
                            background: '#0F766E',
                            color: '#FFFFFF',
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Upload size={14} /> Upload Artwork File
                        </label>

                        {showReplaceUploadPo[subCode] && (
                          <button
                            type="button"
                            onClick={() => setShowReplaceUploadPo(prev => ({ ...prev, [subCode]: false }))}
                            style={{ padding: '8px 14px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Cancel Replacement
                          </button>
                        )}

                        <span style={{ fontSize: 12, color: '#64748B' }}>Supported formats: PDF, AI, CDR, PNG, JPG (Max 25MB)</span>
                      </div>
                    )}

                    {/* Method 2: Link (URL) */}
                    {artSubmissionMethod[`po_${subCode}`] === 'URL' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Provide Artwork Link (URL):</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <input
                            type="url"
                            placeholder="https://drive.google.com/file/d/your-artwork-file"
                            value={artUrlInputValue[`po_${subCode}`] || ''}
                            onChange={e => setArtUrlInputValue(prev => ({ ...prev, [`po_${subCode}`]: e.target.value }))}
                            style={{ flex: 1, minWidth: 240, padding: '7px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const url = artUrlInputValue[`po_${subCode}`] || '';
                              if (!url.trim()) { alert('Please enter a valid artwork URL.'); return; }
                              handleUploadPoArtwork(subCode, `Link: ${url.trim().substring(0, 30)}...`);
                              setArtUrlInputValue(prev => ({ ...prev, [`po_${subCode}`]: '' }));
                            }}
                            style={{ padding: '7px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                          >
                            Submit Link
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Method 3: Email Submission */}
                    {artSubmissionMethod[`po_${subCode}`] === 'EMAIL' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Submit Artwork via Email:</div>
                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                          Send artwork files to <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>artwork@factorygrid.com</strong> with Subject: <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{targetPoSubOrderObj.poCode} Artwork Submission</strong>.
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`Email: artwork@factorygrid.com\nSubject: ${targetPoSubOrderObj.poCode} Artwork Submission`);
                              alert(`✔ Email submission details copied to clipboard!\n\nEmail: artwork@factorygrid.com\nSubject: ${targetPoSubOrderObj.poCode} Artwork Submission`);
                            }}
                            style={{ padding: '6px 14px', borderRadius: 6, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#334155', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                          >
                            Copy Details
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Method 4: In-house Artwork Request */}
                    {artSubmissionMethod[`po_${subCode}`] === 'IN_HOUSE_REQUEST' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Palette size={15} style={{ color: '#0F766E' }} /> In-house Artwork Request
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                          Request our specialized in-house design team to create, format, and prepare the required packaging artwork for Purchase Order <strong>{targetPoSubOrderObj.poCode}</strong>.
                        </div>
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 12 }}>
                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Design Team Contact</div>
                            <div style={{ fontWeight: 700, color: '#0F766E', marginTop: 2, fontFamily: 'monospace' }}>artwork@factorygrid.com</div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>support@factorygrid.com</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Artwork Helpline</div>
                            <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2, fontFamily: 'monospace' }}>+91 80 4567 8900</div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Mon – Fri · 9:00 AM – 6:00 PM IST</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 2 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const firstProd = targetPoSubOrderObj.lines?.[0];
                              const prodKey = firstProd?.id || firstProd?.productName || 'All Product Lines';
                              const prodName = firstProd?.productName || `PO ${targetPoSubOrderObj.poCode} Items`;
                              handleRequestInHouseArtwork(subCode, prodKey, prodName);
                            }}
                            style={{
                              padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF',
                              border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(15,23,42,0.08)'
                            }}
                          >
                            <Palette size={14} /> Request In-house Artwork
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Commercial Terms & Addresses */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: 12.5 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PO Date & Expected Delivery</div>
            <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>PO Date: 14 Aug 2026</div>
            <div style={{ fontWeight: 700, color: '#1D4ED8', marginTop: 1 }}>Expected Delivery: 2026-09-02</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Payment & Freight Terms</div>
            <div style={{ fontWeight: 600, color: '#334155', marginTop: 2 }}>Payment Terms: Net 30 Days</div>
            <div style={{ fontWeight: 600, color: '#334155', marginTop: 1 }}>Delivery: Door Delivery / Cold-Chain</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Billing Address</div>
            <div style={{ color: '#334155', marginTop: 2 }}>Apex Pharma HQ, Sector 18, Gurugram, Haryana</div>
            <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>GST Number: 36APXPH0001A1Z5</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Delivery / Shipping Address</span>
              {currentRole === 'ADMIN' && (
                <button
                  onClick={() => {
                    setAddressInputText(currentShippingAddr);
                    setShowAddressModal(true);
                  }}
                  style={{ background: 'none', border: 'none', color: '#0F766E', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                >
                  <Edit size={12} /> Edit
                </button>
              )}
            </div>
            <div style={{ color: '#0F172A', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <MapPin size={15} style={{ color: '#0F766E', marginTop: 2, flexShrink: 0 }} />
              <span>{currentShippingAddr}</span>
            </div>
          </div>
        </div>

        {/* ── PROFORMA INVOICE SECTION (PO DETAIL VIEW - BUYER READ-ONLY) ── */}
        <ProformaInvoiceSection
          poNumber={targetPoSubOrderObj.poCode || `PO-${targetPoSubOrderObj.code}`}
          subOrderCode={targetPoSubOrderObj.code}
          allowUpload={false}
        />

        {/* PO Line Items Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>ORDER ITEMS ({targetPoSubOrderObj.lines.length} Line Items)</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Contains strictly items assigned to this purchase order.</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DELIVERY SCHEDULE</th>
                </tr>
              </thead>
              <tbody>
                {targetPoSubOrderObj.lines.map((line, lIdx) => (
                  <tr key={lIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{line.productName}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>₹{line.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>₹{line.totalCost.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>{line.leadTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PO Commercial Summary Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Subtotal</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>₹{targetPoSubOrderObj.subtotal.toLocaleString()}</div>
          </div>
          <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>Grand Total PO Value</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>₹{targetPoSubOrderObj.orderValue.toLocaleString()}</div>
          </div>
        </div>

      </div>
    );
  }

  // ── 3. PURCHASE ORDER CREATION SUCCESS SCREEN (`viewMode === 'PO_SUCCESS'`) ──
  if (viewMode === 'PO_SUCCESS' && targetPoSubOrderObj) {
    const poInfo = createdPos[targetPoSubOrderObj.code] || { poNumber: targetPoSubOrderObj.poCode, createdDate: '14 Aug 2026', status: 'Created' };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Success Banner */}
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: 24, boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#15803D', letterSpacing: '0.06em' }}>PURCHASE ORDER CREATED</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#166534' }}>
                {poInfo.poNumber} Created Successfully
              </h2>
            </div>
          </div>
          <div style={{ fontSize: 13.5, color: '#166534', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
            <div>✓ <strong>{poInfo.poNumber}</strong> created successfully</div>
            <div>✓ Linked to Sub-Order <strong style={{ fontFamily: 'monospace' }}>{targetPoSubOrderObj.code}</strong></div>
            <div>✓ Purchase Order notification queued for <strong>{targetPoSubOrderObj.mfgName}</strong></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <button onClick={() => setViewMode('PO_CREATION_LIST')} style={{ padding: '9px 18px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Back to Purchase Orders
          </button>

          <button onClick={() => setViewMode('PO_DETAIL')} style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            View Purchase Order →
          </button>
        </div>

      </div>
    );
  }



  // ── 5. PURCHASE ORDER CREATION LIST VIEW (`viewMode === 'PO_CREATION_LIST'`) ──
  if (viewMode === 'PO_CREATION_LIST' && activeMasterOrder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Breadcrumb & Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('DETAILS')}>MO-2026-1001</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Purchase Orders</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Purchase Orders
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Create manufacturer-specific purchase orders from Master Order <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>MO-2026-1001</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('DETAILS')} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Master Order
            </button>
          </div>
        </div>

        {/* Master Summary Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Master Order</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>MO-2026-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Apex Pharma PCD Franchise</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Orders</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>2 Sub-Orders</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PO Progress</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', marginTop: 2 }}>{poCreatedCount} / 3 Created</div>
          </div>
        </div>

        {/* Purchase Orders List Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {subOrdersDataset.map(so => {
            const poNumberStr = so.poCode || `PO-${so.code}`;
            const subArtworksMap = productArtworksStore[so.code] || {};
            const uploadedFilesCount = Object.values(subArtworksMap).flatMap(arr => arr).filter(f => f.status === 'UPLOADED').length;

            return (
              <div key={so.code} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                      {poNumberStr}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                      PO Created
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>{so.mfgName}</h3>

                  <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    <div>Linked Sub-Order: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{so.code}</strong></div>
                    <div>Product Lines: <strong style={{ color: '#0F172A' }}>{so.productsCount} {so.productsCount > 1 ? 'Products' : 'Product'}</strong></div>
                    <div>Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{so.totalQuantity.toLocaleString()} Units</strong></div>
                    <div>PO Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{so.orderValue.toLocaleString()}</strong></div>
                    <div>Delivery Schedule: <strong style={{ color: '#1D4ED8' }}>{so.leadTimeDays} Days</strong></div>
                  </div>
                </div>

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSelectedSubOrderCode(so.code);
                      setViewMode('SUB_ORDER_DETAIL');
                    }}
                    style={{ padding: '6px 12px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    View Sub-Order →
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setActivePoModalSubOrderCode(so.code);
                    }}
                    style={{ padding: '6px 12px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Eye size={13} /> View PO
                  </button>

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.ai,.cdr,.png,.jpg,.jpeg"
                    id={`po_art_input_${so.code}`}
                    onChange={(e) => {
                      const prodKey = so.lines?.[0]?.productName || so.lines?.[0]?.id || 'Paracetamol 500mg Tablets';
                      handleAddFilesForSubOrder(so.code, prodKey, e.target.files);
                      setActiveArtworkModalSubOrderCode(so.code);
                    }}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor={`po_art_input_${so.code}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveArtworkModalSubOrderCode(so.code);
                    }}
                    style={{ 
                      padding: '6px 12px', borderRadius: 6,
                      background: uploadedFilesCount > 0 ? '#DCFCE7' : '#F0FDF4',
                      border: uploadedFilesCount > 0 ? '1px solid #86EFAC' : '1px solid #86EFAC',
                      color: uploadedFilesCount > 0 ? '#15803D' : '#15803D',
                      fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                    }}
                  >
                    {uploadedFilesCount > 0 ? (
                      <>
                        <CheckCircle2 size={13} style={{ color: '#16A34A' }} /> Uploaded ({uploadedFilesCount} Files) ✓
                      </>
                    ) : (
                      <>
                        <Upload size={13} /> Upload Artwork
                      </>
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manufacturer Notification Queue Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 10 }}>
            MANUFACTURER PO NOTIFICATION QUEUE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#15803D' }}>
            {createdPos['SO-1001-01'] ? (
              <div>✓ PO-2026-1001-01 created — Purchase Order notification queued for SunBio LifeSciences Ltd.</div>
            ) : (
              <div style={{ color: '#64748B' }}>○ SO-1001-01 — Pending PO Creation (SunBio LifeSciences Ltd.)</div>
            )}
            {createdPos['SO-1001-02'] ? (
              <div>✓ PO-2026-1001-02 created — Purchase Order notification queued for Cipla Partner Formulations Ltd.</div>
            ) : (
              <div style={{ color: '#64748B' }}>○ SO-1001-02 — Pending PO Creation (Cipla Partner Formulations Ltd.)</div>
            )}
            {createdPos['SO-1001-03'] ? (
              <div>✓ PO-2026-1001-03 created — Purchase Order notification queued for Lupin Bio-Tech Labs.</div>
            ) : (
              <div style={{ color: '#64748B' }}>○ SO-1001-03 — Pending PO Creation (Lupin Bio-Tech Labs)</div>
            )}
          </div>
        </div>

      </div>
    );
  }

  // ── 6. SUB-ORDER DETAILS VIEW (`viewMode === 'SUB_ORDER_DETAIL'`) ──
  if (viewMode === 'SUB_ORDER_DETAIL' && activeSubOrderObj) {
    const hasPoForThisSubOrder = !!createdPos[activeSubOrderObj.code];
    const poDataForThisSubOrder = createdPos[activeSubOrderObj.code];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>

        {/* Breadcrumb & Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('DETAILS')}>MO-2026-1001</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('SUB_ORDERS_LIST')}>Sub-Orders</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{activeSubOrderObj.code}</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              SUB-ORDER: {activeSubOrderObj.code}
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Manufacturer: <strong style={{ color: '#0F766E' }}>{activeSubOrderObj.mfgName}</strong> · Parent Master Order: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>MO-2026-1001</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('SUB_ORDERS_LIST')} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Sub-Orders
            </button>
          </div>
        </div>

        {/* Sub-Order Meta Summary Box */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Order Code</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{activeSubOrderObj.code}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Manufacturer</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{activeSubOrderObj.mfgName}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Parent Master Order</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>MO-2026-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Apex Pharma PCD Franchise</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Order Status</div>
            <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: hasPoForThisSubOrder ? '#DCFCE7' : '#FEF3C7', color: hasPoForThisSubOrder ? '#15803D' : '#B45309', border: '1px solid #CBD5E1', display: 'inline-block', marginTop: 2 }}>
              {activeSubOrderObj.status}
            </span>
          </div>
        </div>

        {/* PO Section Bar inside Sub-Order Detail */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>PURCHASE ORDER STATUS</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
              {hasPoForThisSubOrder ? (
                <span>PO Status: <strong style={{ color: '#16A34A' }}>PO Generated</strong> ({poDataForThisSubOrder.poNumber})</span>
              ) : (
                <span>PO Status: <strong style={{ color: '#B45309' }}>PO Not Generated</strong></span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setActivePoModalSubOrderCode(activeSubOrderObj.code);
                }}
                style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Eye size={14} /> View PO
              </button>

              <input
                type="file"
                multiple
                accept=".pdf,.ai,.cdr,.png,.jpg,.jpeg"
                id={`detail_art_input_${activeSubOrderObj.code}`}
                onChange={(e) => {
                  const prodKey = activeSubOrderObj.lines?.[0]?.productName || activeSubOrderObj.lines?.[0]?.id || 'Paracetamol 500mg Tablets';
                  handleAddFilesForSubOrder(activeSubOrderObj.code, prodKey, e.target.files);
                  setActiveArtworkModalSubOrderCode(activeSubOrderObj.code);
                }}
                style={{ display: 'none' }}
              />
              <label
                htmlFor={`detail_art_input_${activeSubOrderObj.code}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveArtworkModalSubOrderCode(activeSubOrderObj.code);
                }}
                style={{ padding: '8px 16px', borderRadius: 6, background: '#F0FDF4', border: '1px solid #86EFAC', color: '#15803D', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Upload size={14} /> Upload Artwork
              </label>
          </div>
        </div>

        {/* Sub-Order Assigned Product Lines Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
              ORDER LINES FOR {activeSubOrderObj.mfgName} ({activeSubOrderObj.lines.length} Line Items)
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Showing strictly products assigned to this manufacturer.
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DELIVERY SCHEDULE</th>
                </tr>
              </thead>
              <tbody>
                {activeSubOrderObj.lines.map((line, lIdx) => (
                  <tr key={lIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{line.productName}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>₹{line.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>₹{line.totalCost.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>{line.leadTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // ── 7. DEDICATED SUB-ORDERS LIST VIEW (`viewMode === 'SUB_ORDERS_LIST'`) ──
  if (viewMode === 'SUB_ORDERS_LIST' && activeMasterOrder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Breadcrumb & Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('DETAILS')}>MO-2026-1001</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>Sub-Orders</span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Sub-Orders
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Manufacturer-specific orders created from Master Order <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>MO-2026-1001</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('DETAILS')} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Master Order
            </button>
          </div>
        </div>

        {/* Master Summary Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Master Order</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>MO-2026-1001</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>Apex Pharma PCD Franchise</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Orders Created</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>3 Sub-Orders</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PO Status</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', marginTop: 2 }}>{poCreatedCount} / 3 POs Created</div>
          </div>
        </div>

        {/* Sub-Orders Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {subOrdersDataset.map(so => {
            const hasPo = !!createdPos[so.code] || !!so.poCode || !!so.poNumber || so.status === 'PO Generated' || isSplitComplete;
            const subArtworksMap = productArtworksStore[so.code] || {};
            const uploadedFilesCount = Object.values(subArtworksMap).flatMap(arr => arr).filter(f => f.status === 'UPLOADED').length;

            return (
              <div key={so.code} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{so.code}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: hasPo ? '#DCFCE7' : '#FEF3C7', color: hasPo ? '#15803D' : '#B45309', border: hasPo ? '1px solid #86EFAC' : '1px solid #FCD34D' }}>
                      {hasPo ? 'PO Generated' : 'PO Not Generated'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>{so.mfgName}</h3>

                  <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    <div>Product Lines: <strong style={{ color: '#0F172A' }}>{so.productsCount} {so.productsCount > 1 ? 'Products' : 'Product'}</strong></div>
                    <div>Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{so.totalQuantity.toLocaleString()} Units</strong></div>
                    <div>Order Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{so.orderValue.toLocaleString()}</strong></div>
                    <div>Delivery Schedule: <strong style={{ color: '#1D4ED8' }}>{so.leadTimeDays} Days</strong></div>
                  </div>
                </div>

                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSelectedSubOrderCode(so.code);
                      setViewMode('SUB_ORDER_DETAIL');
                    }}
                    style={{ padding: '6px 12px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    View Sub-Order →
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setActivePoModalSubOrderCode(so.code);
                    }}
                    style={{ padding: '6px 12px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Eye size={13} /> View PO
                  </button>

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.ai,.cdr,.png,.jpg,.jpeg"
                    id={`sub_card_art_input_${so.code}`}
                    onChange={(e) => {
                      const prodKey = so.lines?.[0]?.productName || so.lines?.[0]?.id || 'Paracetamol 500mg Tablets';
                      handleAddFilesForSubOrder(so.code, prodKey, e.target.files);
                      setActiveArtworkModalSubOrderCode(so.code);
                    }}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor={`sub_card_art_input_${so.code}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveArtworkModalSubOrderCode(so.code);
                    }}
                    style={{ 
                      padding: '6px 12px', borderRadius: 6,
                      background: uploadedFilesCount > 0 ? '#DCFCE7' : '#F0FDF4',
                      border: uploadedFilesCount > 0 ? '1px solid #86EFAC' : '1px solid #86EFAC',
                      color: uploadedFilesCount > 0 ? '#15803D' : '#15803D',
                      fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                    }}
                  >
                    {uploadedFilesCount > 0 ? (
                      <>
                        <CheckCircle2 size={13} style={{ color: '#16A34A' }} /> Uploaded ({uploadedFilesCount} Files) ✓
                      </>
                    ) : (
                      <>
                        <Upload size={13} /> Upload Artwork
                      </>
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Purchase Orders Section Bar below Sub-Orders */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>
              PURCHASE ORDERS ENGINE
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>
              Create and manage manufacturer-specific Purchase Orders. ({poCreatedCount} / 2 Created)
            </div>
          </div>

          <button onClick={() => setViewMode('PO_CREATION_LIST')} style={{ padding: '9px 20px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {poCreatedCount > 0 ? 'View Purchase Orders →' : 'Create Purchase Orders →'}
          </button>
        </div>

        {renderModals()}
      </div>
    );
  }

  // ── 8. SPLIT SUCCESS CONFIRMATION SCREEN (`viewMode === 'SPLIT_SUCCESS'`) ──
  if (viewMode === 'SPLIT_SUCCESS') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Success Banner */}
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: 24, boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#15803D', letterSpacing: '0.06em' }}>ORDER SPLIT SUCCESSFULLY</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#166534' }}>
                Master Order MO-2026-1001 Split Complete
              </h2>
            </div>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: 13.5, color: '#166534', fontWeight: 500 }}>
            2 manufacturer-specific Sub-Orders have been created successfully from Master Order <strong style={{ fontFamily: 'monospace' }}>MO-2026-1001</strong>.
          </p>
        </div>

        {/* Created Sub-Orders Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #86EFAC', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>✓ SO-1001-01</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>Open</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>SunBio LifeSciences Ltd.</h3>
            <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Product Lines: <strong>2 Product Lines</strong></div>
              <div>Total Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>12,000 Units</strong></div>
              <div>Order Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹1,95,300</strong></div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #86EFAC', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>✓ SO-1001-02</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>Open</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>Cipla Partner Formulations Ltd.</h3>
            <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Product Lines: <strong>1 Product Line</strong></div>
              <div>Total Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>5,000 Units</strong></div>
              <div>Order Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹57,500</strong></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <button onClick={() => setViewMode('DETAILS')} style={{ padding: '9px 18px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Back to Master Order
          </button>

          <button onClick={() => setViewMode('SUB_ORDERS_LIST')} style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            View Sub-Orders →
          </button>
        </div>

      </div>
    );
  }

  // ── 9. ORDER SPLITTING PREVIEW VIEW (`viewMode === 'SPLIT_PREVIEW'`) ──
  if (viewMode === 'SPLIT_PREVIEW' && activeMasterOrder) {
    const splitGroups = [
      {
        subOrderNumber: 'SO-1001-01',
        manufacturerName: 'SunBio LifeSciences Ltd.',
        mfgCode: 'SUN-PHARM',
        productsCount: 2,
        totalQuantity: 12000,
        totalValue: 195300,
        leadTimeDays: 14,
        products: ['Paracetamol 500mg Tablets (10,000)', 'Azithromycin 500mg Tablets (2,000)']
      },
      {
        subOrderNumber: 'SO-1001-02',
        manufacturerName: 'Cipla Partner Formulations Ltd.',
        mfgCode: 'CIPLA-PARTNER',
        productsCount: 1,
        totalQuantity: 5000,
        totalValue: 57500,
        leadTimeDays: 10,
        products: ['Amoxicillin 250mg Tablets (5,000)']
      }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Header Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>AUTOMATED SOURCING SPLIT</div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Order Splitting Preview
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              The Master Order <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>MO-2026-1001</strong> will be automatically split into manufacturer-specific Sub-Orders.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewMode('DETAILS')} style={{ padding: '8px 16px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              Back
            </button>
            <button onClick={handleExecuteSplitOrders} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Create Sub-Orders →
            </button>
          </div>
        </div>

        {/* Split Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {splitGroups.map((group, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{group.subOrderNumber}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                    Ready to Create
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>{group.manufacturerName}</h3>

                <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                  <div>Product Lines: <strong style={{ color: '#0F172A' }}>{group.productsCount} Product Lines</strong></div>
                  <div>Total Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{group.totalQuantity.toLocaleString()} Units</strong></div>
                  <div>Order Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{group.totalValue.toLocaleString()}</strong></div>
                  <div>Delivery Schedule: <strong style={{ color: '#1D4ED8' }}>{group.leadTimeDays} Days</strong></div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9', fontSize: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Assigned Products</div>
                  {group.products.map((p, pIdx) => (
                    <div key={pIdx} style={{ color: '#334155', fontWeight: 600 }}>• {p}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18, boxShadow: '0 10px 30px rgba(15,23,42,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E' }}>
            {subOrdersDataset.length} Sub-Orders will be created from Master Order MO-2026-1001
          </div>
          <button onClick={handleExecuteSplitOrders} style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Create Sub-Orders →
          </button>
        </div>

      </div>
    );
  }

  // ── 10. MASTER ORDER DETAILS VIEW (`viewMode === 'DETAILS'`) ─────────
  if (viewMode === 'DETAILS' && activeMasterOrder) {
    const orderNumberStr = activeMasterOrder.orderNumber || 'MO-2026-5361';
    const customerNameStr = activeMasterOrder.customerName || 'Apex Pharma PCD Franchise';
    const masterTotalVal = subOrdersDataset.reduce((sum, s) => sum + s.orderValue, 0);

    const allMasterLineItems = subOrdersDataset.flatMap(so =>
      so.lines.map(l => ({
        ...l,
        subCode: so.code,
        poCode: so.poCode || `PO-2026-${so.code.replace('SO-', '')}`,
        mfgName: so.mfgName
      }))
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>

        {/* Breadcrumb & Command Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Navigation Bar: Back Button & Breadcrumbs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button
              onClick={() => setViewMode('LIST')}
              style={{
                padding: '6px 14px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1',
                color: '#0F766E', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              <ArrowLeft size={14} /> Back to Order Management
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
              <span>FactoryGrid</span>
              <span>/</span>
              <span>buyer</span>
              <span>/</span>
              <span>Orders</span>
              <span>/</span>
              <span style={{ cursor: 'pointer', color: '#0F766E', fontWeight: 600 }} onClick={() => setViewMode('LIST')}>Master Orders</span>
              <span>/</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{orderNumberStr}</span>
            </div>
          </div>

          {/* Title & Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Master Order {orderNumberStr}
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                Customer: <strong style={{ color: '#0F172A' }}>{customerNameStr}</strong> · Source Quote: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>QUOTE-1001</strong> · Sub-Orders: <strong style={{ color: '#0F766E' }}>{subOrdersDataset.length} Created</strong> · POs: <strong style={{ color: '#0F766E' }}>{subOrdersDataset.length} / {subOrdersDataset.length} Created</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Master Order Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Order Number</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{orderNumberStr}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{customerNameStr}</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Source Quote</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>QUOTE-1001</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Approved on 14 Aug 2026</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Master Order Status</div>
            <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', display: 'inline-block', marginTop: 4 }}>
              {activeMasterOrder.status || 'OPEN'}
            </span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Orders & POs</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{subOrdersDataset.length} Sub-Orders</div>
            <div style={{ fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: 700 }}>{subOrdersDataset.length} / {subOrdersDataset.length} POs Created</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #0F766E', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>Total Order Value</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>₹{masterTotalVal.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>Expected Delivery: 2026-09-02</div>
          </div>
        </div>

        {/* Manufacturer Sub-Order Cards Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Sub-Orders & Purchase Orders Hierarchy</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#F1F5F9', color: '#0F766E', border: '1px solid #CBD5E1' }}>
              {subOrdersDataset.length} Sub-Orders
            </span>
          </div>

          {subOrdersDataset.map((so) => {
            const isCollapsed = !!collapsedSubOrders[so.code];
            const subCode = so.code;
            const poCode = so.poCode || `PO-2026-${so.code.replace('SO-', '')}`;
            const poObj = createdPos[subCode] || null;
            const subArtworksMap = productArtworksStore[subCode] || {};
            const uploadedFilesCount = Object.values(subArtworksMap).flatMap(arr => arr).filter(f => f.status === 'UPLOADED').length;

            const totalSubUnits = so.lines.reduce((acc, l) => acc + l.quantity, 0);
            const totalSubCost = so.lines.reduce((acc, l) => acc + l.totalCost, 0);

            return (
              <div
                key={so.code}
                style={{
                  background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(15,23,42,0.04)'
                }}
              >
                {/* Sub-Order Card Header (Clickable Expand/Collapse) */}
                <div
                  onClick={() => toggleSubOrderCollapse(so.code)}
                  style={{
                    padding: '16px 20px', background: '#F8FAFC', borderBottom: isCollapsed ? 'none' : '1px solid #E2E8F0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, cursor: 'pointer'
                  }}
                >
                  
                  {/* Left: Sub-Order Code, Manufacturer, Linked PO Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div
                      style={{ color: '#64748B', display: 'flex', alignItems: 'center' }}
                      title={isCollapsed ? "Expand Sub-Order Details" : "Collapse Sub-Order Details"}
                    >
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {so.code}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                          {so.status || 'Assigned'}
                        </span>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #BFDBFE', fontFamily: 'monospace' }}>
                          PO: {poCode}
                        </span>
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {so.mfgName}
                        <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>• WHO-GMP Verified ✓</span>
                      </div>

                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        {so.lines.length} {so.lines.length === 1 ? 'Product Line' : 'Product Lines'} · <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{totalSubUnits.toLocaleString()} Units</strong> · Total: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{totalSubCost.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions Area (View PO, Artwork) - StopPropagation on actions */}
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActivePoModalSubOrderCode(so.code);
                      }}
                      style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                    >
                      <Eye size={13} /> View PO
                    </button>

                    {/* Sub-Order Level Artwork Action */}
                    {uploadedFilesCount > 0 ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveArtworkModalSubOrderCode(so.code);
                          }}
                          style={{
                            fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 6,
                            background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC',
                            display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', whiteSpace: 'nowrap'
                          }}
                          title="Click to view uploaded artwork files"
                        >
                          <CheckCircle2 size={13} style={{ color: '#16A34A' }} /> Artwork Uploaded ({uploadedFilesCount} {uploadedFilesCount === 1 ? 'File' : 'Files'}) ✓
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const firstProdKey = so.lines?.[0]?.id || so.lines?.[0]?.productName || 'Paracetamol 500mg Tablets';
                            setReplaceConfirmTarget({ subCode: so.code, prodKey: firstProdKey });
                          }}
                          style={{
                            padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                            background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8',
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
                          }}
                          title="Replace uploaded artwork set"
                        >
                          <RefreshCw size={12} /> Replace Artwork
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveArtworkModalSubOrderCode(so.code);
                        }}
                        style={{
                          padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                          background: '#F0FDF4', border: '1px solid #86EFAC', color: '#15803D',
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
                        }}
                      >
                        <Upload size={13} /> Upload Artwork
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Order Products Table */}
                {!isCollapsed && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT</th>
                          <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                          <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                          <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                          <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DELIVERY</th>
                          <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right' }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {so.lines.map((line, lineIdx) => (
                          <tr key={lineIdx} style={{ borderBottom: lineIdx === so.lines.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>{line.productName}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</td>
                            <td style={{ padding: '12px 16px' }}>₹{line.unitPrice.toFixed(2)}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>₹{line.totalCost.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1D4ED8' }}>{line.leadTime || '14 Days'}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>Assigned</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {renderModals()}
      </div>
    );
  }

  // ── 11. DEFAULT VIEWMODE: LIST OF MASTER ORDERS ──────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>

      {/* Header Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>ORDER ENGINE / SOURCING CONSOLE</div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            MASTER ORDERS & SPLITTING
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Master orders created from approved customer quotations and split into manufacturer sub-orders.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search by Order Number, Customer, Quote Number, Manufacturer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
          />
        </div>

      </div>

      {/* Master Orders Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filteredOrders.map(ord => (
          <div
            key={ord.id}
            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#0F766E'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>MO-2026-1001</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                  {masterPoStatus}
                </span>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>{ord.customerName}</h3>

              <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                <div>Source Quote: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>QUOTE-1001</strong></div>
                <div>Product Lines: <strong style={{ color: '#0F172A' }}>4 Product Lines</strong></div>
                <div>Sub-Orders: <strong style={{ color: '#0F766E' }}>3 Sub-Orders Created</strong></div>
                <div>Purchase Orders: <strong style={{ color: '#0F766E' }}>3 / 3 POs Created</strong></div>
                <div>Total Order Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹2,97,800</strong></div>
              </div>
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSelectedOrderId(ord.id);
                  setViewMode('DETAILS');
                }}
                style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                View Order →
              </button>
            </div>
          </div>
        ))}
      </div>

      {renderModals()}
    </div>
  );
};
