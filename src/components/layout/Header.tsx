import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { RoleSwitcherDropdown } from '../common/RoleSwitcherDropdown';
import {
  Search, Bell, ShieldCheck, Sparkles
} from 'lucide-react';

export const Header: React.FC = () => {
  const { notifications, userProfile, currentRole, activeTab, openProfileTab } = useApp();
  const { theme, toggleTheme } = useTheme();
  const unreadCount = notifications.filter(n => !n.read).length;

  const initials = userProfile?.fullName 
    ? userProfile.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) 
    : currentRole.slice(0, 2);

  const formattedTab = activeTab.replace(/-/g, ' ').toUpperCase();

  return (
    <header className="ent-topbar">
      {/* Brand & Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          FactoryGrid
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>/</span>
          <span>{currentRole.replace(/_/g, ' ')}</span>
          <span>/</span>
          <span style={{ color: 'var(--c-primary)', fontWeight: 700 }}>{formattedTab}</span>
        </div>
      </div>

      {/* Global Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 12px', width: 340, transition: 'all 150ms' }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--c-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
        <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          placeholder="Search RFQs, orders, suppliers..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit' }}
        />
        <span style={{ fontSize: 10, color: 'var(--text-quaternary)', fontWeight: 600 }}>⌘K</span>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Compliance Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 6 }}>
          <ShieldCheck size={14} style={{ color: '#10B981' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Compliant</span>
        </div>

        {/* Role Switcher */}
        <RoleSwitcherDropdown />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{ width: 32, height: 32, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', transition: 'all 150ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          <Sparkles size={15} />
        </button>

        {/* Notifications */}
        <button
          style={{ width: 32, height: 32, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', position: 'relative', transition: 'all 150ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, background: '#EF4444', borderRadius: '50%' }} />
          )}
        </button>

        {/* User Avatar */}
        <div
          onClick={() => openProfileTab('personal')}
          title="Click to view My Profile"
          style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, #1D4ED8, #0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#FFFFFF', cursor: 'pointer' }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
};
