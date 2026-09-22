import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LogOut, ShieldCheck } from 'lucide-react';

interface AccountMenuPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorPosition?: 'bottom-left' | 'top-right';
  onNavigate?: (tab: string) => void;
}

export const AccountMenuPopover: React.FC<AccountMenuPopoverProps> = ({
  isOpen,
  onClose,
  anchorPosition = 'bottom-left',
  onNavigate
}) => {
  const { userProfile, orgProfile, currentRole, logout } = useApp();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignOut = () => {
    onClose();
    logout();
    if (onNavigate) {
      onNavigate('landing');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const roleColors: Record<string, string> = {
    BUYER: '#2563EB',
    SUPPLIER: '#0D9488',
    COMPLIANCE_OFFICER: '#D97706',
    ADMIN: '#4F46E5',
    SALES_MANAGER: '#059669',
    ACCOUNTS_MANAGER: '#B45309',
  };

  const roleColor = roleColors[currentRole] || '#0D9488';

  const positionStyles: React.CSSProperties = anchorPosition === 'bottom-left'
    ? {
      position: 'absolute',
      bottom: 'calc(100% + 8px)',
      left: 0,
      zIndex: 9999,
    }
    : {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 12,
      zIndex: 9999,
    };

  return (
    <div
      ref={popoverRef}
      style={{
        ...positionStyles,
        width: 240,
        background: '#0F172A',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        color: '#FFFFFF',
        fontFamily: 'inherit',
      }}
    >
      {/* Header Profile Identity */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: roleColor,
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.2)',
            flexShrink: 0
          }}>
            {userProfile.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : currentRole.slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userProfile.fullName || 'User Profile'}
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
              {orgProfile.companyName || 'FactoryGrid Partner'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: roleColor }}>
              <ShieldCheck size={9} />
              {currentRole.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Governance Toggle */}
      {currentRole === 'ADMIN' && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(79, 70, 229, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, color: '#A5B4FC' }}>
            <span>Admin Governance Mode</span>
            <span style={{ background: '#4F46E5', color: '#FFF', fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 900 }}>ON</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Platform Governance &amp; Audit Console Active</div>
        </div>
      )}

      {/* Sign Out — only action in this popover */}
      <div style={{ padding: '8px' }}>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#FCA5A5',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 120ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#FCA5A5';
          }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
