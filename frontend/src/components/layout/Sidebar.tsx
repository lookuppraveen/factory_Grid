import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Users, Factory, Package, FileText,
  Tag, ShoppingBag, Receipt, ShieldAlert, BarChart3,
  Bell, Settings, ChevronRight, HelpCircle, Zap, Truck, ClipboardCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentRole, activeTab, setActiveTab, complianceCases, rfqs, orders } = useApp();

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['BUYER', 'SUPPLIER', 'COMPLIANCE_OFFICER', 'ADMIN', 'SALES_MANAGER', 'ACCOUNTS_MANAGER'] },
        { id: 'analytics', label: 'Analytics & BI', icon: BarChart3, roles: ['ADMIN', 'SALES_MANAGER', 'ACCOUNTS_MANAGER', 'BUYER', 'SUPPLIER'] },
      ]
    },
    {
      label: 'Procurement',
      items: [
        { id: 'rfqs', label: 'RFQ Center', icon: ShoppingBag, roles: ['BUYER', 'ADMIN'] },
        { id: 'quotes', label: 'Quote Studio', icon: FileText, roles: ['BUYER', 'ADMIN'] },
        { id: 'orders', label: 'Orders', icon: Factory, roles: ['BUYER', 'SUPPLIER', 'ADMIN'] },
        { id: 'products', label: 'Product Catalog', icon: Package, roles: ['BUYER', 'SUPPLIER', 'ADMIN'] },
      ]
    },
    {
      label: 'Operations',
      items: [
        { id: 'customers', label: 'Customers', icon: Users, roles: ['SALES_MANAGER', 'ADMIN'] },
        { id: 'compliance', label: 'Compliance', icon: ShieldAlert, roles: ['COMPLIANCE_OFFICER', 'ADMIN'] },
        { id: 'invoices', label: 'Invoices', icon: Receipt, roles: ['ACCOUNTS_MANAGER', 'ADMIN'] },
        { id: 'shipments', label: 'Shipments', icon: Truck, roles: ['SUPPLIER', 'ADMIN'] },
      ]
    },
    {
      label: 'Platform',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
        { id: 'audit', label: 'Audit Logs', icon: ClipboardCheck, roles: ['ADMIN'] },
      ]
    }
  ];

  const badgeCounts = {
    compliance: complianceCases.filter(c => c.status === 'PENDING').length,
    orders: orders.filter(o => o.status === 'PENDING').length,
    rfqs: rfqs.filter(r => r.status === 'PRICING_IN_PROGRESS').length,
  };

  return (
    <aside className="ent-sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, var(--c-primary), var(--c-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#FFFFFF', fontSize: 14 }}>
          FG
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          FactoryGrid
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {navGroups.map(group => {
          const groupItems = group.items.filter(item => item.roles.includes(currentRole));
          if (groupItems.length === 0) return null;

          return (
            <div key={group.label} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', padding: '0 12px 8px' }}>
                {group.label}
              </div>
              {groupItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badge = badgeCounts[item.id as keyof typeof badgeCounts] || 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                      transition: 'all 150ms ease',
                      textAlign: 'left',
                      border: 'none',
                      borderLeft: isActive ? '3px solid #1D4ED8' : '3px solid transparent',
                      background: isActive ? 'rgba(29, 78, 216, 0.25)' : 'transparent',
                      width: '100%',
                      fontFamily: 'inherit',
                      marginBottom: 2,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {badge > 0 && (
                      <span style={{
                        background: 'var(--c-danger)',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 999,
                        minWidth: 18,
                        textAlign: 'center',
                        flexShrink: 0
                      }}>
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)',
          borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Zap size={13} style={{ color: '#14B8A6' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Contact Factory Buddy</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.4 }}>
            24/7 Quality & Sourcing Assistance active for enterprise buyers.
          </p>
          <div
            onClick={() => setActiveTab('qa-support')}
            style={{
              marginTop: 10, fontSize: 11.5, fontWeight: 600, color: '#14B8A6',
              display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
            }}
          >
            Contact Factory Buddy <ChevronRight size={11} />
          </div>
        </div>
      </div>
    </aside>
  );
};
