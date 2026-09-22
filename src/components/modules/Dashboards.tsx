import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { RFQ, RFQLine, RFQStatus, Invoice, MasterOrder, Shipment } from '../../types';
import {
  FileText, ShieldCheck, Package, AlertTriangle, Tag,
  ArrowRight, Plus, Bot, TrendingUp, Check,
  Factory, Clock, Truck, CheckCircle2, Star,
  MapPin, BarChart3, Receipt, RefreshCw,
  ChevronRight, Lock, Zap, Activity, Filter, Eye, Search, Sparkles, Award, UserCheck, Users, Calendar,
  Building2, DollarSign, Bell, Command, Inbox, Target, Layers, MoreHorizontal, Timer, AlertCircle,
  Boxes, Navigation, Flame, TrendingDown, ArrowUpRight, Shield, Key, PieChart, Play, UserPlus, FileCheck,
  ListFilter, MoreVertical, ExternalLink, X, Trash2, CheckSquare, Square, ChevronDown, ShoppingBag, Thermometer, Cpu
} from 'lucide-react';

export const Dashboards: React.FC = () => {
  const {
    currentRole, rfqs, quotes, orders, invoices, complianceCases, manufacturers,
    customers, products, shipments, auditLogs, setActiveTab
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [monitoringSectionTab, setMonitoringSectionTab] = useState<'ALL' | 'PROCUREMENT' | 'QUOTES' | 'ORDERS' | 'SHIPMENTS' | 'FINANCE' | 'COMPLIANCE'>('ALL');

  // Read-Only Detail Modals State
  const [activeRfqDetail, setActiveRfqDetail] = useState<RFQ | null>(null);
  const [activeInvoiceDetail, setActiveInvoiceDetail] = useState<Invoice | null>(null);
  const [activeOrderDetail, setActiveOrderDetail] = useState<MasterOrder | null>(null);

  // Metric Calculations for Platform Monitoring
  const totalArBalance = invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);
  const activeRfqsCount = rfqs.filter(r => r.status !== 'Closed').length;
  const quotesReceivedCount = quotes.length;
  const activeOrdersCount = orders.length;
  const inProductionCount = orders.filter(o => o.status === 'IN_PRODUCTION' || o.status === 'OPEN').length;
  const activeShipmentsCount = shipments.filter(s => s.shipmentStatus !== 'CLOSED').length;
  const complianceItemsCount = complianceCases.filter(c => c.status === 'UNDER_REVIEW' || c.status === 'PENDING').length;

  const filteredRfqs = useMemo(() => {
    return rfqs.filter(r => {
      const q = searchQuery.toLowerCase();
      return r.rfqNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.lines.some(l => l.productName.toLowerCase().includes(q));
    });
  }, [rfqs, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── 1. TOP HEADER: PLATFORM MONITORING DASHBOARD ───────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <ShieldCheck size={14} /> Platform Command Console · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Platform Monitoring Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Monitor procurement, fulfillment, finance, compliance and platform activity.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#4338CA' }}>
            <Eye size={14} /> READ-ONLY MONITORING MODE
          </div>

          <div style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 8, background: '#F8FAFC', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* ── 2. TOP KPI CARDS (7 MONITORING-ONLY CARDS) ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {[
          { label: 'ACTIVE RFQs', value: activeRfqsCount, sub: 'Active Sourcing RFQs', icon: FileText, color: '#2563EB', bg: '#EFF6FF', tab: 'rfqs' },
          { label: 'QUOTES RECEIVED', value: quotesReceivedCount, sub: 'Manufacturer Quotes', icon: Tag, color: '#7C3AED', bg: '#F5F3FF', tab: 'quotes' },
          { label: 'ACTIVE MASTER ORDERS', value: activeOrdersCount, sub: 'Master Order Records', icon: ShoppingBag, color: '#059669', bg: '#ECFDF5', tab: 'orders' },
          { label: 'ORDERS IN PRODUCTION', value: inProductionCount, sub: 'Running Batches', icon: Cpu, color: '#0891B2', bg: '#CFFAFE', tab: 'orders' },
          { label: 'ACTIVE SHIPMENTS', value: activeShipmentsCount, sub: 'In-Transit Shipments', icon: Truck, color: '#D97706', bg: '#FFFBEB', tab: 'shipments' },
          { label: 'OUTSTANDING AR', value: `₹${totalArBalance.toLocaleString('en-IN')}`, sub: 'Unsettled Treasury AR', icon: Receipt, color: '#DC2626', bg: '#FEF2F2', tab: 'invoices' },
          { label: 'PENDING COMPLIANCE', value: complianceItemsCount, sub: 'Verifications Pending', icon: ShieldCheck, color: '#4F46E5', bg: '#EEF2FF', tab: 'compliance' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab(kpi.tab as any)}
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = kpi.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kpi.label}</span>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: kpi.bg, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} />
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>{kpi.value}</div>
              <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <span>{kpi.sub}</span>
                <ChevronRight size={11} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. MONITORING SECTIONS TABS ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, background: '#E2E8F0', padding: 4, borderRadius: 10, overflowX: 'auto' }}>
        {[
          { key: 'ALL', label: 'All Monitoring Views' },
          { key: 'PROCUREMENT', label: '1. Procurement Monitor' },
          { key: 'QUOTES', label: '2. Quote Monitor' },
          { key: 'ORDERS', label: '3. Order & PO Monitor' },
          { key: 'SHIPMENTS', label: '4. Dispatch & Cold-Chain' },
          { key: 'FINANCE', label: '5. Invoice & AR Monitor' },
          { key: 'COMPLIANCE', label: '6. Compliance Monitor' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setMonitoringSectionTab(t.key as any)}
            style={{
              border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whitespace: 'nowrap',
              background: monitoringSectionTab === t.key ? '#FFFFFF' : 'transparent',
              color: monitoringSectionTab === t.key ? '#2563EB' : '#475569',
              boxShadow: monitoringSectionTab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SECTION 1: PROCUREMENT MONITORING ────────────────────────── */}
      {(monitoringSectionTab === 'ALL' || monitoringSectionTab === 'PROCUREMENT') && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} style={{ color: '#2563EB' }} /> Procurement Monitoring (RFQs)
              </h2>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Monitor live RFQ sourcing progress across buyers and manufacturers</span>
            </div>
            <button onClick={() => setActiveTab('rfqs')} style={{ padding: '5px 12px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
              View RFQ Monitor →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 16px' }}>RFQ Number</th>
                <th style={{ padding: '10px 16px' }}>Buyer</th>
                <th style={{ padding: '10px 16px' }}>Products</th>
                <th style={{ padding: '10px 16px' }}>Manufacturers Invited</th>
                <th style={{ padding: '10px 16px' }}>Quotes Received</th>
                <th style={{ padding: '10px 16px' }}>Current Status</th>
                <th style={{ padding: '10px 16px' }}>Created Date</th>
                <th style={{ padding: '10px 16px' }}>Deadline</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRfqs.map((rfq) => {
                const rfqQuotes = quotes.filter(q => q.rfqId === rfq.id || q.rfqNumber === rfq.rfqNumber);
                const qCount = rfqQuotes.length || (rfq.status === 'Quoted' ? 3 : 0);
                return (
                  <tr key={rfq.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>{rfq.rfqNumber}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{rfq.customerName}</td>
                    <td style={{ padding: '12px 16px' }}>{rfq.lines[0]?.productName} ({rfq.lines.length} lines)</td>
                    <td style={{ padding: '12px 16px' }}>{rfq.lines[0]?.eligibleManufacturersCount || 3} Manufacturers</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: qCount > 0 ? '#15803D' : '#64748B', background: qCount > 0 ? '#DCFCE7' : '#F1F5F9', padding: '2px 8px', borderRadius: 999 }}>
                        {qCount} Quotes
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}><Badge status={rfq.status} /></td>
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>{rfq.createdDate}</td>
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>{rfq.deadlineDate}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => setActiveRfqDetail(rfq)} style={{ padding: '4px 10px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        View RFQ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SECTION 2: QUOTE MONITORING ──────────────────────────────── */}
      {(monitoringSectionTab === 'ALL' || monitoringSectionTab === 'QUOTES') && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag size={16} style={{ color: '#7C3AED' }} /> Quote Monitoring &amp; Matrix Oversight
              </h2>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Monitor manufacturer quotations, pricing spread and selection status</span>
            </div>
            <button onClick={() => setActiveTab('quotes')} style={{ padding: '5px 12px', background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
              View Quote Monitor →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 16px' }}>RFQ Number</th>
                <th style={{ padding: '10px 16px' }}>Target Product</th>
                <th style={{ padding: '10px 16px' }}>Manufacturers Bidding</th>
                <th style={{ padding: '10px 16px' }}>Quotes Received</th>
                <th style={{ padding: '10px 16px' }}>Lowest Quote</th>
                <th style={{ padding: '10px 16px' }}>Highest Quote</th>
                <th style={{ padding: '10px 16px' }}>Selected Manufacturer</th>
                <th style={{ padding: '10px 16px' }}>Selection Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.slice(0, 4).map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>{r.rfqNumber}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{r.lines[0]?.productName}</td>
                  <td style={{ padding: '12px 16px' }}>SunBio, Cipla, Lupin</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#15803D' }}>3 Quotes Received</td>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16A34A' }}>₹14.50 / strip</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>₹17.80 / strip</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>
                    {r.status === 'Sub-Order Created' || r.status === 'Approved' ? 'SunBio Labs Pvt Ltd' : 'Under Review'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: r.status === 'Sub-Order Created' ? '#15803D' : '#B45309', background: r.status === 'Sub-Order Created' ? '#DCFCE7' : '#FEF3C7', padding: '2px 8px', borderRadius: 999 }}>
                      {r.status === 'Sub-Order Created' ? 'Manufacturer Selected' : 'Evaluation Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => setActiveTab('quotes')} style={{ padding: '4px 10px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SECTION 3: ORDER & PO MONITORING ──────────────────────────── */}
      {(monitoringSectionTab === 'ALL' || monitoringSectionTab === 'ORDERS') && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={16} style={{ color: '#059669' }} /> Order &amp; PO Monitoring
              </h2>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Monitor Master Orders, sub-PO allocations and fulfillment progress</span>
            </div>
            <button onClick={() => setActiveTab('orders')} style={{ padding: '5px 12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
              View Orders Monitor →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 16px' }}>Master Order #</th>
                <th style={{ padding: '10px 16px' }}>Buyer</th>
                <th style={{ padding: '10px 16px' }}>PO Reference</th>
                <th style={{ padding: '10px 16px' }}>Assigned Manufacturer</th>
                <th style={{ padding: '10px 16px' }}>Order Value</th>
                <th style={{ padding: '10px 16px' }}>Fulfillment %</th>
                <th style={{ padding: '10px 16px' }}>Current Stage</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>{ord.masterOrderNumber}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{ord.customerName}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>PO-2026-9901</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>SunBio Labs Pvt Ltd</td>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>₹{(ord.totalAmount || 180000).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: '65%', height: '100%', background: '#059669' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#059669' }}>65%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: '#DBEAFE', color: '#1D4ED8' }}>
                      Production Batch Running
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => setActiveOrderDetail(ord)} style={{ padding: '4px 10px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      View Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SECTION 4: DISPATCH & COLD-CHAIN MONITORING ──────────────── */}
      {(monitoringSectionTab === 'ALL' || monitoringSectionTab === 'SHIPMENTS') && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={16} style={{ color: '#D97706' }} /> Dispatch &amp; Cold-Chain Telemetry Monitor
              </h2>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Monitor active shipments, carrier locations and 2°C–8°C IoT temperature sensors</span>
            </div>
            <button onClick={() => setActiveTab(currentRole === 'BUYER' ? 'buyer-tracking' : 'shipments')} style={{ padding: '5px 12px', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
              View Dispatch Monitor →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 16px' }}>Shipment #</th>
                <th style={{ padding: '10px 16px' }}>Master Order</th>
                <th style={{ padding: '10px 16px' }}>Manufacturer</th>
                <th style={{ padding: '10px 16px' }}>Transporter / Vehicle</th>
                <th style={{ padding: '10px 16px' }}>Current Location</th>
                <th style={{ padding: '10px 16px' }}>Temp (°C)</th>
                <th style={{ padding: '10px 16px' }}>Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shp) => (
                <tr key={shp.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>{shp.shipmentId}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>MO-2026-1002</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>SunBio Labs Pvt Ltd</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>Delhivery Cold Express (HP-12-C-8821)</td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} style={{ color: '#0284C7' }} />
                      <span>{shp.currentLocation || 'Ambala Toll Plaza, Punjab'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '2px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Thermometer size={12} /> 4.2°C (Optimal)
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: '#DBEAFE', color: '#1D4ED8' }}>
                      IN TRANSIT
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => setActiveTab(currentRole === 'BUYER' ? 'buyer-tracking' : 'shipments')} style={{ padding: '4px 10px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      View Shipment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SECTION 5: INVOICE & PAYMENT MONITORING ──────────────────── */}
      {(monitoringSectionTab === 'ALL' || monitoringSectionTab === 'FINANCE') && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={16} style={{ color: '#DC2626' }} /> Invoice &amp; Payment Monitoring (AR Treasury)
              </h2>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Monitor client invoices, settlement amounts and outstanding balances</span>
            </div>
            <button onClick={() => setActiveTab('invoices')} style={{ padding: '5px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
              View Invoice Monitor →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 16px' }}>Invoice #</th>
                <th style={{ padding: '10px 16px' }}>Customer</th>
                <th style={{ padding: '10px 16px' }}>Order Reference</th>
                <th style={{ padding: '10px 16px' }}>Invoice Total</th>
                <th style={{ padding: '10px 16px' }}>Amount Paid</th>
                <th style={{ padding: '10px 16px' }}>Balance Due</th>
                <th style={{ padding: '10px 16px' }}>Due Date</th>
                <th style={{ padding: '10px 16px' }}>Payment Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isPaid = inv.balanceAmount <= 0;
                const isPartial = inv.paidAmount > 0 && inv.balanceAmount > 0;

                return (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{inv.customerName}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{inv.orderNumber}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#16A34A' }}>₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: inv.balanceAmount > 0 ? '#DC2626' : '#16A34A' }}>₹{inv.balanceAmount.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>{inv.dueDate}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: isPaid ? '#DCFCE7' : isPartial ? '#DBEAFE' : '#FEF3C7', color: isPaid ? '#15803D' : isPartial ? '#1D4ED8' : '#B45309' }}>
                        {isPaid ? 'PAID' : isPartial ? 'PARTIALLY PAID' : 'OPEN / UNPAID'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => setActiveInvoiceDetail(inv)} style={{ padding: '4px 10px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        View Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SECTION 6: COMPLIANCE MONITORING ──────────────────────────── */}
      {(monitoringSectionTab === 'ALL' || monitoringSectionTab === 'COMPLIANCE') && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} style={{ color: '#4F46E5' }} /> Regulatory Compliance Monitoring
              </h2>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>Monitor WHO-GMP certifications, Form 20B/21B drug licenses &amp; expiry dates</span>
            </div>
            <button onClick={() => setActiveTab('compliance')} style={{ padding: '5px 12px', background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
              View Compliance Monitor →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 16px' }}>Manufacturer</th>
                <th style={{ padding: '10px 16px' }}>Drug License #</th>
                <th style={{ padding: '10px 16px' }}>WHO-GMP Cert</th>
                <th style={{ padding: '10px 16px' }}>CDSCO Status</th>
                <th style={{ padding: '10px 16px' }}>License Expiry</th>
                <th style={{ padding: '10px 16px' }}>Verification Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {manufacturers.map((mfg) => (
                <tr key={mfg.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>{mfg.companyName}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{mfg.mfgLicenseNo}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#15803D' }}>Valid (Cert #WHO-GMP-89102)</td>
                  <td style={{ padding: '12px 16px', color: '#059669', fontWeight: 700 }}>✓ Form 20B Verified</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>2028-12-31</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: '#DCFCE7', color: '#15803D' }}>
                      VERIFIED
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => setActiveTab('compliance')} style={{ padding: '4px 10px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SECTION 7: PLATFORM ACTIVITY / AUDIT LOG TIMELINE ──────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} style={{ color: '#2563EB' }} /> Real-Time Platform Activity Audit Log
            </h2>
            <span style={{ fontSize: 11.5, color: '#64748B' }}>Chronological system event log across all platform roles</span>
          </div>
          <button onClick={() => setActiveTab('reports')} style={{ padding: '5px 12px', background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
            Full Audit Logs →
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {auditLogs.slice(0, 6).map((log) => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', fontFamily: 'monospace', width: 65 }}>{log.timestamp.split(' ')[1] || '09:30'}</span>
                <div>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{log.action}</span>
                  <span style={{ color: '#64748B', marginLeft: 8 }}>({log.userName} · {log.userRole})</span>
                </div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', background: '#E2E8F0', padding: '2px 8px', borderRadius: 4 }}>
                {log.module}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* READ-ONLY DETAIL MODAL FOR ADMIN */}
      {activeRfqDetail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 12, width: '100%', maxWidth: 700, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>Read-Only RFQ Inspection</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>RFQ #{activeRfqDetail.rfqNumber}</h3>
              </div>
              <button onClick={() => setActiveRfqDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
              <div><strong>Buyer Organization:</strong> {activeRfqDetail.customerName}</div>
              <div><strong>Created Date:</strong> {activeRfqDetail.createdDate}</div>
              <div><strong>Deadline Date:</strong> {activeRfqDetail.deadlineDate}</div>
              <div><strong>Status:</strong> {activeRfqDetail.status}</div>
              <div><strong>Delivery Location:</strong> {activeRfqDetail.deliveryLocation || 'Baddi, HP'}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 6 }}>Formulation Lines</div>
              {activeRfqDetail.lines.map((l, i) => (
                <div key={i} style={{ padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                  <strong>{l.productName}</strong> — {l.quantity.toLocaleString()} {l.unit || 'Strips'} @ ₹{(l.targetPrice || 20).toFixed(2)}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button onClick={() => setActiveRfqDetail(null)} style={{ padding: '8px 18px', background: '#334155', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
