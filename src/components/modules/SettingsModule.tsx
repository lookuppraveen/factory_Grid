import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, Lock, Users, Key, Database, FileText,
  Activity, Server, Settings, Cpu, HardDrive, AlertTriangle, Check, Search, Plus,
  Shield, Globe, BarChart3, Zap, CheckCircle2, Clock, Eye, Download, MoreHorizontal,
  UserCheck, RefreshCw, Bell, AlertCircle, Building2, DollarSign, Layers, Package,
  Tag, Star
} from 'lucide-react';


const masterUsers = [
  { id: 'usr-1', name: 'Dr. Vikram Sethi', email: 'v.sethi@apexpharma.com', role: 'BUYER', roleTitle: 'Buyer', roleDept: 'Procurement', org: 'Apex Pharma Ltd', status: 'ACTIVE', lastLogin: '10 mins ago', location: 'Mumbai, MH', icon: '🛒' },
  { id: 'usr-2', name: 'Rajesh Sharma', email: 'rajesh@sunbiolabs.com', role: 'SUPPLIER', roleTitle: 'Supplier', roleDept: 'Manufacturing', org: 'SunBio Labs Pvt Ltd', status: 'ACTIVE', lastLogin: '1 hour ago', location: 'Hyderabad, TS', icon: '🏭' },
  { id: 'usr-3', name: 'Ananya Verma', email: 'ananya@factorygrid.com', role: 'COMPLIANCE_OFFICER', roleTitle: 'Compliance Officer', roleDept: 'Quality & Regulatory', org: 'FactoryGrid Platform', status: 'ACTIVE', lastLogin: '5 mins ago', location: 'Delhi, DL', icon: '🛡' },
  { id: 'usr-4', name: 'Finance Controller', email: 'finance@factorygrid.com', role: 'ACCOUNTS_MANAGER', roleTitle: 'Accounts Manager', roleDept: 'Finance', org: 'FactoryGrid HQ', status: 'ACTIVE', lastLogin: '30 mins ago', location: 'Pune, MH', icon: '💰' },
  { id: 'usr-5', name: 'Platform Admin', email: 'admin@factorygrid.com', role: 'ADMIN', roleTitle: 'Platform Admin', roleDept: 'Administration', org: 'FactoryGrid HQ', status: 'ACTIVE', lastLogin: 'Just now', location: 'Bangalore, KA', icon: '⚙' },
];

const rbacMatrix = [
  { role: 'BUYER', title: 'Buyer', dept: 'Procurement', desc: 'Pharmaceutical buyer / procurement manager',
    perms: { rfqs: true, quotes: true, orders: true, invoices: true, compliance: false, analytics: false, admin: false, catalog: true }},
  { role: 'SUPPLIER', title: 'Supplier', dept: 'Manufacturing', desc: 'WHO-GMP certified manufacturer / partner',
    perms: { rfqs: true, quotes: true, orders: true, invoices: true, compliance: false, analytics: false, admin: false, catalog: true }},
  { role: 'COMPLIANCE_OFFICER', title: 'Compliance Officer', dept: 'Quality & Compliance', desc: 'Document verification & regulatory oversight',
    perms: { rfqs: false, quotes: false, orders: false, invoices: false, compliance: true, analytics: false, admin: false, catalog: false }},
  { role: 'SALES_MANAGER', title: 'Sales Manager', dept: 'Revenue & CRM', desc: 'B2B customer acquisition & revenue tracking',
    perms: { rfqs: true, quotes: true, orders: true, invoices: false, compliance: false, analytics: true, admin: false, catalog: true }},
  { role: 'ACCOUNTS_MANAGER', title: 'Accounts Manager', dept: 'Finance & Accounts', desc: 'Finance, invoicing & AR reconciliation',
    perms: { rfqs: false, quotes: false, orders: true, invoices: true, compliance: false, analytics: true, admin: false, catalog: false }},
  { role: 'ADMIN', title: 'Platform Admin', dept: 'Administration', desc: 'Full platform access — RBAC & system health',
    perms: { rfqs: true, quotes: true, orders: true, invoices: true, compliance: true, analytics: true, admin: true, catalog: true }},
];

const permColumns = ['rfqs', 'quotes', 'orders', 'invoices', 'compliance', 'analytics', 'admin', 'catalog'];
const permLabels: Record<string, string> = {
  rfqs: 'RFQ Center', quotes: 'Quotes', orders: 'Orders', invoices: 'Finance',
  compliance: 'Compliance', analytics: 'Analytics', admin: 'Admin Console', catalog: 'Catalog'
};

const systemMetrics = [
  { label: 'API Microservices Gateway', status: '99.99% Uptime', detail: '12ms latency · 4,200 req/s', state: 'HEALTHY' },
  { label: 'PostgreSQL DB Cluster', status: 'Healthy', detail: '42 active connections · Replication active', state: 'HEALTHY' },
  { label: 'Cold-Chain IoT Telemetry', status: 'Streaming Active', detail: '4,890 sensor events/min', state: 'HEALTHY' },
  { label: 'CDSCO Compliance Engine', status: 'Operational', detail: 'SHA-256 encrypted · 1.2TB archived', state: 'HEALTHY' },
  { label: 'WHO-GMP Audit Ledger', status: 'Synced', detail: '2,840 verified manufacturers', state: 'HEALTHY' },
  { label: 'Cold Storage Monitoring', status: '14 Active Units', detail: '2°C–8°C compliance: 100%', state: 'HEALTHY' },
];

const auditLogs = [
  { action: 'Compliance Case APPROVED', user: 'Ananya Verma', dept: 'Quality & Compliance', entity: 'BioCure Healthcare Pvt Ltd', time: '5 mins ago', ip: '192.168.1.42' },
  { action: 'New User Invited', user: 'Platform Admin', dept: 'Administration', entity: 'rajesh@sunbiolabs.com (SUPPLIER)', time: '30 mins ago', ip: '10.0.0.1' },
  { action: 'Master Order Created', user: 'Dr. Vikram Sethi', dept: 'Procurement', entity: 'MO-2026-1001 — ₹25,20,000', time: '2 hours ago', ip: '172.16.0.8' },
  { action: 'RFQ Published', user: 'Dr. Vikram Sethi', dept: 'Procurement', entity: 'RFQ-2026-001 — 50,000 boxes', time: '3 hours ago', ip: '172.16.0.8' },
  { action: 'Payment Recorded', user: 'Finance Controller', dept: 'Finance', entity: 'INV-2026-4401 — ₹7,20,000', time: '4 hours ago', ip: '192.168.2.14' },
];

import { IntegrationsSettingsModule } from './IntegrationsSettingsModule';
import { Security2FAModule } from './Security2FAModule';
import { NotificationsModule } from './NotificationsModule';

export const SettingsModule: React.FC = () => {
  const { 
    currentRole, manufacturers, products, customers, customerVerifications,
    auditLogs: contextAuditLogs, buyerOnboardings, manufacturerOnboardings,
    approveBuyerOnboarding, approveManufacturerOnboarding, addAuditLog,
    setActiveTab: setGlobalTab
  } = useApp();

  // Guard: BUYER and SUPPLIER must not see the admin System Control Center
  if (currentRole === 'BUYER' || currentRole === 'SUPPLIER') {
    return <NotificationsModule />;
  }

  const [activeTab, setActiveTab] = useState<'PRICING' | 'CUSTOMER_FLAGS' | 'INTEGRATIONS' | 'SECURITY' | 'USERS' | 'RBAC' | 'SYSTEM' | 'AUDIT' | 'ORGANIZATIONS' | 'API_HEALTH'>(() => currentRole === 'ADMIN' ? 'PRICING' : 'INTEGRATIONS');

  const tabs = [
    ...(currentRole === 'ADMIN' ? [] : [{ id: 'INTEGRATIONS', label: 'Integrations', icon: Server }]),
    { id: 'PRICING', label: 'Price Settings', icon: DollarSign },
    { id: 'CUSTOMER_FLAGS', label: 'Customer Flags', icon: Tag },
    { id: 'SECURITY', label: 'Security & 2FA', icon: ShieldCheck },
    { id: 'USERS', label: 'User Directory', icon: Users },
    { id: 'ORGANIZATIONS', label: 'Organizations', icon: Building2 },
    { id: 'RBAC', label: 'RBAC Permissions', icon: Shield },
    { id: 'SYSTEM', label: 'System Health', icon: Server },
    { id: 'API_HEALTH', label: 'API Health', icon: Activity },
    { id: 'AUDIT', label: 'Audit Trail', icon: FileText },
  ] as const;

  // Margin Configuration State
  const MARGIN_STORAGE_KEY = 'factorygrid_price_margins_v1';
  const [marginRules, setMarginRules] = useState<Array<{ id: string; type: 'Manufacturer' | 'Product Category' | 'Product SKU'; value: string; margin: number; lastUpdated: string }>>(() => {
    try {
      const saved = localStorage.getItem(MARGIN_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'mrg-1', type: 'Manufacturer', value: 'SunBio Labs Pvt Ltd', margin: 10, lastUpdated: '2026-08-24 14:00' },
      { id: 'mrg-2', type: 'Product Category', value: 'Antibiotics', margin: 15, lastUpdated: '2026-08-24 12:30' },
      { id: 'mrg-3', type: 'Product SKU', value: 'SKU-AZI-500', margin: 20, lastUpdated: '2026-08-23 16:45' }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(MARGIN_STORAGE_KEY, JSON.stringify(marginRules));
    } catch (e) {
      console.error(e);
    }
  }, [marginRules]);

  // Options Data
  const allManufacturerOptions = React.useMemo(() => {
    const names = new Set<string>();
    (manufacturers || []).forEach(m => {
      if (m.companyName) names.add(m.companyName);
      if (m.name) names.add(m.name);
    });
    names.add('CiplaFormulations');
    names.add('SunBio Labs Pvt Ltd');
    names.add('LupinLabs Unit IV');
    names.add('Apex Pharma Labs');
    return Array.from(names).map(name => ({ id: name, name }));
  }, [manufacturers]);

  const allCategoryOptions = ['Antibiotics', 'Analgesics & NSAIDs', 'Cardiovascular', 'Gastrointestinal', 'Antidiabetic', 'Respiratory', 'Injectables'];

  const allSkuOptions = React.useMemo(() => {
    const list: Array<{ id: string; code: string; label: string }> = [
      { id: 'sku-1', code: 'SKU-AZI-500', label: 'SKU-AZI-500 — Azithromycin 500mg' },
      { id: 'sku-2', code: 'SKU-PCM-650', label: 'SKU-PCM-650 — Paracetamol 650mg' },
      { id: 'sku-3', code: 'SKU-AMX-625', label: 'SKU-AMX-625 — Amoxyclav 625mg' },
      { id: 'sku-4', code: 'SKU-CIP-500', label: 'SKU-CIP-500 — Ciprofloxacin 500mg' },
      { id: 'sku-5', code: 'SKU-MET-500', label: 'SKU-MET-500 — Metformin 500mg SR' },
      { id: 'sku-6', code: 'SKU-TEL-40', label: 'SKU-TEL-40 — Telmisartan 40mg' }
    ];
    (products || []).forEach(p => {
      if (p.sku && !list.some(l => l.code === p.sku)) {
        list.push({ id: p.id || p.sku, code: p.sku, label: `${p.sku} — ${p.name || p.productName}` });
      }
    });
    return list;
  }, [products]);

  // Active Selected Inputs
  const [selectedMfg, setSelectedMfg] = useState<string>('SunBio Labs Pvt Ltd');
  const [mfgMarginInput, setMfgMarginInput] = useState<string>('10');

  const [selectedCategory, setSelectedCategory] = useState<string>('Antibiotics');
  const [categoryMarginInput, setCategoryMarginInput] = useState<string>('15');

  const [selectedSku, setSelectedSku] = useState<string>('SKU-AZI-500');
  const [skuMarginInput, setSkuMarginInput] = useState<string>('20');

  // Save Handlers with Audit Logging
  const handleSaveMfgMargin = () => {
    const marginNum = parseFloat(mfgMarginInput);
    if (isNaN(marginNum) || marginNum < 0) {
      alert('Please enter a valid numeric margin percentage.');
      return;
    }

    const existingIndex = marginRules.findIndex(r => r.type === 'Manufacturer' && r.value === selectedMfg);
    const prevMargin = existingIndex >= 0 ? marginRules[existingIndex].margin : 0;
    const nowStr = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    const updatedRule = {
      id: existingIndex >= 0 ? marginRules[existingIndex].id : `mrg-${Date.now()}`,
      type: 'Manufacturer' as const,
      value: selectedMfg,
      margin: marginNum,
      lastUpdated: nowStr
    };

    let newRules = [...marginRules];
    if (existingIndex >= 0) {
      newRules[existingIndex] = updatedRule;
    } else {
      newRules.push(updatedRule);
    }

    setMarginRules(newRules);
    const actionText = `Manufacturer Margin | ${selectedMfg} | ${prevMargin}% → ${marginNum}%`;
    addAuditLog('Price Settings', actionText);
    alert(`✔ Manufacturer Margin Rule Saved!\n\nTarget: ${selectedMfg}\nMargin: ${marginNum}%\nAudit Trail entry recorded.`);
  };

  const handleSaveCategoryMargin = () => {
    const marginNum = parseFloat(categoryMarginInput);
    if (isNaN(marginNum) || marginNum < 0) {
      alert('Please enter a valid numeric margin percentage.');
      return;
    }

    const existingIndex = marginRules.findIndex(r => r.type === 'Product Category' && r.value === selectedCategory);
    const prevMargin = existingIndex >= 0 ? marginRules[existingIndex].margin : 0;
    const nowStr = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    const updatedRule = {
      id: existingIndex >= 0 ? marginRules[existingIndex].id : `mrg-${Date.now()}`,
      type: 'Product Category' as const,
      value: selectedCategory,
      margin: marginNum,
      lastUpdated: nowStr
    };

    let newRules = [...marginRules];
    if (existingIndex >= 0) {
      newRules[existingIndex] = updatedRule;
    } else {
      newRules.push(updatedRule);
    }

    setMarginRules(newRules);
    const actionText = `Product Category Margin | ${selectedCategory} | ${prevMargin}% → ${marginNum}%`;
    addAuditLog('Price Settings', actionText);
    alert(`✔ Product Category Margin Rule Saved!\n\nTarget: ${selectedCategory}\nMargin: ${marginNum}%\nAudit Trail entry recorded.`);
  };

  const handleSaveSkuMargin = () => {
    const marginNum = parseFloat(skuMarginInput);
    if (isNaN(marginNum) || marginNum < 0) {
      alert('Please enter a valid numeric margin percentage.');
      return;
    }

    const existingIndex = marginRules.findIndex(r => r.type === 'Product SKU' && r.value === selectedSku);
    const prevMargin = existingIndex >= 0 ? marginRules[existingIndex].margin : 0;
    const nowStr = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    const updatedRule = {
      id: existingIndex >= 0 ? marginRules[existingIndex].id : `mrg-${Date.now()}`,
      type: 'Product SKU' as const,
      value: selectedSku,
      margin: marginNum,
      lastUpdated: nowStr
    };

    let newRules = [...marginRules];
    if (existingIndex >= 0) {
      newRules[existingIndex] = updatedRule;
    } else {
      newRules.push(updatedRule);
    }

    setMarginRules(newRules);
    const actionText = `Product SKU Margin | ${selectedSku} | ${prevMargin}% → ${marginNum}%`;
    addAuditLog('Price Settings', actionText);
    alert(`✔ Product SKU Margin Rule Saved!\n\nTarget: ${selectedSku}\nMargin: ${marginNum}%\nAudit Trail entry recorded.`);
  };

  const handleRemoveMarginRule = (rule: { id: string; type: string; value: string; margin: number }) => {
    const newRules = marginRules.filter(r => r.id !== rule.id);
    setMarginRules(newRules);
    const actionText = `${rule.type} Margin | ${rule.value} | Cleared Margin Rule (Was ${rule.margin}%)`;
    addAuditLog('Price Settings', actionText);
  };

  const combinedAuditLogs = [...auditLogs, ...contextAuditLogs.slice(0, 10)];

  const orgBuyers = [
    { name: 'Apex Pharma Labs Ltd', code: 'BUY-2026-001', type: 'Buyer', city: 'Hyderabad', status: 'ACTIVE', users: 3, gstin: '36APXPH0001A1Z5', joinedDate: '2026-01-15' },
    { name: 'MedLife Hospital Chain', code: 'BUY-2026-002', type: 'Buyer', city: 'Delhi', status: 'ACTIVE', users: 2, gstin: '07MEDLF0002B1Z6', joinedDate: '2026-02-01' },
    { name: 'BioCure Healthcare', code: 'BUY-2026-003', type: 'Buyer', city: 'Mumbai', status: 'PENDING', users: 1, gstin: '27BIOCR0003C1Z7', joinedDate: '2026-03-10' },
  ];

  const orgManufacturers = [
    { name: 'SunBio Labs Pvt Ltd', code: 'MFG-2026-001', type: 'Manufacturer', city: 'Baddi', status: 'ACTIVE', users: 4, license: 'ML-HP-2024-001', joinedDate: '2025-11-01' },
    { name: 'CiplaFormulations', code: 'MFG-2026-002', type: 'Manufacturer', city: 'Pune', status: 'ACTIVE', users: 2, license: 'ML-MH-2023-099', joinedDate: '2025-10-15' },
    { name: 'LupinLabs Unit IV', code: 'MFG-2026-003', type: 'Manufacturer', city: 'Vapi', status: 'REVIEW', users: 1, license: 'ML-GJ-2024-055', joinedDate: '2026-04-20' },
  ];

  const apiEndpoints = [
    { name: 'RFQ Procurement Gateway', endpoint: 'POST /api/v2/rfqs', latency: '12ms', uptime: '99.99%', rpm: '4,200', status: 'OPERATIONAL' },
    { name: 'Manufacturer Matching AI', endpoint: 'GET /api/v2/ai/match', latency: '48ms', uptime: '99.95%', rpm: '890', status: 'OPERATIONAL' },
    { name: 'Quote Submission Engine', endpoint: 'POST /api/v2/quotes', latency: '18ms', uptime: '100%', rpm: '1,200', status: 'OPERATIONAL' },
    { name: 'Cold-Chain IoT Telemetry', endpoint: 'WS /api/v2/telemetry', latency: '8ms', uptime: '99.98%', rpm: '24,000', status: 'OPERATIONAL' },
    { name: 'CDSCO Compliance Engine', endpoint: 'GET /api/v2/compliance', latency: '32ms', uptime: '99.97%', rpm: '340', status: 'OPERATIONAL' },
    { name: 'Invoice & Payment Gateway', endpoint: 'POST /api/v2/invoices', latency: '22ms', uptime: '99.99%', rpm: '600', status: 'OPERATIONAL' },
    { name: 'Authentication Service', endpoint: 'POST /api/v2/auth/login', latency: '6ms', uptime: '100%', rpm: '2,800', status: 'OPERATIONAL' },
    { name: 'Audit Log Service', endpoint: 'POST /api/v2/audit', latency: '4ms', uptime: '100%', rpm: '12,000', status: 'OPERATIONAL' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Command Bar Header ───────────────── */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left">
          <div>
            <div className="ent-label">Dashboard / Admin Console</div>
            <div className="ent-page-title" style={{ margin: 0 }}>System Control Center</div>
          </div>
        </div>
        <div className="ent-command-bar-right">
          <button className="ent-btn-secondary">
            <Download size={14} /> Export Audit Log
          </button>
          <button className="ent-btn-primary" onClick={() => alert('User invitation sent.')}>
            <Plus size={14} /> Provision User
          </button>
        </div>
      </div>

      {/* ── COMPACT HORIZONTAL SYSTEM METRICS STRIP ─────── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#16A34A', fontSize: 14, fontWeight: 800 }}>●</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>All Platform Systems Operational</div>
            <div className="ent-caption">CDSCO & WHO-GMP Verified Nodes</div>
          </div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />

        <div>
          <div className="ent-label">API Gateway</div>
          <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>99.99% Uptime (12ms)</div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />

        <div>
          <div className="ent-label">Active Sessions</div>
          <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>247 Verified Users</div>
        </div>
        <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />

        <div>
          <div className="ent-label">DB Cluster</div>
          <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>42 Primary Connections</div>
        </div>
      </div>

      {/* ── Workspace Tabs (Azure Admin Center style) ─────── */}
      <div className="ent-tab-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`ent-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── PRICE SETTINGS (MARGIN CONFIGURATION) TAB ── */}
      {activeTab === 'PRICING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Header Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <DollarSign size={20} style={{ color: '#0F766E' }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Price &amp; Margin Settings</h2>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Configure platform markup margins by Manufacturer, Product Category, or Product SKU. Audit logs record all margin updates automatically.
            </p>
          </div>

          {/* 3 Margin Options Grid Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            
            {/* 1. MANUFACTURER MARGIN */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 2px 4px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                <Building2 size={18} style={{ color: '#0F766E' }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>1. Manufacturer Margin</div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>Configure margin % for specific manufacturers</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Select Manufacturer</label>
                  <select
                    value={selectedMfg}
                    onChange={e => setSelectedMfg(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#F8FAFC' }}
                  >
                    {allManufacturerOptions.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Margin Percentage (%)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="e.g. 10"
                      value={mfgMarginInput}
                      onChange={e => setMfgMarginInput(e.target.value)}
                      style={{ width: '100%', padding: '8px 32px 8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748B' }}>%</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveMfgMargin}
                  style={{ marginTop: 6, padding: '9px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={15} /> Save / Apply Manufacturer Margin
                </button>
              </div>
            </div>

            {/* 2. PRODUCT CATEGORY MARGIN */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 2px 4px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                <Layers size={18} style={{ color: '#2563EB' }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>2. Product Category Margin</div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>Configure margin % for product categories</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Select Product Category</label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#F8FAFC' }}
                  >
                    {allCategoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Margin Percentage (%)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="e.g. 15"
                      value={categoryMarginInput}
                      onChange={e => setCategoryMarginInput(e.target.value)}
                      style={{ width: '100%', padding: '8px 32px 8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748B' }}>%</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveCategoryMargin}
                  style={{ marginTop: 6, padding: '9px 16px', borderRadius: 6, background: '#2563EB', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={15} /> Save / Apply Category Margin
                </button>
              </div>
            </div>

            {/* 3. PRODUCT SKU MARGIN */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 2px 4px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                <Package size={18} style={{ color: '#7C3AED' }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>3. Product SKU Margin</div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>Configure margin % for individual Product SKUs</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Select Product SKU</label>
                  <select
                    value={selectedSku}
                    onChange={e => setSelectedSku(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#F8FAFC' }}
                  >
                    {allSkuOptions.map(sku => (
                      <option key={sku.id} value={sku.code}>{sku.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Margin Percentage (%)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="e.g. 20"
                      value={skuMarginInput}
                      onChange={e => setSkuMarginInput(e.target.value)}
                      style={{ width: '100%', padding: '8px 32px 8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748B' }}>%</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveSkuMargin}
                  style={{ marginTop: 6, padding: '9px 16px', borderRadius: 6, background: '#7C3AED', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={15} /> Save / Apply SKU Margin
                </button>
              </div>
            </div>

          </div>

          {/* Active Configured Margin Rules Table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                Configured Active Margin Rules ({marginRules.length})
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Real-time margin rules applied to platform pricing
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textTransform: 'uppercase', fontSize: 11, fontWeight: 800 }}>
                  <th style={{ padding: '12px 16px' }}>Rule Target Type</th>
                  <th style={{ padding: '12px 16px' }}>Selected Value / Entity</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Configured Margin %</th>
                  <th style={{ padding: '12px 16px' }}>Last Updated</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {marginRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 30, textAlign: 'center', color: '#64748B' }}>
                      No active margin rules configured. Use the options above to add margin rules.
                    </td>
                  </tr>
                ) : (
                  marginRules.map(rule => (
                    <tr key={rule.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800,
                          background: rule.type === 'Manufacturer' ? '#F0FDFA' : rule.type === 'Product Category' ? '#EFF6FF' : '#F3E8FF',
                          color: rule.type === 'Manufacturer' ? '#0F766E' : rule.type === 'Product Category' ? '#1D4ED8' : '#6B21A8',
                          border: `1px solid ${rule.type === 'Manufacturer' ? '#99F6E4' : rule.type === 'Product Category' ? '#BFDBFE' : '#E9D5FF'}`
                        }}>
                          {rule.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>
                        {rule.value}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#0F766E', fontSize: 14 }}>
                        {rule.margin}%
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B', fontSize: 11.5 }}>
                        {rule.lastUpdated}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRemoveMarginRule(rule)}
                          style={{ padding: '4px 10px', borderRadius: 6, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Clear Rule
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Customer Classification Architecture Note (Prompt Section 11 Requirement) */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                Customer Classification Architecture &amp; Pricing Separation
              </div>
              <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>
                Special Party is an enterprise identity and customer-level flag controlled exclusively via <strong>Compliance &amp; Verification → Customer Verification</strong>.
                Pricing and margin configurations above operate independently of the classification flag, ensuring clean modularity. Future customer-specific margin rules can plug into this architecture seamlessly without altering base procurement pipelines.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── CUSTOMER FLAGS TAB ──────────────────────────── */}
      {activeTab === 'CUSTOMER_FLAGS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#0891B2', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Tag size={14} /> System Administration · Customer Classification
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
                  Customer Flags &amp; Special Party Governance
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                  Special Party is a platform customer-level classification flag controlled through Admin verification workflows.
                </p>
              </div>

              <button
                onClick={() => setGlobalTab('compliance-verification')}
                style={{ padding: '9px 18px', borderRadius: 8, background: '#0E7490', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 4px rgba(14,116,144,0.2)' }}
              >
                <UserCheck size={16} /> Open Customer Verification Desk →
              </button>
            </div>
          </div>

          {/* Classification Overview KPI Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Customers</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{customers.length}</div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Registered B2B buyer organizations</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Regular Customers</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#475569', marginTop: 4 }}>
                {customers.filter(c => c.customerClassification !== 'SPECIAL_PARTY').length}
              </div>
              <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Standard commercial procurement</div>
            </div>

            <div style={{ background: '#F0FDFA', border: '1px solid #A5F3FC', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(14,116,144,0.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0E7490', textTransform: 'uppercase' }}>Special Party Accounts</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0E7490', marginTop: 4 }}>
                {customers.filter(c => c.customerClassification === 'SPECIAL_PARTY').length}
              </div>
              <div style={{ fontSize: 11.5, color: '#0E7490', marginTop: 2 }}>Platform Admin flagged VIP accounts</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>Verification Requests</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#16A34A', marginTop: 4 }}>{customerVerifications.length}</div>
              <div style={{ fontSize: 11.5, color: '#16A34A', marginTop: 2 }}>Compliance pipeline cases</div>
            </div>
          </div>

          {/* Architecture & Business Rules Detail Panel */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
              Platform Classification Business Rules
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: '#E2E8F0', fontSize: 11, fontWeight: 800, color: '#334155' }}>REGULAR</span>
                  Regular Customer (Default)
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, lineHeight: 1.5 }}>
                  All newly registered buyers default to Regular Customer. No self-service flag during registration. Follows standard sourcing, quotation comparison, and order fulfillment.
                </div>
              </div>

              <div style={{ background: '#ECFEFF', padding: 16, borderRadius: 8, border: '1px solid #A5F3FC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#0E7490' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: '#0E7490', fontSize: 11, fontWeight: 800, color: '#FFFFFF' }}>SPECIAL PARTY</span>
                  Special Party (Admin Managed)
                </div>
                <div style={{ fontSize: 12, color: '#155E75', marginTop: 6, lineHeight: 1.5 }}>
                  Assigned exclusively by authorized Platform Admins via <strong>Compliance &amp; Verification → Customer Verification</strong> with audit trail. Flag automatically inherits into Buyer Dashboard, RFQs, Manufacturer dispatch, and internal order monitoring.
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
              Note: Actual customer flag assignment takes place on the individual customer application record in Customer Verification, maintaining granular auditable controls.
            </div>
          </div>
        </div>
      )}

      {/* ── INTEGRATIONS TAB ────────────────────────────── */}
      {activeTab === 'INTEGRATIONS' && <IntegrationsSettingsModule />}

      {/* ── SECURITY & 2FA TAB ───────────────────────────── */}
      {activeTab === 'SECURITY' && <Security2FAModule />}

      {/* ── ORGANIZATIONS TAB ────────────────────────────── */}
      {activeTab === 'ORGANIZATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Pending Internal Organization Approvals Queue */}
          <div className="ent-panel" style={{ border: '1px solid rgba(37,99,235,0.3)', background: 'var(--bg-surface)' }}>
            <div className="ent-panel-header" style={{ background: 'rgba(37,99,235,0.05)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} style={{ color: '#2563EB' }} />
                  <div className="ent-section-title">Pending Enterprise Approvals & Code Generation</div>
                </div>
                <div className="ent-caption" style={{ marginTop: 2 }}>
                  Internal Platform Admin approval pipeline. Approving generates official Buyer/Manufacturer Code & dispatches invitation email.
                </div>
              </div>
              <span className="ent-chip-primary">
                {buyerOnboardings.filter(b => b.status === 'PENDING' || b.status === 'UNDER_REVIEW').length +
                 manufacturerOnboardings.filter(m => m.status === 'PENDING' || m.status === 'UNDER_REVIEW').length} Pending Review
              </span>
            </div>

            <table className="ent-table">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Type</th>
                  <th>Contact Person</th>
                  <th>Corporate Email</th>
                  <th>Statutory ID</th>
                  <th>Submitted Date</th>
                  <th style={{ textAlign: 'right' }}>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {buyerOnboardings.filter(b => b.status === 'PENDING' || b.status === 'UNDER_REVIEW').map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.companyName}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: 4 }}>BUYER</span></td>
                    <td className="ent-body">{b.contactPerson}</td>
                    <td className="ent-mono" style={{ fontSize: 12 }}>{b.email}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{b.gstin}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{b.submittedDate}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="ent-btn-primary"
                        style={{ height: 30, padding: '0 12px', fontSize: 11.5 }}
                        onClick={() => {
                          const generatedCode = `BUY-2026-${Math.floor(100 + Math.random() * 900)}`;
                          approveBuyerOnboarding(b.id);
                          addAuditLog('Platform Admin', `Approved Buyer Organization ${b.companyName}. Generated Code: ${generatedCode}. Dispatched invitation email to ${b.email}.`);
                          alert(`✔ Account Approved & Provisioned!\n\nGenerated Enterprise Buyer Code: ${generatedCode}\nInvitation email with workstation login credentials dispatched to: ${b.email}`);
                        }}
                      >
                        Approve & Allocate Code →
                      </button>
                    </td>
                  </tr>
                ))}

                {manufacturerOnboardings.filter(m => m.status === 'PENDING' || m.status === 'UNDER_REVIEW').map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.companyName}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', background: 'rgba(20,184,166,0.1)', padding: '2px 8px', borderRadius: 4 }}>MANUFACTURER</span></td>
                    <td className="ent-body">{m.contactPerson}</td>
                    <td className="ent-mono" style={{ fontSize: 12 }}>{m.email}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{m.mfgLicenseNo || m.whoGmpNo}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{m.submittedDate}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="ent-btn-primary"
                        style={{ height: 30, padding: '0 12px', fontSize: 11.5, background: '#14B8A6', borderColor: '#0F766E' }}
                        onClick={() => {
                          const generatedCode = `MFG-2026-${Math.floor(100 + Math.random() * 900)}`;
                          approveManufacturerOnboarding(m.id);
                          addAuditLog('Platform Admin', `Approved Manufacturer Organization ${m.companyName}. Generated Code: ${generatedCode}. Dispatched invitation email to ${m.email}.`);
                          alert(`✔ Account Approved & Provisioned!\n\nGenerated Enterprise Manufacturer Code: ${generatedCode}\nInvitation email with workstation login credentials dispatched to: ${m.email}`);
                        }}
                      >
                        Approve & Allocate Code →
                      </button>
                    </td>
                  </tr>
                ))}

                {buyerOnboardings.filter(b => b.status === 'PENDING' || b.status === 'UNDER_REVIEW').length === 0 &&
                 manufacturerOnboardings.filter(m => m.status === 'PENDING' || m.status === 'UNDER_REVIEW').length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
                      All organization access requests are fully processed & provisioned. No pending approvals in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Buyer Organizations</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Pharmaceutical buyers & procurement companies on the platform</div>
              </div>
              <span className="ent-chip-primary">{orgBuyers.length} Registered</span>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  {['Organization', 'Buyer Code', 'City', 'GSTIN', 'Users', 'Joined', 'Status'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {orgBuyers.map(org => (
                  <tr key={org.code}>
                    <td style={{ fontWeight: 700 }}>{org.name}</td>
                    <td className="ent-mono">{org.code}</td>
                    <td className="ent-body">{org.city}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{org.gstin}</td>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>{org.users} users</td>
                    <td className="ent-mono">{org.joinedDate}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: org.status === 'ACTIVE' ? '#047857' : '#B45309' }} />
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Manufacturer Organizations</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>WHO-GMP certified manufacturing partners on the platform</div>
              </div>
              <span className="ent-chip-primary">{orgManufacturers.length} Registered</span>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  {['Organization', 'Mfg Code', 'City', 'Mfg License', 'Users', 'Joined', 'Status'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {orgManufacturers.map(org => (
                  <tr key={org.code}>
                    <td style={{ fontWeight: 700 }}>{org.name}</td>
                    <td className="ent-mono">{org.code}</td>
                    <td className="ent-body">{org.city}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{org.license}</td>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>{org.users} users</td>
                    <td className="ent-mono">{org.joinedDate}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: org.status === 'ACTIVE' ? '#047857' : '#B45309' }} />
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── API HEALTH TAB ────────────────────────────────── */}
      {activeTab === 'API_HEALTH' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ent-kpi-strip">
            <div className="ent-kpi-strip-item">
              <div className="kpi-label">API Endpoints</div>
              <div className="kpi-value">{apiEndpoints.length}</div>
              <div className="kpi-sub">All operational</div>
            </div>
            <div className="ent-kpi-strip-item">
              <div className="kpi-label">Avg Latency</div>
              <div className="kpi-value">18ms</div>
              <div className="kpi-sub">P99: 42ms</div>
            </div>
            <div className="ent-kpi-strip-item">
              <div className="kpi-label">Platform Uptime</div>
              <div className="kpi-value" style={{ color: '#047857' }}>99.98%</div>
              <div className="kpi-sub">30-day rolling</div>
            </div>
            <div className="ent-kpi-strip-item">
              <div className="kpi-label">Total RPM</div>
              <div className="kpi-value ent-mono">46,030</div>
              <div className="kpi-sub">Requests per minute</div>
            </div>
          </div>

          <div className="ent-panel">
            <div className="ent-panel-header">
              <div className="ent-section-title">API Endpoint Health Monitor</div>
              <span className="ent-caption">Real-time status of all platform microservices</span>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  {['Service Name', 'Endpoint', 'Latency', 'Uptime', 'RPM', 'Status'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {apiEndpoints.map(ep => (
                  <tr key={ep.endpoint}>
                    <td style={{ fontWeight: 700 }}>{ep.name}</td>
                    <td className="ent-mono" style={{ fontSize: 11, color: 'var(--c-secondary)' }}>{ep.endpoint}</td>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>{ep.latency}</td>
                    <td className="ent-mono" style={{ fontWeight: 700, color: '#047857' }}>{ep.uptime}</td>
                    <td className="ent-mono">{ep.rpm}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857' }} />
                        {ep.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── USER DIRECTORY TAB ───────────────────────────── */}
      {activeTab === 'USERS' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">Platform User Registry</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>Provisioned accounts & RBAC credentials — Azure AD style</div>
            </div>
            <span className="ent-caption" style={{ fontWeight: 600 }}>{masterUsers.length} Account Records</span>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                {['User Identity', 'Corporate Email', 'Role & Department', 'Organization', 'Last Active', 'Location', 'Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {masterUsers.map(usr => (
                <tr key={usr.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--c-secondary-soft)', border: '1px solid var(--c-secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--c-secondary)' }}>
                        {usr.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="ent-subheading">{usr.name}</div>
                    </div>
                  </td>
                  <td className="ent-mono" style={{ fontSize: 12 }}>{usr.email}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{usr.roleTitle}</div>
                    <div className="ent-caption">{usr.roleDept}</div>
                  </td>
                  <td className="ent-body">{usr.org}</td>
                  <td className="ent-mono">{usr.lastLogin}</td>
                  <td className="ent-caption">{usr.location}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857' }} /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── RBAC PERMISSIONS MATRIX TAB ─────────────────── */}
      {activeTab === 'RBAC' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">Role-Based Access Control (RBAC) Matrix</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>Enforced endpoint & module authorization rules</div>
            </div>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                <th style={{ width: 220 }}>Role & Scope</th>
                {permColumns.map(p => (
                  <th key={p} style={{ textAlign: 'center' }}>{permLabels[p]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rbacMatrix.map(role => (
                <tr key={role.role}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{role.title}</div>
                    <div className="ent-caption">{role.dept}</div>
                  </td>
                  {permColumns.map(p => {
                    const allowed = role.perms[p as keyof typeof role.perms];
                    return (
                      <td key={p} style={{ textAlign: 'center' }}>
                        {allowed ? (
                          <span style={{ color: '#047857', fontWeight: 800, fontSize: 14 }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--border-strong)', fontSize: 13 }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SYSTEM CONTROL TAB ──────────────────────────── */}
      {activeTab === 'SYSTEM' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div className="ent-section-title">Platform Microservices Health</div>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                <th>Service Gateway</th>
                <th>Health Status</th>
                <th>Telemetry & Latency</th>
                <th>System State</th>
              </tr>
            </thead>
            <tbody>
              {systemMetrics.map(srv => (
                <tr key={srv.label}>
                  <td style={{ fontWeight: 600 }}>{srv.label}</td>
                  <td style={{ fontWeight: 600 }}>{srv.status}</td>
                  <td className="ent-mono">{srv.detail}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857' }} /> Healthy
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── AUDIT TRAIL TAB ──────────────────────────────── */}
      {activeTab === 'AUDIT' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">Platform Security Audit Log</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>Tamper-proof event trail for CDSCO regulatory compliance</div>
            </div>
            <button className="ent-btn-secondary" style={{ fontSize: 11, height: 32, padding: '0 12px' }}>
              <Download size={13} /> Export Audit Log
            </button>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                <th>Audit Action Event</th>
                <th>Actor / User</th>
                <th>Department</th>
                <th>Target Object / Value</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {[...auditLogs, ...contextAuditLogs.slice(0, 5)].map((log: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1E40AF', display: 'inline-block', marginRight: 8 }} />
                    {log.action}
                  </td>
                  <td>{log.user || log.userName}</td>
                  <td className="ent-caption">{log.dept || log.userRole}</td>
                  <td className="ent-mono" style={{ fontSize: 12 }}>{log.entity || log.module}</td>
                  <td className="ent-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{log.ip || log.ipAddress}</td>
                  <td className="ent-mono" style={{ fontSize: 11 }}>{log.time || log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
