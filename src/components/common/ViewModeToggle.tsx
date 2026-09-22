import React from 'react';
import { Table, LayoutGrid } from 'lucide-react';

export type DisplayViewMode = 'TABLE' | 'CARD';

interface ViewModeToggleProps {
  viewMode: DisplayViewMode;
  onViewChange: (mode: DisplayViewMode) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewChange,
  style
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#E2E8F0',
        border: '1.5px solid #CBD5E1',
        borderRadius: 8,
        padding: 3,
        gap: 4,
        boxSizing: 'border-box',
        boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.06)',
        ...style
      }}
    >
      <button
        type="button"
        onClick={() => onViewChange('TABLE')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 6,
          border: 'none',
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
          background: viewMode === 'TABLE' ? '#0F766E' : 'transparent',
          color: viewMode === 'TABLE' ? '#FFFFFF' : '#475569',
          boxShadow: viewMode === 'TABLE' ? '0 2px 4px rgba(15, 118, 110, 0.3)' : 'none',
          transition: 'all 0.15s ease-in-out'
        }}
        title="Switch to Table View"
      >
        <Table size={14} />
        <span>Table View</span>
      </button>

      <button
        type="button"
        onClick={() => onViewChange('CARD')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 6,
          border: 'none',
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
          background: viewMode === 'CARD' ? '#0F766E' : 'transparent',
          color: viewMode === 'CARD' ? '#FFFFFF' : '#475569',
          boxShadow: viewMode === 'CARD' ? '0 2px 4px rgba(15, 118, 110, 0.3)' : 'none',
          transition: 'all 0.15s ease-in-out'
        }}
        title="Switch to Card View"
      >
        <LayoutGrid size={14} />
        <span>Card View</span>
      </button>
    </div>
  );
};
