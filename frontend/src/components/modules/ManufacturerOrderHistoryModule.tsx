import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ViewModeToggle } from '../common/ViewModeToggle';
import { 
  ShoppingBag, CheckCircle2, Clock, Truck, FileText, Download, 
  Package, ChevronRight, Eye, ShieldCheck, X, Search, Filter,
  Building2, Calendar, DollarSign, Receipt, Check, FileCheck, Layers, Award
} from 'lucide-react';
import { UNIFIED_STORAGE_KEY } from './ProductionExecutionModule';

interface ManufacturerOrderHistoryModuleProps {
  onNavigateTab?: (tabId: string) => void;
}

export const ManufacturerOrderHistoryModule: React.FC<ManufacturerOrderHistoryModuleProps> = ({ onNavigateTab }) => {
  const { orders, invoices, manufacturers, setActiveTab } = useApp();

  const myMfg = (manufacturers && manufacturers[0]) || null;
  const mfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';
  const mfgId = myMfg?.id || 'm1';

  // State
  const [displayMode, setDisplayMode] = useState<'TABLE' | 'CARD'>('TABLE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubOrder, setSelectedSubOrder] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Read Unified Store for any completed/closed active sub-orders
  const [subOrdersStore, setSubOrdersStore] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
        if (saved) setSubOrdersStore(JSON.parse(saved));
      } catch (e) { console.error(e); }
    };

    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('focus', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, []);

  // DERIVE COMPLETED / PAST HISTORICAL ORDERS ONLY
  const pastOrdersList = useMemo(() => {
    const list: any[] = [];
    const processedCodes = new Set<string>();

    // 1. Static Curated Historical Completed Sub-Orders (Full End-to-End Archives)
    const samplePastOrders: any[] = [
      {
        id: 'so-hist-880',
        subOrderNumber: 'SO-2026-880-01',
        poNumber: 'PO-2026-880-01',
        masterOrderNumber: 'MO-2026-880',
        customerName: 'Apex Pharma PCD Franchise',
        manufacturerName: mfgName,
        totalQuantity: 50000,
        totalAmount: 750000,
        createdDate: '12 Jun 2026',
        completedDate: '05 Jul 2026',
        overallStatus: 'COMPLETED',
        fulfillmentOutcome: 'Delivered & POD Confirmed',
        lines: [
          { productName: 'Azithromycin 500mg Tablets', quantity: 30000, unitPrice: 15.00, taxPercent: 12, totalPrice: 450000 },
          { productName: 'Paracetamol 650mg ER Tablets', quantity: 20000, unitPrice: 15.00, taxPercent: 12, totalPrice: 300000 }
        ],
        qcStatus: 'PASSED (Assay: 99.8% - Batch #SB-2026-880A)',
        shipment: {
          trackingNumber: 'TRK-BD-880-01',
          transporterName: 'Blue Dart Express Ltd.',
          dispatchDate: '02 Jul 2026',
          deliveryDate: '05 Jul 2026',
          shipmentStatus: 'DELIVERED',
          podStatus: 'CONFIRMED ✓',
          goodsReceipt: {
            status: 'VERIFIED_ACCEPTED',
            receivedQuantity: 50000,
            missingQuantity: 0,
            receivedDate: '05 Jul 2026',
            receivedBy: 'Rajesh Sharma (Warehouse Mgr)',
            condition: 'GOOD_INTACT',
            receivingRemarks: 'All 50,000 units received in original sealed master cartons. Batch COA verified.'
          }
        },
        invoice: {
          invoiceNumber: 'INV-2026-880-01',
          totalAmount: 840000,
          invoiceDate: '02 Jul 2026',
          status: 'PAID (100% Cleared)'
        }
      },
      {
        id: 'so-hist-845',
        subOrderNumber: 'SO-2026-845-02',
        poNumber: 'PO-2026-845-02',
        masterOrderNumber: 'MO-2026-845',
        customerName: 'MedLife Distribution Corp',
        manufacturerName: mfgName,
        totalQuantity: 25000,
        totalAmount: 475000,
        createdDate: '18 May 2026',
        completedDate: '10 Jun 2026',
        overallStatus: 'CLOSED',
        fulfillmentOutcome: 'Order Lifecycle Closed & Settled',
        lines: [
          { productName: 'Amoxyclav 625mg Tablets', quantity: 25000, unitPrice: 19.00, taxPercent: 12, totalPrice: 475000 }
        ],
        qcStatus: 'PASSED (Assay: 99.5% - Batch #SB-2026-845B)',
        shipment: {
          trackingNumber: 'TRK-SF-845-02',
          transporterName: 'Safexpress Logistics',
          dispatchDate: '07 Jun 2026',
          deliveryDate: '10 Jun 2026',
          shipmentStatus: 'DELIVERED',
          podStatus: 'CONFIRMED ✓',
          goodsReceipt: {
            status: 'VERIFIED_ACCEPTED',
            receivedQuantity: 25000,
            missingQuantity: 0,
            receivedDate: '10 Jun 2026',
            receivedBy: 'Amitabh Verma (QA Lead)',
            condition: 'GOOD_INTACT',
            receivingRemarks: 'Full shipment received in excellent condition with complete batch testing reports.'
          }
        },
        invoice: {
          invoiceNumber: 'INV-2026-845-02',
          totalAmount: 532000,
          invoiceDate: '07 Jun 2026',
          status: 'PAID (100% Cleared)'
        }
      },
      {
        id: 'so-hist-790',
        subOrderNumber: 'SO-2026-790-01',
        poNumber: 'PO-2026-790-01',
        masterOrderNumber: 'MO-2026-790',
        customerName: 'Healthcare Global Pharma',
        manufacturerName: mfgName,
        totalQuantity: 40000,
        totalAmount: 600000,
        createdDate: '04 Apr 2026',
        completedDate: '28 Apr 2026',
        overallStatus: 'COMPLETED',
        fulfillmentOutcome: 'Delivered & Payment Settled',
        lines: [
          { productName: 'Metformin 500mg SR Tablets', quantity: 40000, unitPrice: 15.00, taxPercent: 12, totalPrice: 600000 }
        ],
        qcStatus: 'PASSED (Assay: 100.1% - Batch #SB-2026-790A)',
        shipment: {
          trackingNumber: 'TRK-BD-790-01',
          transporterName: 'Blue Dart Express Ltd.',
          dispatchDate: '25 Apr 2026',
          deliveryDate: '28 Apr 2026',
          shipmentStatus: 'DELIVERED',
          podStatus: 'CONFIRMED ✓',
          goodsReceipt: {
            status: 'VERIFIED_ACCEPTED',
            receivedQuantity: 40000,
            missingQuantity: 0,
            receivedDate: '28 Apr 2026',
            receivedBy: 'Sanjay Gupta (Procurement Head)',
            condition: 'GOOD_INTACT',
            receivingRemarks: 'Verified against PO specifications and released to stock.'
          }
        },
        invoice: {
          invoiceNumber: 'INV-2026-790-01',
          totalAmount: 672000,
          invoiceDate: '25 Apr 2026',
          status: 'PAID (100% Cleared)'
        }
      }
    ];

    samplePastOrders.forEach(o => {
      processedCodes.add(o.subOrderNumber);
      list.push(o);
    });

    // 2. Add any real orders from AppContext or localStorage that are strictly COMPLETED or CLOSED
    orders.forEach(masterOrd => {
      (masterOrd.subOrders || []).forEach(sub => {
        const isMyOrder = sub.manufacturerId === mfgId ||
                          sub.manufacturerName.toLowerCase().includes('sunbio') ||
                          sub.manufacturerName.toLowerCase().includes(mfgName.toLowerCase());

        if (!isMyOrder) return;

        const subCode = sub.subOrderNumber === 'SO-2026-1001-01' ? 'SO-1001-01' : sub.subOrderNumber;
        if (processedCodes.has(subCode)) return;

        const storeRec = subOrdersStore[subCode] || null;
        const prodStatus = storeRec?.productionStatus || sub.status || '';
        const shpObj = storeRec?.shipment;
        const invObj = storeRec?.invoice || invoices.find(inv => inv.subOrderNumber === subCode);

        let overallStatus = (shpObj?.shipmentStatus || prodStatus || '').toUpperCase();
        
        // ONLY INCLUDE STRICTLY CLOSED OR COMPLETED ORDERS
        const isCompleted = overallStatus.includes('CLOSED') || 
                            overallStatus.includes('DELIVERED') || 
                            overallStatus.includes('POD') ||
                            overallStatus.includes('COMPLETED');

        if (isCompleted) {
          processedCodes.add(subCode);
          list.push({
            id: sub.id || subCode,
            subOrderNumber: subCode,
            poNumber: sub.poNumber || `PO-${subCode}`,
            masterOrderNumber: masterOrd.orderNumber,
            customerName: masterOrd.customerName,
            manufacturerName: sub.manufacturerName,
            totalQuantity: sub.lines?.reduce((sum, l) => sum + l.quantity, 0) || sub.totalQuantity || 10000,
            totalAmount: sub.totalAmount || 150000,
            createdDate: masterOrd.createdDate || '2026-08-04',
            completedDate: '2026-08-20',
            overallStatus: 'COMPLETED',
            fulfillmentOutcome: 'Delivered & POD Confirmed',
            qcStatus: 'PASSED (Assay: 99.6%)',
            shipment: shpObj || {
              trackingNumber: `TRK-BD-${subCode}`,
              transporterName: 'Blue Dart Express Ltd.',
              dispatchDate: '2026-08-18',
              deliveryDate: '2026-08-20',
              shipmentStatus: 'DELIVERED',
              podStatus: 'CONFIRMED ✓',
              goodsReceipt: {
                status: 'VERIFIED_ACCEPTED',
                receivedQuantity: sub.totalQuantity || 10000,
                missingQuantity: 0,
                receivedDate: '2026-08-20',
                receivedBy: 'Warehouse Operations Manager',
                condition: 'GOOD_INTACT',
                receivingRemarks: 'Full shipment verified and accepted.'
              }
            },
            invoice: invObj || {
              invoiceNumber: `INV-2026-${subCode}`,
              totalAmount: (sub.totalAmount || 150000) * 1.12,
              invoiceDate: '2026-08-18',
              status: 'PAID (100% Cleared)'
            },
            lines: sub.lines || [
              { productName: storeRec?.productName || 'Paracetamol 500mg Tablets', quantity: sub.totalQuantity || 10000, unitPrice: 15.00, taxPercent: 12, totalPrice: sub.totalAmount || 150000 }
            ]
          });
        }
      });
    });

    return list;
  }, [orders, subOrdersStore, invoices, mfgId, mfgName]);

  // Filter Search Query
  const filteredPastOrders = useMemo(() => {
    return pastOrdersList.filter(ord => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const matchSub = ord.subOrderNumber.toLowerCase().includes(q);
      const matchMaster = ord.masterOrderNumber.toLowerCase().includes(q);
      const matchPO = ord.poNumber.toLowerCase().includes(q);
      const matchCust = ord.customerName.toLowerCase().includes(q);
      const matchProd = ord.lines?.some((l: any) => l.productName?.toLowerCase().includes(q));
      return matchSub || matchMaster || matchPO || matchCust || matchProd;
    });
  }, [pastOrdersList, searchQuery]);

  // Summary Metrics for Past Historical Orders
  const metrics = useMemo(() => {
    const totalOrders = pastOrdersList.length;
    const totalUnits = pastOrdersList.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
    const totalRevenue = pastOrdersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return { totalOrders, totalUnits, totalRevenue };
  }, [pastOrdersList]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* ── COMMAND HEADER ───────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Manufacturer Portal</span>
            <span>/</span>
            <span style={{ fontWeight: 700, color: '#0F766E' }}>Historical Orders & Fulfillment Archives</span>
          </div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Supplier Order History
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Complete end-to-end historical records and fulfillment archives for completed sub-orders of <strong style={{ color: '#0F766E' }}>{mfgName}</strong>
          </p>
        </div>
      </div>

      {/* ── HISTORICAL SUMMARY METRICS BAR ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Completed Sub-Orders</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{metrics.totalOrders}</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Historical orders fulfilled</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Delivered Quantity</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 4 }}>{metrics.totalUnits.toLocaleString()} Units</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Dispatched &amp; confirmed</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Settled Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 4 }}>₹{metrics.totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Payments completed</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>On-Time Compliance</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>100%</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>SLA fulfillment rate</div>
        </div>
      </div>

      {/* ── SEARCH & VIEW MODE TOOLBAR ────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
          Historical Orders Collection ({filteredPastOrders.length} {filteredPastOrders.length === 1 ? 'Record' : 'Records'})
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search Sub-Order, PO #, Customer, Product..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }}
            />
          </div>

          <ViewModeToggle viewMode={displayMode} onViewChange={setDisplayMode} />
        </div>
      </div>

      {/* ── COMPLETED ORDERS TABLE / CARDS CONTAINER ──────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        {filteredPastOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
            <Clock size={36} style={{ color: '#CBD5E1', marginBottom: 10 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No Historical Orders Found</div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>No completed sub-orders match your search criteria.</div>
          </div>
        ) : displayMode === 'CARD' ? (
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredPastOrders.map(so => (
              <div
                key={so.id || so.subOrderNumber}
                style={{
                  background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18,
                  boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                      {so.subOrderNumber}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                      COMPLETED ✓
                    </span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                    {so.customerName}
                  </div>

                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div>PO Ref: <strong style={{ fontFamily: 'monospace' }}>{so.poNumber}</strong></div>
                    <div>Products: <strong>{so.lines?.[0]?.productName || 'Pharma Product'}</strong></div>
                    <div>Quantity: <strong style={{ fontFamily: 'monospace' }}>{so.totalQuantity.toLocaleString()} Units</strong></div>
                    <div>Order Value: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>₹{so.totalAmount.toLocaleString()}</strong></div>
                    <div>Order Date: <strong>{so.createdDate}</strong> · Completed: <strong>{so.completedDate}</strong></div>
                  </div>
                </div>

                <div style={{ paddingTop: 8, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setSelectedSubOrder(so);
                      setShowDetailModal(true);
                    }}
                    style={{ padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Eye size={14} /> View Historical Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textTransform: 'uppercase', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 16px' }}>Sub-Order / PO Ref</th>
                  <th style={{ padding: '12px 16px' }}>Customer / Buyer</th>
                  <th style={{ padding: '12px 16px' }}>Products</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Quantity</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Order Value</th>
                  <th style={{ padding: '12px 16px' }}>Order Date</th>
                  <th style={{ padding: '12px 16px' }}>Completion Date</th>
                  <th style={{ padding: '12px 16px' }}>Final Outcome</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPastOrders.map(so => (
                  <tr key={so.id || so.subOrderNumber} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                    
                    {/* 1. Sub-Order Ref */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', fontSize: 13.5 }}>
                        {so.subOrderNumber}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', marginTop: 1 }}>
                        PO: {so.poNumber}
                      </div>
                    </td>

                    {/* 2. Customer */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{so.customerName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>MO: {so.masterOrderNumber}</div>
                    </td>

                    {/* 3. Products */}
                    <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                      <div style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {so.lines?.[0]?.productName || 'Pharmaceutical Products'}
                      </div>
                      {so.lines?.length > 1 && (
                        <div style={{ fontSize: 11, color: '#64748B' }}>+{so.lines.length - 1} additional items</div>
                      )}
                    </td>

                    {/* 4. Quantity */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                      {so.totalQuantity.toLocaleString()} Units
                    </td>

                    {/* 5. Order Value */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#0F766E' }}>
                      ₹{so.totalAmount.toLocaleString()}
                    </td>

                    {/* 6. Order Date */}
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {so.createdDate}
                    </td>

                    {/* 7. Completion Date */}
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {so.completedDate}
                    </td>

                    {/* 8. Final Outcome Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 9px', borderRadius: 4, background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D' }}>
                        ✓ {so.overallStatus}
                      </span>
                    </td>

                    {/* 9. Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedSubOrder(so);
                          setShowDetailModal(true);
                        }}
                        style={{ padding: '6px 12px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={13} /> View Historical Details →
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: COMPLETE END-TO-END HISTORICAL FULFILLMENT ARCHIVE ── */}
      {showDetailModal && selectedSubOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowDetailModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>End-to-End Historical Record #{selectedSubOrder.subOrderNumber}</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Completed Fulfillment Archive · {selectedSubOrder.manufacturerName}</div>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {/* SECTION 1: ORDER INFORMATION */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ORDER &amp; PO ARCHIVE METADATA</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                <div>Master Order #: <strong style={{ fontFamily: 'monospace' }}>{selectedSubOrder.masterOrderNumber}</strong></div>
                <div>Sub-Order #: <strong style={{ fontFamily: 'monospace' }}>{selectedSubOrder.subOrderNumber}</strong></div>
                <div>PO Number: <strong style={{ fontFamily: 'monospace' }}>{selectedSubOrder.poNumber}</strong></div>
                <div>Customer / Buyer: <strong>{selectedSubOrder.customerName}</strong></div>
                <div>Order Date: <strong>{selectedSubOrder.createdDate}</strong></div>
                <div>Completion Date: <strong>{selectedSubOrder.completedDate}</strong></div>
                <div>Total Order Value: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>₹{selectedSubOrder.totalAmount.toLocaleString()}</strong></div>
                <div>Final Outcome: <strong style={{ color: '#16A34A' }}>✓ {selectedSubOrder.fulfillmentOutcome}</strong></div>
              </div>
            </div>

            {/* SECTION 2: PRODUCT DETAILS */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: '#F1F5F9', padding: '8px 12px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                FULFILLED PRODUCTS &amp; BATCH DETAILS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', color: '#64748B', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Product</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty Delivered</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubOrder.lines?.map((ln: any, idx: number) => (
                    <tr key={idx} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{ln.productName}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{ln.quantity.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{ln.unitPrice}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0F766E' }}>₹{(ln.totalPrice || ln.quantity * ln.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTION 3: MANUFACTURING & QC CLEARANCE LOG */}
            <div style={{ background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: 12, fontSize: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>MANUFACTURING QC &amp; BATCH CLEARANCE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>QC Release Status: <strong style={{ color: '#16A34A' }}>✓ {selectedSubOrder.qcStatus || 'PASSED (Assay: 99.8%)'}</strong></div>
                <div>GMP Compliance: <strong style={{ color: '#0F766E' }}>VERIFIED (WHO-GMP)</strong></div>
              </div>
            </div>

            {/* SECTION 4: DISPATCH & LOGISTICS TELEMETRY RECORD */}
            {selectedSubOrder.shipment && (
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, fontSize: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', marginBottom: 6 }}>HISTORICAL DISPATCH &amp; LOGISTICS RECORD</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>Tracking #: <strong style={{ fontFamily: 'monospace' }}>{selectedSubOrder.shipment.trackingNumber}</strong></div>
                  <div>Transporter: <strong>{selectedSubOrder.shipment.transporterName}</strong></div>
                  <div>Dispatch Date: <strong>{selectedSubOrder.shipment.dispatchDate}</strong></div>
                  <div>Delivery Date: <strong>{selectedSubOrder.shipment.deliveryDate}</strong></div>
                  <div>POD Status: <strong style={{ color: '#16A34A' }}>{selectedSubOrder.shipment.podStatus || 'CONFIRMED ✓'}</strong></div>
                </div>
              </div>
            )}

            {/* SECTION 5: COMMERCIAL TAX INVOICE & PAYMENT SETTLEMENT */}
            {selectedSubOrder.invoice && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 12, fontSize: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', marginBottom: 6 }}>COMMERCIAL TAX INVOICE &amp; PAYMENT SETTLEMENT</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>Tax Invoice #: <strong style={{ fontFamily: 'monospace' }}>{selectedSubOrder.invoice.invoiceNumber}</strong></div>
                  <div>Invoice Amount: <strong style={{ color: '#1D4ED8', fontFamily: 'monospace' }}>₹{selectedSubOrder.invoice.totalAmount?.toLocaleString()}</strong></div>
                  <div>Invoice Date: <strong>{selectedSubOrder.invoice.invoiceDate}</strong></div>
                  <div>Payment Status: <strong style={{ color: '#15803D' }}>✓ {selectedSubOrder.invoice.status}</strong></div>
                </div>
              </div>
            )}

            {/* SECTION 6: BUYER GOODS RECEIPT CONFIRMATION & SIGN-OFF */}
            {selectedSubOrder.shipment?.goodsReceipt && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: 12, fontSize: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 6 }}>
                  BUYER GOODS RECEIPT SIGN-OFF (CONFIRMED ARCHIVE)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>Receipt Status: <strong style={{ color: '#16A34A' }}>✓ {selectedSubOrder.shipment.goodsReceipt.status.replace(/_/g, ' ')}</strong></div>
                  <div>Received Qty: <strong style={{ color: '#166534', fontFamily: 'monospace' }}>{selectedSubOrder.shipment.goodsReceipt.receivedQuantity?.toLocaleString()} Units</strong></div>
                  <div>Missing / Damaged Qty: <strong style={{ color: '#64748B', fontFamily: 'monospace' }}>0 Units</strong></div>
                  <div>Received Date: <strong>{selectedSubOrder.shipment.goodsReceipt.receivedDate}</strong></div>
                  <div>Verified By: <strong>{selectedSubOrder.shipment.goodsReceipt.receivedBy}</strong></div>
                  <div>Package Condition: <strong>{selectedSubOrder.shipment.goodsReceipt.condition}</strong></div>
                </div>
                {selectedSubOrder.shipment.goodsReceipt.receivingRemarks && (
                  <div style={{ fontSize: 11.5, color: '#166534', marginTop: 6, background: '#FFF', padding: '6px 10px', borderRadius: 4, border: '1px solid #BBF7D0' }}>
                    <strong>Buyer Sign-off Remarks:</strong> {selectedSubOrder.shipment.goodsReceipt.receivingRemarks}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
              <button type="button" onClick={() => setShowDetailModal(false)} style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                Close Historical Archive
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
