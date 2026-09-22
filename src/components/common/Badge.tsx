import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '', style: customStyle }) => {
  const normalized = status.toUpperCase();

  let textColor = '#6B7280';
  let bgColor = 'rgba(107, 114, 128, 0.1)';
  let borderColor = 'rgba(107, 114, 128, 0.25)';

  if (['ACTIVE', 'APPROVED', 'PASSED', 'VALID', 'PAID', 'DELIVERED', 'COMPLETED', 'PROVISIONED', 'QUALIFIED', 'ACCEPTED'].includes(normalized)) {
    textColor = '#10B981';
    bgColor = 'rgba(16, 185, 129, 0.1)';
    borderColor = 'rgba(16, 185, 129, 0.25)';
  } else if (['SUBMITTED', 'QUOTED', 'CREATED'].includes(normalized)) {
    textColor = '#0D9488';
    bgColor = 'rgba(13, 148, 136, 0.1)';
    borderColor = 'rgba(13, 148, 136, 0.25)';
  } else if (['UNDER_REVIEW', 'IN_PROGRESS', 'IN_PRODUCTION', 'PRICING_IN_PROGRESS', 'DISPATCHED', 'IN_TRANSIT'].includes(normalized)) {
    textColor = '#1D4ED8';
    bgColor = 'rgba(29, 78, 216, 0.1)';
    borderColor = 'rgba(29, 78, 216, 0.25)';
  } else if (['PENDING', 'NEGOTIATION', 'AWAITING', 'PARTIAL_PAYMENT', 'EXPIRING_SOON'].includes(normalized)) {
    textColor = '#F59E0B';
    bgColor = 'rgba(245, 158, 11, 0.1)';
    borderColor = 'rgba(245, 158, 11, 0.25)';
  } else if (['REJECTED', 'OVERDUE', 'FAILED', 'DISABLED', 'HIGH'].includes(normalized)) {
    textColor = '#EF4444';
    bgColor = 'rgba(239, 68, 68, 0.1)';
    borderColor = 'rgba(239, 68, 68, 0.25)';
  }

  const formattedText = status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11.5px',
        fontWeight: 700,
        color: textColor,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '2px 10px',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        ...customStyle,
      }}
    >
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: textColor, flexShrink: 0 }} />
      <span>{formattedText}</span>
    </span>
  );
};
