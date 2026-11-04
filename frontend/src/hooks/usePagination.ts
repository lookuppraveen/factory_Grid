import { useState, useMemo, useEffect } from 'react';

export interface UsePaginationOptions<T = any> {
  /** Full collection of items when doing client-side slicing of loaded datasets */
  items?: T[];
  /** Total count from backend when using server-side pagination */
  totalElements?: number;
  /** Alias for totalElements */
  totalItems?: number;
  /** Default rows per page (default: 10) */
  initialPageSize?: number;
  /** Initial page index (1-based, default: 1) */
  initialPage?: number;
  /** Dependencies that should trigger a reset to page 1 (e.g. [searchTerm, filterStatus]) */
  resetDeps?: any[];
  /** Alias for resetDeps */
  resetDependencies?: any[];
  /** Callback when page or size changes (for server-side fetching) */
  onPageChange?: (page: number, size: number) => void;
}

export function usePagination<T = any>(
  itemsOrOptions?: T[] | UsePaginationOptions<T>,
  maybeOptions?: UsePaginationOptions<T>
) {
  let resolvedItems: T[] | undefined;
  let options: UsePaginationOptions<T> = {};

  if (Array.isArray(itemsOrOptions)) {
    resolvedItems = itemsOrOptions;
    options = maybeOptions || {};
  } else if (itemsOrOptions && typeof itemsOrOptions === 'object') {
    options = itemsOrOptions;
    resolvedItems = options.items;
  }

  const {
    totalElements: serverTotalElements,
    totalItems: serverTotalItems,
    initialPageSize = 10,
    initialPage = 1,
    resetDeps,
    resetDependencies,
    onPageChange,
  } = options;

  const actualResetDeps = resetDeps || resetDependencies || [];

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  // Automatically reset to page 1 whenever any reset dependency changes (search term, filters, etc.)
  useEffect(() => {
    setCurrentPage(1);
  }, actualResetDeps); // eslint-disable-line react-hooks/exhaustive-deps

  const totalElements = useMemo(() => {
    if (typeof serverTotalElements === 'number') {
      return serverTotalElements;
    }
    if (typeof serverTotalItems === 'number') {
      return serverTotalItems;
    }
    return resolvedItems ? resolvedItems.length : 0;
  }, [serverTotalElements, serverTotalItems, resolvedItems]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalElements / pageSize));
  }, [totalElements, pageSize]);

  // Ensure current page does not exceed totalPages if data shrinks
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalElements);

  // Sliced page items (for in-memory / pre-loaded collections)
  const paginatedItems = useMemo(() => {
    if (!resolvedItems) return [];
    return resolvedItems.slice(startIndex, endIndex);
  }, [resolvedItems, startIndex, endIndex]);

  const paginateItems = (list?: T[]): T[] => {
    const src = list || resolvedItems || [];
    return src.slice(startIndex, startIndex + pageSize);
  };

  const handlePageChange = (newPage: number) => {
    const validPage = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(validPage);
    if (onPageChange) {
      onPageChange(validPage, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    if (onPageChange) {
      onPageChange(1, newPageSize);
    }
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    startIndex,
    endIndex,
    paginatedItems,
    paginateItems,
    setCurrentPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    resetPage,
    paginationProps: {
      currentPage,
      totalElements,
      pageSize,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
    },
  };
}
