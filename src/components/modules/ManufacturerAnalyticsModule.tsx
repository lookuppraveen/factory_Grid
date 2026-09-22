import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3, TrendingUp, DollarSign, ShoppingBag, Receipt, Truck, Package, Filter, Calendar, RefreshCw, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

export const ManufacturerAnalyticsModule: React.FC = () => {
  const { manufacturers, orders, invoices, shipments, products } = useApp();

  // Current Logged-In Manufacturer
  const myMfg = (manufacturers && manufacturers[0]) || null;
  const mfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';

  // Filter States
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30' | 'THIS_QUARTER'>('ALL');

  // Filtered Orders for this Manufacturer
  const myOrders = useMemo(() => {
    return (orders || []).filter(ord => {
      if (ord.manufacturerName?.includes('SunBio') || ord.subOrders?.some(so => so.manufacturerName?.includes('SunBio') || so.manufacturerId === myMfg?.id)) {
        return true;
      }
      return true; // Default to showing supplier-relevant orders in demo
    });
  }, [orders, myMfg]);

  // Derived Metrics
  const totalSubOrdersCount = myOrders.flatMap(o => o.subOrders || []).length || 6;
  const totalSalesValue = myOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 1245000;
  const totalInvoicesCount = invoices.length || 4;
  const totalPaidCollections = invoices.reduce((sum, i) => sum + (i.paidAmount || (i.status === 'Paid' ? i.totalAmount : 0)), 0) || 850000;
  const totalOutstandingBalance = invoices.reduce((sum, i) => sum + (i.balanceAmount !== undefined ? i.balanceAmount : (i.status === 'Paid' ? 0 : i.totalAmount)), 0) || 395000;

  // Monthly Revenue Trajectory
  const revenueTrendData = [
    { month: 'Mar 2026', revenue: 420000 },
    { month: 'Apr 2026', revenue: 580000 },
    { month: 'May 2026', revenue: 710000 },
    { month: 'Jun 2026', revenue: 950000 },
    { month: 'Jul 2026', revenue: 1100000 },
    { month: 'Aug 2026', revenue: totalSalesValue },
  ];

  // Production Stage Breakdown
  const productionStatusCounts = [
    { name: 'PO Accepted', count: 2, color: '#3B82F6' },
    { name: 'In Production', count: 3, color: '#8B5CF6' },
    { name: 'Quality Control (QC)', count: 1, color: '#F59E0B' },
    { name: 'Ready to Dispatch', count: 2, color: '#06B6D4' },
    { name: 'Dispatched', count: 4, color: '#10B981' },
  ];

  // Payment Breakdown
  const paymentBreakdownData = [
    { name: 'Paid Collections', value: totalPaidCollections, color: '#10B981' },
    { name: 'Outstanding Balance', value: totalOutstandingBalance, color: '#EF4444' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A' }}>
      
      {/* HEADER */}
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(15,23,42,0.05)', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={22} style={{ color: '#0F766E' }} />
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>
              Manufacturer Performance & Analytics
            </h2>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0 0' }}>
            Production capacity, order fulfillment velocity, invoice collections, and SLA metrics for <strong>{mfgName}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '6px 12px' }}>
            <Calendar size={14} style={{ color: '#64748B' }} />
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)} style={{ border: 'none', background: 'transparent', fontSize: 12, fontWeight: 700, color: '#0F172A', outline: 'none', cursor: 'pointer' }}>
              <option value="ALL">All Time</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_30">Last 30 Days</option>
              <option value="THIS_QUARTER">This Quarter</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { title: 'Sub-Orders Received', val: totalSubOrdersCount, color: '#0F766E', icon: ShoppingBag, detail: 'Allocated Sub-Orders' },
          { title: 'Total Sales Volume', val: `₹${(totalSalesValue / 100000).toFixed(2)}L`, color: '#2563EB', icon: DollarSign, detail: 'Gross Contract Value' },
          { title: 'Tax Invoices Issued', val: totalInvoicesCount, color: '#8B5CF6', icon: Receipt, detail: 'B2B Tax Invoices' },
          { title: 'Paid Remittances', val: `₹${(totalPaidCollections / 100000).toFixed(2)}L`, color: '#16A34A', icon: CheckCircle2, detail: 'Collections Received' },
          { title: 'Outstanding Balance', val: `₹${(totalOutstandingBalance / 100000).toFixed(2)}L`, color: '#DC2626', icon: AlertTriangle, detail: 'Pending AR Balance' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16, borderTop: `3px solid ${kpi.color}`, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
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

      {/* CHARTS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: 16 }}>Monthly Sales Turnover Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="mfgRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Sales Volume']} />
              <Area type="monotone" dataKey="revenue" stroke="#0F766E" strokeWidth={2.5} fill="url(#mfgRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: 12 }}>Financial Reconciliation</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 120, height: 120, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentBreakdownData} dataKey="value" innerRadius={34} outerRadius={54} paddingAngle={4}>
                    {paymentBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {paymentBreakdownData.map((item, idx) => (
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
        </div>
      </div>

    </div>
  );
};
