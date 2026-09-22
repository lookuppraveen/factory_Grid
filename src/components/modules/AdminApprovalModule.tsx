import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Key, ShieldCheck, UserCheck, AlertCircle, RefreshCw, Search, CheckCircle2,
  XCircle, Send, Lock, Eye, Building2, Factory, Mail, Server, Clock, Download,
  Layers, Shield, ChevronRight, UserPlus, MoreVertical, X, Check, Copy
} from 'lucide-react';

export interface ProvisioningAccount {
  id: string;
  organizationName: string;
  type: 'BUYER' | 'MANUFACTURER';
  contactPerson: string;
  email: string;
  phone: string;
  complianceCleared: boolean;
  clearanceDate: string;
  enterpriseCode?: string;
  assignedRole: 'BUYER' | 'SUPPLIER' | 'COMPLIANCE_OFFICER' | 'SALES_MANAGER' | 'ACCOUNTS_MANAGER' | 'ADMIN';
  assignedWorkspace: string;
  temporaryPassword?: string;
  invitationSent: boolean;
  status: 'PENDING' | 'PROVISIONED' | 'DISABLED';
  joinedDate: string;
}

const initialAccounts: ProvisioningAccount[] = [
  {
    id: 'pa-1',
    organizationName: 'Zenith Global Pharma Exporters',
    type: 'BUYER',
    contactPerson: 'Vikram Mehta',
    email: 'exports@zenithpharma.com',
    phone: '+91 97222 88990',
    complianceCleared: true,
    clearanceDate: '2026-08-07',
    assignedRole: 'BUYER',
    assignedWorkspace: 'Procurement Workspace',
    invitationSent: false,
    status: 'PENDING',
    joinedDate: '2026-08-07'
  },
  {
    id: 'pa-2',
    organizationName: 'NovaMed Formulations Pvt Ltd',
    type: 'MANUFACTURER',
    contactPerson: 'Dr. Rajesh Vardhan',
    email: 'regulatory@novamedpharma.com',
    phone: '+91 98160 55443',
    complianceCleared: true,
    clearanceDate: '2026-08-06',
    assignedRole: 'SUPPLIER',
    assignedWorkspace: 'Manufacturing Operations Control Room',
    invitationSent: false,
    status: 'PENDING',
    joinedDate: '2026-08-06'
  },
  {
    id: 'pa-3',
    organizationName: 'Apex Pharma Labs Ltd',
    type: 'BUYER',
    contactPerson: 'Dr. Vikram Sethi',
    email: 'v.sethi@apexpharma.com',
    phone: '+91 98765 43210',
    complianceCleared: true,
    clearanceDate: '2026-07-20',
    enterpriseCode: 'BUY-2026-101',
    assignedRole: 'BUYER',
    assignedWorkspace: 'Procurement Workspace',
    temporaryPassword: 'FG-8921-Xq9#',
    invitationSent: true,
    status: 'PROVISIONED',
    joinedDate: '2026-07-20'
  },
  {
    id: 'pa-4',
    organizationName: 'SunBio LifeSciences Ltd',
    type: 'MANUFACTURER',
    contactPerson: 'Rajesh Sharma',
    email: 'rajesh@sunbiolabs.com',
    phone: '+91 98111 22334',
    complianceCleared: true,
    clearanceDate: '2026-07-15',
    enterpriseCode: 'MFG-2026-088',
    assignedRole: 'SUPPLIER',
    assignedWorkspace: 'Manufacturing Operations Control Room',
    temporaryPassword: 'FG-4410-Mn2$',
    invitationSent: true,
    status: 'PROVISIONED',
    joinedDate: '2026-07-15'
  },
  {
    id: 'pa-5',
    organizationName: 'Unverified Trader Network',
    type: 'BUYER',
    contactPerson: 'Amit Verma',
    email: 'amit@traderco.com',
    phone: '+91 90000 00000',
    complianceCleared: false,
    clearanceDate: 'N/A',
    assignedRole: 'BUYER',
    assignedWorkspace: 'Procurement Workspace',
    invitationSent: false,
    status: 'DISABLED',
    joinedDate: '2026-07-10'
  }
];

export const AdminApprovalModule: React.FC = () => {
  const { currentRole, addAuditLog, buyerOnboardings, manufacturerOnboardings, auditLogs } = useApp();

  const [accounts, setAccounts] = useState<ProvisioningAccount[]>(() => {
    const contextAccounts: ProvisioningAccount[] = [
      ...buyerOnboardings.map(b => ({
        id: `ctx-b-${b.id}`,
        organizationName: b.companyName,
        type: 'BUYER' as const,
        contactPerson: b.contactPerson,
        email: b.email,
        phone: b.phone,
        complianceCleared: b.status === 'APPROVED',
        clearanceDate: b.submittedDate || 'Today',
        enterpriseCode: b.buyerCode,
        assignedRole: 'BUYER' as const,
        assignedWorkspace: 'Procurement Workspace',
        invitationSent: b.status === 'APPROVED',
        status: (b.status === 'APPROVED' ? 'PROVISIONED' : b.status === 'REJECTED' ? 'DISABLED' : 'PENDING') as any,
        joinedDate: b.submittedDate || 'Today'
      })),
      ...manufacturerOnboardings.map(m => ({
        id: `ctx-m-${m.id}`,
        organizationName: m.companyName,
        type: 'MANUFACTURER' as const,
        contactPerson: m.contactPerson,
        email: m.email,
        phone: m.phone,
        complianceCleared: m.status === 'APPROVED',
        clearanceDate: m.submittedDate || 'Today',
        enterpriseCode: m.manufacturerCode,
        assignedRole: 'SUPPLIER' as const,
        assignedWorkspace: 'Manufacturing Operations Control Room',
        invitationSent: m.status === 'APPROVED',
        status: (m.status === 'APPROVED' ? 'PROVISIONED' : m.status === 'REJECTED' ? 'DISABLED' : 'PENDING') as any,
        joinedDate: m.submittedDate || 'Today'
      }))
    ];
    return [...initialAccounts, ...contextAccounts];
  });

  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'PROVISIONED' | 'DISABLED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [drawerAccountId, setDrawerAccountId] = useState<string | null>(null);
  const selectedDrawerAccount = accounts.find(a => a.id === drawerAccountId) || null;

  // Provisioning Action Handler
  const handleProvisionAccount = (acc: ProvisioningAccount) => {
    const generatedCode = acc.type === 'BUYER'
      ? `BUY-2026-${Math.floor(100 + Math.random() * 900)}`
      : `MFG-2026-${Math.floor(100 + Math.random() * 900)}`;

    const generatedPassword = `FG-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 6)}`;

    setAccounts(prev => prev.map(a => a.id === acc.id ? {
      ...a,
      enterpriseCode: generatedCode,
      temporaryPassword: generatedPassword,
      invitationSent: true,
      status: 'PROVISIONED'
    } : a));

    addAuditLog('Platform Admin Approval', `Provisioned account for ${acc.organizationName}. Enterprise Code: ${generatedCode}`);
    setActiveMenuId(null);
    alert(`✔ Account Provisioned!\n\nOrganization: ${acc.organizationName}\nEnterprise Code: ${generatedCode}\nTemp Password: ${generatedPassword}\n\nInvitation email dispatched to ${acc.email}.`);
  };

  const handleResetPassword = (acc: ProvisioningAccount) => {
    const newPass = `FG-${Math.floor(1000 + Math.random() * 9000)}-Reset#`;
    setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, temporaryPassword: newPass } : a));
    addAuditLog('Platform Admin Approval', `Reset password for ${acc.organizationName}`);
    setActiveMenuId(null);
    alert(`Password reset for ${acc.organizationName}. New Temp Password: ${newPass}`);
  };

  const handleSuspendAccount = (acc: ProvisioningAccount) => {
    setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, status: 'DISABLED' } : a));
    addAuditLog('Platform Admin Approval', `Suspended access for ${acc.organizationName}`);
    setActiveMenuId(null);
    alert(`Account suspended for ${acc.organizationName}.`);
  };

  // Metrics
  const metrics = {
    total: accounts.length,
    pending: accounts.filter(a => a.status === 'PENDING').length,
    provisioned: accounts.filter(a => a.status === 'PROVISIONED').length,
    roles: 6,
    activeSessions: 128
  };

  // Filtered List
  const filteredAccounts = accounts.filter(a => {
    const matchSearch = a.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.enterpriseCode && a.enterpriseCode.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;
    if (roleFilter !== 'ALL' && a.assignedRole !== roleFilter) return false;

    if (filterTab === 'PENDING') return a.status === 'PENDING';
    if (filterTab === 'PROVISIONED') return a.status === 'PROVISIONED';
    if (filterTab === 'DISABLED') return a.status === 'DISABLED';
    return true;
  });

  // Render Status Chip (Blue, Purple, Red)
  const renderStatusChip = (status: ProvisioningAccount['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} /> Pending Provision
          </span>
        );
      case 'PROVISIONED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#FAF5FF', color: '#9333EA', border: '1px solid #E9D5FF' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9333EA' }} /> Provisioned Active
          </span>
        );
      case 'DISABLED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} /> Disabled
          </span>
        );
      default:
        return <span style={{ fontSize: 12 }}>{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── TOP HEADER BAR ────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Key size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>System Admin</span>
              <ChevronRight size={12} />
              <span>Governance</span>
              <ChevronRight size={12} />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>User Management Dashboard</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Enterprise User Management Dashboard
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Provision buyer and manufacturer accounts, generate enterprise codes, assign workspaces, and dispatch temporary credentials.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search org, code, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 240, height: 38, paddingLeft: 34, paddingRight: 12, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
            />
          </div>

          <button onClick={() => alert('Add New Account Provisioning dialog launched.')} style={{ height: 38, padding: '0 16px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserPlus size={14} /> + Provision New Account
          </button>
        </div>
      </div>

      {/* ── QUICK KPI CARDS ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Organizations</span>
            <Building2 size={16} style={{ color: '#2563EB' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>{metrics.total}</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>Registered entities</div>
        </div>

        <div onClick={() => setFilterTab('PENDING')} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Provision</span>
            <Clock size={16} style={{ color: '#2563EB' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#2563EB', marginTop: 8 }}>{metrics.pending}</div>
          <div style={{ fontSize: 11.5, color: '#2563EB', fontWeight: 600, marginTop: 4 }}>● Needs Action</div>
        </div>

        <div onClick={() => setFilterTab('PROVISIONED')} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Provisioned Users</span>
            <UserCheck size={16} style={{ color: '#9333EA' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#9333EA', marginTop: 8 }}>{metrics.provisioned}</div>
          <div style={{ fontSize: 11.5, color: '#9333EA', fontWeight: 600, marginTop: 4 }}>Active credentials</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Roles</span>
            <ShieldCheck size={16} style={{ color: '#16A34A' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>{metrics.roles}</div>
          <div style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 600, marginTop: 4 }}>✓ RBAC Active</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Sessions</span>
            <Server size={16} style={{ color: '#14B8A6' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>{metrics.activeSessions}</div>
          <div style={{ fontSize: 11.5, color: '#14B8A6', fontWeight: 600, marginTop: 4 }}>● Live Concurrent</div>
        </div>
      </div>

      {/* ── ACTION TOOLBAR ───────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[
            { id: 'PENDING', label: `Pending Provision (${metrics.pending})` },
            { id: 'PROVISIONED', label: `Provisioned (${metrics.provisioned})` },
            { id: 'DISABLED', label: `Disabled` },
            { id: 'ALL', label: `All Accounts (${accounts.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              style={{
                height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12.5, fontWeight: filterTab === tab.id ? 700 : 500,
                background: filterTab === tab.id ? '#2563EB' : 'transparent', color: filterTab === tab.id ? '#FFFFFF' : '#475569',
                border: 'none', cursor: 'pointer', transition: 'all 120ms ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, color: '#334155', outline: 'none' }}>
            <option value="ALL">All Roles</option>
            <option value="BUYER">BUYER</option>
            <option value="SUPPLIER">SUPPLIER</option>
            <option value="COMPLIANCE_OFFICER">COMPLIANCE_OFFICER</option>
            <option value="SALES_MANAGER">SALES_MANAGER</option>
            <option value="ACCOUNTS_MANAGER">ACCOUNTS_MANAGER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <button onClick={() => alert('Provisioning Queue Refreshed.')} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => alert('Account Registry Exported.')} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* ── MAIN DATA TABLE ──────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 20px' }}>Organization & Contact</th>
              <th style={{ padding: '14px 16px' }}>Enterprise Code</th>
              <th style={{ padding: '14px 16px' }}>Assigned Role</th>
              <th style={{ padding: '14px 16px' }}>Compliance Cleared</th>
              <th style={{ padding: '14px 16px' }}>Assigned Workspace</th>
              <th style={{ padding: '14px 16px' }}>Account Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>No accounts found.</td></tr>
            ) : filteredAccounts.map(acc => (
              <tr
                key={acc.id}
                onClick={() => setDrawerAccountId(acc.id)}
                style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 120ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
              >
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{acc.organizationName}</div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{acc.contactPerson} ({acc.email})</div>
                </td>

                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: acc.enterpriseCode ? '#2563EB' : '#94A3B8' }}>
                    {acc.enterpriseCode || 'Not Generated'}
                  </div>
                </td>

                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', background: '#F1F5F9', padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                    {acc.assignedRole}
                  </span>
                </td>

                <td style={{ padding: '14px 16px' }}>
                  {acc.complianceCleared ? (
                    <span style={{ color: '#16A34A', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} /> Cleared ({acc.clearanceDate})
                    </span>
                  ) : (
                    <span style={{ color: '#DC2626', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <XCircle size={13} /> Pending Review
                    </span>
                  )}
                </td>

                <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>
                  {acc.assignedWorkspace}
                </td>

                <td style={{ padding: '14px 16px' }}>
                  {renderStatusChip(acc.status)}
                </td>

                <td style={{ padding: '14px 20px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                    {acc.status === 'PENDING' && (
                      <button
                        onClick={() => handleProvisionAccount(acc)}
                        style={{ padding: '5px 12px', borderRadius: 6, background: '#2563EB', color: '#FFFFFF', border: 'none', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Provision →
                      </button>
                    )}

                    <button
                      onClick={() => setDrawerAccountId(acc.id)}
                      style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 11.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── RIGHT SIDE SLIDE-OVER DRAWER ─────────────────────── */}
      {selectedDrawerAccount && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 580, height: '100vh', background: '#FFFFFF', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 24px rgba(15,23,42,0.12)' }}>

            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ENTERPRISE ACCOUNT PROVISIONING</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>{selectedDrawerAccount.organizationName}</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{selectedDrawerAccount.type} · Contact: {selectedDrawerAccount.contactPerson}</div>
              </div>
              <button onClick={() => setDrawerAccountId(null)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Account Provision Controls */}
              <div style={{ padding: 16, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Enterprise Code</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563EB', fontSize: 14 }}>
                    {selectedDrawerAccount.enterpriseCode || 'Not Generated'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Temporary Password</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', fontSize: 13 }}>
                    {selectedDrawerAccount.temporaryPassword || '—'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {selectedDrawerAccount.status === 'PENDING' ? (
                    <button onClick={() => handleProvisionAccount(selectedDrawerAccount)} style={{ flex: 1, height: 36, borderRadius: 6, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Provision Account & Send Credentials →
                    </button>
                  ) : (
                    <>
                      <button onClick={() => handleResetPassword(selectedDrawerAccount)} style={{ flex: 1, height: 34, borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                        Reset Password
                      </button>
                      <button onClick={() => handleSuspendAccount(selectedDrawerAccount)} style={{ height: 34, padding: '0 12px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 12, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}>
                        Suspend Access
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Account Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Organization Credentials</div>
                <div style={{ padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div><strong>Email:</strong> {selectedDrawerAccount.email}</div>
                  <div><strong>Phone:</strong> {selectedDrawerAccount.phone}</div>
                  <div><strong>Assigned Role:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedDrawerAccount.assignedRole}</span></div>
                  <div><strong>Assigned Workspace:</strong> {selectedDrawerAccount.assignedWorkspace}</div>
                  <div><strong>Joined Date:</strong> {selectedDrawerAccount.joinedDate}</div>
                </div>
              </div>

              {/* Audit Timeline */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Account Audit Log History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {auditLogs.slice(0, 4).map((log: any, idx: number) => (
                    <div key={idx} style={{ padding: 8, borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 11.5, color: '#334155' }}>
                      • <strong>{log.action}</strong> ({log.timestamp || log.time}) by {log.userName || log.user}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
