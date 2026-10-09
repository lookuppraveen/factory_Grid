import { InvoiceModule } from './InvoiceModule';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatNumber, UNIFIED_STORAGE_KEY } from './ProductionExecutionModule';
import { Invoice, InvoiceStatus } from '../../types';
import {
  Truck, Navigation, Thermometer, ShieldCheck, Clock, MapPin,
  CheckCircle2, FileText, Upload, RefreshCw, AlertTriangle, Phone,
  ChevronRight, ArrowRight, Download, RotateCcw, Check, User, Plus, X,
  Layers, Package, AlertCircle, File, MoreVertical, Activity, ArrowLeft, XCircle,
  Receipt, DollarSign, Send, Printer, CreditCard, Eye
} from 'lucide-react';

interface ShipmentModuleProps {
  onNavigateTab?: (tabId: string) => void;
}

export type ShipmentStatus =
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'POD_CONFIRMED'
  | 'CLOSED';

export const ShipmentModule: React.FC<ShipmentModuleProps> = ({ onNavigateTab }) => {
  const { currentRole, addAuditLog, manufacturers, invoices, addInvoice, recordInvoicePayment, updateInvoiceStatus, setActiveTab, orders } = useApp();

  const myMfg = (manufacturers && manufacturers[0]) || null;
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';

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
                manufacturerName: so.manufacturerName || myMfgName,
                productName: so.lines?.[0]?.productName || 'Pharmaceutical Product',
                totalQuantity: so.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 10000,
                orderValue: so.totalAmount || 150000,
                productionStatus: 'PO_ACCEPTED',
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

  const [subOrdersStore, setSubOrdersStore] = useState<Record<string, any>>(getInitialStore);

  const [selectedSubOrderCode, setSelectedSubOrderCode] = useState<string>(() => {
    try {
      const target = localStorage.getItem('factorygrid_target_suborder');
      if (target) return target;
    } catch (e) {}
    const keys = Object.keys(getInitialStore());
    return keys[keys.length - 1] || 'SO-1001-01';
  });

  const [activeTabLocal, setActiveTabLocal] = useState<'ACTIVE_SHIPMENTS' | 'CREATE_SHIPMENT' | 'DELIVERY_HISTORY' | 'POD_VIEW'>('ACTIVE_SHIPMENTS');

  // Historical Completed Shipments (Archived in Delivery History)
  const historicalShipments = [
    {
      id: 'SHP-1001-02',
      trackingNumber: 'TRK-CIP-44092',
      subOrderNumber: 'SO-1001-02',
      masterOrderNumber: 'MO-2026-1001',
      poNumber: 'PO-2026-1001-02',
      customerName: 'Apex Pharma PCD Franchise',
      manufacturerName: 'Cipla Partner Operations',
      productName: 'Amoxicillin 500mg Tablets',
      totalQuantity: 5000,
      transporterName: 'BlueDart Healthcare Logistics',
      vehicleNumber: 'MH 04 CD 1102',
      driverName: 'Rajesh Kumar',
      driverPhone: '+91 98112 33445',
      dispatchDate: '2026-08-12',
      expectedDeliveryDate: '2026-08-15',
      actualDeliveryDate: '2026-08-15',
      shipmentStatus: 'CLOSED' as ShipmentStatus,
      temperatureStatus: 'Normal / Compliant',
      currentTemp: '4.5°C',
      demoGpsLocation: 'Delivered at Apex Central Warehouse, Naroda',
      podStatus: 'CONFIRMED',
      podReceiverName: 'Dr. Vikas Sharma (Stores In-Charge)',
      podDeliveryDate: '2026-08-15',
      podRemarks: 'Cold chain tamper-evident seal verified unbroken. 100% quantity received.',
      podDocName: 'POD_STAMP_SIGNED_SO-1001-02.pdf',
      activityHistory: [
        { id: 'act_10', timestamp: '12 Aug 09:00 AM', eventTitle: 'Shipment Dispatched', actor: 'Cipla Partner Operations', details: 'Dispatched via BlueDart' },
        { id: 'act_11', timestamp: '12 Aug 11:30 AM', eventTitle: 'Shipment In Transit', actor: 'BlueDart Healthcare Logistics', details: 'Entered transit route' },
        { id: 'act_12', timestamp: '15 Aug 08:30 AM', eventTitle: 'Shipment Out for Delivery', actor: 'BlueDart Healthcare Logistics', details: 'Out for final mile delivery' },
        { id: 'act_13', timestamp: '15 Aug 02:15 PM', eventTitle: 'Shipment Delivered', actor: 'Apex Pharma / Dr. Vikas Sharma', details: 'Delivered to Naroda Warehouse' },
        { id: 'act_14', timestamp: '15 Aug 03:00 PM', eventTitle: 'POD Confirmed', actor: 'Apex Pharma', details: 'Electronic POD stamp verified' },
        { id: 'act_15', timestamp: '15 Aug 03:05 PM', eventTitle: 'Shipment Closed', actor: 'System / Authorized User', details: 'Lifecycle completed and archived' }
      ]
    }
  ];

  // Sync state changes with localStorage & window focus listeners
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        const merged = syncSubOrdersWithContext(parsed);
        setSubOrdersStore(merged);

        const target = localStorage.getItem('factorygrid_target_suborder');
        if (target && merged[target]) {
          setSelectedSubOrderCode(target);
        } else if (!merged[selectedSubOrderCode]) {
          const keys = Object.keys(merged);
          if (keys.length > 0) setSelectedSubOrderCode(keys[keys.length - 1]);
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

  useEffect(() => {
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(subOrdersStore));
    } catch (e) {
      console.error(e);
    }
  }, [subOrdersStore]);

  // VIEW MODE STATE: 'LIST' | 'DETAIL' | 'NOT_FOUND'
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL' | 'NOT_FOUND'>('LIST');
  const [notFoundTarget, setNotFoundTarget] = useState<string>('');

  // Transporter / Logistics Partners List
  const DEFAULT_TRANSPORTERS = [
    'ColdEx Logistics Telemetry Fleet',
    'BlueDart Healthcare Logistics',
    'Delhivery Pharma Express'
  ];

  const [customPartners, setCustomPartners] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_logistics_partners');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const allTransporters = useMemo(() => {
    const list = [...DEFAULT_TRANSPORTERS];
    customPartners.forEach(p => {
      if (!list.includes(p)) list.push(p);
    });
    return list;
  }, [customPartners]);

  // Form States for Create Shipment
  const [transporterSelect, setTransporterSelect] = useState<string>('ColdEx Logistics Telemetry Fleet');
  const [customTransporter, setCustomTransporter] = useState<string>('');
  const [autoTrackingNo, setAutoTrackingNo] = useState<string>(`TRK-COLD-${Math.floor(80000 + Math.random() * 9999)}`);
  const todayStr = new Date().toISOString().split('T')[0];
  const [dispDate, setDispDate] = useState<string>(todayStr);

  // Add New Logistics Partner Modal State
  const [showAddPartnerModal, setShowAddPartnerModal] = useState<boolean>(false);
  const [newPartnerName, setNewPartnerName] = useState<string>('');
  const [newPartnerFleetType, setNewPartnerFleetType] = useState<string>('Cold-Chain Fleet (2°C - 8°C)');
  const [newPartnerContact, setNewPartnerContact] = useState<string>('');
  const [newPartnerPhone, setNewPartnerPhone] = useState<string>('');
  const [newPartnerError, setNewPartnerError] = useState<string>('');

  const handleSaveNewPartner = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPartnerName.trim();
    if (!name) {
      setNewPartnerError('Please enter a valid logistics partner name.');
      return;
    }

    if (!allTransporters.includes(name)) {
      const updated = [...customPartners, name];
      setCustomPartners(updated);
      try {
        localStorage.setItem('factorygrid_logistics_partners', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save custom logistics partner', err);
      }
    }

    setTransporterSelect(name);
    setCustomTransporter('');
    setShowAddPartnerModal(false);
    setNewPartnerName('');
    setNewPartnerContact('');
    setNewPartnerPhone('');
    setNewPartnerError('');
    addAuditLog('Logistics Engine', `Registered new logistics partner: ${name}`);
    alert(`✔ Logistics Partner "${name}" registered successfully and selected.`);
  };

  const calcDeliveryDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    } catch (e) { return dateStr; }
  };
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(calcDeliveryDate(todayStr));
  const [dispatchNotes, setDispatchNotes] = useState<string>('');

  // Modal Control States
  const [showConfirmDeliveryModal, setShowConfirmDeliveryModal] = useState<boolean>(false);
  const [showPodModal, setShowPodModal] = useState<boolean>(false);
  const [showCloseShipmentModal, setShowCloseShipmentModal] = useState<boolean>(false);

  // Form States for Modals
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [delivReceiver, setDelivReceiver] = useState('');
  const [delivDate, setDelivDate] = useState(todayDateStr);
  const [delivRemarks, setDelivRemarks] = useState('');

  const [podReceiver, setPodReceiver] = useState('');
  const [podDate, setPodDate] = useState(todayDateStr);
  const [podRemarksText, setPodRemarksText] = useState('');
  const [selectedPodFile, setSelectedPodFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const podFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenConfirmDeliveryModal = () => {
    if (activeShipment) {
      setDelivReceiver(activeShipment.podReceiverName || `${activeShipment.customerName} Receiving Officer`);
      setDelivDate(activeShipment.actualDeliveryDate || todayDateStr);
      setDelivRemarks(activeShipment.podRemarks || '');
    } else {
      setDelivReceiver('');
      setDelivDate(todayDateStr);
      setDelivRemarks('');
    }
    setShowConfirmDeliveryModal(true);
  };

  const handleOpenPodModal = () => {
    if (activeShipment) {
      setPodReceiver(activeShipment.podReceiverName || `${activeShipment.customerName} Receiving Officer`);
      setPodDate(activeShipment.podDeliveryDate || activeShipment.actualDeliveryDate || todayDateStr);
      setPodRemarksText(activeShipment.podRemarks || '');
      if (activeShipment.podDocName) {
        setSelectedPodFile({
          name: activeShipment.podDocName,
          size: activeShipment.podFileSize || '2.4 MB',
          type: activeShipment.podFileType || 'PDF'
        });
      } else {
        setSelectedPodFile(null);
      }
    } else {
      setPodReceiver('');
      setPodDate(todayDateStr);
      setPodRemarksText('');
      setSelectedPodFile(null);
    }
    setShowPodModal(true);
  };

  const handlePodFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('⚠ File Size Exceeds Limit!\n\nMaximum allowed file size for Proof of Delivery is 10 MB.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      alert('⚠ Invalid File Format!\n\nOnly PDF, JPG, JPEG, and PNG files are supported for Proof of Delivery.');
      return;
    }

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    setSelectedPodFile({
      name: file.name,
      size: sizeFormatted,
      type: ext.toUpperCase()
    });
  };

  // Robust Sub-Order Record Resolution (NEVER fall back to old completed state for a new order)
  const activeSubOrder = subOrdersStore[selectedSubOrderCode] || {
    subOrderNumber: selectedSubOrderCode,
    poNumber: `PO-${selectedSubOrderCode}`,
    masterOrderNumber: 'MO-2026-1002',
    customerName: 'B2B Client Partner',
    manufacturerName: myMfgName,
    productName: 'Pharmaceutical Products',
    totalQuantity: 10000,
    productionStatus: 'PO_ACCEPTED',
    shipment: null,
    invoice: null
  };
  const activeShipment = activeSubOrder?.shipment;

    const liveInvoiceFromContext = invoices.find((inv: Invoice) => 
    (inv.subOrderNumber && inv.subOrderNumber === activeSubOrder?.subOrderNumber) || 
    (inv.subOrderId && inv.subOrderId === activeSubOrder?.id) ||
    (activeSubOrder?.invoice && (inv.id === activeSubOrder.invoice.id || inv.invoiceNumber === activeSubOrder.invoice.invoiceNumber))
  );
  const activeInvoice: Invoice | null = liveInvoiceFromContext || activeSubOrder?.invoice || null;

  // Invoice Modal Controls State
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState<boolean>(false);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState<boolean>(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState<boolean>(false);
  const [targetInvoiceForModal, setTargetInvoiceForModal] = useState<Invoice | null>(null);

  // Form States for Generate Invoice
  const [genInvNumber, setGenInvNumber] = useState<string>('');
  const [genInvDate, setGenInvDate] = useState<string>('');
  const [genDueDate, setGenDueDate] = useState<string>('');
  const [genMasterOrder, setGenMasterOrder] = useState<string>('');
  const [genSubOrder, setGenSubOrder] = useState<string>('');
  const [genCustomerName, setGenCustomerName] = useState<string>('');
  const [genMfgName, setGenMfgName] = useState<string>('');
  const [genProductName, setGenProductName] = useState<string>('');
  const [genQty, setGenQty] = useState<number>(12000);
  const [genUnitPrice, setGenUnitPrice] = useState<number>(16.28);
  const [genTaxPercent, setGenTaxPercent] = useState<number>(12);
  const [genFreight, setGenFreight] = useState<number>(0);
  const [genHsn, setGenHsn] = useState<string>('30049099');

  // Form States for Record Payment
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentMethodSelect, setPaymentMethodSelect] = useState<string>('RTGS');
  const [paymentRefInput, setPaymentRefInput] = useState<string>('');

  const getEffectiveInvoiceStatus = (inv: Invoice): InvoiceStatus => {
    const paid = Math.round((inv.paidAmount || 0) * 100) / 100;
    const total = Math.round((inv.totalAmount || 0) * 100) / 100;
    const bal = typeof inv.balanceAmount === 'number'
      ? Math.round(inv.balanceAmount * 100) / 100
      : Math.max(0, Math.round((total - paid) * 100) / 100);

    if ((bal <= 0 || paid >= total) && total > 0) return 'PAID';
    if (paid > 0 && bal > 0) return 'PARTIAL_PAYMENT';
    const today = new Date().toISOString().split('T')[0];
    if (inv.dueDate && inv.dueDate < today && bal > 0) return 'OVERDUE';
    return 'UNPAID';
  };

  const renderInvoiceStatusChip = (inv: Invoice | null) => {
    if (!inv) return null;
    const status = getEffectiveInvoiceStatus(inv);
    if (status === 'PAID') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} /> ✓ PAID
        </span>
      );
    }
    if (status === 'PARTIAL_PAYMENT') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} /> ↗ PARTIALLY PAID
        </span>
      );
    }
    if (status === 'OVERDUE') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} /> OVERDUE
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706' }} /> OPEN / UNPAID
      </span>
    );
  };

  const handleOpenGenerateInvoiceModal = () => {
    if (!activeShipment) {
      alert('⚠ Shipment Required!\n\nPlease dispatch the shipment first before generating an invoice.');
      return;
    }

    const isEligible = ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'POD_CONFIRMED', 'CLOSED'].includes(activeShipment.shipmentStatus);
    if (!isEligible) {
      alert('⚠ Shipment Must Be Dispatched or Delivered!\n\nInvoice upload is available after the shipment has reached Dispatched or Delivered stage.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const dueStr = due.toISOString().split('T')[0];

    const totalQty = activeSubOrder.totalQuantity || 12000;
    const totalVal = activeSubOrder.orderValue || 195300;
    const unitP = Math.round((totalVal / totalQty) * 100) / 100 || 16.28;

    setGenInvNumber(`INV-2026-${Math.floor(4420 + Math.random() * 500)}`);
    setGenInvDate(todayStr);
    setGenDueDate(dueStr);
    setGenMasterOrder(activeSubOrder.masterOrderNumber || 'MO-2026-1001');
    setGenSubOrder(activeSubOrder.subOrderNumber || 'SO-1001-01');
    setGenCustomerName(activeSubOrder.customerName || 'Apex Pharma PCD Franchise');
    setGenMfgName(activeSubOrder.manufacturerName || myMfgName);
    setGenProductName(activeSubOrder.productName || 'Paracetamol 500mg & Azithromycin 500mg Tablets');
    setGenQty(totalQty);
    setGenUnitPrice(unitP);
    setGenTaxPercent(12);
    setGenFreight(0);
    setGenHsn('30049099');

    setShowGenerateInvoiceModal(true);
  };

  const handleGenerateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subtotal = Math.round(genQty * genUnitPrice);
    const taxTotal = 0;
    const grandTotal = Math.round(subtotal + Number(genFreight || 0));

    const newInvoiceObj: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: genInvNumber,
      masterOrderId: activeSubOrder.masterOrderId || 'mo_1001',
      orderNumber: genMasterOrder,
      subOrderId: activeSubOrder.id || 'so_1001_01',
      subOrderNumber: genSubOrder,
      customerId: activeSubOrder.customerId || 'c1',
      customerName: genCustomerName,
      customerCode: 'CUS000101',
      manufacturerId: myMfg?.id || 'mfg_001',
      manufacturerName: genMfgName,
      invoiceDate: genInvDate,
      dueDate: genDueDate,
      subtotal: subtotal,
      taxTotal: 0,
      totalAmount: grandTotal,
      paidAmount: 0,
      balanceAmount: grandTotal,
      status: 'OPEN',
      lines: [
        {
          id: `il_${Date.now()}`,
          productId: 'p1',
          productName: genProductName,
          hsnCode: genHsn,
          quantity: genQty,
          unitPrice: genUnitPrice,
          taxAmount: 0,
          totalAmount: subtotal
        }
      ],
      sentToCustomer: false
    };

    addInvoice(newInvoiceObj);

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
        invoice: newInvoiceObj
      }
    }));

    addAuditLog('Invoice Engine', `Generated B2B Tax Invoice ${genInvNumber} for Sub-Order ${genSubOrder} (Total ₹${grandTotal.toLocaleString()})`);

    setShowGenerateInvoiceModal(false);
    setTargetInvoiceForModal(newInvoiceObj);
    setShowViewInvoiceModal(true);

    alert(`✔ B2B Tax Invoice ${genInvNumber} Generated Successfully!\n\nGrand Total: ₹${grandTotal.toLocaleString()}\nAccounts Receivable (AR) record created and linked to Sub-Order ${genSubOrder}.`);
  };

  const handleSendInvoiceToCustomer = (invObj: Invoice) => {
    if (invObj.sentToCustomer) {
      alert(`Invoice ${invObj.invoiceNumber} has already been sent to the customer.`);
      return;
    }
    if (window.confirm(`Are you sure you want to send Tax Invoice ${invObj.invoiceNumber} to ${invObj.customerName}? Once sent, the invoice will become locked and read-only.`)) {
      if (sendInvoiceToCustomer) {
        sendInvoiceToCustomer(invObj.id);
      }
      const updatedInv = {
        ...invObj,
        status: 'GENERATED' as const,
        sentToCustomer: true,
        sentAt: new Date().toISOString().split('T')[0]
      };
      addInvoice(updatedInv);
      setSubOrdersStore(prev => ({
        ...prev,
        [selectedSubOrderCode]: {
          ...prev[selectedSubOrderCode],
          invoice: updatedInv
        }
      }));
      setShowViewInvoiceModal(false);
      setShowGenerateInvoiceModal(false);
      setTargetInvoiceForModal(null);
      addAuditLog('Invoice Engine', `Sent Tax Invoice ${invObj.invoiceNumber} to Customer ${invObj.customerName}`);
      alert(`✔ Tax Invoice ${invObj.invoiceNumber} Sent to Customer! Navigating to Supplier Invoice Ledger...`);
      if (setActiveTab) {
        setActiveTab('invoices');
      }
    }
  };

  const handleDownloadPdf = (invObj: Invoice) => {
    addAuditLog('Invoice Engine', `Downloaded PDF for Tax Invoice ${invObj.invoiceNumber}`);
    alert(`📄 Downloading B2B Tax Invoice PDF...\n\nFilename: ${invObj.invoiceNumber}.pdf\nOrder Ref: ${invObj.orderNumber} / ${invObj.subOrderNumber || ''}\nTotal Amount: ₹${invObj.totalAmount.toLocaleString()}`);
  };

  const handleOpenRecordPaymentModal = (invObj: Invoice) => {
    setTargetInvoiceForModal(invObj);
    setPaymentAmountInput(invObj.balanceAmount);
    setPaymentMethodSelect('RTGS');
    setPaymentRefInput(`RTGS-HDFC-${Math.floor(100000 + Math.random() * 899999)}`);
    setShowRecordPaymentModal(true);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceForModal) return;

    const amt = Number(paymentAmountInput);
    if (amt <= 0) {
      alert('⚠ Invalid Payment Amount!');
      return;
    }

    recordInvoicePayment(targetInvoiceForModal.id, amt, paymentMethodSelect, paymentRefInput);

    const newPaid = (targetInvoiceForModal.paidAmount || 0) + amt;
    const newBal = targetInvoiceForModal.totalAmount - newPaid;
    const newStatus: InvoiceStatus = newBal <= 0 ? 'PAID' : 'PARTIAL_PAYMENT';

    const updatedInv: Invoice = {
      ...targetInvoiceForModal,
      paidAmount: newPaid,
      balanceAmount: Math.max(0, newBal),
      status: newStatus
    };

    setSubOrdersStore(prev => ({
      ...prev,
      [selectedSubOrderCode]: {
        ...prev[selectedSubOrderCode],
        invoice: updatedInv
      }
    }));

    setTargetInvoiceForModal(updatedInv);
    setShowRecordPaymentModal(false);

    alert(`✔ Payment Entry Submitted!\n\nInvoice: ${targetInvoiceForModal.invoiceNumber}\nAmount Paid: ₹${amt.toLocaleString()}\nMethod: ${paymentMethodSelect}\nUTR / Ref #: ${paymentRefInput}\nNew Status: ${newStatus.replace(/_/g, ' ')}\n\nAccounts Receivable updated successfully.`);
  };

  // Active Dispatches Queue (ONLY active non-closed shipments)
  const activeDispatchesList = Object.values(subOrdersStore)
    .filter((s: any) => s.shipment && s.shipment.shipmentStatus !== 'CLOSED')
    .map((s: any) => s.shipment);

  // Delivery History Archive (ONLY closed shipments)
  const activeClosedShipments = Object.values(subOrdersStore)
    .filter((s: any) => s.shipment && s.shipment.shipmentStatus === 'CLOSED')
    .map((s: any) => s.shipment);

  const deliveryHistoryList = [...activeClosedShipments, ...historicalShipments];

  // Helper: Format Time String
  const getTimeString = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' (Today)';
  };

  // Sequential Step Index Converter (Strictly 6 Logistics Stages)
  const getShipmentStepIndex = (status: ShipmentStatus) => {
    switch (status) {
      case 'DISPATCHED': return 1;
      case 'IN_TRANSIT': return 2;
      case 'OUT_FOR_DELIVERY': return 3;
      case 'DELIVERED': return 4;
      case 'POD_CONFIRMED': return 5;
      case 'CLOSED': return 6;
      default: return 1;
    }
  };

  const currentStepIdx = activeShipment ? getShipmentStepIndex(activeShipment.shipmentStatus) : 1;

  // Exact Shipment Router Handler
  const handleOpenSpecificShipment = (shipmentId: string, trackingNo: string) => {
    const match = Object.values(subOrdersStore).find((s: any) => s.shipment && (s.shipment.id === shipmentId || s.shipment.trackingNumber === trackingNo || s.subOrderNumber === trackingNo || s.subOrderNumber === shipmentId));
    
    if (match) {
      setSelectedSubOrderCode(match.subOrderNumber);
      try {
        localStorage.setItem('factorygrid_target_tracking', match.shipment.trackingNumber);
      } catch (e) { console.error(e); }
      setViewMode('DETAIL');
    } else {
      const histMatch = historicalShipments.find(s => s.id === shipmentId || s.trackingNumber === trackingNo || s.subOrderNumber === trackingNo);
      if (histMatch) {
        setSelectedSubOrderCode(histMatch.subOrderNumber);
        setViewMode('DETAIL');
      } else {
        setNotFoundTarget(trackingNo || shipmentId);
        setViewMode('NOT_FOUND');
      }
    }
  };

  // Synchronous Store Saver & Storage Event Dispatcher
  const saveAndSyncStore = (newStore: Record<string, any>) => {
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(newStore));
    } catch (e) {
      console.error('Failed to write suborders store to localStorage', e);
    }
    setSubOrdersStore(newStore);
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to dispatch storage event', e);
    }
  };

  // CREATE NEW SHIPMENT HANDLER
  const handleCreateShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const effectiveTransporter = transporterSelect === 'Other' ? customTransporter.trim() : transporterSelect;
    const timeStr = getTimeString();

    const newShipmentObj = {
      id: `SHP-${Date.now().toString().slice(-6)}`,
      trackingNumber: autoTrackingNo,
      subOrderNumber: activeSubOrder.subOrderNumber,
      masterOrderNumber: activeSubOrder.masterOrderNumber,
      poNumber: activeSubOrder.poNumber,
      customerName: activeSubOrder.customerName,
      manufacturerName: myMfgName,
      productName: activeSubOrder.productName,
      totalQuantity: activeSubOrder.totalQuantity,
      transporterName: effectiveTransporter,
      dispatchDate: dispDate,
      expectedDeliveryDate: expectedDeliveryDate,
      dispatchNotes: dispatchNotes.trim(),
      shipmentStatus: 'DISPATCHED' as ShipmentStatus,
      temperatureStatus: 'Normal / Compliant (2°C - 8°C)',
      currentTemp: '4.1°C',
      demoGpsLocation: 'Dispatch Bay — En route to Consignee',
      podStatus: 'PENDING',
      activityHistory: [
        {
          id: `act_${Date.now()}`,
          timestamp: timeStr,
          eventTitle: 'Shipment Dispatched',
          actor: myMfgName,
          details: `Dispatched via ${effectiveTransporter} (Tracking: ${autoTrackingNo})`
        }
      ]
    };

    const updatedStore = {
      ...subOrdersStore,
      [selectedSubOrderCode]: {
        ...subOrdersStore[selectedSubOrderCode],
        shipment: newShipmentObj
      }
    };

    saveAndSyncStore(updatedStore);
    try {
      localStorage.setItem('factorygrid_target_tracking', autoTrackingNo);
    } catch (err) { console.error(err); }

    addAuditLog('Dispatch Engine', `Created & Dispatched Shipment ${autoTrackingNo} for ${selectedSubOrderCode}`);
    alert(`✔ Shipment DISPATCHED Successfully!\n\nTracking #: ${autoTrackingNo}\nTransporter: ${effectiveTransporter}`);
    setViewMode('DETAIL');
  };

  // LOGISTICS ACTIONS
  const handleStartInTransit = () => {
    if (!activeShipment) return;
    const targetCode = activeShipment.subOrderNumber || selectedSubOrderCode;
    console.log('[MARK IN TRANSIT] Target code:', targetCode, 'Current status:', activeShipment.shipmentStatus);

    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Entered In Transit',
      actor: activeShipment.transporterName || 'Logistics Partner',
      details: `Shipment ${activeShipment.trackingNumber} entered transit route via vehicle ${activeShipment.vehicleNumber}`
    };

    const updatedShipment = {
      ...activeShipment,
      shipmentStatus: 'IN_TRANSIT' as ShipmentStatus,
      activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
    };

    const updatedStore = {
      ...subOrdersStore,
      [targetCode]: {
        ...subOrdersStore[targetCode],
        shipment: updatedShipment
      }
    };

    saveAndSyncStore(updatedStore);
    addAuditLog('Shipment Tracking', `Updated ${activeShipment.trackingNumber} status to IN TRANSIT`);
    alert(`✔ Shipment ${activeShipment.trackingNumber} is now IN TRANSIT.`);
  };

  const handleMarkOutForDelivery = () => {
    if (!activeShipment) return;
    const targetCode = activeShipment.subOrderNumber || selectedSubOrderCode;
    console.log('[MARK OUT FOR DELIVERY] Target code:', targetCode, 'Current status:', activeShipment.shipmentStatus);

    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Out for Delivery',
      actor: activeShipment.transporterName || 'Logistics Partner',
      details: `Shipment ${activeShipment.trackingNumber} is out for final mile delivery today`
    };

    const updatedShipment = {
      ...activeShipment,
      shipmentStatus: 'OUT_FOR_DELIVERY' as ShipmentStatus,
      activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
    };

    const updatedStore = {
      ...subOrdersStore,
      [targetCode]: {
        ...subOrdersStore[targetCode],
        shipment: updatedShipment
      }
    };

    saveAndSyncStore(updatedStore);
    addAuditLog('Shipment Tracking', `Updated ${activeShipment.trackingNumber} status to OUT FOR DELIVERY`);
    alert(`✔ Shipment ${activeShipment.trackingNumber} marked OUT FOR DELIVERY.`);
  };

  const handleConfirmDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    const targetCode = activeShipment.subOrderNumber || selectedSubOrderCode;
    console.log('[CONFIRM DELIVERY SUBMIT] Target code:', targetCode, 'Current status:', activeShipment.shipmentStatus);

    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Delivered',
      actor: `Buyer / ${delivReceiver}`,
      details: `Delivery confirmed at consignee facility. Received by ${delivReceiver}. Remarks: ${delivRemarks}`
    };

    const updatedShipment = {
      ...activeShipment,
      shipmentStatus: 'DELIVERED' as ShipmentStatus,
      actualDeliveryDate: delivDate,
      podReceiverName: delivReceiver,
      podDeliveryDate: undefined,
      podRemarks: delivRemarks,
      podStatus: 'PENDING',
      podDocName: undefined,
      activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
    };

    const updatedStore = {
      ...subOrdersStore,
      [targetCode]: {
        ...subOrdersStore[targetCode],
        shipment: updatedShipment
      }
    };

    saveAndSyncStore(updatedStore);
    setShowConfirmDeliveryModal(false);
    addAuditLog('Shipment Tracking', `Confirmed delivery for ${activeShipment.trackingNumber}. Receiver: ${delivReceiver}`);
    alert(`✔ Delivery Confirmed for ${activeShipment.trackingNumber}!\n\nStatus updated to DELIVERED. Upload & Confirm Proof of Delivery (POD) to proceed.`);
  };

  const handleConfirmPodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipment) return;
    if (!podReceiver.trim()) {
      alert('⚠ Receiver Name is required!');
      return;
    }
    if (!podDate) {
      alert('⚠ Delivery Date is required!');
      return;
    }
    if (!selectedPodFile && !activeShipment.podDocName) {
      alert('⚠ Please upload an actual Proof of Delivery (POD) document!');
      return;
    }

    const targetCode = activeShipment.subOrderNumber || selectedSubOrderCode;
    const docName = selectedPodFile?.name || activeShipment.podDocName || `POD_SIGNED_${targetCode}.pdf`;
    const docSize = selectedPodFile?.size || activeShipment.podFileSize || '2.4 MB';
    const docType = selectedPodFile?.type || activeShipment.podFileType || 'PDF';

    console.log('[CONFIRM POD SUBMIT] Target code:', targetCode, 'Document:', docName);

    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Proof of Delivery (POD) Confirmed',
      actor: `Buyer / ${activeShipment.customerName}`,
      details: `Electronic POD stamp & signature verified. Uploaded Document: ${docName} (${docType} • ${docSize})`
    };

    const updatedShipment = {
      ...activeShipment,
      shipmentStatus: 'POD_CONFIRMED' as ShipmentStatus,
      podStatus: 'CONFIRMED',
      podReceiverName: podReceiver.trim(),
      podDeliveryDate: podDate,
      podRemarks: podRemarksText.trim(),
      podDocName: docName,
      podFileSize: docSize,
      podFileType: docType,
      activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
    };

    const updatedStore = {
      ...subOrdersStore,
      [targetCode]: {
        ...subOrdersStore[targetCode],
        shipment: updatedShipment
      }
    };

    saveAndSyncStore(updatedStore);
    setShowPodModal(false);
    addAuditLog('Shipment Tracking', `Confirmed POD for ${activeShipment.trackingNumber}. File: ${docName}`);
    alert(`✔ Proof of Delivery (POD) Confirmed for ${activeShipment.trackingNumber}!\n\nUploaded File: ${docName}\nReceiver: ${podReceiver}\nStatus updated to POD CONFIRMED. Shipment can now be closed.`);
  };

  const handleCloseShipmentSubmit = () => {
    if (!activeShipment) return;
    const targetCode = activeShipment.subOrderNumber || selectedSubOrderCode;
    console.log('[CLOSE SHIPMENT SUBMIT] Target code:', targetCode, 'Current status:', activeShipment.shipmentStatus);

    const timeStr = getTimeString();
    const newActivity = {
      id: `act_${Date.now()}`,
      timestamp: timeStr,
      eventTitle: 'Shipment Closed',
      actor: 'System / Authorized User',
      details: 'Logistics lifecycle completed. Shipment archived to Delivery History.'
    };

    const updatedShipment = {
      ...activeShipment,
      shipmentStatus: 'CLOSED' as ShipmentStatus,
      activityHistory: [newActivity, ...(activeShipment.activityHistory || [])]
    };

    const updatedStore = {
      ...subOrdersStore,
      [targetCode]: {
        ...subOrdersStore[targetCode],
        shipment: updatedShipment
      }
    };

    saveAndSyncStore(updatedStore);
    setShowCloseShipmentModal(false);
    addAuditLog('Shipment Tracking', `Closed Shipment ${activeShipment.trackingNumber}`);
    alert(`✔ Shipment closed successfully after POD confirmation.\n\nShipment ${activeShipment.trackingNumber} archived to Delivery History.`);
    setViewMode('LIST');
    setActiveTabLocal('DELIVERY_HISTORY');
  };

  const isManufacturer = currentRole === 'SUPPLIER';
  const isAccounts = currentRole === 'ACCOUNTS_MANAGER' || currentRole === 'ADMIN';
  const isBuyer = currentRole === 'BUYER';

  // ERROR / NOT FOUND SCREEN
  if (viewMode === 'NOT_FOUND') {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 32, margin: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <AlertTriangle size={48} style={{ color: '#DC2626' }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>Shipment Not Found</h2>
        <div style={{ fontSize: 14, color: '#475569', background: '#F8FAFC', padding: '10px 16px', borderRadius: 6, border: '1px solid #E2E8F0', fontFamily: 'monospace' }}>
          Tracking / Shipment ID Parameter: <strong>{notFoundTarget}</strong>
        </div>
        <button
          onClick={() => { setViewMode('LIST'); setActiveTabLocal('ACTIVE_SHIPMENTS'); }}
          style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <ArrowLeft size={16} /> Back to Active Dispatches
        </button>
      </div>
    );
  }

  // DEDICATED FULL SHIPMENT DETAIL PAGE (FULL-PAGE VIEW)
  if (viewMode === 'DETAIL' && activeShipment) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>
        
        {/* Top Breadcrumb Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '14px 20px', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748B' }}>
            <button onClick={() => setViewMode('LIST')} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
              <ArrowLeft size={15} /> Back to Active Dispatches
            </button>
            <span>/</span>
            <span style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{activeShipment.trackingNumber}</span>
          </div>

          <span style={{ fontSize: 11.5, fontWeight: 800, padding: '4px 12px', borderRadius: 4, background: activeShipment.shipmentStatus === 'CLOSED' ? '#DCFCE7' : '#FEF3C7', color: activeShipment.shipmentStatus === 'CLOSED' ? '#15803D' : '#B45309', border: '1px solid #CBD5E1' }}>
            STATUS: {activeShipment.shipmentStatus.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Detailed Logistics Header */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, boxShadow: '0 2px 6px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                COLD-CHAIN SHIPMENT INSPECTOR
              </div>
              <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                SHIPMENT TRACKING #{activeShipment.trackingNumber}
              </h1>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                Consignee: <strong style={{ color: '#0F172A' }}>{activeShipment.customerName}</strong> | Dispatcher: <strong style={{ color: '#0F766E' }}>{activeShipment.manufacturerName}</strong>
              </div>
            </div>

            {/* Sequential Logistics Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {activeShipment.shipmentStatus === 'DISPATCHED' && (
                <button onClick={handleStartInTransit} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Mark In Transit →
                </button>
              )}

              {activeShipment.shipmentStatus === 'IN_TRANSIT' && (
                <button onClick={handleMarkOutForDelivery} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Mark Out For Delivery →
                </button>
              )}

              {activeShipment.shipmentStatus === 'OUT_FOR_DELIVERY' && (
                <button onClick={handleOpenConfirmDeliveryModal} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Confirm Delivery →
                </button>
              )}

              {activeShipment.shipmentStatus === 'DELIVERED' && (
                <button onClick={handleOpenPodModal} style={{ padding: '10px 22px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Upload & Confirm POD →
                </button>
              )}

              {activeShipment.shipmentStatus === 'POD_CONFIRMED' && (
                <button onClick={() => setShowCloseShipmentModal(true)} style={{ padding: '10px 22px', borderRadius: 8, background: '#166534', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                  Close Shipment →
                </button>
              )}

              {activeShipment.shipmentStatus === 'CLOSED' && (
                <span style={{ fontSize: 13, fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '8px 16px', borderRadius: 8, border: '1px solid #86EFAC' }}>
                  ✓ Shipment Lifecycle Closed
                </span>
              )}

              {/* Quick Invoice Trigger Button */}
              {activeInvoice ? (
                <button
                  onClick={() => { setTargetInvoiceForModal(activeInvoice); setShowViewInvoiceModal(true); }}
                  style={{ padding: '10px 18px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Receipt size={16} /> View Invoice ({activeInvoice.invoiceNumber})
                </button>
              ) : null}
            </div>
          </div>

          {/* Stored Logistics Information Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, fontSize: 13, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Master Order:</span>
              <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>{activeShipment.masterOrderNumber}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Sub-Order:</span>
              <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{activeShipment.subOrderNumber}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Purchase Order:</span>
              <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{activeShipment.poNumber}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Order Quantity:</span>
              <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>{formatNumber(activeShipment.totalQuantity)} Units</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Transporter / Logistics:</span>
              <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{activeShipment.transporterName}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Vehicle Number:</span>
              <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{activeShipment.vehicleNumber}</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Driver Details:</span>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{activeShipment.driverName} ({activeShipment.driverPhone})</div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Dispatch / Delivery Dates:</span>
              <div style={{ fontWeight: 700, color: '#1D4ED8', marginTop: 2 }}>{activeShipment.dispatchDate} → {activeShipment.expectedDeliveryDate}</div>
            </div>

            {activeShipment.dispatchNotes && (
              <div style={{ gridColumn: '1 / -1', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: 12, marginTop: 4 }}>
                <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Dispatch Notes / Remarks:</span>
                <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 4, whiteSpace: 'pre-wrap', fontSize: 12.5 }}>
                  {activeShipment.dispatchNotes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LOGISTICS LIFECYCLE STEPPER TIMELINE (6 STEPS) */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 14 }}>
            LOGISTICS LIFECYCLE STAGE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, fontSize: 11.5 }}>
            {[
              { label: 'Dispatched', step: 1 },
              { label: 'In Transit', step: 2 },
              { label: 'Out For Delivery', step: 3 },
              { label: 'Delivered', step: 4 },
              { label: 'POD Confirmed', step: 5 },
              { label: 'Closed', step: 6 }
            ].map(st => {
              const isCompleted = currentStepIdx > st.step;
              const isCurrent = currentStepIdx === st.step;
              const isLocked = currentStepIdx < st.step;

              return (
                <div key={st.step} style={{ background: isCurrent ? '#F0FDFA' : isCompleted ? '#F8FAFC' : '#F1F5F9', border: isCurrent ? '2px solid #0F766E' : isCompleted ? '1px solid #86EFAC' : '1px solid #E2E8F0', borderRadius: 8, padding: 10, opacity: isLocked ? 0.55 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: isCurrent ? '#0F766E' : isCompleted ? '#16A34A' : '#64748B' }}>STEP 0{st.step}</span>
                    {isCompleted ? <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span> : isCurrent ? <span style={{ color: '#0F766E', fontWeight: 800 }}>●</span> : <span style={{ color: '#94A3B8', fontSize: 10 }}>🔒</span>}
                  </div>
                  <div style={{ fontWeight: isCurrent || isCompleted ? 800 : 500, color: isCurrent ? '#0F766E' : isCompleted ? '#0F172A' : '#64748B', marginTop: 4 }}>
                    {st.label} {isCurrent ? '[CURRENT]' : isLocked ? '[LOCKED]' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PROOF OF DELIVERY CARD (VISIBLE IF DELIVERED, POD_CONFIRMED, OR CLOSED) */}
        {(activeShipment.shipmentStatus === 'DELIVERED' || activeShipment.shipmentStatus === 'POD_CONFIRMED' || activeShipment.shipmentStatus === 'CLOSED') && (
          <div style={{ background: '#FFFFFF', border: '1px solid #99F6E4', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} /> PROOF OF DELIVERY (POD) DOCUMENT & RECEIPT
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12.5, background: '#F0FDFA', padding: 14, borderRadius: 8, border: '1px solid #CCFBF1' }}>
              <div>Received By: <strong style={{ color: '#0F172A' }}>{activeShipment.podReceiverName || 'Pending Receiver Confirmation'}</strong></div>
              <div>Delivery Date: <strong>{activeShipment.podDeliveryDate || activeShipment.actualDeliveryDate || 'Pending Delivery'}</strong></div>
              <div>POD Status: <strong style={{ color: activeShipment.podStatus === 'CONFIRMED' ? '#16A34A' : '#D97706' }}>{activeShipment.podStatus === 'CONFIRMED' ? '✓ CONFIRMED' : 'PENDING'}</strong></div>
              <div>POD File: <strong style={{ color: activeShipment.podDocName ? '#0F766E' : '#64748B', fontFamily: 'monospace' }}>{activeShipment.podDocName || 'No Document Uploaded Yet'}</strong></div>
            </div>

            {activeShipment.podRemarks && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#334155' }}>
                <strong>Consignee Remarks:</strong> {activeShipment.podRemarks}
              </div>
            )}

            {/* Stage Action Button inside POD Card */}
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              {activeShipment.shipmentStatus === 'DELIVERED' && (
                <button
                  onClick={handleOpenPodModal}
                  style={{ padding: '9px 20px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.2)' }}
                >
                  <FileText size={15} /> Upload & Confirm POD →
                </button>
              )}

              {activeShipment.shipmentStatus === 'POD_CONFIRMED' && (
                <button
                  onClick={() => setShowCloseShipmentModal(true)}
                  style={{ padding: '9px 20px', borderRadius: 8, background: '#166534', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(22,101,52,0.2)' }}
                >
                  <CheckCircle2 size={15} /> Close Shipment →
                </button>
              )}

              {activeShipment.shipmentStatus === 'CLOSED' && (
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '6px 14px', borderRadius: 6, border: '1px solid #86EFAC' }}>
                  ✓ Shipment Lifecycle Closed & Archived
                </span>
              )}
            </div>
          </div>
        )}

        {/* BUYER GOODS RECEIPT CONFIRMATION CARD */}
        {activeShipment && (activeShipment.shipmentStatus === 'DELIVERED' || activeShipment.shipmentStatus === 'POD_CONFIRMED' || activeShipment.shipmentStatus === 'CLOSED') && (
          <div style={{ background: '#FFFFFF', border: '1px solid #86EFAC', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#166534', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={16} /> BUYER GOODS RECEIPT CONFIRMATION
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: activeShipment.goodsReceipt ? '#DCFCE7' : '#FEF3C7', color: activeShipment.goodsReceipt ? '#15803D' : '#B45309', border: `1px solid ${activeShipment.goodsReceipt ? '#86EFAC' : '#FDE68A'}` }}>
                {activeShipment.goodsReceipt ? `✓ ${activeShipment.goodsReceipt.status.replace(/_/g, ' ')}` : 'PENDING BUYER CONFIRMATION'}
              </span>
            </div>

            {activeShipment.goodsReceipt ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, fontSize: 12.5, background: '#F0FDF4', padding: 14, borderRadius: 8, border: '1px solid #BBF7D0' }}>
                  <div>Received Qty: <strong style={{ color: '#166534', fontFamily: 'monospace' }}>{activeShipment.goodsReceipt.receivedQuantity?.toLocaleString()} Units</strong></div>
                  <div>Missing Qty: <strong style={{ color: activeShipment.goodsReceipt.missingQuantity > 0 ? '#DC2626' : '#64748B', fontFamily: 'monospace' }}>{activeShipment.goodsReceipt.missingQuantity?.toLocaleString()} Units</strong></div>
                  <div>Damaged Qty: <strong style={{ color: activeShipment.goodsReceipt.damagedQuantity > 0 ? '#DC2626' : '#64748B', fontFamily: 'monospace' }}>{activeShipment.goodsReceipt.damagedQuantity?.toLocaleString()} Units</strong></div>
                  <div>Condition: <strong>{activeShipment.goodsReceipt.condition}</strong></div>
                  <div>Received Date: <strong>{activeShipment.goodsReceipt.receivedDate}</strong></div>
                  <div>Received By: <strong>{activeShipment.goodsReceipt.receivedBy}</strong></div>
                </div>

                {activeShipment.goodsReceipt.receivingRemarks && (
                  <div style={{ fontSize: 12, color: '#166534', background: '#FFFFFF', padding: '8px 12px', borderRadius: 6, border: '1px solid #BBF7D0' }}>
                    <strong>Buyer Remarks:</strong> {activeShipment.goodsReceipt.receivingRemarks}
                  </div>
                )}

                {activeShipment.goodsReceipt.grnDocumentName && (
                  <div style={{ fontSize: 12, color: '#0F766E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={14} /> GRN Document: <strong>{activeShipment.goodsReceipt.grnDocumentName}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#78350F', background: '#FEF3C7', padding: 12, borderRadius: 8, border: '1px solid #FDE68A' }}>
                Goods Receipt is pending buyer physical package verification. {isBuyer ? 'Please navigate to Order Details / Tracking View to confirm Goods Received.' : 'Manufacturer will receive real-time telemetry when Buyer confirms receipt.'}
              </div>
            )}
          </div>
        )}

        {/* FINANCIAL INVOICE & ACCOUNTS RECEIVABLE (AR) CONTROL CARD */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  FINANCIAL INVOICE & ACCOUNTS RECEIVABLE (AR)
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  Sub-Order Tax Invoice & Ledger Status
                </h3>
              </div>
            </div>

            {activeInvoice ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {renderInvoiceStatusChip(activeInvoice)}
                <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>
                  {activeInvoice.invoiceNumber}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 4, background: '#F1F5F9', color: '#64748B' }}>
                INVOICE NOT UPLOADED
              </span>
            )}
          </div>

          {activeInvoice ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, color: '#334155' }}>
                  Tax Invoice <strong>{activeInvoice.invoiceNumber}</strong> issued on <strong>{activeInvoice.invoiceDate}</strong> (Due: <strong>{activeInvoice.dueDate}</strong>)
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setTargetInvoiceForModal(activeInvoice); setShowViewInvoiceModal(true); }}
                    style={{ padding: '8px 14px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Eye size={14} /> Invoice Preview
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(activeInvoice)}
                    style={{ padding: '8px 14px', borderRadius: 6, background: '#FFFFFF', color: '#0F766E', border: '1px solid #0F766E', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={14} /> Download PDF
                  </button>

                  {isManufacturer && (
                    <button
                      onClick={() => handleSendInvoiceToCustomer(activeInvoice)}
                      style={{ padding: '8px 14px', borderRadius: 6, background: activeInvoice.sentToCustomer ? '#F0FDF4' : '#EFF6FF', color: activeInvoice.sentToCustomer ? '#16A34A' : '#2563EB', border: activeInvoice.sentToCustomer ? '1px solid #BBF7D0' : '1px solid #BFDBFE', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Send size={14} /> {activeInvoice.sentToCustomer ? 'Resend to Customer ✓' : 'Send to Customer'}
                    </button>
                  )}
                </div>
              </div>

              {/* Accounts Receivable (AR) Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Invoice Amount</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>
                    ₹{activeInvoice.totalAmount.toLocaleString()}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Received Amount</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 2 }}>
                    ₹{(activeInvoice.paidAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Balance Due</span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: activeInvoice.balanceAmount > 0 ? '#D97706' : '#16A34A', fontFamily: 'monospace', marginTop: 2 }}>
                    ₹{(activeInvoice.balanceAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Due Date</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1D4ED8', marginTop: 4 }}>
                    {activeInvoice.dueDate}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Payment Status</span>
                  <div style={{ marginTop: 4 }}>
                    {renderInvoiceStatusChip(activeInvoice)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                  {activeInvoice.balanceAmount > 0 ? (
                    isAccounts ? (
                      <button
                        onClick={() => handleOpenRecordPaymentModal(activeInvoice)}
                        style={{ padding: '8px 16px', borderRadius: 6, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Plus size={14} /> Record Payment
                      </button>
                    ) : isBuyer ? (
                      Boolean(activeInvoice.uploadedFileUrl || activeInvoice.uploadedFileName) ? (
                        <button
                          onClick={() => alert(`Online Payment Gateway:\n\nInitiating secure payment for Invoice ${activeInvoice.invoiceNumber}.\nOutstanding Balance: ₹${activeInvoice.balanceAmount.toLocaleString()}`)}
                          style={{ padding: '8px 16px', borderRadius: 6, background: '#166534', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          Pay Now →
                        </button>
                      ) : (
                        <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>Awaiting Invoice PDF</span>
                      )
                    ) : null
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '6px 12px', borderRadius: 6, border: '1px solid #86EFAC' }}>
                      ✓ Paid in Full
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>No B2B Tax Invoice uploaded yet for this sub-order.</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  <span>Upload the manual B2B invoice PDF for this sub-order to proceed.</span>
                </div>
              </div>

              {isManufacturer && (
                <button
                  onClick={handleOpenGenerateInvoiceModal}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Upload size={14} /> Upload Invoice PDF
                </button>
              )}
            </div>
          )}
        </div>

        {/* ACTIVITY AUDIT TRAIL */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>
            <Activity size={18} style={{ color: '#0F766E' }} />
            <span>SHIPMENT ACTIVITY AUDIT TRAIL</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeShipment.activityHistory?.map((act: any, idx: number) => (
              <div key={act.id || idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E' }}>
                    ✓ {act.eventTitle}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{act.timestamp}</span>
                </div>
                <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 600 }}>
                  By: <strong style={{ color: '#1E293B' }}>{act.actor}</strong>
                </div>
                {act.details && (
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{act.details}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modals Container */}
        {/* MODAL: GENERATE INVOICE */}
        {showGenerateInvoiceModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '20px 10px' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', background: '#F8FAFC', borderRadius: 16, padding: 16, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '1px solid #CBD5E1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={18} style={{ color: '#2563EB' }} /> Upload B2B Tax Invoice PDF for Shipment #{activeShipment?.trackingNumber || activeShipment?.subOrderNumber}
                </div>
                <button onClick={() => setShowGenerateInvoiceModal(false)} style={{ padding: '6px 14px', borderRadius: 6, background: '#334155', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Close Workspace ✕</button>
              </div>
              <InvoiceModule
                initialViewMode="WORKSPACE"
                initialData={{
                  orderNumber: activeSubOrder?.masterOrderNumber || activeShipment?.masterOrderNumber,
                  subOrderNumber: activeSubOrder?.subOrderNumber || activeShipment?.subOrderNumber,
                  customerName: activeSubOrder?.customerName || activeShipment?.customerName,
                  manufacturerName: activeSubOrder?.manufacturerName || activeShipment?.manufacturerName,
                  productName: activeSubOrder?.productName || activeShipment?.productName,
                  totalQuantity: activeSubOrder?.totalQuantity || activeShipment?.totalQuantity,
                  orderValue: activeSubOrder?.orderValue || activeShipment?.totalOrderValue,
                }}
                onComplete={(createdInvoice) => {
                  setShowGenerateInvoiceModal(false);
                  if (activeSubOrder) {
                    activeSubOrder.invoice = createdInvoice;
                    activeSubOrder.invoiceStatus = 'GENERATED';
                  }
                  if (setActiveTab) {
                    setActiveTab('invoices');
                  }
                }}
                onCancel={() => setShowGenerateInvoiceModal(false)}
              />
            </div>
          </div>
        )}
        {/* MODAL: VIEW TAX INVOICE & PDF VIEWER */}
        {showViewInvoiceModal && targetInvoiceForModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowViewInvoiceModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.3)', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '92vh', overflowY: 'auto' }}>
              
              {/* Invoice Toolbar Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={22} style={{ color: '#0F766E' }} />
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      B2B TAX INVOICE — {targetInvoiceForModal.invoiceNumber}
                    </h3>
                    <span style={{ fontSize: 11.5, color: '#64748B' }}>Official B2B Pharmaceutical Invoice Document</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleDownloadPdf(targetInvoiceForModal)}
                    style={{ padding: '7px 14px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={14} /> Download PDF
                  </button>

                  <button
                    onClick={() => handleSendInvoiceToCustomer(targetInvoiceForModal)}
                    style={{ padding: '7px 14px', borderRadius: 6, background: targetInvoiceForModal.sentToCustomer ? '#F0FDF4' : '#EFF6FF', color: targetInvoiceForModal.sentToCustomer ? '#16A34A' : '#2563EB', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={14} /> {targetInvoiceForModal.sentToCustomer ? 'Sent to Customer ✓' : 'Send to Customer'}
                  </button>

                  <button onClick={() => setShowViewInvoiceModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
                </div>
              </div>

              {/* Tax Invoice Document Preview Container */}
              {targetInvoiceForModal.uploadedFileUrl ? (
                <div style={{ height: 600, width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #CBD5E1', background: '#FFFFFF' }}>
                  <iframe
                    src={targetInvoiceForModal.uploadedFileUrl}
                    title="Invoice PDF Preview"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              ) : (
                <div style={{ background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, fontSize: 13, color: '#0F172A' }}>
                  
                  {/* Invoice Letterhead */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F766E', paddingBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#0F766E', letterSpacing: '-0.02em' }}>
                        {targetInvoiceForModal.manufacturerName || myMfgName}
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                        Plot No. 42-45, EPIP Phase I, Baddi, Himachal Pradesh - 173205
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                        GSTIN: <strong>02AAACS1234F1Z9</strong> | Mfg License: <strong>ML-HP-2024-001</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        TAX INVOICE
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: 2 }}>
                        {targetInvoiceForModal.invoiceNumber}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        {renderInvoiceStatusChip(targetInvoiceForModal)}
                      </div>
                    </div>
                  </div>

                  {/* Party Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Billed & Shipped To (Customer)</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{targetInvoiceForModal.customerName}</div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Customer Code: <strong>{targetInvoiceForModal.customerCode || 'CUS000101'}</strong></div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>GSTIN: 27AAACA9876E1Z2 | PAN: AAACA9876E</div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Consignee Facility: Industrial Zone, Phase I, Delhi</div>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Invoice & Order References</div>
                      <div>Master Order #: <strong style={{ fontFamily: 'monospace' }}>{targetInvoiceForModal.orderNumber}</strong></div>
                      <div>Sub-Order #: <strong style={{ fontFamily: 'monospace', color: '#0F766E' }}>{targetInvoiceForModal.subOrderNumber || activeSubOrder.subOrderNumber}</strong></div>
                      <div>Invoice Date: <strong>{targetInvoiceForModal.invoiceDate}</strong></div>
                      <div>Due Date: <strong style={{ color: '#1D4ED8' }}>{targetInvoiceForModal.dueDate}</strong></div>
                      <div>Payment Terms: <strong>Net 30 Days</strong></div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>INVOICE DOCUMENT STATUS</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#15803D', marginTop: 2 }}>✓ Uploaded Tax Invoice PDF</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>TOTAL INVOICE VALUE</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{targetInvoiceForModal.totalAmount?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons in Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {targetInvoiceForModal.sentToCustomer ? (
                    <span style={{ color: '#16A34A', fontWeight: 700 }}>✓ Dispatched to customer on {targetInvoiceForModal.sentAt || 'Today'}</span>
                  ) : (
                    <span>Not sent to customer yet</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {targetInvoiceForModal.balanceAmount > 0 && isAccounts && (
                    <button
                      onClick={() => handleOpenRecordPaymentModal(targetInvoiceForModal)}
                      style={{ padding: '9px 18px', borderRadius: 6, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} /> Record Payment
                    </button>
                  )}
                  {targetInvoiceForModal.balanceAmount > 0 && isBuyer && (
                    <button
                      onClick={() => alert(`Online Payment Gateway:\n\nInitiating secure payment for Invoice ${targetInvoiceForModal.invoiceNumber}.\nOutstanding Balance: ₹${targetInvoiceForModal.balanceAmount.toLocaleString()}`)}
                      style={{ padding: '9px 18px', borderRadius: 6, background: '#166534', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                    >
                      Pay Now →
                    </button>
                  )}
                  <button onClick={() => setShowViewInvoiceModal(false)} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: RECORD PAYMENT (Finance & Accounts Only) */}
        {showRecordPaymentModal && targetInvoiceForModal && isAccounts && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowRecordPaymentModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Record Invoice Payment</h3>
                <button onClick={() => setShowRecordPaymentModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5 }}>
                  <div>Invoice Ref: <strong>{targetInvoiceForModal.invoiceNumber}</strong></div>
                  <div>Customer: <strong>{targetInvoiceForModal.customerName}</strong></div>
                  <div>Outstanding Balance: <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>₹{targetInvoiceForModal.balanceAmount?.toLocaleString()}</strong></div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Payment Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    max={targetInvoiceForModal.balanceAmount}
                    value={paymentAmountInput}
                    onChange={e => setPaymentAmountInput(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 14, fontFamily: 'monospace', fontWeight: 800, color: '#16A34A' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Payment Method *</label>
                  <select
                    value={paymentMethodSelect}
                    onChange={e => setPaymentMethodSelect(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}
                  >
                    <option value="RTGS">RTGS Bank Remittance</option>
                    <option value="NEFT">NEFT Transfer</option>
                    <option value="UPI">UPI Digital Payment</option>
                    <option value="CHEQUE">Cheque Clearance</option>
                    <option value="CREDIT_LINE">Credit Line Settlement</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Transaction UTR / Reference Number *</label>
                  <input
                    type="text"
                    required
                    value={paymentRefInput}
                    onChange={e => setPaymentRefInput(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setShowRecordPaymentModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Post Payment to Ledger →</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showConfirmDeliveryModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowConfirmDeliveryModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Confirm Delivery</h3>
                <button onClick={() => setShowConfirmDeliveryModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleConfirmDeliverySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Received By *</label>
                  <input type="text" required value={delivReceiver} onChange={e => setDelivReceiver(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Date *</label>
                  <input type="date" required value={delivDate} onChange={e => setDelivDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Remarks</label>
                  <textarea rows={2} value={delivRemarks} onChange={e => setDelivRemarks(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setShowConfirmDeliveryModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Confirm Delivery →</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPodModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowPodModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Confirm Proof of Delivery (POD)</h3>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Sub-Order: <strong>{activeSubOrder?.subOrderNumber}</strong></div>
                </div>
                <button onClick={() => setShowPodModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <form onSubmit={handleConfirmPodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Receiver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter consignee / receiving officer name"
                    value={podReceiver}
                    onChange={e => setPodReceiver(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={podDate}
                    onChange={e => setPodDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    POD Document * <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>(PDF, JPG, JPEG, PNG • Max 10MB)</span>
                  </label>

                  {!selectedPodFile && !activeShipment?.podDocName ? (
                    <div
                      onClick={() => podFileInputRef.current?.click()}
                      style={{
                        border: '2px dashed #99F6E4',
                        borderRadius: 8,
                        padding: '20px 16px',
                        textAlign: 'center',
                        background: '#F0FDFA',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Upload size={24} style={{ color: '#0F766E', marginBottom: 6 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E' }}>
                        Click to upload or drag & drop Proof of Delivery file
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                        Supported: PDF, JPG, JPEG, PNG (Max 10 MB)
                      </div>
                      <input
                        ref={podFileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                        style={{ display: 'none' }}
                        onChange={handlePodFileChange}
                      />
                    </div>
                  ) : (
                    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                            ✓ {selectedPodFile?.name || activeShipment?.podDocName}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                            {selectedPodFile?.type || activeShipment?.podFileType || 'PDF'} • {selectedPodFile?.size || activeShipment?.podFileSize || '2.4 MB'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => podFileInputRef.current?.click()}
                          style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, border: '1px solid #CBD5E1', background: '#FFF', color: '#0F766E', cursor: 'pointer' }}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPodFile(null)}
                          style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                        <input
                          ref={podFileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                          style={{ display: 'none' }}
                          onChange={handlePodFileChange}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Enter any delivery verification remarks or seal checks..."
                    value={podRemarksText}
                    onChange={e => setPodRemarksText(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                  <button type="button" onClick={() => setShowPodModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button
                    type="submit"
                    disabled={!podReceiver.trim() || !podDate || (!selectedPodFile && !activeShipment?.podDocName)}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 6,
                      border: 'none',
                      background: (!podReceiver.trim() || !podDate || (!selectedPodFile && !activeShipment?.podDocName)) ? '#94A3B8' : '#0F766E',
                      color: '#FFF',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: (!podReceiver.trim() || !podDate || (!selectedPodFile && !activeShipment?.podDocName)) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Confirm POD →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCloseShipmentModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowCloseShipmentModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Close Shipment?</h3>
                <button onClick={() => setShowCloseShipmentModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
                Delivery and Proof of Delivery (POD) have been confirmed. Closing this shipment will complete the logistics lifecycle and archive the record to Delivery History.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowCloseShipmentModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={handleCloseShipmentSubmit} style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#166534', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Close Shipment →</button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // LIST / QUEUE MAIN VIEW
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* TOP COMMAND HEADER */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '18px 24px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pharma Cold-Chain Logistics & Dispatch Control
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>
            DISPATCH & TRACKING CONTROL DESK
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Dedicated logistics & shipment management (Starts at Dispatched when production reaches Ready To Dispatch)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            value={selectedSubOrderCode}
            onChange={e => {
              setSelectedSubOrderCode(e.target.value);
              try { localStorage.setItem('factorygrid_target_suborder', e.target.value); } catch(err){}
            }}
            style={{ padding: '8px 12px', fontSize: 13, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontWeight: 800, fontFamily: 'monospace', cursor: 'pointer' }}
          >
            {Object.values(subOrdersStore).map((ord: any) => (
              <option key={ord.subOrderNumber} value={ord.subOrderNumber}>
                {ord.subOrderNumber} ({ord.customerName})
              </option>
            ))}
          </select>

          {/* Cold-Chain Telemetry Badge — Only rendered if configured for Cold Chain */}
          {(activeSubOrder?.isColdChain || activeShipment?.isColdChain) && (
            <div style={{ padding: '6px 14px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 6, fontSize: 12, color: '#0F766E', fontWeight: 700 }}>
              Cold-Chain Telemetry: <strong style={{ color: '#16A34A' }}>Active ({activeShipment?.currentTemp || '2.0°C–8.0°C'}) ✓</strong>
            </div>
          )}
        </div>
      </div>

      {/* SUB NAVIGATION TABS */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, display: 'flex', borderBottom: 'none', overflow: 'hidden' }}>
        <button onClick={() => { setViewMode('LIST'); setActiveTabLocal('ACTIVE_SHIPMENTS'); }} style={{ padding: '12px 20px', border: 'none', background: activeTabLocal === 'ACTIVE_SHIPMENTS' ? '#0F766E' : 'transparent', color: activeTabLocal === 'ACTIVE_SHIPMENTS' ? '#FFFFFF' : '#475569', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
          Active Dispatches ({activeDispatchesList.length})
        </button>
        {isManufacturer && (
          <button onClick={() => { setViewMode('LIST'); setActiveTabLocal('CREATE_SHIPMENT'); }} style={{ padding: '12px 20px', border: 'none', background: activeTabLocal === 'CREATE_SHIPMENT' ? '#0F766E' : 'transparent', color: activeTabLocal === 'CREATE_SHIPMENT' ? '#FFFFFF' : '#475569', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Create Dispatch
          </button>
        )}
        <button onClick={() => { setViewMode('LIST'); setActiveTabLocal('DELIVERY_HISTORY'); }} style={{ padding: '12px 20px', border: 'none', background: activeTabLocal === 'DELIVERY_HISTORY' ? '#0F766E' : 'transparent', color: activeTabLocal === 'DELIVERY_HISTORY' ? '#FFFFFF' : '#475569', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
          Delivery History ({deliveryHistoryList.length})
        </button>
        <button onClick={() => { setViewMode('LIST'); setActiveTabLocal('POD_VIEW'); }} style={{ padding: '12px 20px', border: 'none', background: activeTabLocal === 'POD_VIEW' ? '#0F766E' : 'transparent', color: activeTabLocal === 'POD_VIEW' ? '#FFFFFF' : '#475569', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
          Proof of Delivery (POD)
        </button>
      </div>

      {/* ACTIVE DISPATCHES LIST QUEUE */}
      {activeTabLocal === 'ACTIVE_SHIPMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* FOCUSED SUB-ORDER LOGISTICS STATUS CARD */}
          <div style={{ background: '#FFFFFF', border: '1px solid #99F6E4', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  FOCUSED SUB-ORDER LOGISTICS STATUS
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>
                  Sub-Order: {activeSubOrder.subOrderNumber} ({activeSubOrder.customerName})
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                  Master Order: {activeSubOrder.masterOrderNumber} | Product: {activeSubOrder.productName}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#DCFCE7' : '#EFF6FF', color: activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#15803D' : '#1D4ED8', border: '1px solid #CBD5E1' }}>
                  Production: {activeSubOrder.productionStatus?.replace(/_/g, ' ')}
                </span>

                {activeShipment && (
                  <button
                    onClick={() => setViewMode('DETAIL')}
                    style={{ padding: '8px 16px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Truck size={14} /> Inspect Active Shipment ({activeShipment.trackingNumber}) →
                  </button>
                )}

                {isManufacturer && (
                  <button
                    onClick={() => {
                      if (activeSubOrder.productionStatus !== 'READY_TO_DISPATCH' && activeSubOrder.productionStatus !== 'COMPLETED') {
                        alert('⚠ Shipment Creation Blocked!\n\nThis sub-order has not reached "Ready to Dispatch" stage in Production Planning yet. Complete manufacturing execution up to Step 07 — Ready to Dispatch before creating a dispatch record.');
                        return;
                      }
                      setViewMode('LIST');
                      setActiveTabLocal('CREATE_SHIPMENT');
                    }}
                    style={{
                      padding: '8px 18px', borderRadius: 6,
                      background: (activeSubOrder.productionStatus === 'READY_TO_DISPATCH' || activeSubOrder.productionStatus === 'COMPLETED') ? '#0F766E' : '#94A3B8',
                      color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5,
                      cursor: (activeSubOrder.productionStatus === 'READY_TO_DISPATCH' || activeSubOrder.productionStatus === 'COMPLETED') ? 'pointer' : 'not-allowed',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      opacity: (activeSubOrder.productionStatus === 'READY_TO_DISPATCH' || activeSubOrder.productionStatus === 'COMPLETED') ? 1 : 0.65
                    }}
                  >
                    <Plus size={14} /> Create Dispatch
                  </button>
                )}
              </div>
            </div>

            {!activeShipment && (
              <div style={{ background: activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#F0FDFA' : '#F8FAFC', border: `1px dashed ${activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#99F6E4' : '#CBD5E1'}`, borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Package size={20} style={{ color: activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#0F766E' : '#64748B' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: activeSubOrder.productionStatus === 'READY_TO_DISPATCH' ? '#0F766E' : '#334155' }}>
                      {activeSubOrder.productionStatus === 'READY_TO_DISPATCH'
                        ? '✔ Production Completed — Sub-Order Ready for Dispatch'
                        : `Production Status: ${(activeSubOrder?.productionStatus || 'IN_PRODUCTION').replace(/_/g, ' ')}`}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      {activeSubOrder.productionStatus === 'READY_TO_DISPATCH'
                        ? 'Click the "Create Dispatch" button above to generate a shipment record.'
                        : 'Shipment creation becomes available after manufacturing reaches Ready To Dispatch.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              ALL ACTIVE DISPATCHES QUEUE ({activeDispatchesList.length})
            </div>

          {activeDispatchesList.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 13.5, color: '#64748B', fontWeight: 600, background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8 }}>
              No active dispatches. Create a dispatch after the sub-order reaches Ready to Dispatch.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: 12 }}>TRACKING #</th>
                    <th style={{ padding: 12 }}>SUB-ORDER</th>
                    <th style={{ padding: 12 }}>CUSTOMER</th>
                    <th style={{ padding: 12 }}>TRANSPORTER</th>
                    <th style={{ padding: 12 }}>VEHICLE #</th>
                    <th style={{ padding: 12 }}>DISPATCH DATE</th>
                    <th style={{ padding: 12 }}>EXPECTED DELIVERY</th>
                    <th style={{ padding: 12 }}>STATUS</th>
                    <th style={{ padding: 12, textAlign: 'right', paddingRight: 16 }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDispatchesList.map((shp: any) => (
                    <tr
                      key={shp.id}
                      onClick={() => handleOpenSpecificShipment(shp.id, shp.trackingNumber)}
                      style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      <td style={{ padding: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                        {shp.trackingNumber}
                      </td>
                      <td style={{ padding: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                        {shp.subOrderNumber}
                      </td>
                      <td style={{ padding: 12, fontWeight: 700, color: '#0F172A' }}>
                        {shp.customerName}
                      </td>
                      <td style={{ padding: 12, color: '#334155' }}>
                        {shp.transporterName}
                      </td>
                      <td style={{ padding: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                        {shp.vehicleNumber}
                      </td>
                      <td style={{ padding: 12, color: '#64748B' }}>
                        {shp.dispatchDate}
                      </td>
                      <td style={{ padding: 12, fontWeight: 700, color: '#1D4ED8' }}>
                        {shp.expectedDeliveryDate}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #CBD5E1' }}>
                          {shp.shipmentStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', paddingRight: 16 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSpecificShipment(shp.id, shp.trackingNumber);
                          }}
                          style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          View Shipment →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      {/* CREATE SHIPMENT FORM */}
      {activeTabLocal === 'CREATE_SHIPMENT' && isManufacturer && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Create Cold-Chain Dispatch Request</h2>

          <form onSubmit={handleCreateShipmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Order Summary Box */}
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 16, fontSize: 12.5, color: '#0F766E', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>Sub-Order: <strong>{activeSubOrder.subOrderNumber}</strong></div>
                <div>PO Ref: <strong>{activeSubOrder.poNumber}</strong></div>
                <div>Customer: <strong>{activeSubOrder.customerName}</strong></div>
                <div>Manufacturer: <strong>{myMfgName}</strong></div>
                <div>Quantity: <strong>{formatNumber(activeSubOrder.totalQuantity)} Units</strong></div>
                <div>Production Status: <strong style={{ color: '#16A34A' }}>READY TO DISPATCH ✓</strong></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Logistics Transporter *</label>
                  <select
                    value={transporterSelect}
                    onChange={e => {
                      if (e.target.value === 'ADD_NEW_PARTNER') {
                        setShowAddPartnerModal(true);
                      } else {
                        setTransporterSelect(e.target.value);
                      }
                    }}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}
                  >
                    {allTransporters.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Other">Other Transporter...</option>
                    <option value="ADD_NEW_PARTNER" style={{ fontWeight: 700, color: '#0F766E' }}>Add New Logistics Partner</option>
                  </select>

                  {transporterSelect === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom transporter name"
                      required
                      value={customTransporter}
                      onChange={e => setCustomTransporter(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, marginTop: 8 }}
                    />
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Auto-Generated Tracking #</label>
                  <input
                    type="text"
                    readOnly
                    value={autoTrackingNo}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', background: '#F8FAFC', fontWeight: 800, color: '#0F766E' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Dispatch Date *</label>
                  <input
                    type="date"
                    required
                    value={dispDate}
                    onChange={e => {
                      setDispDate(e.target.value);
                      setExpectedDeliveryDate(calcDeliveryDate(e.target.value));
                    }}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Expected Delivery Date (Auto-Calculated)</label>
                  <input
                    type="date"
                    readOnly
                    value={expectedDeliveryDate}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#F8FAFC', fontWeight: 700, color: '#1D4ED8' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Dispatch Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter any relevant dispatch-related notes or remarks..."
                  value={dispatchNotes}
                  onChange={e => setDispatchNotes(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="submit"
                  style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
                >
                  Mark Dispatched & Create Shipment →
                </button>
              </div>

            </form>
        </div>
      )}

      {/* DELIVERY HISTORY TAB */}
      {activeTabLocal === 'DELIVERY_HISTORY' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Completed Delivery Records & Logistics Archive</h2>

          {deliveryHistoryList.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13.5, color: '#64748B', fontWeight: 600, background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8 }}>
              No completed deliveries yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    <th style={{ padding: 12 }}>TRACKING #</th>
                    <th style={{ padding: 12 }}>SUB-ORDER</th>
                    <th style={{ padding: 12 }}>CUSTOMER</th>
                    <th style={{ padding: 12 }}>MANUFACTURER</th>
                    <th style={{ padding: 12 }}>DISPATCH DATE</th>
                    <th style={{ padding: 12 }}>DELIVERY DATE</th>
                    <th style={{ padding: 12 }}>FINAL STATUS</th>
                    <th style={{ padding: 12 }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryHistoryList.map((shp: any) => (
                    <tr key={shp.id} onClick={() => handleOpenSpecificShipment(shp.id, shp.trackingNumber)} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
                      <td style={{ padding: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{shp.trackingNumber}</td>
                      <td style={{ padding: 12, fontFamily: 'monospace' }}>{shp.subOrderNumber}</td>
                      <td style={{ padding: 12, fontWeight: 700, color: '#0F172A' }}>{shp.customerName}</td>
                      <td style={{ padding: 12, color: '#475569' }}>{shp.manufacturerName}</td>
                      <td style={{ padding: 12 }}>{shp.dispatchDate}</td>
                      <td style={{ padding: 12 }}>{shp.actualDeliveryDate || shp.expectedDeliveryDate}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>{shp.shipmentStatus}</span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <button onClick={(e) => { e.stopPropagation(); handleOpenSpecificShipment(shp.id, shp.trackingNumber); }} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 800, borderRadius: 4, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer' }}>
                          View Shipment →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PROOF OF DELIVERY (POD) TAB */}
      {activeTabLocal === 'POD_VIEW' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Electronic Proof of Delivery (POD) Records</h2>

          {activeClosedShipments.length === 0 && historicalShipments.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13.5, color: '#64748B', fontWeight: 600, background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8 }}>
              No POD records yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {[...activeClosedShipments, ...historicalShipments].map((shp: any) => (
                <div key={shp.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{shp.trackingNumber}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: shp.podStatus === 'CONFIRMED' ? '#DCFCE7' : '#FEF3C7', color: shp.podStatus === 'CONFIRMED' ? '#15803D' : '#B45309' }}>
                      POD {shp.podStatus}
                    </span>
                  </div>

                  <div style={{ fontSize: 12.5, color: '#0F172A' }}>Sub-Order: <strong>{shp.subOrderNumber}</strong> · Customer: <strong>{shp.customerName}</strong></div>
                  
                  <button onClick={() => handleOpenSpecificShipment(shp.id, shp.trackingNumber)} style={{ padding: '8px 14px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                    View Shipment →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD NEW LOGISTICS PARTNER */}
      {showAddPartnerModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowAddPartnerModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={20} style={{ color: '#0F766E' }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Add New Logistics Partner</h3>
              </div>
              <button onClick={() => setShowAddPartnerModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {newPartnerError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: 6, color: '#DC2626', fontSize: 12, fontWeight: 700 }}>
                ⚠️ {newPartnerError}
              </div>
            )}

            <form onSubmit={handleSaveNewPartner} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Partner / Transporter Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Safexpress Cold Fleet Logistics"
                  value={newPartnerName}
                  onChange={e => { setNewPartnerName(e.target.value); setNewPartnerError(''); }}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fleet / Service Type</label>
                <select
                  value={newPartnerFleetType}
                  onChange={e => setNewPartnerFleetType(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}
                >
                  <option value="Cold-Chain Fleet (2°C - 8°C)">Cold-Chain Fleet (2°C - 8°C)</option>
                  <option value="Deep Freeze Telemetry (-20°C)">Deep Freeze Telemetry (-20°C)</option>
                  <option value="Standard Express Freight">Standard Express Freight</option>
                  <option value="Surface Cargo Logistics">Surface Cargo Logistics</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Contact Person (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={newPartnerContact}
                    onChange={e => setNewPartnerContact(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Contact Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={newPartnerPhone}
                    onChange={e => setNewPartnerPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowAddPartnerModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Save &amp; Select Partner →</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
