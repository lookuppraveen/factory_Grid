import React from 'react';
import { useApp } from '../../context/AppContext';
import { ManufacturerAnalyticsModule } from './ManufacturerAnalyticsModule';
import { AdminAnalyticsModule } from './AdminAnalyticsModule';

import {
  BarChart3, TrendingUp, DollarSign, ShoppingBag,
  Users, Factory, ShieldCheck, ArrowUpRight, Download
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';

const analyticsMonthly = [
  { month: 'Jan', revenue: 140000, rfqs: 15, orders: 10 },
  { month: 'Feb', revenue: 165000, rfqs: 18, orders: 12 },
  { month: 'Mar', revenue: 185000, rfqs: 22, orders: 14 },
  { month: 'Apr', revenue: 228000, rfqs: 28, orders: 19 },
  { month: 'May', revenue: 195000, rfqs: 24, orders: 16 },
  { month: 'Jun', revenue: 312000, rfqs: 35, orders: 24 },
  { month: 'Jul', revenue: 278000, rfqs: 30, orders: 22 },
  { month: 'Aug', revenue: 408500, rfqs: 42, orders: 31 },
];

const arAgingData = [
  { bucket: '< 30 days', amount: 245000, color: 'var(--c-success)' },
  { bucket: '31–60 days', amount: 85000, color: 'var(--c-warning)' },
  { bucket: '61–90 days', amount: 32000, color: 'var(--c-warning)' },
  { bucket: '90+ days', amount: 14000, color: 'var(--c-danger)' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 8, padding: '10px 14px',
        boxShadow: 'var(--shadow-floating)',
      }}>
        <div className="ent-label" style={{ marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="ent-mono" style={{ fontWeight: 700, color: p.color || 'var(--text-primary)' }}>
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? `₹${p.value.toLocaleString()}` : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AnalyticsModule: React.FC = () => {
  const { currentRole, invoices, orders, rfqs } = useApp();

  // Role Routing
  if (currentRole === 'SUPPLIER') {
    return <ManufacturerAnalyticsModule />;
  }

  if (currentRole === 'ADMIN') {
    return <AdminAnalyticsModule />;
  }

  // Fallback / Buyer Executive View
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const rfqConversionRate = rfqs.length > 0 ? Math.round((orders.length / rfqs.length) * 100) : 0;

  const execKpis = [
    { title: 'Procurement Spend (FY)', val: `₹${(totalRevenue / 100000).toFixed(2)}L`, sub: '↑ +24.5% vs prior year', color: 'var(--c-secondary)', icon: DollarSign },
    { title: 'RFQ Conversion Rate', val: `${rfqConversionRate || 82}%`, sub: '↑ +5.2% vs industry avg', color: 'var(--c-success)', icon: TrendingUp },
    { title: 'Avg Order SLA Delivery Schedule', val: '16.8 Days', sub: 'WHO-GMP standard: ≤21 days', color: 'var(--c-primary)', icon: ShoppingBag },
    { title: 'Supplier SLA On-Time', val: '96.8%', sub: 'SLA compliance across all MFGs', color: 'var(--c-accent)', icon: ShieldCheck },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>
      {/* Enterprise Command Bar */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left">
          <div>
            <div className="ent-label">Dashboard / Analytics & BI</div>
            <div className="ent-page-title" style={{ margin: 0 }}>Executive Business Intelligence</div>
          </div>
        </div>
        <div className="ent-command-bar-right">
          <button className="ent-btn-secondary">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* Executive KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {execKpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="ent-card" style={{ borderTop: `3px solid ${kpi.color}`, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="ent-label">{kpi.title}</span>
                <Icon size={16} style={{ color: kpi.color }} />
              </div>
              <div className="ent-mono" style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>{kpi.val}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: kpi.color, marginTop: 4 }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Revenue & Order Velocity Area Chart */}
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">Procurement Spend & Order Velocity</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>8-Month growth trajectory (2026 YTD)</div>
            </div>
          </div>
          <div className="ent-panel-body">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analyticsMonthly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--c-secondary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--c-secondary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Spend" stroke="var(--c-secondary)" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AR Aging Bar */}
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">AR Aging Analysis</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>Collection risk buckets</div>
            </div>
          </div>
          <div className="ent-panel-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={arAgingData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="bucket" type="category" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} width={75} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]}>
                  {arAgingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
