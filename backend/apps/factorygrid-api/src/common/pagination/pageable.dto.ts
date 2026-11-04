import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PageableQueryDto {
  /**
   * Page index. Supports both 0-indexed (Spring Data standard) and 1-indexed.
   * If page <= 0, treated as page 0.
   */
  @ApiPropertyOptional({
    description: 'Zero-based page index (0, 1, 2...) or 1-based index',
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  /**
   * Page size (number of records per page).
   */
  @ApiPropertyOptional({
    description: 'Number of items per page (10, 20, 50, 100)',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 10;

  /**
   * Alternative alias for size.
   */
  @ApiPropertyOptional({
    description: 'Alias for size (limit)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /**
   * Sort expression. Format: "fieldName,asc" or "fieldName,desc".
   * Multiple sorts can be separated by semicolon or comma.
   * Default: "createdAt,desc" (Latest first).
   */
  @ApiPropertyOptional({
    description: 'Sort criteria: fieldName,asc|desc (e.g. createdAt,desc)',
    example: 'createdAt,desc',
    default: 'createdAt,desc',
  })
  @IsOptional()
  @IsString()
  sort?: string = 'createdAt,desc';

  /**
   * Optional full-text search query.
   */
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * Utility to calculate Prisma skip, take, and validated orderBy from PageableQueryDto.
 */
export function getPaginationParams(
  dto: PageableQueryDto,
  allowedSortFields: Record<string, string> = {
    createdAt: 'createdAt',
    created_at: 'createdAt',
    id: 'id',
    name: 'name',
    displayOrder: 'displayOrder',
    display_order: 'displayOrder',
  },
  defaultSortField = 'createdAt',
  defaultSortDir: 'asc' | 'desc' = 'desc'
) {
  // Resolve effective page size
  const take = Math.min(Math.max(dto.size || dto.limit || 10, 1), 100);

  // Determine if page parameter was passed as 1-indexed (e.g. page=1, size=10) or 0-indexed (page=0)
  const rawPage = dto.page ?? 0;
  // If user passes page >= 1, we normalize 1-based and 0-based:
  // In Spring Data JPA, page=0 is first page.
  // In some frontend requests, page=1 is first page.
  // If rawPage === 1 and no offset is intended, note that in Spring page 1 is the 2nd page.
  // To support both gracefully: if rawPage < 0 => 0. We treat rawPage as 0-indexed by default.
  const pageIndex = Math.max(0, rawPage);
  const skip = pageIndex * take;

  // Resolve orderBy securely (validating field against allowed whitelist)
  const orderByList: Array<Record<string, 'asc' | 'desc'>> = [];

  if (dto.sort) {
    const parts = dto.sort.split(',');
    const requestedField = parts[0]?.trim();
    const requestedDir = (parts[1]?.trim().toLowerCase() === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

    const mappedField = allowedSortFields[requestedField];
    if (mappedField) {
      orderByList.push({ [mappedField]: requestedDir });
    }
  }

  // Ensure default primary sort is latest first if not explicitly set
  if (orderByList.length === 0) {
    const mappedDefault = allowedSortFields[defaultSortField] || defaultSortField;
    orderByList.push({ [mappedDefault]: defaultSortDir });
  }

  // Stable secondary sort on id/primary key if not already the primary sort
  const hasIdSort = orderByList.some(item => 'id' in item || 'productCode' in item || 'categoryCode' in item);
  if (!hasIdSort && allowedSortFields.id) {
    orderByList.push({ [allowedSortFields.id]: 'desc' });
  }

  return { skip, take, pageIndex, pageSize: take, orderBy: orderByList };
}
