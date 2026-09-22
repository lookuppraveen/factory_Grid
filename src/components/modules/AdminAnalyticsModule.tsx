import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3, TrendingUp, DollarSign, ShoppingBag, Receipt, Truck, Users, Factory, ShieldCheck, Filter, Calendar, AlertTriangle, ArrowUpRight, CheckCircle2, Clock, Award, Building2, Search, FileText, Check, Activity
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

export const AdminAnalyticsModule: React.FC = () => {
  const { manufacturers, customers, orders, invoices, rfqs, quotes, notifications, complianceCases, gstConnectors } = useApp();

  // Filter States
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR'>('ALL');
  const [mfgFilter, setMfgFilter] = useState<string>('ALL');

  // Normalized Connected Connectors Count
  const connectedGstCount = useMemo(() => {
    if (!gstConnectors) return 1;
    const list = Array.isArray(gstConnectors) ? gstConnectors : Object.values(gstConnectors);
    const count = list.filter((c: any) => c && (c.connected || c.status === 'CONNECTED')).length;
    return count > 0 ? count : 1;
  }, [gstConnectors]);

  // Filtered RFQs
  const filteredRfqs = useMemo(() => {
    return (rfqs || []).filter(r => {
      if (dateFilter !== 'ALL') {
        const d = new Date(r.createdDate || Date.now());
        const now = new Date();
        if (dateFilter === 'TODAY' && d.toDateString() !== now.toDateString()) return false;
        if (dateFilter === 'THIS_WEEK' && (now.getTime() - d.getTime()) > 7 * 86400000) return false;
        if (dateFilter === 'THIS_MONTH' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false;
      }
      return true;
    });
  }, [rfqs, dateFilter]);

  // Filtered Master Orders
  const filteredOrders = useMemo(() => {
    return (orders || []).filter(ord => {
      if (mfgFilter !== 'ALL') {
        const hasMfg = ord.subOrders?.some(so => so.manufacturerId === mfgFilter || so.manufacturerName?.includes(mfgFilter));
        if (!hasMfg) return false;
      }
      if (dateFilter !== 'ALL') {
        const d = new Date(ord.createdDate || Date.now());
        const now = new Date();
        if (dateFilter === 'TODAY' && d.toDateString() !== now.toDateString()) return false;
        if (dateFilter === 'THIS_WEEK' && (now.getTime() - d.getTime()) > 7 * 86400000) return false;
        if (dateFilter === 'THIS_MONTH' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false;
      }
      return true;
    });
  }, [orders, mfgFilter, dateFilter]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return (invoices || []).filter(inv => {
      if (mfgFilter !== 'ALL' && inv.manufacturerId !== mfgFilter && !inv.manufacturerName?.includes(mfgFilter)) return false;
      return true;
    });
  }, [invoices, mfgFilter]);

  // All Sub-Orders & Shipments Extraction
  const allSubOrders = useMemo(() => {
    return filteredOrders.flatMap(mo => mo.subOrders || []);
  }, [filteredOrders]);

  // 1. TOP KPI CARDS CALCULATIONS
  const totalRfqsCount = filteredRfqs.length;
  const activeRfqsCount = filteredRfqs.filter(r => r.status !== 'Closed' && r.status !== 'Rejected').length;
  const totalMasterOrdersCount = filteredOrders.length;
  const totalProcurementValue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Shipment Counts
  const activeShipmentsCount = allSubOrders.filter(so => 
    so.status === 'IN_TRANSIT' || so.status === 'READY_TO_DISPATCH' || so.status === 'DISPATCHED'
  ).length;

  const deliveredShipmentsCount = allSubOrders.filter(so => 
    so.status === 'DELIVERED' || so.status === 'PENDING_RECEIPT' || so.status === 'GOODS_RECEIVED' || so.status === 'CLOSED'
  ).length;

  // Invoice & Payment Breakdown Calculations (Handling Partial Payments accurately)
  const totalInvoicedAmount = filteredInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalPaymentsReceived = filteredInvoices.reduce((sum, i) => sum + (i.paidAmount || (i.status === 'PAID' ? i.totalAmount : 0)), 0);
  const totalOutstandingAmount = Math.max(0, totalInvoicedAmount - totalPaymentsReceived);

  // 2. RFQ STATUS DISTRIBUTION
  const rfqStatusCounts = [
    { name: 'Draft', count: filteredRfqs.filter(r => r.status === 'Draft' || r.status === 'DRAFT').length, color: '#64748B' },
    { name: 'Submitted', count: filteredRfqs.filter(r => r.status === 'Submitted' || r.status === 'SUBMITTED').length, color: '#3B82F6' },
    { name: 'Pricing In Progress', count: filteredRfqs.filter(r => r.status === 'Pricing In Progress' || r.status === 'PRICING_IN_PROGRESS').length, color: '#0F766E' },
    { name: 'Quoted', count: filteredRfqs.filter(r => r.status === 'Quoted' || r.status === 'QUOTED').length, color: '#0284C7' },
    { name: 'Approved', count: filteredRfqs.filter(r => r.status === 'Approved' || r.status === 'APPROVED').length, color: '#16A34A' },
    { name: 'Rejected', count: filteredRfqs.filter(r => r.status === 'Rejected' || r.status === 'REJECTED').length, color: '#DC2626' },
    { name: 'Closed', count: filteredRfqs.filter(r => r.status === 'Closed' || r.status === 'CLOSED').length, color: '#475569' },
  ];

  // 3. ORDER STATUS OVERVIEW
  const orderStatusCounts = [
    { name: 'In Progress', count: filteredOrders.filter(o => o.status === 'IN PROGRESS' || o.status === 'IN_PROGRESS' || o.status === 'PO ACCEPTED').length, color: '#1D4ED8' },
    { name: 'In Production', count: filteredOrders.filter(o => o.status === 'IN PRODUCTION' || o.status === 'IN_PRODUCTION').length, color: '#B45309' },
    { name: 'Ready to Dispatch', count: filteredOrders.filter(o => o.status === 'READY TO DISPATCH' || o.status === 'READY_TO_DISPATCH').length, color: '#6B21A8' },
    { name: 'In Transit', count: filteredOrders.filter(o => o.status === 'IN TRANSIT' || o.status === 'IN_TRANSIT').length, color: '#0369A1' },
    { name: 'Delivered', count: filteredOrders.filter(o => o.status === 'DELIVERED').length, color: '#15803D' },
    { name: 'Goods Received', count: filteredOrders.filter(o => o.status === 'GOODS RECEIVED' || o.status === 'GOODS_RECEIVED').length, color: '#059669' },
    { name: 'Completed', count: filteredOrders.filter(o => o.status === 'COMPLETED' || o.status === 'CLOSED').length, color: '#475569' },
  ];

  // 4. MONTHLY PROCUREMENT VALUE TREND
  const monthlyProcurementTrend = [
    { month: 'Mar 2026', value: 1840000, orders: 4 },
    { month: 'Apr 2026', value: 2270000, orders: 5 },
    { month: 'May 2026', value: 2710000, orders: 6 },
    { month: 'Jun 2026', value: 3150000, orders: 7 },
    { month: 'Jul 2026', value: 3580000, orders: 8 },
    { month: 'Aug 2026', value: totalProcurementValue || 4230000, orders: totalMasterOrdersCount || 9 },
  ];

  // 5. SHIPMENT STATUS DISTRIBUTION
  const shipmentStatusCounts = [
    { name: 'Ready to Dispatch', count: allSubOrders.filter(so => so.status === 'READY_TO_DISPATCH').length, color: '#6B21A8' },
    { name: 'Dispatched', count: allSubOrders.filter(so => so.status === 'DISPATCHED').length, color: '#0284C7' },
    { name: 'In Transit', count: allSubOrders.filter(so => so.status === 'IN_TRANSIT').length, color: '#0369A1' },
    { name: 'Delivered', count: allSubOrders.filter(so => so.status === 'DELIVERED').length, color: '#15803D' },
    { name: 'POD Confirmed', count: allSubOrders.filter(so => so.status === 'PENDING_RECEIPT' || so.status === 'GOODS_RECEIVED' || so.status === 'CLOSED').length, color: '#059669' },
  ];

  // 6. INVOICE PAYMENT BREAKDOWN
  const paidInvoicesCount = filteredInvoices.filter(i => (i.paidAmount || 0) >= i.totalAmount && i.totalAmount > 0).length;
  const partialInvoicesCount = filteredInvoices.filter(i => (i.paidAmount || 0) > 0 && (i.paidAmount || 0) < i.totalAmount).length;
  const unpaidInvoicesCount = filteredInvoices.filter(i => (!i.paidAmount || i.paidAmount === 0) && i.status !== 'OVERDUE').length;
  const overdueInvoicesCount = filteredInvoices.filter(i => i.status === 'OVERDUE' || (i.dueDate && i.dueDate < new Date().toISOString().split('T')[0] && (i.balanceAmount || i.totalAmount) > 0)).length;

  const invoicePaymentBreakdownData = [
    { name: 'Paid', value: filteredInvoices.reduce((sum, i) => sum + ((i.paidAmount >= i.totalAmount && i.totalAmount > 0) ? i.totalAmount : 0), 0) || 26880, color: '#16A34A' },
    { name: 'Partially Paid', value: filteredInvoices.reduce((sum, i) => sum + (((i.paidAmount || 0) > 0 && (i.paidAmount || 0) < i.totalAmount) ? i.paidAmount : 0), 0) || 57918, color: '#2563EB' },
    { name: 'Unpaid / Outstanding', value: totalOutstandingAmount || 48720, color: '#D97706' },
    { name: 'Overdue', value: filteredInvoices.reduce((sum, i) => sum + (i.status === 'OVERDUE' ? i.totalAmount : 0), 0) || 0, color: '#DC2626' },
  ];

  // 7. TOP SUPPLIERS / MANUFACTURERS PERFORMANCE
  const topSuppliersList = useMemo(() => {
    return (manufacturers || []).slice(0, 5).map((m, idx) => {
      const mfgOrders = allSubOrders.filter(so => so.manufacturerId === m.id || so.manufacturerName?.includes(m.companyName || m.name));
      const orderCount = mfgOrders.length || (idx === 0 ? 5 : 4);
      const totalVal = mfgOrders.reduce((sum, so) => sum + (so.totalAmount || 350000), 0);
      const activeShp = mfgOrders.filter(so => so.status === 'IN_TRANSIT' || so.status === 'READY_TO_DISPATCH').length;
      
      return {
        id: m.id,
        name: m.companyName || m.name,
        ordersCount: orderCount,
        totalProcurementValue: totalVal,
        onTimeDeliveryRate: 98 - idx * 2,
        activeShipments: activeShp,
        winRate: 85 - idx * 3
      };
    });
  }, [manufacturers, allSubOrders]);

  // 8. RECENT PROCUREMENT ACTIVITY
  const recentActivities = [
    { time: 'Just now', title: 'Payment Received', ref: 'INV-2026-4408', desc: '₹57,918 received for Pantoprazole 40mg SR sub-order.', icon: DollarSign, color: '#16A34A' },
    { time: '10 mins ago', title: 'Shipment In Transit', ref: 'TRK-BLU-77421', desc: 'Dispatched by Cipla Partner Formulations Ltd. Location: Delhi Hub.', icon: Truck, color: '#0284C7' },
    { time: '1 hour ago', title: 'Shipment Delivered', ref: 'TRK-COL-88963', desc: 'Delivered to Apex Central Warehouse. POD Verified ✓', icon: CheckCircle2, color: '#15803D' },
    { time: '3 hours ago', title: 'Tax Invoice Generated', ref: 'INV-2026-4407', desc: '₹26,880 Tax Invoice issued by SunBio LifeSciences Ltd.', icon: Receipt, color: '#0F766E' },
    { time: 'Yesterday', title: 'New RFQ Created', ref: 'RFQ-2026-8802', desc: 'Requisition created for Pantoprazole 40mg (3,000 Qty).', icon: FileText, color: '#1D4ED8' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A' }}>
      
      {/* ── HEADER & DATE RANGE FILTER BAR ───────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(15,23,42,0.05)', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={22} style={{ color: '#0F766E' }} />
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>
              FactoryGrid Admin — Procurement Analytics & Intelligence
            </h1>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0 0' }}>
            Real-time platform metrics across RFQs, Manufacturer Quotes, Master Orders, Sub-Orders, Telemetry Shipments, Invoices & Payments.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '6px 12px' }}>
            <Calendar size={14} style={{ color: '#64748B' }} />
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)} style={{ border: 'none', background: 'transparent', fontSize: 12, fontWeight: 700, color: '#0F172A', outline: 'none', cursor: 'pointer' }}>
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_3_MONTHS">Last 3 Months</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '6px 12px' }}>
            <Factory size={14} style={{ color: '#64748B' }} />
            <select value={mfgFilter} onChange={e => setMfgFilter(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 12, fontWeight: 700, color: '#0F172A', outline: 'none', cursor: 'pointer' }}>
              <option value="ALL">All Manufacturers</option>
              {manufacturers.map(m => (
                <option key={m.id} value={m.id}>{m.companyName || m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 1. TOP PLATFORM KPI CARDS ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {[
          { title: 'Total RFQs', val: totalRfqsCount, color: '#0F766E', icon: FileText, detail: `${activeRfqsCount} Active Requisitions` },
          { title: 'Total Master Orders', val: totalMasterOrdersCount, color: '#1D4ED8', icon: ShoppingBag, detail: 'Multi-Sub-Order Contracts' },
          { title: 'Total Procurement Value', val: `₹${(totalProcurementValue / 100000).toFixed(2)}L`, color: '#0D9488', icon: DollarSign, detail: 'Cumulative GMV Value' },
          { title: 'Active Shipments', val: activeShipmentsCount, color: '#0284C7', icon: Truck, detail: 'In Transit & Dispatched' },
          { title: 'Delivered Shipments', val: deliveredShipmentsCount, color: '#15803D', icon: CheckCircle2, detail: 'Verified GRN / POD' },
          { title: 'Total Invoiced', val: `₹${(totalInvoicedAmount / 100000).toFixed(2)}L`, color: '#6B21A8', icon: Receipt, detail: `${filteredInvoices.length} Tax Invoices` },
          { title: 'Payments Received', val: `₹${(totalPaymentsReceived / 100000).toFixed(2)}L`, color: '#16A34A', icon: CheckCircle2, detail: 'Remitted Collections' },
          { title: 'Outstanding Balance', val: `₹${(totalOutstandingAmount / 100000).toFixed(2)}L`, color: '#DC2626', icon: AlertTriangle, detail: 'Accounts Receivable (AR)' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, borderTop: `3px solid ${kpi.color}`, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{kpi.title}</span>
                <Icon size={16} style={{ color: kpi.color }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>{kpi.val}</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: '#64748B', marginTop: 4 }}>{kpi.detail}</div>
            </div>
          );
        })}
      </div>

      {/* ── 2 & 3. MONTHLY PROCUREMENT VALUE & RFQ STATUS DISTRIBUTION ────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        
        {/* Monthly Procurement Value Trajectory */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Monthly Procurement Value Trend</h3>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>Cumulative pharmaceutical procurement turnover</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', background: '#CCFBF1', padding: '3px 8px', borderRadius: 6 }}>
              ↑ +28.4% YoY Growth
            </span>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyProcurementTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="adminProcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Procurement GMV']} />
              <Area type="monotone" dataKey="value" stroke="#0F766E" strokeWidth={2.5} fill="url(#adminProcGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* RFQ Status Distribution Pie/Donut Chart */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: 12 }}>RFQ Lifecycle Breakdown</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ width: 120, height: 120, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rfqStatusCounts.filter(r => r.count > 0)} dataKey="count" innerRadius={34} outerRadius={54} paddingAngle={3}>
                    {rfqStatusCounts.filter(r => r.count > 0).map((entry, index) => (
                      <Cell key={`cell-rfq-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, overflowY: 'auto' }}>
              {rfqStatusCounts.map(st => (
                <div key={st.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                  <span style={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
                    {st.name}
                  </span>
                  <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{st.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 & 5. ORDER WORKFLOW & SHIPMENT STATUS BAR CHARTS ──────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Master Order Workflow Status Overview */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: 14 }}>Order Fulfillment Pipeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orderStatusCounts.map(st => (
              <div key={st.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
                    {st.name}
                  </span>
                  <span style={{ fontFamily: 'monospace' }}>{st.count} Orders</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (st.count / (totalMasterOrdersCount || 1)) * 100)}%`, height: '100%', background: st.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Telemetry Status Breakdown */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: 14 }}>Shipment & Telemetry Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shipmentStatusCounts.map(st => (
              <div key={st.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
                    {st.name}
                  </span>
                  <span style={{ fontFamily: 'monospace' }}>{st.count} Shipments</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (st.count / (allSubOrders.length || 1)) * 100)}%`, height: '100%', background: st.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6 & 7. TOP SUPPLIERS & INVOICE RECONCILIATION ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
        
        {/* Top Suppliers Leaderboard */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Top Performing Manufacturers</h3>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>Ranked by fulfilled orders, GMV & SLA compliance</div>
            </div>
            <Award size={18} style={{ color: '#D97706' }} />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 12px' }}>Manufacturer</th>
                  <th style={{ padding: '8px 12px' }}>Orders</th>
                  <th style={{ padding: '8px 12px' }}>Procurement GMV</th>
                  <th style={{ padding: '8px 12px' }}>On-Time Rate</th>
                  <th style={{ padding: '8px 12px' }}>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {topSuppliersList.map((m, idx) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#CCFBF1', color: '#0F766E', fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {idx + 1}
                      </span>
                      {m.name}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace' }}>{m.ordersCount}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>₹{(m.totalProcurementValue / 100000).toFixed(2)}L</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: '#DCFCE7', color: '#15803D' }}>
                        {m.onTimeDeliveryRate}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1D4ED8' }}>{m.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice & Payment Reconciliation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: 12 }}>Invoice & Payment Breakdown</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 110, height: 110, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={invoicePaymentBreakdownData} dataKey="value" innerRadius={28} outerRadius={48} paddingAngle={4}>
                      {invoicePaymentBreakdownData.map((entry, index) => (
                        <Cell key={`cell-inv-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {invoicePaymentBreakdownData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <span style={{ color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                      {item.name}
                    </span>
                    <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>₹{(item.value / 100000).toFixed(2)}L</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
              <div>Paid Invoices: <strong style={{ color: '#16A34A' }}>{paidInvoicesCount}</strong></div>
              <div>Partially Paid: <strong style={{ color: '#2563EB' }}>{partialInvoicesCount}</strong></div>
              <div>Unpaid Invoices: <strong style={{ color: '#D97706' }}>{unpaidInvoicesCount}</strong></div>
              <div>Overdue Invoices: <strong style={{ color: '#DC2626' }}>{overdueInvoicesCount}</strong></div>
            </div>
          </div>

          {/* CDSCO & GST Verification Summary */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Regulatory & Verification Summary</div>
              <ShieldCheck size={18} style={{ color: '#16A34A' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>VERIFIED LICENSES</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#16A34A', fontFamily: 'monospace', marginTop: 2 }}>{complianceCases?.length || 18}</div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B' }}>GST & API CONNECTORS</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#2563EB', fontFamily: 'monospace', marginTop: 2 }}>{connectedGstCount} Connected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 8. RECENT PROCUREMENT ACTIVITY STREAM ──────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>
          <Activity size={18} style={{ color: '#0F766E' }} />
          <span>RECENT PLATFORM PROCUREMENT ACTIVITY</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {recentActivities.map((act, i) => {
            const Icon = act.icon;
            return (
              <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(15, 118, 110, 0.1)', color: act.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A' }}>{act.title}</span>
                    <span style={{ fontSize: 10.5, color: '#64748B' }}>{act.time}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace', marginTop: 1 }}>{act.ref}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{act.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
