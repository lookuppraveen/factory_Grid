export interface PageResponse<T> {
  content: T[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  numberOfElements: number;
  page?: number;
  size?: number;
  total?: number;
  [key: string]: any;
}

export function createPageResponse<T>(
  content: T[],
  totalElements: number,
  pageIndex: number,
  pageSize: number,
  extraProperties: Record<string, any> = {}
): PageResponse<T> {
  const safeTotal = Math.max(0, totalElements);
  const safeSize = Math.max(1, pageSize);
  const totalPages = Math.ceil(safeTotal / safeSize);
  const currentPage = Math.max(0, pageIndex);

  const first = currentPage === 0;
  const last = totalPages === 0 || currentPage >= totalPages - 1;
  const hasNext = currentPage < totalPages - 1;
  const hasPrevious = currentPage > 0;

  return {
    content,
    currentPage,
    pageSize: safeSize,
    totalElements: safeTotal,
    totalPages,
    first,
    last,
    hasNext,
    hasPrevious,
    numberOfElements: content.length,
    page: currentPage,
    size: safeSize,
    total: safeTotal,
    ...extraProperties,
  };
}
