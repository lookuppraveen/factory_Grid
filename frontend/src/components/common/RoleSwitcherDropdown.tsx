import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Check, ShoppingBag, Factory, ShieldAlert,
  Receipt, TrendingUp, Settings, Search, Command, Activity, Lock,
  User, Building2, Bell, LogOut, Star
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface RoleOption {
  id: string;
  role: UserRole;
  buyerAccount?: 'NORMAL' | 'SPECIAL_PARTY';
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badgeColor: string;
  iconBg: string;
  defaultTab: string;
  permissions: string[];
  shortcut: string;
  preview: string;
}

const roleOptions: RoleOption[] = [
  {
    id: 'buyer_normal',
    role: 'BUYER',
    buyerAccount: 'NORMAL',
    title: 'Buyer (Normal Flow)',
    subtitle: 'Apex Pharma PCD Franchise · Regular',
    icon: ShoppingBag,
    badgeColor: '#0F766E',
    iconBg: '#CCFBF1',
    defaultTab: 'dashboard',
    permissions: ['Create RFQ', 'Supplier Quotations', 'Master PO Flow'],
    shortcut: '⌘1',
    preview: 'Standard Sourcing with Manufacturer Bidding'
  },
  {
    id: 'buyer_special',
    role: 'BUYER',
    buyerAccount: 'SPECIAL_PARTY',
    title: 'Buyer (Special Party Demo)',
    subtitle: 'MediPlus Healthcare · Special Party Flag',
    icon: Star,
    badgeColor: '#0E7490',
    iconBg: '#ECFEFF',
    defaultTab: 'dashboard',
    permissions: ['Enter Agreed Prices', 'Special Party RFQ', 'Pre-Agreed Quote PO'],
    shortcut: '⌘5',
    preview: 'Buyer-Provided Pricing & Special Party RFQ'
  },
  {
    id: 'supplier',
    role: 'SUPPLIER',
    title: 'Manufacturer / Supplier',
    subtitle: 'SunBio LifeSciences Ltd · Plant Operations',
    icon: Factory,
    badgeColor: '#0284C7',
    iconBg: '#E0F2FE',
    defaultTab: 'dashboard',
    permissions: ['Submit Bids', 'Production Lane', 'Cold-Chain Dispatch'],
    shortcut: '⌘2',
    preview: 'Live Plant Queue & Active Production'
  },
  {
    id: 'compliance',
    role: 'COMPLIANCE_OFFICER',
    title: 'Compliance Desk',
    subtitle: 'Regulatory Approval & KYC',
    icon: ShieldAlert,
    badgeColor: '#6D28D9',
    iconBg: '#EDE9FE',
    defaultTab: 'compliance',
    permissions: ['WHO-GMP Audit', 'GSTIN Verify', 'Document Review'],
    shortcut: '⌘3',
    preview: 'Verification Queue & Expiry Alerts'
  },
  {
    id: 'admin',
    role: 'ADMIN',
    title: 'Platform Admin',
    subtitle: 'System Governance, Flags & Audit',
    icon: Settings,
    badgeColor: '#0F172A',
    iconBg: '#F1F5F9',
    defaultTab: 'settings',
    permissions: ['Customer Flags', 'RBAC Roles', 'System Audit'],
    shortcut: '⌘4',
    preview: 'Platform Health & User Activity'
  },
];

export const RoleSwitcherDropdown: React.FC = () => {
  const { currentRole, setCurrentRole, activeBuyerAccount, setActiveBuyerAccount, setActiveTab, openProfileTab, logout, orgProfile } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = roleOptions.find(o => {
    if (currentRole === 'BUYER') {
      return o.role === 'BUYER' && o.buyerAccount === (activeBuyerAccount || 'NORMAL');
    }
    return o.role === currentRole;
  }) || roleOptions[0];
  const ActiveIcon = activeOption.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (opt: RoleOption) => {
    setCurrentRole(opt.role);
    if (opt.role === 'BUYER' && opt.buyerAccount) {
      setActiveBuyerAccount(opt.buyerAccount);
    }
    setActiveTab(opt.defaultTab);
    setIsOpen(false);

    let path = '/dashboard';
    if (opt.role === 'BUYER') path = '/buyer';
    else if (opt.role === 'SUPPLIER') path = '/supplier';
    else if (opt.role === 'COMPLIANCE_OFFICER') path = '/compliance';
    else if (opt.role === 'SALES_MANAGER') path = '/sales';
    else if (opt.role === 'ACCOUNTS_MANAGER') path = '/accounts';
    else if (opt.role === 'ADMIN') path = '/admin';

    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.replaceState({}, '', path);
    }
  };

  const filteredOptions = roleOptions.filter(o =>
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mfgCompanyName = orgProfile?.companyName || 'SunBio LifeSciences Ltd';

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Organization / Workspace Context Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '5px 12px 5px 8px',
          cursor: 'pointer',
          boxShadow: isOpen ? 'var(--shadow-elevated)' : 'var(--shadow-subtle)',
          transition: 'all 140ms ease-out',
          outline: 'none',
        }}
      >
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: currentRole === 'SUPPLIER' ? 'rgba(15, 118, 110, 0.12)' : 'var(--bg-subtle)',
          border: currentRole === 'SUPPLIER' ? '1px solid rgba(15, 118, 110, 0.3)' : '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ActiveIcon size={15} style={{ color: currentRole === 'SUPPLIER' ? '#0F766E' : 'var(--text-primary)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 130 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {activeOption.title}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {activeOption.subtitle}
          </span>
        </div>

        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-tertiary)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            marginLeft: 4
          }}
        />
      </button>

      {/* Switcher / Organization Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 360,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 12,
              boxShadow: 'var(--shadow-floating)',
              zIndex: 1000,
            }}
          >
            {/* Standard Workspace Switcher Panel */}
            <div style={{ paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Workspace Switcher
                </span>
                <span className="ent-mono" style={{ fontSize: 10, color: 'var(--text-quaternary)' }}>
                  {roleOptions.length} Active Workspaces
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Filter workspace by role..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="ent-input"
                  style={{ paddingLeft: 30, height: 32, fontSize: 12 }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
              {filteredOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = activeOption.id === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectRole(opt)}
                    style={{
                      border: isSelected ? `1px solid ${opt.badgeColor}` : '1px solid var(--border-subtle)',
                      background: isSelected ? opt.iconBg : 'transparent',
                      borderRadius: 8,
                      padding: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 120ms ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: opt.iconBg,
                      border: `1px solid ${opt.badgeColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <Icon size={16} style={{ color: opt.badgeColor }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: isSelected ? 800 : 600, color: 'var(--text-primary)' }}>
                          {opt.title}
                        </span>
                        <kbd className="ent-mono" style={{ fontSize: 10, color: 'var(--text-quaternary)', border: '1px solid var(--border-default)', padding: '1px 4px', borderRadius: 4 }}>
                          {opt.shortcut}
                        </kbd>
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {opt.subtitle}
                      </div>

                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                        {opt.permissions.map(perm => (
                          <span key={perm} style={{ fontSize: 9.5, color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '1px 6px', borderRadius: 4 }}>
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: opt.badgeColor,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 4
                      }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

