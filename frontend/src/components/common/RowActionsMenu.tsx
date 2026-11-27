import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface RowActionItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  color?: string;
}

interface RowActionsMenuProps {
  items: RowActionItem[];
  disabled?: boolean;
}

/**
 * Standardized Admin Settings "Actions ⋮" dropdown menu matching
 * Product Type & Category Master visual and interaction pattern.
 */
export const RowActionsMenu: React.FC<RowActionsMenuProps> = ({ items, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-actions-menu]') && !target.closest('[data-actions-trigger]')) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleScroll = () => setIsOpen(false);
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const isUpward = spaceBelow < 210 && rect.top > 210;
    setAnchor({
      top: isUpward ? undefined : rect.bottom + 4,
      bottom: isUpward ? window.innerHeight - rect.top + 4 : undefined,
      right: Math.max(12, window.innerWidth - rect.right),
    });
    setIsOpen(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-actions-trigger="true"
        disabled={disabled}
        onClick={handleToggle}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 10px',
          borderRadius: 6,
          border: '1px solid #CBD5E1',
          background: isOpen ? '#F0FDFA' : '#FFFFFF',
          color: isOpen ? '#0F766E' : '#334155',
          fontSize: 12,
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <span>Actions</span>
        <MoreVertical size={13} />
      </button>

      {isOpen && anchor && createPortal(
        <div
          data-actions-menu="true"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: anchor.top,
            bottom: anchor.bottom,
            right: anchor.right,
            zIndex: 10050,
            minWidth: 168,
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 4px 10px -4px rgba(15, 23, 42, 0.08)',
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                textAlign: 'left',
                padding: '7px 10px',
                border: 'none',
                borderRadius: 6,
                background: 'transparent',
                color: item.disabled ? '#94A3B8' : item.danger ? '#DC2626' : (item.color || '#1E293B'),
                fontSize: 12.5,
                fontWeight: 600,
                cursor: item.disabled ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.background = item.danger ? '#FEF2F2' : '#F8FAFC';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};
