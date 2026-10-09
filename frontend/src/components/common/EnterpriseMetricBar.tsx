import React from 'react';

export interface EnterpriseMetricItem {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
}

export interface EnterpriseMetricBarProps {
  title?: string;
  subtitle?: string;
  metrics: EnterpriseMetricItem[];
  extraRight?: React.ReactNode;
  style?: React.CSSProperties;
}

export const EnterpriseMetricBar: React.FC<EnterpriseMetricBarProps> = ({
  title,
  subtitle,
  metrics,
  extraRight,
  style
}) => {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        ...style
      }}
    >
      {(title || extraRight) && (
        <div
          style={{
            padding: '9px 18px',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {title && (
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#475569'
                }}
              >
                {title}
              </span>
            )}
            {subtitle && (
              <span style={{ fontSize: 11.5, color: '#94A3B8' }}>• {subtitle}</span>
            )}
          </div>
          {extraRight && <div>{extraRight}</div>}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
          background: '#FFFFFF'
        }}
      >
        {metrics.map((m, idx) => (
          <div
            key={idx}
            style={{
              padding: '14px 20px',
              borderRight: idx < metrics.length - 1 ? '1px solid #E2E8F0' : 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6
              }}
            >
              <span>{m.label}</span>
              {m.badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: m.badgeBg || '#F1F5F9',
                    color: m.badgeColor || '#475569',
                    textTransform: 'none'
                  }}
                >
                  {m.badge}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: m.color || '#0F172A',
                fontFamily: typeof m.value === 'string' && m.value.includes('₹') ? 'monospace' : 'inherit',
                marginTop: 3,
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              {m.value}
            </div>
            {m.sub && (
              <div
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  marginTop: 3,
                  fontWeight: 500
                }}
              >
                {m.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
