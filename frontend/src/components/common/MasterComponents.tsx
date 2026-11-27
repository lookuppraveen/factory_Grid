import React from 'react';
import { RowActionsMenu, RowActionItem } from './RowActionsMenu';
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

  const menuItems: RowActionItem[] = [];

  if (onView) {
    menuItems.push({
      key: 'view',
      label: 'View',
      icon: <Eye size={13} style={{ color: '#64748B', flexShrink: 0 }} />,
      onClick: onView,
    });
  }

  if (onEdit) {
    menuItems.push({
      key: 'edit',
      label: 'Edit',
      icon: <Edit3 size={13} style={{ color: '#0F766E', flexShrink: 0 }} />,
      onClick: onEdit,
    });
  }

  customActions.forEach((ca, idx) => {
    const IconComp = ca.icon;
    menuItems.push({
      key: `custom_${idx}_${ca.label}`,
      label: ca.label,
      icon: <IconComp size={13} style={{ color: ca.color || '#334155', flexShrink: 0 }} />,
      onClick: ca.onClick,
      color: ca.color,
    });
  });

  if (onToggleStatus) {
    menuItems.push({
      key: 'toggle_status',
      label: isActive ? 'Deactivate' : 'Activate',
      icon: isActive
        ? <Pause size={13} style={{ color: '#D97706', flexShrink: 0 }} />
        : <Play size={13} style={{ color: '#15803D', flexShrink: 0 }} />,
      onClick: onToggleStatus,
      color: isActive ? '#B45309' : '#15803D',
    });
  }

  if (onDelete) {
    menuItems.push({
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 size={13} style={{ flexShrink: 0 }} />,
      onClick: onDelete,
      danger: true,
    });
  }

  if (menuItems.length === 0) return null;

  return <RowActionsMenu items={menuItems} />;
};

// ── 6. API LOADING / ERROR BANNER (NO MOCK FALLBACK) ───────────────────────
export interface MasterApiStatusBannerProps {
  loading?: boolean;
  error?: string | null;
  entityLabel: string;
  onRetry?: () => void;
}

export const MasterApiStatusBanner: React.FC<MasterApiStatusBannerProps> = ({
  loading,
  error,
  entityLabel,
  onRetry,
}) => {
  if (error) {
    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 8,
          color: '#991B1B',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span>Unable to load {entityLabel}. {error}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #FCA5A5',
              background: '#FFFFFF',
              color: '#991B1B',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          padding: '10px 16px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          color: '#475569',
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
        Loading {entityLabel}...
      </div>
    );
  }

  return null;
};
