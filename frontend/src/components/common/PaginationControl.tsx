import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationControlProps {
  /** Current 1-based page index */
  currentPage: number;
  /** Total number of records matching query */
  totalElements: number;
  /** Number of items displayed per page */
  pageSize: number;
  /** Callback invoked when page changes */
  onPageChange: (newPage: number) => void;
  /** Callback invoked when page size changes */
  onPageSizeChange?: (newPageSize: number) => void;
  /** Allowed page sizes (default: [10, 20, 50, 100]) */
  pageSizeOptions?: number[];
  /** Noun describing the items (e.g. 'records', 'categories', 'products') */
  itemName?: string;
  /** Disabled interaction flag */
  disabled?: boolean;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = 'records',
  disabled = false,
}) => {
  const safeTotal = Math.max(0, totalElements);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const page = Math.min(Math.max(1, currentPage), totalPages);

  const startRecord = safeTotal === 0 ? 0 : (page - 1) * safePageSize + 1;
  const endRecord = safeTotal === 0 ? 0 : Math.min(page * safePageSize, safeTotal);

  const isFirstPage = page <= 1 || safeTotal === 0;
  const isLastPage = page >= totalPages || safeTotal === 0;

  // Compute numeric page pills to display (with smart windowing)
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (page >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  const pageNumbers = getPageNumbers();

  const buttonBaseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    height: 32,
    padding: '0 8px',
    borderRadius: 6,
    fontSize: 12.5,
    fontWeight: 600,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#334155',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    opacity: 0.4,
    cursor: 'not-allowed',
    background: '#F8FAFC',
    borderColor: '#E2E8F0',
    color: '#94A3B8',
  };

  const buttonActiveStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: '#0F766E',
    borderColor: '#0F766E',
    color: '#FFFFFF',
    fontWeight: 800,
    boxShadow: '0 1px 3px rgba(15, 118, 110, 0.25)',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        borderRadius: '0 0 8px 8px',
        fontSize: 12.5,
        color: '#475569',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      {/* ── Left Side: Visible Record Range & Total ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 500 }}>
          Showing{' '}
          <strong style={{ color: '#0F172A', fontWeight: 700 }}>
            {startRecord}–{endRecord}
          </strong>{' '}
          of{' '}
          <strong style={{ color: '#0F172A', fontWeight: 700 }}>
            {safeTotal}
          </strong>{' '}
          {itemName}
        </span>
        <span style={{ color: '#CBD5E1' }}>•</span>
        <span style={{ color: '#64748B' }}>
          Page <strong style={{ color: '#0F172A' }}>{page}</strong> of{' '}
          <strong style={{ color: '#0F172A' }}>{totalPages}</strong>
        </span>
      </div>

      {/* ── Right Side: Page Size Selector & Navigation Buttons ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Page size dropdown */}
        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Rows per page:
            </span>
            <select
              aria-label="Select rows per page"
              value={safePageSize}
              disabled={disabled}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                if (newSize > 0) onPageSizeChange(newSize);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                fontWeight: 700,
                color: '#0F172A',
                background: '#FFFFFF',
                outline: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* First page button */}
          <button
            type="button"
            title="First Page"
            aria-label="First Page"
            disabled={disabled || isFirstPage}
            onClick={() => onPageChange(1)}
            style={disabled || isFirstPage ? buttonDisabledStyle : buttonBaseStyle}
          >
            <ChevronsLeft size={15} />
          </button>

          {/* Previous page button */}
          <button
            type="button"
            title="Previous Page"
            aria-label="Previous Page"
            disabled={disabled || isFirstPage}
            onClick={() => onPageChange(page - 1)}
            style={disabled || isFirstPage ? buttonDisabledStyle : buttonBaseStyle}
          >
            <ChevronLeft size={15} />
          </button>

          {/* Numeric Page Buttons */}
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 26,
                    height: 32,
                    color: '#94A3B8',
                    fontSize: 12,
                    userSelect: 'none',
                  }}
                >
                  •••
                </span>
              );
            }

            const numPage = Number(p);
            const isActive = numPage === page;

            return (
              <button
                key={`page-${numPage}`}
                type="button"
                aria-label={`Page ${numPage}`}
                disabled={disabled}
                onClick={() => onPageChange(numPage)}
                style={isActive ? buttonActiveStyle : buttonBaseStyle}
              >
                {numPage}
              </button>
            );
          })}

          {/* Next page button */}
          <button
            type="button"
            title="Next Page"
            aria-label="Next Page"
            disabled={disabled || isLastPage}
            onClick={() => onPageChange(page + 1)}
            style={disabled || isLastPage ? buttonDisabledStyle : buttonBaseStyle}
          >
            <ChevronRight size={15} />
          </button>

          {/* Last page button */}
          <button
            type="button"
            title="Last Page"
            aria-label="Last Page"
            disabled={disabled || isLastPage}
            onClick={() => onPageChange(totalPages)}
            style={disabled || isLastPage ? buttonDisabledStyle : buttonBaseStyle}
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
