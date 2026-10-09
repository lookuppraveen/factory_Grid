import React from 'react';

interface LogoMarkProps {
  size?: number;
  color?: string;
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ size = 32, color = 'currentColor', className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Geometric Enterprise Cube / Grid Core */}
    <rect x="3" y="3" width="26" height="26" rx="5" fill="none" stroke={color} strokeWidth="2.2" strokeOpacity="0.9" />
    
    {/* Precision Grid Interconnect Nodes */}
    <path d="M9 11 H23" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M9 16 H19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M9 21 H15" stroke={color} strokeWidth="2" strokeLinecap="round" />

    {/* Pillar Accents */}
    <circle cx="21" cy="21" r="2.5" fill={color} />
  </svg>
);

