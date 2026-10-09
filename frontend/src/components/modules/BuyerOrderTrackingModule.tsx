import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ViewModeToggle } from '../common/ViewModeToggle';
import {
  ShoppingBag, CheckCircle2, Clock, Truck, FileText, Download, 
  Package, ChevronRight, Eye, AlertCircle, ShieldCheck, X, Search, Filter,
  ArrowLeft, ArrowRight, Building2, Calendar, DollarSign, Receipt, Check, FileCheck, Layers, AlertTriangle, Upload, File, Star
} from 'lucide-react';
import { MasterOrder, Invoice } from '../../types';
import { UNIFIED_STORAGE_KEY } from './ProductionExecutionModule';
import { RaiseQaModal, getStoredQaRequests } from './RaiseQaModal';
import { AdvancePaymentSection } from '../common/AdvancePaymentSection';

interface BuyerOrderTrackingModuleProps {
  initialViewMode?: 'ORDERS_LIST' | 'TRACKING_DETAIL';
}

export const BuyerOrderTrackingModule: React.FC<BuyerOrderTrackingModuleProps> = ({ initialViewMode = 'ORDERS_LIST' }) => {
  const { orders, invoices, addAuditLog, currentRole } = useApp();
  const [viewMode, setViewMode] = useState<'ORDERS_LIST' | 'TRACKING_DETAIL' | 'HISTORY_DETAIL'>(initialViewMode);
  const [displayMode, setDisplayMode] = useState<'TABLE' | 'CARD'>('TABLE');
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(orders[0] || null);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<MasterOrder | null>(null);

  // Filters & Search State for Buyer Orders
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // View Invoice Modal State
  const [targetInvoiceModal, setTargetInvoiceModal] = useState<Invoice | null>(null);

  // Success Toast Banner State
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // QA Query Modal State
  const [isQaModalOpen, setIsQaModalOpen] = useState(false);
  const [qaModalContext, setQaModalContext] = useState<{
    contextType: 'ORDER' | 'SUB_ORDER' | 'PO' | 'PRODUCT' | 'RFQ' | 'GENERAL';
    contextNumber: string;
    productName?: string;
    manufacturerName?: string;
  }>({
    contextType: 'ORDER',
    contextNumber: 'MO-2026-1001'
  });

  // Goods Received Modal State
  const [goodsReceivedContext, setGoodsReceivedContext] = useState<{
    subCode: string;
    masterOrder: MasterOrder;
    subOrder: any;
    shipment: any;
  } | null>(null);

  const [receivedQtyInput, setReceivedQtyInput] = useState<number>(0);
  const [damagedQtyInput, setDamagedQtyInput] = useState<number>(0);
  const [receivedDateInput, setReceivedDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [conditionInput, setConditionInput] = useState<string>('Good / Accepted');
  const [receivingRemarksInput, setReceivingRemarksInput] = useState<string>('All cartons received in good condition.');
  const [grnFile, setGrnFile] = useState<File | null>(null);
  const [grnFormError, setGrnFormError] = useState<string | null>(null);

  const handleOpenGoodsReceivedModal = (subCode: string, masterOrder: MasterOrder, subOrder: any, shipment: any) => {
    const totalQty = subOrder.totalQuantity || shipment.totalQuantity || 12000;
    setGoodsReceivedContext({ subCode, masterOrder, subOrder, shipment });
    setReceivedQtyInput(totalQty);
    setDamagedQtyInput(0);
    setReceivedDateInput(new Date().toISOString().split('T')[0]);
    setConditionInput('Good / Accepted');
    setReceivingRemarksInput('All cartons received in good condition and verified at warehouse.');
    setGrnFile(null);
    setGrnFormError(null);
  };

  const handleConfirmGoodsReceivedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGrnFormError(null);

    if (!goodsReceivedContext) return;

    const { subCode, shipment } = goodsReceivedContext;
    const orderedQty = goodsReceivedContext.subOrder.totalQuantity || shipment.totalQuantity || 12000;
    const deliveredQty = shipment.podDetails?.deliveredQuantity || orderedQty;

    // Ensure shipment status is Delivered or POD Confirmed
    if (shipment.shipmentStatus !== 'DELIVERED' && shipment.shipmentStatus !== 'POD_CONFIRMED' && shipment.shipmentStatus !== 'CLOSED') {
      setGrnFormError('Goods Received confirmation is not allowed until shipment has reached Delivered or POD Confirmed state.');
      return;
    }

    if (receivedQtyInput < 0 || receivedQtyInput > deliveredQty) {
      setGrnFormError(`Received Quantity (${receivedQtyInput.toLocaleString()}) cannot exceed Delivered Quantity (${deliveredQty.toLocaleString()}).`);
      return;
    }

    if (damagedQtyInput < 0 || damagedQtyInput > receivedQtyInput) {
      setGrnFormError(`Damaged quantity cannot exceed received quantity.`);
      return;
    }

    if (receivedQtyInput < deliveredQty && (!receivingRemarksInput || receivingRemarksInput.trim().length === 0)) {
      setGrnFormError('Remarks are required when received quantity is less than delivered quantity.');
      return;
    }

    if ((conditionInput === 'Damaged' || conditionInput === 'Short Quantity') && (!receivingRemarksInput || receivingRemarksInput.trim().length === 0)) {
      setGrnFormError(`Remarks are required when condition is selected as ${conditionInput}.`);
      return;
    }

    const missingQty = Math.max(orderedQty - receivedQtyInput, 0);

    let receiptStatus: 'FULLY_RECEIVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED_WITH_ISSUES' = 'FULLY_RECEIVED';
    if (receivedQtyInput < orderedQty) {
      receiptStatus = 'PARTIALLY_RECEIVED';
    } else if (damagedQtyInput > 0 || conditionInput === 'Damaged') {
      receiptStatus = 'RECEIVED_WITH_ISSUES';
    }

    const timeStr = receivedDateInput || new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    const newStore = {
      ...subOrdersStore,
      [subCode]: {
        ...subOrdersStore[subCode],
        shipment: {
          ...shipment,
          goodsReceipt: {
            status: receiptStatus,
            receivedQuantity: receivedQtyInput,
            damagedQuantity: damagedQtyInput,
            missingQuantity: missingQty,
            condition: conditionInput,
            receivingRemarks: receivingRemarksInput || 'All cartons received and verified at warehouse.',
            receivedDate: timeStr,
            receivedBy: 'Buyer / Warehouse User',
            grnDocumentName: grnFile ? grnFile.name : 'GRN_RECEIPT_VERIFIED.pdf'
          }
        }
      }
    };

    setSubOrdersStore(newStore);
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(newStore));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }

    addAuditLog('Goods Receipt', `Buyer confirmed Goods Receipt for Sub-Order ${subCode}. Status: ${receiptStatus}. Received: ${receivedQtyInput} units, Missing: ${missingQty} units.`);
    
    setGoodsReceivedContext(null);
    setSuccessBanner(`✓ Goods Received successfully confirmed for Sub-Order ${subCode}.`);
  };

  // Dynamic Sub-Orders Store Synced with AppContext Master Orders
  const syncSubOrdersWithContext = (saved: any) => {
    const store: Record<string, any> = { ...(saved || {}) };

    store['SO-2026-5228-01'] = {
      subOrderNumber: 'SO-2026-5228-01',
      poNumber: 'PO-SO-2026-5228-01',
      masterOrderNumber: 'MO-2026-5228',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Azithromycin 500mg Tablets',
      totalQuantity: 2000,
      orderValue: 26880,
      requiredDeliveryDate: '2026-08-28',
      productionStatus: 'COMPLETED',
      category: 'DELIVERED',
      batchNumber: 'BATCH-2026-8801',
      manufacturingLine: 'Line A - Solid Oral Dosages',
      plannedStartDate: '2026-08-20',
      expectedCompletionDate: '2026-08-24',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5228-01',
        trackingNumber: 'TRK-COL-88963',
        subOrderNumber: 'SO-2026-5228-01',
        masterOrderNumber: 'MO-2026-5228',
        poNumber: 'PO-SO-2026-5228-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd',
        productName: 'Azithromycin 500mg Tablets',
        totalQuantity: 2000,
        transporterName: 'ColdEx Logistics',
        vehicleNumber: 'HP 12 B 8801',
        driverName: 'Gurpreet Singh',
        driverPhone: '+91 98765 00112',
        dispatchDate: '2026-08-25',
        expectedDeliveryDate: '2026-08-28',
        actualDeliveryDate: '2026-08-28',
        shipmentStatus: 'DELIVERED',
        podStatus: 'CONFIRMED',
        temperatureStatus: 'Normal / Compliant (2°C - 8°C)',
        currentTemp: '4.2°C',
        demoGpsLocation: 'Consignee Warehouse - New Delhi',
        podReceiverName: 'Buyer Warehouse Manager',
        podDeliveryDate: '2026-08-28',
        podRemarks: 'All cartons received in good condition and verified at warehouse.',
        podDocName: 'POD_STAMP_SIGNED_SO-2026-5228-01.pdf',
        goodsReceipt: {
          status: 'FULLY_RECEIVED',
          receivedQuantity: 2000,
          damagedQuantity: 0,
          missingQuantity: 0,
          condition: 'Good / Accepted',
          receivingRemarks: 'All cartons received in good condition and verified at warehouse.',
          receivedDate: '2026-08-28',
          receivedBy: 'Buyer Warehouse Manager'
        },
        activityHistory: [
          { id: 'act_5228_1_3', timestamp: '28 Aug 04:30 PM', eventTitle: 'POD Verified & Delivered', actor: 'Buyer Warehouse Manager', details: 'Confirmed 2,000 units received in pristine cold chain condition.' },
          { id: 'act_5228_1_2', timestamp: '27 Aug 11:00 AM', eventTitle: 'Arrived at Destination Hub', actor: 'ColdEx Logistics', details: 'Arrived at New Delhi Distribution Hub.' },
          { id: 'act_5228_1_1', timestamp: '25 Aug 09:30 AM', eventTitle: 'Shipment Dispatched', actor: 'SunBio LifeSciences Ltd', details: 'Dispatched via ColdEx Logistics (Vehicle: HP 12 B 8801, AWB: TRK-COL-88963)' }
        ]
      }
    };

    store['SO-2026-5228-02'] = {
      subOrderNumber: 'SO-2026-5228-02',
      poNumber: 'PO-SO-2026-5228-02',
      masterOrderNumber: 'MO-2026-5228',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'Cipla Partner Formulations Ltd',
      productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules',
      totalQuantity: 3000,
      orderValue: 48720,
      requiredDeliveryDate: '2026-09-01',
      productionStatus: 'COMPLETED',
      category: 'IN_TRANSIT',
      batchNumber: 'BATCH-2026-8802',
      manufacturingLine: 'Line B - Capsule Encapsulation',
      plannedStartDate: '2026-08-21',
      expectedCompletionDate: '2026-08-26',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5228-02',
        trackingNumber: 'TRK-BLU-77421',
        subOrderNumber: 'SO-2026-5228-02',
        masterOrderNumber: 'MO-2026-5228',
        poNumber: 'PO-SO-2026-5228-02',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'Cipla Partner Formulations Ltd',
        productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules',
        totalQuantity: 3000,
        transporterName: 'BlueDart Express',
        vehicleNumber: 'DL 01 CD 7742',
        driverName: 'Vikram Singh',
        driverPhone: '+91 98112 77421',
        dispatchDate: '2026-08-27',
        expectedDeliveryDate: '2026-09-01',
        shipmentStatus: 'IN_TRANSIT',
        podStatus: 'PENDING',
        temperatureStatus: 'Normal / Compliant (15°C - 25°C)',
        currentTemp: '21.5°C',
        demoGpsLocation: 'Delhi Distribution Hub - En Route',
        activityHistory: [
          { id: 'act_5228_2_2', timestamp: '27 Aug 02:15 PM', eventTitle: 'In Transit - En Route', actor: 'BlueDart Express', details: 'Shipment departed Delhi Distribution Hub.' },
          { id: 'act_5228_2_1', timestamp: '27 Aug 09:00 AM', eventTitle: 'Shipment Dispatched', actor: 'Cipla Partner Formulations Ltd', details: 'Dispatched via BlueDart Express (Vehicle: DL 01 CD 7742, AWB: TRK-BLU-77421)' }
        ]
      }
    };

    store['SO-2026-5229-01'] = {
      subOrderNumber: 'SO-2026-5229-01',
      poNumber: 'PO-SO-2026-5229-01',
      masterOrderNumber: 'MO-2026-5229',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Paracetamol 650mg ER Tablets',
      totalQuantity: 10000,
      orderValue: 128800,
      requiredDeliveryDate: '2026-08-25',
      productionStatus: 'COMPLETED',
      category: 'DELIVERED',
      batchNumber: 'BATCH-2026-5229',
      manufacturingLine: 'Line A - Solid Oral Dosages',
      plannedStartDate: '2026-08-14',
      expectedCompletionDate: '2026-08-20',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5229-01',
        trackingNumber: 'TRK-SAF-99412',
        subOrderNumber: 'SO-2026-5229-01',
        masterOrderNumber: 'MO-2026-5229',
        poNumber: 'PO-SO-2026-5229-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd',
        productName: 'Paracetamol 650mg ER Tablets',
        totalQuantity: 10000,
        transporterName: 'Safexpress Cold Fleet',
        vehicleNumber: 'HP 12 B 9941',
        driverName: 'Ramesh Verma',
        driverPhone: '+91 98765 99412',
        dispatchDate: '2026-08-20',
        expectedDeliveryDate: '2026-08-25',
        actualDeliveryDate: '2026-08-25',
        shipmentStatus: 'DELIVERED',
        podStatus: 'CONFIRMED',
        temperatureStatus: 'Normal / Compliant (15°C - 25°C)',
        currentTemp: '20.1°C',
        demoGpsLocation: 'Apex Central Warehouse New Delhi',
        podReceiverName: 'Warehouse Stores Manager',
        podDeliveryDate: '2026-08-25',
        podRemarks: 'Delivered in good condition and stock logged.',
        podDocName: 'POD_STAMP_SIGNED_SO-2026-5229-01.pdf',
        activityHistory: [
          { id: 'act_5229_1_2', timestamp: '25 Aug 03:00 PM', eventTitle: 'Delivered & Verified', actor: 'Safexpress Cold Fleet', details: 'Delivered to Apex Central Warehouse.' },
          { id: 'act_5229_1_1', timestamp: '20 Aug 10:00 AM', eventTitle: 'Shipment Dispatched', actor: 'SunBio LifeSciences Ltd', details: 'Dispatched via Safexpress Cold Fleet (Vehicle: HP 12 B 9941, AWB: TRK-SAF-99412)' }
        ]
      }
    };

    store['SO-2026-5230-01'] = {
      subOrderNumber: 'SO-2026-5230-01',
      poNumber: 'PO-SO-2026-5230-01',
      masterOrderNumber: 'MO-2026-5230',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Amoxyclav 625mg Tablets',
      totalQuantity: 5000,
      orderValue: 252000,
      requiredDeliveryDate: '2026-09-05',
      productionStatus: 'IN_PRODUCTION',
      category: 'IN_PRODUCTION',
      batchNumber: 'BATCH-2026-5230',
      manufacturingLine: 'Line A - Solid Oral Dosages',
      plannedStartDate: '2026-08-18',
      expectedCompletionDate: '2026-09-05',
      progressPercent: 70,
      shipment: null
    };

    store['SO-2026-5231-01'] = {
      subOrderNumber: 'SO-2026-5231-01',
      poNumber: 'PO-SO-2026-5231-01',
      masterOrderNumber: 'MO-2026-5231',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'Cipla Partner Formulations Ltd',
      productName: 'Ciprofloxacin 500mg Tablets',
      totalQuantity: 8000,
      orderValue: 161280,
      requiredDeliveryDate: '2026-08-30',
      productionStatus: 'READY_TO_DISPATCH',
      category: 'READY_TO_DISPATCH',
      batchNumber: 'BATCH-2026-5231',
      manufacturingLine: 'Line B - High Speed Tablet Press',
      plannedStartDate: '2026-08-18',
      expectedCompletionDate: '2026-08-26',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5231-01',
        trackingNumber: 'TRK-BD-9940128',
        subOrderNumber: 'SO-2026-5231-01',
        masterOrderNumber: 'MO-2026-5231',
        poNumber: 'PO-SO-2026-5231-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'Cipla Partner Formulations Ltd',
        productName: 'Ciprofloxacin 500mg Tablets',
        totalQuantity: 8000,
        transporterName: 'BlueDart Surface',
        vehicleNumber: 'DL 01 CD 9940',
        driverName: 'Sanjay Kumar',
        driverPhone: '+91 98112 99401',
        dispatchDate: '2026-08-26',
        expectedDeliveryDate: '2026-08-30',
        shipmentStatus: 'DISPATCHED',
        podStatus: 'PENDING',
        temperatureStatus: 'Normal / Compliant (15°C - 25°C)',
        currentTemp: '22.0°C',
        demoGpsLocation: 'Cipla Logistics Bay - Baddi',
        activityHistory: [
          { id: 'act_5231_1_1', timestamp: '26 Aug 05:00 PM', eventTitle: 'Shipment Dispatched', actor: 'Cipla Partner Formulations Ltd', details: 'Dispatched via BlueDart Surface (Vehicle: DL 01 CD 9940, AWB: TRK-BD-9940128)' }
        ]
      }
    };

    store['SO-2026-5232-01'] = {
      subOrderNumber: 'SO-2026-5232-01',
      poNumber: 'PO-SO-2026-5232-01',
      masterOrderNumber: 'MO-2026-5232',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Ceftriaxone 1g Injection',
      totalQuantity: 1200,
      orderValue: 114240,
      requiredDeliveryDate: '2026-08-27',
      productionStatus: 'COMPLETED',
      category: 'PENDING_RECEIPT',
      batchNumber: 'BATCH-2026-5232',
      manufacturingLine: 'Line C - Sterile Liquid Injectables',
      plannedStartDate: '2026-08-16',
      expectedCompletionDate: '2026-08-22',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5232-01',
        trackingNumber: 'TRK-TCI-88102',
        subOrderNumber: 'SO-2026-5232-01',
        masterOrderNumber: 'MO-2026-5232',
        poNumber: 'PO-SO-2026-5232-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd',
        productName: 'Ceftriaxone 1g Injection',
        totalQuantity: 1200,
        transporterName: 'TCI Express',
        vehicleNumber: 'HP 12 B 8810',
        driverName: 'Harpreet Singh',
        driverPhone: '+91 98765 88102',
        dispatchDate: '2026-08-23',
        expectedDeliveryDate: '2026-08-27',
        actualDeliveryDate: '2026-08-27',
        shipmentStatus: 'POD_CONFIRMED',
        podStatus: 'CONFIRMED',
        temperatureStatus: 'Normal / Compliant (2°C - 8°C)',
        currentTemp: '4.5°C',
        demoGpsLocation: 'Consignee Receiving Bay - New Delhi',
        podReceiverName: 'Receiving Dock Officer',
        podDeliveryDate: '2026-08-27',
        podRemarks: 'Delivered. Awaiting buyer GRN log entry.',
        podDocName: 'POD_STAMP_SIGNED_SO-2026-5232-01.pdf',
        activityHistory: [
          { id: 'act_5232_1_2', timestamp: '27 Aug 02:00 PM', eventTitle: 'POD Confirmed', actor: 'TCI Express', details: 'Delivered at Consignee Receiving Bay.' },
          { id: 'act_5232_1_1', timestamp: '23 Aug 11:00 AM', eventTitle: 'Shipment Dispatched', actor: 'SunBio LifeSciences Ltd', details: 'Dispatched via TCI Express (Vehicle: HP 12 B 8810, AWB: TRK-TCI-88102)' }
        ]
      }
    };

    store['SO-2026-5233-01'] = {
      subOrderNumber: 'SO-2026-5233-01',
      poNumber: 'PO-SO-2026-5233-01',
      masterOrderNumber: 'MO-2026-5233',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'Cipla Partner Formulations Ltd',
      productName: 'Metformin 500mg SR Tablets',
      totalQuantity: 20000,
      orderValue: 145600,
      requiredDeliveryDate: '2026-08-26',
      productionStatus: 'COMPLETED',
      category: 'GOODS_RECEIVED',
      batchNumber: 'BATCH-2026-5233',
      manufacturingLine: 'Line B - High Speed Tablet Press',
      plannedStartDate: '2026-08-12',
      expectedCompletionDate: '2026-08-20',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5233-01',
        trackingNumber: 'TRK-COL-99012',
        subOrderNumber: 'SO-2026-5233-01',
        masterOrderNumber: 'MO-2026-5233',
        poNumber: 'PO-SO-2026-5233-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'Cipla Partner Formulations Ltd',
        productName: 'Metformin 500mg SR Tablets',
        totalQuantity: 20000,
        transporterName: 'ColdEx Express Fleet',
        vehicleNumber: 'DL 01 CD 9901',
        driverName: 'Amit Kumar',
        driverPhone: '+91 98112 99012',
        dispatchDate: '2026-08-22',
        expectedDeliveryDate: '2026-08-26',
        actualDeliveryDate: '2026-08-26',
        shipmentStatus: 'CLOSED',
        podStatus: 'CONFIRMED',
        temperatureStatus: 'Normal / Compliant (15°C - 25°C)',
        currentTemp: '19.8°C',
        demoGpsLocation: 'Apex Central Warehouse New Delhi',
        podReceiverName: 'Apex Warehouse Lead',
        podDeliveryDate: '2026-08-26',
        podRemarks: 'Full shipment received and stock logged into ERP.',
        podDocName: 'POD_STAMP_SIGNED_SO-2026-5233-01.pdf',
        goodsReceipt: {
          status: 'FULLY_RECEIVED',
          receivedQuantity: 20000,
          damagedQuantity: 0,
          missingQuantity: 0,
          condition: 'Good / Accepted',
          receivingRemarks: 'Full shipment received and stock logged into ERP.',
          receivedDate: '2026-08-26',
          receivedBy: 'Apex Warehouse Lead'
        },
        activityHistory: [
          { id: 'act_5233_1_3', timestamp: '26 Aug 04:00 PM', eventTitle: 'Shipment Closed & Archived', actor: 'System', details: 'Goods receipt verified. Shipment closed.' },
          { id: 'act_5233_1_2', timestamp: '26 Aug 11:30 AM', eventTitle: 'Delivered', actor: 'ColdEx Express Fleet', details: 'Delivered at Apex Central Warehouse.' },
          { id: 'act_5233_1_1', timestamp: '22 Aug 09:00 AM', eventTitle: 'Shipment Dispatched', actor: 'Cipla Partner Formulations Ltd', details: 'Dispatched via ColdEx Express Fleet (Vehicle: DL 01 CD 9901, AWB: TRK-COL-99012)' }
        ]
      }
    };

    store['SO-2026-5234-01'] = {
      subOrderNumber: 'SO-2026-5234-01',
      poNumber: 'PO-SO-2026-5234-01',
      masterOrderNumber: 'MO-2026-5234',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Telmisartan 40mg Tablets',
      totalQuantity: 15000,
      orderValue: 154560,
      requiredDeliveryDate: '2026-08-24',
      productionStatus: 'COMPLETED',
      category: 'CLOSED',
      batchNumber: 'BATCH-2026-5234',
      manufacturingLine: 'Line A - Solid Oral Dosages',
      plannedStartDate: '2026-08-08',
      expectedCompletionDate: '2026-08-18',
      progressPercent: 100,
      shipment: {
        id: 'SHP-5234-01',
        trackingNumber: 'TRK-TCI-77129',
        subOrderNumber: 'SO-2026-5234-01',
        masterOrderNumber: 'MO-2026-5234',
        poNumber: 'PO-SO-2026-5234-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd',
        productName: 'Telmisartan 40mg Tablets',
        totalQuantity: 15000,
        transporterName: 'TCI Express Cold Fleet',
        vehicleNumber: 'HP 12 B 7712',
        driverName: 'Kuldeep Singh',
        driverPhone: '+91 98765 77129',
        dispatchDate: '2026-08-20',
        expectedDeliveryDate: '2026-08-24',
        actualDeliveryDate: '2026-08-24',
        shipmentStatus: 'CLOSED',
        podStatus: 'CONFIRMED',
        temperatureStatus: 'Normal / Compliant (15°C - 25°C)',
        currentTemp: '21.0°C',
        demoGpsLocation: 'Apex Central Warehouse New Delhi',
        podReceiverName: 'Apex Warehouse Manager',
        podDeliveryDate: '2026-08-24',
        podRemarks: 'Verified full quantity 15,000 units. Invoice paid.',
        podDocName: 'POD_STAMP_SIGNED_SO-2026-5234-01.pdf',
        goodsReceipt: {
          status: 'FULLY_RECEIVED',
          receivedQuantity: 15000,
          damagedQuantity: 0,
          missingQuantity: 0,
          condition: 'Good / Accepted',
          receivingRemarks: 'Verified full quantity 15,000 units. Invoice paid.',
          receivedDate: '2026-08-24',
          receivedBy: 'Apex Warehouse Manager'
        },
        activityHistory: [
          { id: 'act_5234_1_3', timestamp: '24 Aug 05:00 PM', eventTitle: 'Shipment Closed & Archived', actor: 'System', details: 'Lifecycle completed and archived.' },
          { id: 'act_5234_1_2', timestamp: '24 Aug 02:00 PM', eventTitle: 'Delivered', actor: 'TCI Express Cold Fleet', details: 'Delivered to Apex Central Warehouse.' },
          { id: 'act_5234_1_1', timestamp: '20 Aug 10:00 AM', eventTitle: 'Shipment Dispatched', actor: 'SunBio LifeSciences Ltd', details: 'Dispatched via TCI Express Cold Fleet (Vehicle: HP 12 B 7712, AWB: TRK-TCI-77129)' }
        ]
      }
    };

    store['SO-1001-01'] = {
      subOrderNumber: 'SO-1001-01',
      poNumber: 'PO-2026-1001-01',
      masterOrderNumber: 'MO-2026-1001',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Paracetamol 500mg & Azithromycin 500mg Tablets',
      totalQuantity: 12000,
      orderValue: 195300,
      productionStatus: 'READY_TO_DISPATCH',
      category: 'IN_TRANSIT',
      shipment: {
        id: 'SHP-COLD-5027',
        trackingNumber: 'BD502730757IN',
        subOrderNumber: 'SO-1001-01',
        masterOrderNumber: 'MO-2026-1001',
        poNumber: 'PO-2026-1001-01',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: 'SunBio LifeSciences Ltd',
        productName: 'Paracetamol 500mg & Azithromycin 500mg Tablets',
        totalQuantity: 12000,
        transporterName: 'ColdEx Logistics Telemetry Fleet',
        vehicleNumber: 'HP 12 B 9021',
        driverName: 'Gurpreet Singh',
        driverPhone: '+91 98765 00112',
        dispatchDate: '2026-08-18',
        expectedDeliveryDate: '2026-08-28',
        shipmentStatus: 'IN_TRANSIT',
        temperatureStatus: 'Normal / Compliant (2°C - 8°C)',
        currentTemp: '4.1°C',
        demoGpsLocation: 'NH44 Highway — En route to Consignee (Hyderabad Hub)',
        podStatus: 'PENDING',
        pickupRefNumber: 'PU-BD-88912',
        activityHistory: [
          { id: 'act_1', timestamp: '18 Aug 10:00 AM', eventTitle: 'Shipment Entered In Transit', actor: 'ColdEx Logistics Telemetry Fleet', details: 'Shipment BD502730757IN entered transit route via vehicle HP 12 B 9021' },
          { id: 'act_0', timestamp: '18 Aug 08:30 AM', eventTitle: 'Shipment Dispatched', actor: 'SunBio LifeSciences Ltd', details: 'Dispatched via ColdEx Logistics Telemetry Fleet (Vehicle: HP 12 B 9021, AWB: BD502730757IN)' }
        ]
      }
    };

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
                manufacturerName: so.manufacturerName || 'SunBio LifeSciences Ltd.',
                productName: so.lines?.[0]?.productName || 'Pharmaceutical Formulation Product',
                totalQuantity: so.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 10000,
                orderValue: so.totalAmount || 150000,
                requiredDeliveryDate: mo.expectedDeliveryDate || '2026-09-02',
                productionStatus: 'PO_ACCEPTED',
                batchNumber: '',
                shipment: null
              };
            }
          });
        }
      });
    }
    return store;
  };

  // Read Unified Store
  const [subOrdersStore, setSubOrdersStore] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      return syncSubOrdersWithContext(parsed);
    } catch (e) {
      console.error(e);
      return syncSubOrdersWithContext({});
    }
  });

  // Keep synced with localStorage & AppContext Orders
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        const merged = syncSubOrdersWithContext(parsed);
        setSubOrdersStore(merged);
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

    // Handler for Buyer Artwork Upload
  const handleUploadArtwork = (subCode: string, sampleFileName?: string) => {
    const fileName = sampleFileName || `${subCode}_Packaging_Artwork_v1.pdf`;
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const targetRec = subOrdersStore[subCode] || {};
    const updatedRec = {
      ...targetRec,
      subOrderNumber: subCode,
      artworkRequired: true,
      artworkStatus: 'ARTWORK_COMPLETED',
      artworkFile: {
        fileName,
        uploadedAt: nowStr,
        uploadedBy: 'Buyer Procurement Desk',
        fileSize: '3.8 MB'
      },
      deliveryScheduleFinalized: true
    };

    const newStore = {
      ...subOrdersStore,
      [subCode]: updatedRec
    };

    setSubOrdersStore(newStore);
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(newStore));
    } catch (e) {
      console.error(e);
    }

    setReplacingArtworkSubOrders(prev => ({ ...prev, [subCode]: false }));
    addAuditLog('Artwork Workflow', `Buyer uploaded artwork file ${fileName} for Sub-Order ${subCode}`);
    alert(`✔ Artwork Uploaded Successfully!\n\nSub-Order: ${subCode}\nArtwork File: ${fileName}\nStatus: Artwork Completed ✓\nDelivery Schedule: Finalized & Confirmed`);
  };

  // Centralized Sub-Order Status Categorization
  const getSubOrderDetailedStatus = (sub: any) => {
    const subCode = sub.subOrderNumber === 'SO-2026-1001-01' ? 'SO-1001-01' : sub.subOrderNumber;
    const storeRec = subOrdersStore[subCode] || sub;
    const shp = storeRec?.shipment;
    const prodSt = storeRec?.productionStatus || sub.status || 'PO_ACCEPTED';
    const explicitCat = storeRec?.category || sub?.category;

    const orderSt = storeRec?.status || sub?.status;
    if (orderSt === 'Awaiting Acceptance' || orderSt === 'AWAITING_ACCEPTANCE') {
      return { subCode, category: 'AWAITING', displayStatus: 'Awaiting Acceptance ⏳', badgeStyle: { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' } };
    }
    if (orderSt === 'Rejected' || storeRec?.status === 'Rejected') {
      return { subCode, category: 'REJECTED', displayStatus: 'Rejected ❌', badgeStyle: { bg: '#FEE2E2', border: '#FCA5A5', color: '#B91C1C' } };
    }

    if (storeRec?.artworkStatus === 'ARTWORK_PENDING' || (!storeRec?.artworkFile && storeRec?.artworkRequired !== false && prodSt === 'PO_ACCEPTED')) {
      return { subCode, category: 'ACTIVE', displayStatus: 'Artwork Pending 🎨', badgeStyle: { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' } };
    }

    if (explicitCat) {
      if (explicitCat === 'CLOSED' || explicitCat === 'COMPLETED') {
        return { subCode, category: 'CLOSED', displayStatus: 'Completed', badgeStyle: { bg: '#F1F5F9', border: '#CBD5E1', color: '#475569' } };
      }
      if (explicitCat === 'GOODS_RECEIVED') {
        return { subCode, category: 'GOODS_RECEIVED', displayStatus: 'Goods Received ✓', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
      }
      if (explicitCat === 'PENDING_RECEIPT' || explicitCat === 'PENDING_GOODS_RECEIPT') {
        return { subCode, category: 'PENDING_RECEIPT', displayStatus: 'Pending Goods Receipt', badgeStyle: { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' } };
      }
      if (explicitCat === 'DELIVERED') {
        return { subCode, category: 'DELIVERED', displayStatus: 'Delivered', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
      }
      if (explicitCat === 'IN_TRANSIT') {
        return { subCode, category: 'IN_TRANSIT', displayStatus: 'In Transit', badgeStyle: { bg: '#E0F2FE', border: '#BAE6FD', color: '#0369A1' } };
      }
      if (explicitCat === 'READY_TO_DISPATCH') {
        return { subCode, category: 'READY_TO_DISPATCH', displayStatus: 'Ready To Dispatch', badgeStyle: { bg: '#F3E8FF', border: '#E9D5FF', color: '#6B21A8' } };
      }
      if (explicitCat === 'IN_PRODUCTION') {
        return { subCode, category: 'IN_PRODUCTION', displayStatus: 'In Production', badgeStyle: { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' } };
      }
    }

    if (shp) {
      const shpSt = shp.shipmentStatus;
      const podSt = shp.podStatus;
      const gRec = shp.goodsReceipt;

      if (gRec || shpSt === 'CLOSED') {
        if (shpSt === 'CLOSED') {
          return { subCode, category: 'CLOSED', displayStatus: 'Completed', badgeStyle: { bg: '#F1F5F9', border: '#CBD5E1', color: '#475569' } };
        }
        return { subCode, category: 'GOODS_RECEIVED', displayStatus: 'Goods Received ✓', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
      }

      if (shpSt === 'DELIVERED' || shpSt === 'POD_CONFIRMED') {
        if (podSt === 'CONFIRMED' || shpSt === 'POD_CONFIRMED') {
          return { subCode, category: 'PENDING_RECEIPT', displayStatus: 'Pending Goods Receipt', badgeStyle: { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' } };
        }
        return { subCode, category: 'DELIVERED', displayStatus: 'Delivered', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
      }

      if (shpSt === 'IN_TRANSIT' || shpSt === 'OUT_FOR_DELIVERY' || shpSt === 'DISPATCHED') {
        return { subCode, category: 'IN_TRANSIT', displayStatus: 'In Transit', badgeStyle: { bg: '#E0F2FE', border: '#BAE6FD', color: '#0369A1' } };
      }
    }

    if (prodSt === 'READY_TO_DISPATCH' || prodSt === 'READY TO DISPATCH') {
      return { subCode, category: 'READY_TO_DISPATCH', displayStatus: 'Ready To Dispatch', badgeStyle: { bg: '#F3E8FF', border: '#E9D5FF', color: '#6B21A8' } };
    }

    if (prodSt === 'SCHEDULED' || prodSt === 'IN_PRODUCTION' || prodSt === 'IN PRODUCTION' || prodSt === 'QUALITY_INSPECTION' || prodSt === 'PACKAGING') {
      return { subCode, category: 'IN_PRODUCTION', displayStatus: 'In Production', badgeStyle: { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' } };
    }

    if (prodSt === 'DELIVERED') {
      return { subCode, category: 'DELIVERED', displayStatus: 'Delivered', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
    }
    if (prodSt === 'CLOSED' || prodSt === 'COMPLETED') {
      return { subCode, category: 'CLOSED', displayStatus: 'Completed', badgeStyle: { bg: '#F1F5F9', border: '#CBD5E1', color: '#475569' } };
    }
    if (prodSt === 'GOODS_RECEIVED') {
      return { subCode, category: 'GOODS_RECEIVED', displayStatus: 'Goods Received ✓', badgeStyle: { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' } };
    }

    return { subCode, category: 'ACTIVE', displayStatus: 'PO Accepted', badgeStyle: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' } };
  };

  // Calculate Master Order Overall Status dynamically from sub-orders
  const getMasterOrderStatus = (ord: MasterOrder): string => {
    if (ord.status === 'PENDING_ADMIN_APPROVAL') return 'PENDING ADMIN APPROVAL';
    if (ord.status === 'PENDING_ADVANCE') return 'PENDING ADVANCE';
    if (ord.status === 'CONFIRMED_RELEASED') {
      if (!ord.subOrders || ord.subOrders.length === 0) return 'CONFIRMED & RELEASED';
    }
    if (!ord.subOrders || ord.subOrders.length === 0) return ord.status || 'PO ACCEPTED';
    
    const subStatuses = ord.subOrders.map(sub => getSubOrderDetailedStatus(sub));
    const categories = subStatuses.map(s => s.category);

    if (categories.every(c => c === 'CLOSED')) return 'COMPLETED';
    if (categories.every(c => c === 'GOODS_RECEIVED' || c === 'CLOSED')) return 'GOODS RECEIVED';
    if (categories.every(c => c === 'DELIVERED' || c === 'PENDING_RECEIPT' || c === 'GOODS_RECEIVED' || c === 'CLOSED')) return 'DELIVERED';
    if (categories.some(c => c === 'IN_TRANSIT')) return 'IN TRANSIT';
    if (categories.some(c => c === 'READY_TO_DISPATCH')) return 'READY TO DISPATCH';
    if (categories.some(c => c === 'IN_PRODUCTION')) return 'IN PRODUCTION';
    if (categories.every(c => c === 'ACTIVE')) return 'PO ACCEPTED';
    
    return 'IN PROGRESS';
  };

  // Calculate Dynamic Status Counts for Filter Badges
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: 0,
      ACTIVE: 0,
      IN_PRODUCTION: 0,
      READY_TO_DISPATCH: 0,
      IN_TRANSIT: 0,
      DELIVERED: 0,
      PENDING_RECEIPT: 0,
      GOODS_RECEIVED: 0,
      CLOSED: 0,
    };

    orders.forEach(ord => {
      counts.ALL++;
      const subStatuses = (ord.subOrders || []).map(sub => getSubOrderDetailedStatus(sub));
      const categories = new Set(subStatuses.map(s => s.category));

      categories.forEach(cat => {
        if (counts[cat] !== undefined) {
          counts[cat]++;
        }
      });
    });

    return counts;
  }, [orders, subOrdersStore]);

  // Sub-Order Level Filtered Orders for Buyer
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const subDetails = (ord.subOrders || []).map(sub => getSubOrderDetailedStatus(sub));
      
      let matchesStatus = true;
      if (statusFilter === 'ALL') {
        matchesStatus = true;
      } else if (statusFilter === 'ACTIVE') {
        matchesStatus = subDetails.some(s => s.category === 'ACTIVE');
      } else if (statusFilter === 'IN_PRODUCTION') {
        matchesStatus = subDetails.some(s => s.category === 'IN_PRODUCTION');
      } else if (statusFilter === 'READY_TO_DISPATCH') {
        matchesStatus = subDetails.some(s => s.category === 'READY_TO_DISPATCH');
      } else if (statusFilter === 'IN_TRANSIT') {
        matchesStatus = subDetails.some(s => s.category === 'IN_TRANSIT');
      } else if (statusFilter === 'DELIVERED') {
        matchesStatus = subDetails.some(s => s.category === 'DELIVERED');
      } else if (statusFilter === 'PENDING_RECEIPT') {
        matchesStatus = subDetails.some(s => s.category === 'PENDING_RECEIPT');
      } else if (statusFilter === 'GOODS_RECEIVED') {
        matchesStatus = subDetails.some(s => s.category === 'GOODS_RECEIVED');
      } else if (statusFilter === 'CLOSED') {
        matchesStatus = subDetails.some(s => s.category === 'CLOSED');
      }

      const q = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (q) {
        const matchOrdNum = ord.orderNumber.toLowerCase().includes(q);
        const matchCust = ord.customerName.toLowerCase().includes(q);
        const matchMfg = ord.subOrders.some(s => s.manufacturerName.toLowerCase().includes(q));
        const matchProd = ord.subOrders.some(s => s.lines.some(l => l.productName.toLowerCase().includes(q)));
        const matchDate = ord.createdDate.toLowerCase().includes(q);
        matchesSearch = matchOrdNum || matchCust || matchMfg || matchProd || matchDate;
      }

      return matchesStatus && matchesSearch;
    });
  }, [orders, subOrdersStore, statusFilter, searchQuery]);

  // Filter ONLY Completed / Closed Master Orders for Buyer Order History
  const completedMasterOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter(ord => {
      if (!ord) return false;
      const isCompletedMaster =
        ord.status === 'COMPLETED' ||
        ord.status === 'CLOSED' ||
        ord.status === 'DELIVERED' ||
        ord.status === 'GOODS_RECEIVED';

      const subStatuses = (ord.subOrders || []).map(sub => getSubOrderDetailedStatus(sub));
      const hasCompletedSub = subStatuses.some(
        s => s.category === 'CLOSED' || s.category === 'GOODS_RECEIVED' || s.category === 'DELIVERED'
      );

      const isFinished = isCompletedMaster || hasCompletedSub;
      if (!isFinished) return false;

      const q = (searchQuery || '').toLowerCase().trim();
      if (!q) return true;

      const matchOrdNum = (ord.orderNumber || '').toLowerCase().includes(q);
      const matchMfg = (ord.subOrders || []).some(s => (s.manufacturerName || '').toLowerCase().includes(q));
      const matchProd = (ord.subOrders || []).some(s => (s.lines || []).some(l => (l.productName || '').toLowerCase().includes(q)));
      const matchDate = (ord.createdDate || '').toLowerCase().includes(q);
      return matchOrdNum || matchMfg || matchProd || matchDate;
    });
  }, [orders, subOrdersStore, searchQuery]);

  const activeMasterOrder = selectedOrder || orders[0];
  const activeMasterStatus = activeMasterOrder ? getMasterOrderStatus(activeMasterOrder) : 'PO ACCEPTED';

  // 16-Stage Unified Order Lifecycle Stepper Configuration
  const UNIFIED_TIMELINE_STAGES = [
    { key: 'ORDER_CREATED', label: 'Order Created', group: 'Order' },
    { key: 'QUOTE_APPROVED', label: 'Quote Approved', group: 'Order' },
    { key: 'PO_ACCEPTED', label: 'PO Accepted', group: 'Mfg' },
    { key: 'ARTWORK_COMPLETED', label: 'Artwork Completed', group: 'Mfg' },
    { key: 'SCHEDULED', label: 'Scheduled', group: 'Mfg' },
    { key: 'IN_PRODUCTION', label: 'In Production', group: 'Mfg' },
    { key: 'QUALITY_INSPECTION', label: 'QC Inspection', group: 'Mfg' },
    { key: 'PACKAGING', label: 'Packaging', group: 'Mfg' },
    { key: 'READY_TO_DISPATCH', label: 'Ready To Dispatch', group: 'Mfg' },
    { key: 'DISPATCHED', label: 'Dispatched', group: 'Logistics' },
    { key: 'IN_TRANSIT', label: 'In Transit', group: 'Logistics' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out For Delivery', group: 'Logistics' },
    { key: 'DELIVERED', label: 'Delivered', group: 'Logistics' },
    { key: 'POD_CONFIRMED', label: 'POD Confirmed', group: 'Logistics' },
    { key: 'GOODS_RECEIVED', label: 'Goods Received', group: 'Buyer' },
    { key: 'CLOSED', label: 'Closed & Archived', group: 'Finance' }
  ];

  const getStageCurrentIndex = (statusStr: string): number => {
    switch (statusStr) {
      case 'ORDER_CREATED': return 0;
      case 'QUOTE_APPROVED': return 1;
      case 'PO_ACCEPTED': case 'PO ACCEPTED': return 2;
      case 'ARTWORK_PENDING': case 'ARTWORK PENDING': return 3;
      case 'ARTWORK_COMPLETED': case 'ARTWORK COMPLETED': return 3;
      case 'SCHEDULED': return 4;
      case 'IN_PRODUCTION': case 'IN PRODUCTION': return 5;
      case 'QUALITY_INSPECTION': return 6;
      case 'PACKAGING': return 7;
      case 'READY_TO_DISPATCH': case 'READY TO DISPATCH': return 8;
      case 'DISPATCHED': return 9;
      case 'IN_TRANSIT': case 'IN TRANSIT': return 10;
      case 'OUT_FOR_DELIVERY': case 'OUT FOR DELIVERY': return 11;
      case 'DELIVERED': return 12;
      case 'POD_CONFIRMED': case 'POD CONFIRMED': return 13;
      case 'GOODS_RECEIVED': case 'GOODS RECEIVED': return 14;
      case 'CLOSED': return 15;
      default: return 5;
    }
  };

  const activeStageIdx = getStageCurrentIndex(activeMasterStatus);

  const getStatusBadgeStyle = (st: string) => {
    switch (st) {
      case 'CLOSED':
        return { bg: '#F1F5F9', border: '#CBD5E1', color: '#475569', icon: CheckCircle2 };
      case 'DELIVERED': case 'POD CONFIRMED':
        return { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D', icon: CheckCircle2 };
      case 'IN TRANSIT': case 'DISPATCHED':
        return { bg: '#E0F2FE', border: '#BAE6FD', color: '#0369A1', icon: Truck };
      case 'READY TO DISPATCH':
        return { bg: '#F3E8FF', border: '#E9D5FF', color: '#6B21A8', icon: Package };
      case 'IN PRODUCTION': case 'SCHEDULED':
        return { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309', icon: Clock };
      default:
        return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', icon: ShoppingBag };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* ── COMMAND HEADER & VIEW SWITCHER ────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Buyer Portal / Order Fulfillment & Tracking History
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>
            {viewMode === 'ORDERS_LIST' ? 'My Orders & Order History' : `Order Details & Tracking #${activeMasterOrder?.orderNumber}`}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setViewMode('ORDERS_LIST')}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              border: viewMode === 'ORDERS_LIST' ? '1px solid #0F766E' : '1px solid #CBD5E1',
              background: viewMode === 'ORDERS_LIST' ? '#F0FDFA' : '#FFFFFF',
              color: viewMode === 'ORDERS_LIST' ? '#0F766E' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ShoppingBag size={16} /> My Orders List ({orders.length})
          </button>

          <button
            onClick={() => setViewMode('TRACKING_DETAIL')}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              border: viewMode === 'TRACKING_DETAIL' ? '1px solid #0F766E' : '1px solid #CBD5E1',
              background: viewMode === 'TRACKING_DETAIL' ? '#F0FDFA' : '#FFFFFF',
              color: viewMode === 'TRACKING_DETAIL' ? '#0F766E' : '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Clock size={16} /> Order History
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          VIEW 1: BUYER ORDER HISTORY TABLE (COMPLETED / CLOSED ORDERS ONLY)
         ───────────────────────────────────────────────────────────────── */}
      {viewMode === 'ORDERS_LIST' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Search & Filter Toolbar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Order History &amp; Archival Records
                </h2>
                <p style={{ fontSize: 12.5, color: '#64748B', margin: '2px 0 0' }}>
                  Complete historical record of finished and closed Master Orders across all sub-orders, POs, artwork, and invoices.
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: 280 }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search order #, quote, product..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }}
                />
              </div>

              <ViewModeToggle viewMode={displayMode} onViewChange={setDisplayMode} />
            </div>
          </div>

          {/* Completed Orders B2B Table / Cards */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                Completed Master Orders Collection ({completedMasterOrders.length} {completedMasterOrders.length === 1 ? 'Record' : 'Records'})
              </div>
            </div>

            {completedMasterOrders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                <Clock size={36} style={{ color: '#CBD5E1', marginBottom: 10 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No Completed Orders Found</div>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>Completed orders will automatically move into Order History once their lifecycle is closed.</div>
              </div>
            ) : displayMode === 'CARD' ? (
              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {completedMasterOrders.map(ord => (
                  <div
                    key={ord.id}
                    style={{
                      background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18,
                      boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {ord.orderNumber}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                          COMPLETED
                        </span>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                        {ord.customerName}
                      </div>

                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div>Order Date: <strong>{ord.orderDate}</strong> · Completion: <strong>2026-08-20</strong></div>
                        <div>Total Value: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{ord.totalValue?.toLocaleString('en-IN')}</strong></div>
                      </div>
                    </div>

                    <div style={{ paddingTop: 8, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setSelectedHistoryOrder(ord);
                          setViewMode('HISTORY_DETAIL');
                        }}
                        style={{ padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        View Order Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ORDER NUMBER</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ORDER DATE</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>COMPLETION DATE</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>STATUS</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL VALUE</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCTS</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SUB-ORDERS</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PURCHASE ORDERS</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ARTWORK STATUS</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>INVOICE STATUS</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PAYMENT STATUS</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedMasterOrders.map(ord => {
                      const subList = ord.subOrders || [];
                      const subCount = subList.length || 1;
                      const prodCount = subList.reduce((sum, s) => sum + (s.lines?.length || 1), 0);
                      const totalVal = ord.totalAmount || subList.reduce((sum, s) => sum + s.totalAmount, 0);

                      return (
                        <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                            {ord.orderNumber}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#475569' }}>
                            {ord.createdDate || '12 Aug 2026'}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: '#16A34A' }}>
                            {ord.expectedDeliveryDate || '25 Aug 2026'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                              COMPLETED ✓
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                            ₹{totalVal.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A' }}>
                            {prodCount} {prodCount === 1 ? 'Product' : 'Products'}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F766E' }}>
                            {subCount} Sub-Orders
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#15803D' }}>
                            {subCount} POs
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                              Uploaded ✓
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                              Paid ✓
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#E0F2FE', color: '#0369A1', border: '1px solid #7DD3FC' }}>
                              Settled ✓
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setSelectedHistoryOrder(ord);
                                setSelectedOrder(ord);
                                setViewMode('HISTORY_DETAIL');
                              }}
                              style={{
                                padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF',
                                border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                            >
                              View Order History →
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
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          VIEW 1B: COMPLETE ORDER HISTORY LIFECYCLE DETAIL VIEW
         ───────────────────────────────────────────────────────────────── */}
      {viewMode === 'HISTORY_DETAIL' && (selectedHistoryOrder || selectedOrder || activeMasterOrder) && (() => {
        const ord = selectedHistoryOrder || selectedOrder || activeMasterOrder;
        const subOrdersList = ord.subOrders || [];
        const allProducts = subOrdersList.flatMap(s => s.lines || []);
        const totalProdCount = allProducts.length || 1;
        const totalQty = allProducts.reduce((sum, l) => sum + (l.quantity || 0), 0) || subOrdersList.reduce((sum, s) => sum + (s.totalQuantity || 5000), 0);
        const totalVal = ord.totalAmount || subOrdersList.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

        const matchedInvoice = invoices.find(inv => inv.masterOrderId === ord.id || inv.orderNumber === ord.orderNumber) || {
          id: `inv-${ord.id}`,
          sentToCustomer: true,
          invoiceNumber: `INV-2026-${ord.orderNumber.replace(/[^0-9]/g, '')}`,
          masterOrderId: ord.id,
          orderNumber: ord.orderNumber,
          subOrderId: subOrdersList[0]?.id || `so-${ord.id}-01`,
          subOrderNumber: subOrdersList[0]?.subOrderNumber || `SO-${ord.orderNumber}-01`,
          customerId: ord.customerId || 'c1',
          customerName: ord.customerName || 'Apex Pharma PCD Franchise',
          customerCode: ord.customerCode || 'CUS000101',
          manufacturerId: subOrdersList[0]?.manufacturerId || 'm1',
          manufacturerName: subOrdersList[0]?.manufacturerName || 'SunBio LifeSciences Ltd',
          invoiceDate: ord.expectedDeliveryDate || ord.createdDate || '2026-08-25',
          dueDate: ord.expectedDeliveryDate || '2026-09-25',
          subtotal: Math.round(totalVal * 0.88),
          taxTotal: Math.round(totalVal * 0.12),
          totalAmount: totalVal,
          paidAmount: totalVal,
          balanceAmount: 0,
          status: 'PAID' as const,
          currency: 'INR',
          lines: allProducts.map((l, lIdx) => ({
            id: `il-${l.id || lIdx}`,
            productId: l.productId || `p${lIdx + 1}`,
            productName: l.productName,
            hsnCode: '30049099',
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxAmount: Math.round((l.totalPrice || (l.quantity * l.unitPrice)) * 0.12),
            totalAmount: l.totalPrice || (l.quantity * l.unitPrice)
          })),
          payments: [
            {
              id: `pay-${ord.id}`,
              invoiceId: `inv-${ord.id}`,
              amount: totalVal,
              currency: 'INR',
              paymentMethod: 'RTGS / HDFC Bank Wire',
              paymentDate: ord.expectedDeliveryDate || '2026-08-25',
              reference: `UTR-HDFC-${ord.orderNumber.replace(/[^0-9]/g, '')}`,
              status: 'COMPLETED' as const,
              remarks: 'Full commercial settlement received upon goods delivery verification'
            }
          ]
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 80, background: '#F8FAFC' }}>
            
            {/* Header & Back Button */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <button
                  onClick={() => setViewMode('ORDERS_LIST')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700,
                    color: '#0F766E', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '6px 14px',
                    borderRadius: 6, cursor: 'pointer', marginBottom: 10
                  }}
                >
                  <ArrowLeft size={14} /> Back to Order History Table
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
                  <span>FactoryGrid</span>
                  <span>/</span>
                  <span>buyer</span>
                  <span>/</span>
                  <span>Order History</span>
                  <span>/</span>
                  <span style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{ord.orderNumber}</span>
                </div>
                <h1 style={{ margin: '4px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Master Order Complete Historical Archival ({ord.orderNumber})
                </h1>
                <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                  Full end-to-end audit record: RFQ requirements, quotation responses, sub-orders, POs, artwork, logistics, and invoice settlement.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 6, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                  ✓ Completed &amp; Archived Order
                </span>
                <button
                  onClick={() => setTargetInvoiceModal(matchedInvoice as any)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 6,
                    background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer'
                  }}
                >
                  <Receipt size={15} /> View Settlement Invoice Document
                </button>
              </div>
            </div>

            {/* Top Summary Banner Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Master Order Number</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{ord.orderNumber}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>PO Ref: {ord.poNumber || `PO-${ord.orderNumber}`}</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Order &amp; Completion Dates</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{ord.createdDate || '12 Aug 2026'} → {ord.expectedDeliveryDate || '25 Aug 2026'}</div>
                <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, marginTop: 2 }}>Lifecycle Closed ✓</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Order Commercials</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>₹{totalVal.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{subOrdersList.length} Sub-Orders · {totalProdCount} Products ({totalQty.toLocaleString()} Units)</div>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Final Settlement Status</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#15803D', marginTop: 4 }}>PAID &amp; SETTLED ✓</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Invoice: {matchedInvoice.invoiceNumber}</div>
              </div>
            </div>

            {/* CHRONOLOGICAL LIFECYCLE STEPS TIMELINE */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Clock size={18} style={{ color: '#0F766E' }} /> COMPLETE ORDER LIFECYCLE TIMELINE
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {[
                  { title: '1. RFQ / Requirement', date: '10 Aug 2026', status: 'Completed' },
                  { title: '2. Quotes Selected', date: '13 Aug 2026', status: 'Completed' },
                  { title: '3. Master Order', date: ord.createdDate || '14 Aug 2026', status: 'Completed' },
                  { title: '4. Sub-Orders Split', date: '14 Aug 2026', status: 'Completed' },
                  { title: '5. POs Executed', date: '14 Aug 2026', status: 'Completed' },
                  { title: '6. Artwork Approved', date: '15 Aug 2026', status: 'Completed' },
                  { title: '7. Production & QA', date: '20 Aug 2026', status: 'Completed' },
                  { title: '8. Dispatched', date: '22 Aug 2026', status: 'Completed' },
                  { title: '9. Goods Received', date: ord.expectedDeliveryDate || '25 Aug 2026', status: 'Completed' },
                  { title: '10. Invoice Paid', date: ord.expectedDeliveryDate || '25 Aug 2026', status: 'Completed' }
                ].map((step, idx) => (
                  <div key={idx} style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <CheckCircle2 size={16} style={{ color: '#16A34A', margin: '0 auto 4px auto' }} />
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A' }}>{step.title}</div>
                    <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>{step.date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 1: RFQ / ORIGINAL REQUIREMENT */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} style={{ color: '#0F766E' }} /> 1. RFQ / Original Requirement Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, fontSize: 12.5, color: '#475569', background: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 14 }}>
                <div><strong>RFQ Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F766E' }}>RFQ-2026-{ord.orderNumber.replace(/[^0-9]/g, '')}</span></div>
                <div><strong>RFQ Creation Date:</strong> 10 Aug 2026</div>
                <div><strong>Delivery Location:</strong> {ord.shippingAddress || 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020'}</div>
                <div><strong>Payment Terms Requested:</strong> {ord.paymentTerms || 'Net 30'}</div>
                <div><strong>RFQ Status:</strong> <span style={{ color: '#15803D', fontWeight: 800 }}>Quoted &amp; Awarded ✓</span></div>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Requested Products Breakdown ({allProducts.length} Items):</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT NAME</th>
                      <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DOSAGE FORM</th>
                      <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TARGET QUANTITY</th>
                      <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ESTIMATED VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts.map((p: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0F172A' }}>{p.productName}</td>
                        <td style={{ padding: '8px 12px', color: '#475569' }}>{p.dosageForm || 'Tablet'}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, fontFamily: 'monospace', color: '#0F766E' }}>{p.quantity.toLocaleString()} Units</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, fontFamily: 'monospace' }}>₹{(p.totalPrice || (p.quantity * p.unitPrice)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: QUOTES / MANUFACTURER RESPONSES */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} style={{ color: '#0F766E' }} /> 2. Quotes &amp; Manufacturer Commercial Responses
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>MANUFACTURER</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUOTED PRODUCT</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TAX %</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DISCOUNT %</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>FINAL PRICE</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subOrdersList.flatMap(so => (so.lines || []).map((l: any, qIdx: number) => (
                      <tr key={qIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A' }}>{so.manufacturerName}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>{l.productName} ({l.quantity.toLocaleString()} Units)</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>₹{l.unitPrice.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{l.taxPercent || 12}%</td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{l.discountPercent || 0}%</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{(l.unitPrice * (1 + (l.taxPercent || 12)/100) * (1 - (l.discountPercent || 0)/100)).toFixed(2)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                            Selected &amp; Awarded ✓
                          </span>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: MASTER ORDER DETAILS */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} style={{ color: '#0F766E' }} /> 3. Master Order Execution Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, fontSize: 12.5, color: '#475569', background: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div><strong>Master Order No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F766E' }}>{ord.orderNumber}</span></div>
                <div><strong>Master Order Date:</strong> {ord.createdDate || '14 Aug 2026'}</div>
                <div><strong>Overall Status:</strong> <span style={{ color: '#15803D', fontWeight: 800 }}>COMPLETED &amp; ARCHIVED ✓</span></div>
                <div><strong>Total Order Value:</strong> <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{totalVal.toLocaleString()}</strong></div>
                <div><strong>Total Line Items:</strong> {totalProdCount} Products ({totalQty.toLocaleString()} Units)</div>
                <div><strong>Actual Delivery Date:</strong> {ord.expectedDeliveryDate || '25 Aug 2026'}</div>
                <div><strong>Consignee Address:</strong> {ord.shippingAddress || 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020'}</div>
                <div>
                  <strong>Billing Address:</strong> {ord.billingAddress || 'Apex Corporate Office, Connaught Place, New Delhi - 110001'}
                  <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 1 }}>GST Number: {ord.buyerGst || '36APXPH0001A1Z5'}</div>
                </div>
              </div>
            </div>

            {/* SECTION 4: SUB-ORDERS (SHOW ALL SUB-ORDERS) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={18} style={{ color: '#0F766E' }} /> 4. Manufacturer Sub-Orders ({subOrdersList.length} Sub-Orders)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SUB-ORDER NO</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>MANUFACTURER</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ASSIGNED PRODUCTS</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SUB-ORDER VALUE</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>RELATED PO</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subOrdersList.map((so: any, sIdx: number) => (
                      <tr key={sIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{so.subOrderNumber}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>{so.manufacturerName}</td>
                        <td style={{ padding: '10px 12px', color: '#0F172A' }}>
                          {(so.lines || []).map((l: any, lIdx: number) => (
                            <div key={lIdx} style={{ fontSize: 12, fontWeight: 600 }}>• {l.productName} ({l.quantity.toLocaleString()} Units)</div>
                          ))}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, fontFamily: 'monospace' }}>
                          {(so.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 5000).toLocaleString()} Units
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                          ₹{(so.totalAmount || 128800).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F766E', fontFamily: 'monospace' }}>
                          {so.poNumber || `PO-SO-2026-${ord.orderNumber.replace(/[^0-9]/g, '')}-0${sIdx + 1}`}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                            Completed ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 5: PURCHASE ORDERS (SHOW ALL POs) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCheck size={18} style={{ color: '#0F766E' }} /> 5. Executed Purchase Orders ({subOrdersList.length} POs)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PO NUMBER</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SUB-ORDER REF</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>MANUFACTURER</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PO DATE</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>LINE ITEMS &amp; COSTS</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TOTAL COST</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subOrdersList.map((so: any, pIdx: number) => (
                      <tr key={pIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {so.poNumber || `PO-SO-2026-${ord.orderNumber.replace(/[^0-9]/g, '')}-0${pIdx + 1}`}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F766E', fontFamily: 'monospace' }}>{so.subOrderNumber}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>{so.manufacturerName}</td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{ord.createdDate || '14 Aug 2026'}</td>
                        <td style={{ padding: '10px 12px', color: '#0F172A' }}>
                          {(so.lines || []).map((l: any, lIdx: number) => (
                            <div key={lIdx} style={{ fontSize: 11.5 }}>
                              {l.productName}: {l.quantity.toLocaleString()} Units @ ₹{l.unitPrice.toFixed(2)} (Tax {l.taxPercent || 12}%)
                            </div>
                          ))}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>₹{(so.totalAmount || 128800).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                            PO Accepted ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 6: ARTWORK HISTORY */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={18} style={{ color: '#0F766E' }} /> 6. Product Packaging Artwork History
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT NAME</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SUB-ORDER</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ARTWORK FILE NAME</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UPLOAD DATE</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ARTWORK STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subOrdersList.flatMap(so => (so.lines || []).map((l: any, aIdx: number) => (
                      <tr key={aIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A' }}>{l.productName}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F766E', fontFamily: 'monospace' }}>{so.subOrderNumber}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0F766E' }}>
                          {so.manufacturerName.split(' ')[0]}_{l.productName.replace(/ /g, '_')}_Packaging_v2.pdf
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>15 Aug 2026 11:30 AM</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                            Uploaded &amp; Approved ✓
                          </span>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 7: FULFILLMENT & LOGISTICS */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={18} style={{ color: '#0F766E' }} /> 7. Fulfillment, Logistics &amp; Goods Receipt (GRN)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SUB-ORDER</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>TRANSPORTER</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>AWB / TRACKING NO</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DISPATCH DATE</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DELIVERY DATE</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DELIVERED UNITS</th>
                      <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>GRN STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subOrdersList.map((so: any, fIdx: number) => (
                      <tr key={fIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{so.subOrderNumber}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>{so.transporterName || 'Safexpress Cold Fleet'}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#1D4ED8' }}>{so.awbNumber || `TRK-SAF-994${fIdx + 1}`}</td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{so.startDate || '20 Aug 2026'}</td>
                        <td style={{ padding: '10px 12px', color: '#15803D', fontWeight: 700 }}>{so.expectedDeliveryDate || '25 Aug 2026'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, fontFamily: 'monospace' }}>
                          {(so.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 5000).toLocaleString()} / {(so.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 5000).toLocaleString()} Units
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                            Fully Received ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 8: INVOICE & PAYMENT */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={18} style={{ color: '#0F766E' }} /> 8. Commercial Invoices &amp; Settlement Payment
                </div>
                <button
                  onClick={() => setTargetInvoiceModal(matchedInvoice as any)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6,
                    background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                  }}
                >
                  <Eye size={13} /> View Commercial Invoice Document
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, fontSize: 12.5, color: '#475569', background: '#F0FDF4', padding: 18, borderRadius: 10, border: '1px solid #BBF7D0' }}>
                <div><strong>Invoice Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F766E' }}>{matchedInvoice.invoiceNumber}</span></div>
                <div><strong>Invoice Date:</strong> {matchedInvoice.invoiceDate}</div>
                <div><strong>Subtotal:</strong> ₹{(matchedInvoice.subtotal || Math.round(totalVal * 0.88)).toLocaleString()}</div>
                <div><strong>Tax (GST 12%):</strong> ₹{(matchedInvoice.taxTotal || Math.round(totalVal * 0.12)).toLocaleString()}</div>
                <div><strong>Grand Total Amount:</strong> <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>₹{totalVal.toLocaleString()}</strong></div>
                <div><strong>Payment Status:</strong> <span style={{ color: '#15803D', fontWeight: 800 }}>PAID &amp; SETTLED ✓</span></div>
                <div><strong>Payment Method:</strong> RTGS / HDFC Bank Wire</div>
                <div><strong>Payment Reference:</strong> <span style={{ fontFamily: 'monospace' }}>UTR-HDFC-{ord.orderNumber.replace(/[^0-9]/g, '')}</span></div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* ─────────────────────────────────────────────────────────────────
          VIEW 2: UNIFIED ORDER DETAILS & LIFECYCLE TRACKING
         ───────────────────────────────────────────────────────────────── */}
      {viewMode === 'TRACKING_DETAIL' && activeMasterOrder && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 1. ORDER SUMMARY CARD */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <button onClick={() => setViewMode('ORDERS_LIST')} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <ArrowLeft size={14} /> Back to My Orders List
                </button>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Master Order Summary</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>{activeMasterOrder.orderNumber}</h2>
                <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span>Consignee Buyer: <strong style={{ color: '#0F172A' }}>{activeMasterOrder.customerName}</strong></span>
                  {activeMasterOrder.customerClassification === 'SPECIAL_PARTY' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 10, fontWeight: 800 }}>
                      <Star size={10} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                    </span>
                  )}
                  <span>| Delivery Address: {activeMasterOrder.shippingAddress}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>SELECT MO:</span>
                  <select
                    value={activeMasterOrder.id}
                    onChange={(e) => {
                      const found = orders.find(o => o.id === e.target.value);
                      if (found) setSelectedOrder(found);
                    }}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 11.5, fontWeight: 700, color: '#0F766E', outline: 'none' }}
                  >
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginTop: 4 }}>Total Order Value</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{activeMasterOrder.totalAmount.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Expected Delivery: <strong>{activeMasterOrder.expectedDeliveryDate}</strong></div>
              </div>
            </div>

            {/* Read-Only Status Indicator */}
            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#0F766E' }}>
                <ShieldCheck size={18} /> Overall Master Order Status: <span style={{ color: '#0F172A', textTransform: 'uppercase' }}>{activeMasterStatus}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 600 }}>
                ✓ Synchronized Real-Time Buyer Telemetry (Read-Only)
              </div>
            </div>
          </div>

          {/* ADVANCE PAYMENT DESK (MASTER ORDER LEVEL) */}
          <AdvancePaymentSection order={activeMasterOrder} />

          {/* 2. UNIFIED 14-STAGE LIFECYCLE STEPPER */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={16} style={{ color: '#0F766E' }} /> UNIFIED END-TO-END ORDER LIFECYCLE TIMELINE
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {UNIFIED_TIMELINE_STAGES.map((st, idx) => {
                const isDone = idx <= activeStageIdx;
                const isCurrent = idx === activeStageIdx;
                const isPending = idx > activeStageIdx;

                return (
                  <div
                    key={st.key}
                    style={{
                      background: isCurrent ? '#F0FDFA' : isDone ? '#FFFFFF' : '#F8FAFC',
                      border: isCurrent ? '2px solid #0F766E' : isDone ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                      borderRadius: 8,
                      padding: 10,
                      textAlign: 'center',
                      boxShadow: isCurrent ? '0 2px 8px rgba(15,118,110,0.15)' : 'none',
                      opacity: isPending ? 0.65 : 1
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: isCurrent ? '#0F766E' : isDone ? '#16A34A' : '#94A3B8' }}>
                      {isDone ? '✓' : `🔒 STEP ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: isCurrent || isDone ? 800 : 600, color: isCurrent ? '#0F766E' : isDone ? '#0F172A' : '#64748B', marginTop: 4, lineHeight: 1.3 }}>
                      {st.label}
                    </div>
                    {isCurrent && (
                      <div style={{ fontSize: 9.5, fontWeight: 800, background: '#0F766E', color: '#FFF', padding: '1px 6px', borderRadius: 4, marginTop: 6, display: 'inline-block' }}>
                        CURRENT STAGE
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. CURRENT MILESTONE TELEMETRY & DETAILS */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={18} style={{ color: '#0F766E' }} /> CURRENT MILESTONE TELEMETRY & DETAILS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Current Milestone</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', marginTop: 2 }}>
                  Step {activeStageIdx + 1} of 16 — {UNIFIED_TIMELINE_STAGES[activeStageIdx]?.label || activeMasterStatus}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Consignee Buyer</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{activeMasterOrder.customerName}</span>
                  {activeMasterOrder.customerClassification === 'SPECIAL_PARTY' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 10, fontWeight: 800 }}>
                      <Star size={10} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Destination Warehouse</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 2 }}>{activeMasterOrder.shippingAddress}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Target Delivery Schedule</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1D4ED8', marginTop: 2 }}>{activeMasterOrder.expectedDeliveryDate}</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: VIEW B2B INVOICE (READ-ONLY FOR BUYER)
         ───────────────────────────────────────────────────────────────── */}
      {targetInvoiceModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setTargetInvoiceModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 26, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Tax Invoice #{targetInvoiceModal.invoiceNumber}</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Manufacturer Commercial B2B Document</div>
              </div>
              <button onClick={() => setTargetInvoiceModal(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {targetInvoiceModal.uploadedFileUrl ? (
              <div style={{ height: 500, width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #CBD5E1', background: '#FFFFFF' }}>
                <iframe
                  src={targetInvoiceModal.uploadedFileUrl}
                  title="Uploaded Invoice PDF Preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 12.5, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div>Master Order #: <strong style={{ fontFamily: 'monospace' }}>{targetInvoiceModal.orderNumber}</strong></div>
                  <div>Sub-Order #: <strong style={{ fontFamily: 'monospace' }}>{targetInvoiceModal.subOrderNumber || 'SO-1001-01'}</strong></div>
                  <div>Invoice Date: <strong>{targetInvoiceModal.invoiceDate}</strong></div>
                  <div>Due Date: <strong>{targetInvoiceModal.dueDate}</strong></div>
                  <div>Billed To: <strong>{targetInvoiceModal.customerName}</strong></div>
                  <div>Issuer: <strong>{targetInvoiceModal.manufacturerName || 'SunBio LifeSciences Ltd.'}</strong></div>
                </div>

                {/* Line Items Table */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px 12px' }}>Product</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tax</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targetInvoiceModal.lines?.map((ln, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{ln.productName}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>{ln.quantity.toLocaleString()}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{ln.unitPrice}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{ln.taxAmount?.toLocaleString() || '0'}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>₹{ln.totalAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    Payment Status: <strong style={{ color: targetInvoiceModal.status === 'PAID' ? '#16A34A' : '#D97706', textTransform: 'uppercase' }}>{targetInvoiceModal.status}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Grand Total</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{targetInvoiceModal.totalAmount.toLocaleString()}</div>
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setTargetInvoiceModal(null)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
              
              <button
                type="button"
                onClick={() => {
                  if (targetInvoiceModal.uploadedFileUrl) {
                    const a = document.createElement('a');
                    a.href = targetInvoiceModal.uploadedFileUrl;
                    a.download = targetInvoiceModal.uploadedFileName || `${targetInvoiceModal.invoiceNumber}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  } else {
                    window.print();
                  }
                }}
                style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F766E', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={15} /> Download Invoice
              </button>

              {targetInvoiceModal.balanceAmount > 0 && Boolean(targetInvoiceModal.uploadedFileUrl || targetInvoiceModal.uploadedFileName) && (
                <button
                  type="button"
                  onClick={() => alert(`Online Payment Gateway:\n\nInitiating secure payment for Invoice ${targetInvoiceModal.invoiceNumber}.\nOutstanding Balance: ₹${targetInvoiceModal.balanceAmount.toLocaleString()}`)}
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.25)' }}
                >
                  <CreditCard size={15} /> Pay Now →
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: CONFIRM GOODS RECEIVED (BUYER PORTAL)
         ───────────────────────────────────────────────────────────────── */}
      {goodsReceivedContext && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setGoodsReceivedContext(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 580, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={20} style={{ color: '#0F766E' }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Confirm Goods Received</h3>
              </div>
              <button onClick={() => setGoodsReceivedContext(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {/* Read-Only Context Info */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>Master Order: <strong style={{ fontFamily: 'monospace' }}>{goodsReceivedContext.masterOrder.orderNumber}</strong></div>
              <div>Sub-Order: <strong style={{ fontFamily: 'monospace' }}>{goodsReceivedContext.subCode}</strong></div>
              <div>PO Number: <strong style={{ fontFamily: 'monospace' }}>{goodsReceivedContext.subOrder.poNumber || `PO-${goodsReceivedContext.subCode}`}</strong></div>
              <div>Tracking #: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{goodsReceivedContext.shipment.trackingNumber}</strong></div>
              <div>Manufacturer: <strong>{goodsReceivedContext.subOrder.manufacturerName}</strong></div>
              <div>Ordered Quantity: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{(goodsReceivedContext.subOrder.totalQuantity || 12000).toLocaleString()} Units</strong></div>
            </div>

            {grnFormError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 10, borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={15} /> {grnFormError}
              </div>
            )}

            <form onSubmit={handleConfirmGoodsReceivedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Received Quantity *</label>
                  <input
                    type="number"
                    value={receivedQtyInput}
                    onChange={e => setReceivedQtyInput(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Received Date *</label>
                  <input
                    type="date"
                    value={receivedDateInput}
                    onChange={e => setReceivedDateInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                    required
                  />
                </div>
              </div>

              {/* Calculated Missing Qty Display */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 10, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  Calculated Missing Quantity: <strong style={{ color: (goodsReceivedContext.subOrder.totalQuantity || 12000) - receivedQtyInput > 0 ? '#DC2626' : '#1D4ED8', fontFamily: 'monospace', fontSize: 13 }}>
                    {Math.max((goodsReceivedContext.subOrder.totalQuantity || 12000) - receivedQtyInput, 0).toLocaleString()} Units
                  </strong>
                </div>
                <div style={{ fontSize: 11, color: '#3B82F6', fontWeight: 700 }}>
                  Status: {receivedQtyInput === (goodsReceivedContext.subOrder.totalQuantity || 12000) && damagedQtyInput === 0 && conditionInput === 'Good / Accepted' ? 'Fully Received' : receivedQtyInput < (goodsReceivedContext.subOrder.totalQuantity || 12000) ? 'Partially Received' : 'Received with Issues'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Physical Package Condition *</label>
                  <select
                    value={conditionInput}
                    onChange={e => setConditionInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600 }}
                  >
                    <option value="Good / Accepted">Good / Accepted</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Short Quantity">Short Quantity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Damaged Quantity</label>
                  <input
                    type="number"
                    value={damagedQtyInput}
                    onChange={e => setDamagedQtyInput(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Warehouse Receiving Remarks {(receivedQtyInput < (goodsReceivedContext.subOrder.totalQuantity || 12000) || conditionInput === 'Damaged' || conditionInput === 'Short Quantity') ? '*' : ''}
                </label>
                <textarea
                  rows={2}
                  value={receivingRemarksInput}
                  onChange={e => setReceivingRemarksInput(e.target.value)}
                  placeholder="Enter carton inspection notes, warehouse verification details, etc..."
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              {/* Upload Receiving Evidence Document (GRN) */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Upload Goods Received Note (GRN) / Delivery Receipt</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ padding: '6px 12px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F766E', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={14} /> Upload Document
                    <input type="file" accept="application/pdf,image/png,image/jpeg,image/jpg" onChange={e => setGrnFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  </label>
                  {grnFile ? (
                    <div style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} /> {grnFile.name}
                      <button type="button" onClick={() => setGrnFile(null)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11.5, color: '#94A3B8' }}>Supported: PDF, JPG, PNG (Optional)</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setGoodsReceivedContext(null)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Confirm Goods Received →
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Universal QA Query Raising Modal for Buyer */}
      <RaiseQaModal
        isOpen={isQaModalOpen}
        onClose={() => setIsQaModalOpen(false)}
        userRole="BUYER"
        contextType={qaModalContext.contextType}
        contextNumber={qaModalContext.contextNumber}
        productName={qaModalContext.productName}
        manufacturerName={qaModalContext.manufacturerName}
      />

    </div>
  );
};
