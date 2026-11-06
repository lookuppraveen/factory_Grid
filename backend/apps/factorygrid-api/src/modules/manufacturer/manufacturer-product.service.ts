import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateManufacturerProductDto,
  ManufacturerProductBulkUploadDto,
  ManufacturerProductQueryDto,
  UpdateManufacturerProductDto,
} from './dto/manufacturer-product.dto';

@Injectable()
export class ManufacturerProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Authoritatively resolves the authenticated manufacturer registration from PostgreSQL.
   * Guarantees strict data isolation: caller identity is NEVER taken from request body or query params.
   */
  async resolveManufacturer(user: AuthUser, explicitMfgId?: string) {
    let reg = await this.prisma.manufacturerRegistration.findFirst({
      where: { userId: BigInt(user.id) },
      orderBy: { id: 'desc' },
    });

    if (!reg) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: BigInt(user.id) },
      });
      if (dbUser?.email) {
        reg = await this.prisma.manufacturerRegistration.findFirst({
          where: { email: { equals: dbUser.email.trim(), mode: 'insensitive' } },
          orderBy: { id: 'desc' },
        });
        if (reg && !reg.userId) {
          await this.prisma.manufacturerRegistration.update({
            where: { id: reg.id },
            data: { userId: BigInt(user.id) },
          });
        }
      }
    }

    const isAdmin =
      (user as any).roles?.includes('ADMIN') ||
      (user as any).roles?.includes('ROLE_ADMIN') ||
      (user as any).role === 'ADMIN';

    if (explicitMfgId) {
      if (isAdmin) {
        const targetReg = await this.prisma.manufacturerRegistration.findFirst({
          where: {
            OR: [
              { registrationCode: explicitMfgId },
              ...(isNaN(Number(explicitMfgId)) ? [] : [{ id: BigInt(explicitMfgId) }]),
            ],
          },
        });
        if (targetReg) return targetReg;
      } else if (reg) {
        // Enforce Manufacturer Isolation: A manufacturer cannot access another manufacturer's catalog
        const isMatch =
          (reg.registrationCode === explicitMfgId || reg.manufacturerCode === explicitMfgId) ||
          String(reg.id) === explicitMfgId;
        if (!isMatch) {
          throw new ForbiddenException(
            'Manufacturer Isolation: You do not have permission to view or modify products for another facility.',
          );
        }
      }
    }

    if (!reg && isAdmin) {
      reg = await this.prisma.manufacturerRegistration.findFirst({ orderBy: { id: 'asc' } });
    }

    if (!reg) {
      throw new NotFoundException('Authenticated user is not registered as a verified manufacturer.');
    }

    return reg;
  }

  /**
   * Retrieves summary counts for the authenticated manufacturer
   */
  async getSummary(user: AuthUser, explicitMfgId?: string) {
    const reg = await this.resolveManufacturer(user, explicitMfgId);

    const [totalMapped, activeCount, inactiveCount, allMapped] = await Promise.all([
      this.prisma.manufacturerProduct.count({
        where: { registrationId: reg.id },
      }),
      this.prisma.manufacturerProduct.count({
        where: { registrationId: reg.id, lifecycleStatus: 'ACTIVE' },
      }),
      this.prisma.manufacturerProduct.count({
        where: { registrationId: reg.id, lifecycleStatus: { not: 'ACTIVE' } },
      }),
      this.prisma.manufacturerProduct.findMany({
        where: { registrationId: reg.id },
        select: {
          product: {
            select: { category: true },
          },
        },
      }),
    ]);

    const distinctCategories = new Set(
      allMapped
        .map((m) => m.product?.category?.trim())
        .filter((cat): cat is string => Boolean(cat)),
    );

    return {
      manufacturerId: reg.id.toString(),
      manufacturerCode: reg.manufacturerCode || reg.registrationCode,
      companyName: reg.companyName,
      totalMapped,
      activeCount,
      inactiveCount,
      totalCategories: distinctCategories.size,
    };
  }

  /**
   * Lists mapped products exclusively for the logged-in manufacturer with filtering & pagination
   */
  async listMappedProducts(user: AuthUser, query: ManufacturerProductQueryDto, explicitMfgId?: string) {
    const reg = await this.resolveManufacturer(user, explicitMfgId);

    const where: any = {
      registrationId: reg.id,
    };

    if (query.status && query.status.toUpperCase() !== 'ALL') {
      where.lifecycleStatus = query.status.toUpperCase();
    }

    const productWhere: any = {};
    if (query.category && query.category !== 'ALL') {
      productWhere.category = { equals: query.category.trim(), mode: 'insensitive' };
    }
    if (query.subCategory && query.subCategory !== 'ALL') {
      productWhere.subCategory = { equals: query.subCategory.trim(), mode: 'insensitive' };
    }
    if (query.subSubCategory && query.subSubCategory !== 'ALL') {
      productWhere.subSubCategory = { equals: query.subSubCategory.trim(), mode: 'insensitive' };
    }

    const searchTerm = query.search?.trim();
    if (searchTerm) {
      where.OR = [
        { manufacturerProductCode: { contains: searchTerm, mode: 'insensitive' } },
        { manufacturerPartNumber: { contains: searchTerm, mode: 'insensitive' } },
        { manufacturerSku: { contains: searchTerm, mode: 'insensitive' } },
        {
          product: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { genericName: { contains: searchTerm, mode: 'insensitive' } },
              { productCode: { contains: searchTerm, mode: 'insensitive' } },
              { category: { contains: searchTerm, mode: 'insensitive' } },
              { subCategory: { contains: searchTerm, mode: 'insensitive' } },
              { subSubCategory: { contains: searchTerm, mode: 'insensitive' } },
              { dosageForm: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (Object.keys(productWhere).length > 0) {
      where.product = {
        ...(where.product || {}),
        ...productWhere,
      };
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 50;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.manufacturerProduct.count({ where }),
      this.prisma.manufacturerProduct.findMany({
        where,
        include: {
          product: true,
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      manufacturer: {
        id: reg.id.toString(),
        registrationCode: reg.registrationCode,
        manufacturerCode: reg.manufacturerCode || reg.registrationCode,
        companyName: reg.companyName,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      items: items.map((m) => this.toResponseDto(m)),
    };
  }

  /**
   * Retrieves single product mapping by ID, verifying owner identity
   */
  async getMappingById(user: AuthUser, id: string | number) {
    const reg = await this.resolveManufacturer(user);
    const mappingId = BigInt(id);

    const mapping = await this.prisma.manufacturerProduct.findUnique({
      where: { id: mappingId },
      include: { product: true },
    });

    if (!mapping) {
      throw new NotFoundException(`Product mapping #${id} not found.`);
    }

    if (mapping.registrationId !== reg.id) {
      throw new ForbiddenException("Access to another manufacturer's product mapping is denied.");
    }

    return this.toResponseDto(mapping);
  }

  /**
   * Creates a new PRODUCT_MANUFACTURER mapping from the master catalogue
   */
  async createMapping(user: AuthUser, dto: CreateManufacturerProductDto, explicitMfgId?: string) {
    const reg = await this.resolveManufacturer(user, explicitMfgId);

    // 1. Resolve or create central product in catalog_products
    let product: any = null;
    if (dto.productId) {
      product = await this.prisma.catalogProduct.findFirst({
        where: {
          OR: [
            { id: dto.productId },
            { productCode: { equals: dto.productId.trim(), mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!product && dto.name && dto.category) {
      const targetCode = (dto.manufacturerProductCode || dto.productCode || `PRD${Date.now()}`).trim().toUpperCase();
      product = await this.prisma.catalogProduct.findFirst({
        where: { productCode: { equals: targetCode, mode: 'insensitive' } },
      });

      if (!product) {
        product = await this.prisma.catalogProduct.create({
          data: {
            id: `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            productCode: targetCode,
            name: dto.name.trim(),
            genericName: dto.genericName?.trim() || dto.name.trim(),
            category: dto.category.trim(),
            subCategory: dto.subCategory?.trim() || null,
            subSubCategory: dto.subSubCategory?.trim() || null,
            dosageForm: dto.dosageForm?.trim() || dto.subCategory?.trim() || 'Standard Form',
            packSize: dto.packagingDetails?.trim() || dto.packSize?.trim() || '10 x 10 Strip',
            packUom: dto.uom?.trim() || 'Strip',
            baseUom: dto.baseUom?.trim() || 'Unit',
            description: dto.description?.trim() || null,
            productTypeId: dto.productTypeId?.trim() || 'pt_med',
            lifecycleStatus: 'ACTIVE',
            isSellable: true,
            active: true,
          },
        });
      }
    }

    if (!product) {
      throw new NotFoundException(
        `Product could not be resolved. Please provide a valid productId or product Name and Category.`,
      );
    }

    // 2. Prevent duplicate mapping for the same manufacturer and product
    const existing = await this.prisma.manufacturerProduct.findUnique({
      where: {
        registrationId_productId: {
          registrationId: reg.id,
          productId: product.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Product "${product.name}" (${product.productCode}) is already mapped to your facility. You can edit the existing mapping instead of creating a duplicate.`,
      );
    }

    const created = await this.prisma.manufacturerProduct.create({
      data: {
        registrationId: reg.id,
        productId: product.id,
        manufacturerProductCode: dto.manufacturerProductCode?.trim() || product.productCode,
        manufacturerPartNumber: dto.manufacturerPartNumber?.trim() || null,
        manufacturerSku: dto.manufacturerSku?.trim() || dto.manufacturerProductCode?.trim() || product.productCode,
        moq: dto.moq ?? 1000,
        leadTimeDays: dto.leadTimeDays ?? 14,
        packagingDetails: dto.packagingDetails?.trim() || dto.packSize?.trim() || null,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        isPreferred: dto.isPreferred ?? false,
        lifecycleStatus: dto.lifecycleStatus || 'ACTIVE',
      },
      include: {
        product: true,
      },
    });

    return this.toResponseDto(created);
  }
  /**
   * Bulk upload products and map them to the authenticated manufacturer facility
   */
  
  parseCsvProducts(csvText: string): any[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = this.parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
    const rows: any[] = [];

    const findIndex = (aliases: string[]) => headers.findIndex((h) => aliases.some((a) => h.includes(a)));
    const idxName = findIndex(['name', 'productname', 'title']);
    const idxSku = findIndex(['sku', 'code', 'productcode', 'mfgcode', 'itemcode']);
    const idxGeneric = findIndex(['generic', 'molecule', 'activeingredient']);
    const idxCat = findIndex(['category', 'cat']);
    const idxSub = findIndex(['subcategory', 'subcat']);
    const idxSubSub = findIndex(['subsubcategory', 'subsub', 'classification']);
    const idxPack = findIndex(['pack', 'packaging', 'packsize']);
    const idxUom = findIndex(['uom', 'unit']);
    const idxMoq = findIndex(['moq', 'minimumorder']);
    const idxLead = findIndex(['lead', 'leadtime', 'days']);
    const idxDesc = findIndex(['desc', 'description']);

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      if (cols.length === 0 || cols.every((c) => !c.trim())) continue;

      const name = cols[idxName !== -1 ? idxName : 0] || '';
      const sku = (cols[idxSku !== -1 ? idxSku : 1] || '').toUpperCase();
      const genericName = cols[idxGeneric !== -1 ? idxGeneric : 2] || name;
      const category = cols[idxCat !== -1 ? idxCat : 3] || 'Drugs';
      const subCategory = idxSub !== -1 ? cols[idxSub] : undefined;
      const subSubCategory = idxSubSub !== -1 ? cols[idxSubSub] : undefined;
      const packSize = cols[idxPack !== -1 ? idxPack : 4] || '10 x 10 Strip';
      const baseUom = cols[idxUom !== -1 ? idxUom : 5] || 'Unit';
      const moq = parseInt(cols[idxMoq !== -1 ? idxMoq : 6]?.replace(/[^0-9]/g, '') || '1000', 10);
      const leadTimeDays = parseInt(cols[idxLead !== -1 ? idxLead : 7]?.replace(/[^0-9]/g, '') || '14', 10);
      const description = idxDesc !== -1 ? cols[idxDesc] : undefined;

      rows.push({
        name,
        productCode: sku,
        manufacturerProductCode: sku,
        genericName,
        category,
        subCategory,
        subSubCategory,
        packSize,
        packagingDetails: packSize,
        baseUom,
        moq: isNaN(moq) ? 1000 : moq,
        leadTimeDays: isNaN(leadTimeDays) ? 14 : leadTimeDays,
        description,
      });
    }

    return rows;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let insideQuotes = false;
    let current = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  async bulkUpload(user: AuthUser, dto: ManufacturerProductBulkUploadDto, explicitMfgId?: string) {
    const reg = await this.resolveManufacturer(user, explicitMfgId);
    const rows = dto.rows || [];
    const totalRows = rows.length;
    let successfulRows = 0;
    let failedRows = 0;
    let duplicateRows = 0;
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const imported: Array<any> = [];

    const existingMappings = await this.prisma.manufacturerProduct.findMany({
      where: { registrationId: reg.id },
      select: { productId: true, manufacturerProductCode: true, manufacturerSku: true },
    });
    const mappedProductIds = new Set(existingMappings.map((m) => m.productId));
    const seenMfgCodesInBatch = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      let hasError = false;

      if (!row.name || !row.name!.trim()) {
        errors.push({
          row: rowNum,
          field: 'name',
          message: 'Product Name is required.',
        });
        hasError = true;
      }

      if (!row.category || !row.category!.trim()) {
        errors.push({
          row: rowNum,
          field: 'category',
          message: 'Category is required.',
        });
        hasError = true;
      }

      const mfgCodeClean = (row.manufacturerProductCode || row.productCode || '').trim().toUpperCase();
      if (mfgCodeClean) {
        if (seenMfgCodesInBatch.has(mfgCodeClean)) {
          errors.push({
            row: rowNum,
            field: 'manufacturerProductCode',
            message: `Duplicate Product Code/SKU "${mfgCodeClean}" in uploaded batch.`,
          });
          hasError = true;
          duplicateRows++;
        } else {
          seenMfgCodesInBatch.add(mfgCodeClean);
        }
      }

      if (hasError) {
        failedRows++;
        continue;
      }

      try {
        let product: any = null;
        const codeToFind = row.productCode?.trim() || mfgCodeClean;
        if (codeToFind) {
          product = await this.prisma.catalogProduct.findFirst({
            where: {
              OR: [
                { productCode: { equals: codeToFind, mode: 'insensitive' } },
                { id: codeToFind },
              ],
            },
          });
        }

        if (!product) {
          const targetCode = codeToFind || `PRD${Date.now()}${String(i + 1).padStart(3, '0')}`;
          const targetId = `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const subCategory = row.subCategory?.trim() || null;
          const subSubCategory = row.subSubCategory?.trim() || null;
          const genericName = row.genericName?.trim() || row.name!.trim();
          const dosageForm = row.dosageForm?.trim() || subCategory || 'Standard Form';
          const packSize = row.packSize?.trim() || '10 x 10 Strip';
          const baseUom = row.baseUom?.trim() || 'Unit';

          product = await this.prisma.catalogProduct.create({
            data: {
              id: targetId,
              productCode: targetCode,
              name: row.name!.trim(),
              genericName,
              dosageForm,
              productTypeId: row.productTypeId?.trim() || 'pt_med',
              category: row.category!.trim(),
              subCategory,
              subSubCategory,
              description: row.description?.trim() || null,
              baseUom,
              packSize,
              packUom: 'Strip',
              lifecycleStatus: 'ACTIVE',
              isSellable: true,
              active: true,
            },
          });
        }

        if (mappedProductIds.has(product.id)) {
          errors.push({
            row: rowNum,
            field: 'productCode',
            message: `Product "${product.name}" (${product.productCode}) is already mapped to your facility.`,
          });
          failedRows++;
          duplicateRows++;
          continue;
        }

        const mapping = await this.prisma.manufacturerProduct.create({
          data: {
            registrationId: reg.id,
            productId: product.id,
            manufacturerProductCode: row.manufacturerProductCode?.trim() || product.productCode,
            moq: row.moq ? Number(row.moq) : 1000,
            leadTimeDays: row.leadTimeDays ? Number(row.leadTimeDays) : 14,
            packagingDetails: row.packagingDetails?.trim() || row.packSize?.trim() || null,
            lifecycleStatus: 'ACTIVE',
          },
          include: {
            product: true,
          },
        });

        mappedProductIds.add(product.id);
        successfulRows++;
        imported.push(this.toResponseDto(mapping));
      } catch (err: any) {
        failedRows++;
        errors.push({
          row: rowNum,
          field: 'general',
          message: err?.message || 'Database error processing row.',
        });
      }
    }

    return {
      totalRows,
      successfulRows,
      failedRows,
      duplicateRows,
      errors,
      importedCount: successfulRows,
      items: imported,
    };
  }


  /**
   * Updates an existing mapping
   */
  async updateMapping(user: AuthUser, id: string | number, dto: UpdateManufacturerProductDto) {
    const reg = await this.resolveManufacturer(user);
    const mappingId = BigInt(id);

    const existing = await this.prisma.manufacturerProduct.findUnique({
      where: { id: mappingId },
    });

    if (!existing) {
      throw new NotFoundException(`Product mapping #${id} not found.`);
    }

    if (existing.registrationId !== reg.id) {
      throw new ForbiddenException("Access to another manufacturer's product mapping is denied.");
    }

    const updated = await this.prisma.manufacturerProduct.update({
      where: { id: mappingId },
      data: {
        ...(dto.manufacturerProductCode !== undefined
          ? { manufacturerProductCode: dto.manufacturerProductCode?.trim() || null }
          : {}),
        ...(dto.manufacturerPartNumber !== undefined
          ? { manufacturerPartNumber: dto.manufacturerPartNumber?.trim() || null }
          : {}),
        ...(dto.manufacturerSku !== undefined
          ? { manufacturerSku: dto.manufacturerSku?.trim() || null }
          : {}),
        ...(dto.moq !== undefined ? { moq: dto.moq } : {}),
        ...(dto.leadTimeDays !== undefined ? { leadTimeDays: dto.leadTimeDays } : {}),
        ...(dto.packagingDetails !== undefined
          ? { packagingDetails: dto.packagingDetails?.trim() || null }
          : {}),
        ...(dto.effectiveFrom !== undefined
          ? { effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null }
          : {}),
        ...(dto.effectiveTo !== undefined
          ? { effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null }
          : {}),
        ...(dto.isPreferred !== undefined ? { isPreferred: dto.isPreferred } : {}),
        ...(dto.lifecycleStatus !== undefined ? { lifecycleStatus: dto.lifecycleStatus } : {}),
      },
      include: {
        product: true,
      },
    });

    return this.toResponseDto(updated);
  }

  /**
   * Toggles or updates mapping status (ACTIVE vs INACTIVE)
   */
  async updateStatus(user: AuthUser, id: string | number, status: 'ACTIVE' | 'INACTIVE') {
    const reg = await this.resolveManufacturer(user);
    const mappingId = BigInt(id);

    const existing = await this.prisma.manufacturerProduct.findUnique({
      where: { id: mappingId },
    });

    if (!existing) {
      throw new NotFoundException(`Product mapping #${id} not found.`);
    }

    if (existing.registrationId !== reg.id) {
      throw new ForbiddenException("Access to another manufacturer's product mapping is denied.");
    }

    const updated = await this.prisma.manufacturerProduct.update({
      where: { id: mappingId },
      data: {
        lifecycleStatus: status,
      },
      include: {
        product: true,
      },
    });

    return this.toResponseDto(updated);
  }

  /**
   * Removes a mapping
   */
  async deleteMapping(user: AuthUser, id: string | number) {
    const reg = await this.resolveManufacturer(user);
    const mappingId = BigInt(id);

    const existing = await this.prisma.manufacturerProduct.findUnique({
      where: { id: mappingId },
    });

    if (!existing) {
      throw new NotFoundException(`Product mapping #${id} not found.`);
    }

    if (existing.registrationId !== reg.id) {
      throw new ForbiddenException("Access to another manufacturer's product mapping is denied.");
    }

    await this.prisma.manufacturerProduct.delete({
      where: { id: mappingId },
    });

    return {
      success: true,
      message: `Product mapping #${id} successfully removed.`,
    };
  }

  /**
   * Serializes a database ManufacturerProduct record to client-ready DTO
   */
  private toResponseDto(m: any) {
    const p = m.product || {};
    return {
      id: m.id.toString(),
      registrationId: m.registrationId.toString(),
      productId: m.productId,
      manufacturerProductCode: m.manufacturerProductCode || p.productCode,
      manufacturerPartNumber: m.manufacturerPartNumber || null,
      manufacturerSku: m.manufacturerSku || null,
      moq: m.moq ?? 1000,
      leadTimeDays: m.leadTimeDays ?? 14,
      lifecycleStatus: m.lifecycleStatus || 'ACTIVE',
      status: m.lifecycleStatus === 'ACTIVE' ? 'Active' : 'Inactive',
      effectiveFrom: m.effectiveFrom ? m.effectiveFrom.toISOString() : null,
      effectiveTo: m.effectiveTo ? m.effectiveTo.toISOString() : null,
      isPreferred: m.isPreferred ?? false,
      packagingDetails: m.packagingDetails || p.packSize || null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),

      // Embedded Central Product Attributes
      product: {
        id: p.id,
        productCode: p.productCode,
        name: p.name,
        genericName: p.genericName || '',
        dosageForm: p.dosageForm || 'Tablet',
        strength: (p.attributes as any)?.strength || p.shortName || 'Standard',
        category: p.category || 'Drugs',
        subCategory: p.subCategory || p.dosageForm || null,
        subSubCategory: p.subSubCategory || null,
        packSize: p.packSize || '10 x 10 Strip',
        baseUom: p.baseUom || 'Unit',
        packUom: p.packUom || 'Strip',
        brand: p.brand || null,
        lifecycleStatus: p.lifecycleStatus || 'ACTIVE',
        isSellable: p.isSellable ?? true,
      },
    };
  }
}
