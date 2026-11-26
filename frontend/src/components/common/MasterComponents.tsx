import React from 'react';
import { Eye, Edit3, Pause, Play, Trash2, CheckCircle2 } from 'lucide-react';

/* ==========================================================================
   FACTORYGRID ENTERPRISE MASTER DATA DESIGN SYSTEM
   Common reusable components for all Admin -> Settings / Master Data pages.
   ========================================================================== */

// ── 1. BREADCRUMBS BAR ──────────────────────────────────────────────────────
export interface MasterBreadcrumbsProps {
  pageTitle: string;
  parentLabel?: string;
  onBack?: () => void;
  subTitle?: string;
}

export const MasterBreadcrumbs: React.FC<MasterBreadcrumbsProps> = ({
  pageTitle,
  parentLabel = 'Master Data (Settings)',
  onBack,
  subTitle
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748B', fontWeight: 600, padding: '4px 0' }}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#64748B', padding: 0, cursor: 'pointer', fontWeight: 600 }}
          onMouseEnter={e => e.currentTarget.style.color = '#0F766E'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
        >
          {parentLabel}
        </button>
      ) : (
        <span>{parentLabel}</span>
      )}
      <span style={{ color: '#CBD5E1' }}>/</span>
      <span style={{ color: subTitle ? '#64748B' : '#0F766E', fontWeight: subTitle ? 600 : 700 }}>
        {pageTitle}
      </span>
      {subTitle && (
        <>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <span style={{ color: '#0F766E', fontWeight: 700 }}>{subTitle}</span>
        </>
      )}
    </div>
  );
};

// ── 2. PAGE HEADER ──────────────────────────────────────────────────────────
export interface MasterPageHeaderProps {
  icon: React.ElementType;
  domainLabel?: string;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    icon?: React.ElementType;
    onClick: () => void;
    disabled?: boolean;
    title?: string;
  };
  children?: React.ReactNode;
}

export const MasterPageHeader: React.FC<MasterPageHeaderProps> = ({
  icon: Icon,
  domainLabel = 'PRODUCT MANAGEMENT MODEL',
  title,
  description,
  primaryAction,
  children
}) => {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      padding: '16px 20px',
      boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 14
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          background: '#F0FDFA',
          border: '1px solid #CCFBF1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0F766E',
          flexShrink: 0
        }}>
          <Icon size={18} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0F766E' }}>
            {domainLabel}
          </div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            {description}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {children}
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            title={primaryAction.title}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              background: primaryAction.disabled ? '#94A3B8' : '#0F766E',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              fontSize: 12.5,
              cursor: primaryAction.disabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 2px rgba(15,118,110,0.15)',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => {
              if (!primaryAction.disabled) e.currentTarget.style.background = '#115E59';
            }}
            onMouseLeave={e => {
              if (!primaryAction.disabled) e.currentTarget.style.background = '#0F766E';
            }}
          >
            {primaryAction.icon && <primaryAction.icon size={14} />}
            <span>{primaryAction.label}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ── 3. COMPACT STATISTICS STRIP ─────────────────────────────────────────────
export interface StatItem {
  label: string;
  value: string | number;
  color?: string;
  fontFamily?: string;
}

export interface MasterStatsStripProps {
  stats: StatItem[];
  modelTag?: string;
}

export const MasterStatsStrip: React.FC<MasterStatsStripProps> = ({
  stats,
  modelTag
}) => {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      padding: '10px 16px',
      boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, fontSize: 12 }}>
        {stats.map((s, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span style={{ color: '#CBD5E1' }}>•</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
                {s.label}:
              </span>
              <span style={{
                fontWeight: 800,
                color: s.color || '#0F172A',
                fontFamily: s.fontFamily || 'monospace',
                fontSize: 13
              }}>
                {s.value}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
      {modelTag && (
        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
          {modelTag}
        </div>
      )}
    </div>
  );
};

// ── 4. STATUS BADGE ─────────────────────────────────────────────────────────
export interface MasterStatusBadgeProps {
  status?: string | boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export const MasterStatusBadge: React.FC<MasterStatusBadgeProps> = ({
  status,
  activeLabel = 'ACTIVE',
  inactiveLabel = 'INACTIVE'
}) => {
  const isBool = typeof status === 'boolean';
  const rawStatus = isBool ? (status ? 'ACTIVE' : 'INACTIVE') : (status || 'ACTIVE').toString().toUpperCase();
  const isActive = rawStatus === 'ACTIVE' || rawStatus === 'TRUE';

  let bg = '#F1F5F9';
  let color = '#475569';
  let border = '#CBD5E1';
  let label = rawStatus;

  if (isActive) {
    bg = '#DCFCE7';
    color = '#15803D';
    border = '#86EFAC';
    label = activeLabel;
  } else if (rawStatus === 'INACTIVE' || rawStatus === 'FALSE') {
    bg = '#FEE2E2';
    color = '#B91C1C';
    border = '#FCA5A5';
    label = inactiveLabel;
  } else if (rawStatus === 'SUSPENDED' || rawStatus === 'DRAFT') {
    bg = '#FEF3C7';
    color = '#B45309';
    border = '#FDE68A';
  } else if (rawStatus === 'EOL' || rawStatus === 'DISCONTINUED') {
    bg = '#F3E8FF';
    color = '#7E22CE';
    border = '#D8B4FE';
  }

  return (
    <span style={{
      fontSize: 11,
      fontWeight: 800,
      padding: '3px 8px',
      borderRadius: 4,
      background: bg,
      color: color,
      border: `1px solid ${border}`,
      display: 'inline-block',
      letterSpacing: '0.02em'
    }}>
      {label}
    </span>
  );
};

// ── 5. TABLE ACTION GROUP ───────────────────────────────────────────────────
export interface CustomActionItem {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  title?: string;
  color?: string;
  borderColor?: string;
  hoverBg?: string;
}

export interface TableActionGroupProps {
  onView?: () => void;
  onEdit?: () => void;
  status?: string | boolean;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  customActions?: CustomActionItem[];
  viewTitle?: string;
  editTitle?: string;
  activateTitle?: string;
  deactivateTitle?: string;
  deleteTitle?: string;
}

export const TableActionGroup: React.FC<TableActionGroupProps> = ({
  onView,
  onEdit,
  status,
  onToggleStatus,
  onDelete,
  customActions = [],
  viewTitle = 'View Details',
  editTitle = 'Edit',
  activateTitle = 'Activate',
  deactivateTitle = 'Deactivate',
  deleteTitle = 'Delete'
}) => {
  const isBool = typeof status === 'boolean';
  const rawStatus = isBool ? (status ? 'ACTIVE' : 'INACTIVE') : (status || 'ACTIVE').toString().toUpperCase();
  const isActive = rawStatus === 'ACTIVE' || rawStatus === 'TRUE';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, whiteSpace: 'nowrap' }}>
      {/* 1. View Action */}
      {onView && (
        <button
          type="button"
          onClick={onView}
          title={viewTitle}
          aria-label={viewTitle}
          style={{
            height: 28,
            padding: '0 9px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            background: '#FFFFFF',
            color: '#334155',
            border: '1px solid #CBD5E1',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            boxSizing: 'border-box',
            lineHeight: 1,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#F8FAFC';
            e.currentTarget.style.borderColor = '#94A3B8';
            e.currentTarget.style.color = '#0F172A';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.borderColor = '#CBD5E1';
            e.currentTarget.style.color = '#334155';
          }}
        >
          <Eye size={12.5} style={{ flexShrink: 0, color: '#64748B' }} />
          <span className="hidden sm:inline">View</span>
        </button>
      )}

      {/* 2. Edit Action */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title={editTitle}
          aria-label={editTitle}
          style={{
            height: 28,
            padding: '0 9px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            background: '#FFFFFF',
            color: '#334155',
            border: '1px solid #CBD5E1',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            boxSizing: 'border-box',
            lineHeight: 1,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#F8FAFC';
            e.currentTarget.style.borderColor = '#94A3B8';
            e.currentTarget.style.color = '#0F172A';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.borderColor = '#CBD5E1';
            e.currentTarget.style.color = '#334155';
          }}
        >
          <Edit3 size={12.5} style={{ flexShrink: 0, color: '#64748B' }} />
          <span className="hidden sm:inline">Edit</span>
        </button>
      )}

      {/* 3. Custom Action Items (e.g., Preferred, Inspect) */}
      {customActions.map((ca, idx) => (
        <button
          key={idx}
          type="button"
          onClick={ca.onClick}
          title={ca.title || ca.label}
          aria-label={ca.title || ca.label}
          style={{
            height: 28,
            padding: '0 9px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            background: '#FFFFFF',
            color: ca.color || '#334155',
            border: `1px solid ${ca.borderColor || '#CBD5E1'}`,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            boxSizing: 'border-box',
            lineHeight: 1,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = ca.hoverBg || '#F8FAFC';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#FFFFFF';
          }}
        >
          <ca.icon size={12} style={{ flexShrink: 0 }} />
          <span className="hidden sm:inline">{ca.label}</span>
        </button>
      ))}

      {/* 4. Activate / Deactivate Toggle Action */}
      {onToggleStatus && (
        isActive ? (
          <button
            type="button"
            onClick={onToggleStatus}
            title={deactivateTitle}
            aria-label={deactivateTitle}
            style={{
              height: 28,
              padding: '0 9px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              background: '#FFFFFF',
              color: '#DC2626',
              border: '1px solid #FECACA',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              boxSizing: 'border-box',
              lineHeight: 1,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FEF2F2';
              e.currentTarget.style.borderColor = '#FCA5A5';
              e.currentTarget.style.color = '#B91C1C';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#FECACA';
              e.currentTarget.style.color = '#DC2626';
            }}
          >
            <Pause size={11.5} style={{ flexShrink: 0 }} />
            <span className="hidden sm:inline">Deactivate</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleStatus}
            title={activateTitle}
            aria-label={activateTitle}
            style={{
              height: 28,
              padding: '0 9px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              background: '#FFFFFF',
              color: '#15803D',
              border: '1px solid #BBF7D0',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              boxSizing: 'border-box',
              lineHeight: 1,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#F0FDF4';
              e.currentTarget.style.borderColor = '#86EFAC';
              e.currentTarget.style.color = '#166534';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#BBF7D0';
              e.currentTarget.style.color = '#15803D';
            }}
          >
            <Play size={11} style={{ flexShrink: 0 }} />
            <span className="hidden sm:inline">Activate</span>
          </button>
        )
      )}

      {/* 5. Delete Action (Only when supported) */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title={deleteTitle}
          aria-label={deleteTitle}
          style={{
            height: 28,
            padding: '0 7px',
            borderRadius: 6,
            background: '#FFFFFF',
            color: '#94A3B8',
            border: '1px solid #E2E8F0',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#DC2626';
            e.currentTarget.style.borderColor = '#FCA5A5';
            e.currentTarget.style.background = '#FEF2F2';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#94A3B8';
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.background = '#FFFFFF';
          }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};
