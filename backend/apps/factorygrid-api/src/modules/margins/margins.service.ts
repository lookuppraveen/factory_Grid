import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BulkImportProductMarginsDto,
  CalculateMarginDto,
  MarginQueryDto,
  ProductMarginImportRowDto,
  SetCategoryMarginDto,
  SetManufacturerMarginDto,
  SetPlatformFeeDto,
  SetProductMarginDto,
} from './dto/margins.dto';

@Injectable()
export class MarginsService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================================
  // SUMMARY METRICS
  // =====================================================================

  async getSummary() {
    const [
      totalCategories,
      configuredCategories,
      categoryConfigs,
      totalManufacturers,
      configuredManufacturers,
      totalProducts,
      configuredProducts,
      platformFee,
    ] = await Promise.all([
      this.prisma.category.count(),
      this.prisma.categoryMarginConfig.count({ where: { status: 'ACTIVE' } }),
      this.prisma.categoryMarginConfig.findMany({ where: { status: 'ACTIVE' } }),
      this.prisma.manufacturerRegistration.count(),
      this.prisma.manufacturerMarginConfig.count({ where: { status: 'ACTIVE' } }),
      this.prisma.catalogProduct.count(),
      this.prisma.productMarginConfig.count({ where: { status: 'ACTIVE' } }),
      this.getPlatformFee(),
    ]);

    const percentageConfigs = categoryConfigs.filter(c => c.marginMode === 'PERCENTAGE');
    const totalPercentage = percentageConfigs.reduce((sum, c) => sum + Number(c.marginValue), 0);
    const avgMarginPercentage = percentageConfigs.length > 0
      ? Number((totalPercentage / percentageConfigs.length).toFixed(1))
      : 10.0;

    return {
      totalCategories,
      configuredCategories,
      totalManufacturers,
      configuredManufacturers,
      totalProducts,
      configuredProducts,
      avgMarginPercentage,
      activeRulesCount: configuredCategories + configuredManufacturers + configuredProducts,
      platformFee,
    };
  }

  // =====================================================================
  // PLATFORM FEE
  // =====================================================================

  async getPlatformFee() {
    const fee = await this.prisma.platformFeeConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!fee) {
      return {
        id: 'pf_default',
        feeMode: 'PERCENTAGE',
        feeValue: 2.0,
        feeName: 'Platform Facilitation & Escrow Fee',
        status: 'Active',
        effectiveFrom: null,
        effectiveTo: null,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      id: fee.id,
      feeMode: fee.feeMode,
      feeValue: Number(fee.feeValue),
      feeName: fee.feeName,
      status: fee.status,
      effectiveFrom: fee.effectiveFrom?.toISOString() || null,
      effectiveTo: fee.effectiveTo?.toISOString() || null,
      updatedAt: fee.updatedAt.toISOString(),
      updatedBy: fee.updatedBy || 'Admin',
    };
  }

  async updatePlatformFee(dto: SetPlatformFeeDto, user = 'Admin') {
    const existing = await this.prisma.platformFeeConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const feeValueDecimal = new Prisma.Decimal(dto.feeValue);
    const effFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined;
    const effTo = dto.effectiveTo ? new Date(dto.effectiveTo) : undefined;

    if (existing) {
      const updated = await this.prisma.platformFeeConfig.update({
        where: { id: existing.id },
        data: {
          feeMode: dto.feeMode,
          feeValue: feeValueDecimal,
          feeName: dto.feeName || existing.feeName,
          status: dto.status || 'Active',
          effectiveFrom: effFrom,
          effectiveTo: effTo,
          updatedBy: user,
        },
      });
      return {
        id: updated.id,
        feeMode: updated.feeMode,
        feeValue: Number(updated.feeValue),
        feeName: updated.feeName,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      };
    }

    const created = await this.prisma.platformFeeConfig.create({
      data: {
        id: `pf_${Date.now()}`.substring(0, 50),
        feeMode: dto.feeMode,
        feeValue: feeValueDecimal,
        feeName: dto.feeName || 'Platform Facilitation & Escrow Fee',
        status: dto.status || 'Active',
        effectiveFrom: effFrom,
        effectiveTo: effTo,
        createdBy: user,
        updatedBy: user,
      },
    });

    return {
      id: created.id,
      feeMode: created.feeMode,
      feeValue: Number(created.feeValue),
      feeName: created.feeName,
      status: created.status,
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  // =====================================================================
  // CATEGORY MARGINS
  // =====================================================================

  async listCategoryMargins(query?: MarginQueryDto) {
    const where: Prisma.CategoryMarginConfigWhereInput = {};
    if (query?.status) {
      where.status = query.status.toUpperCase();
    }
    if (query?.search) {
      where.OR = [
        { categoryName: { contains: query.search, mode: 'insensitive' } },
        { categoryId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const list = await this.prisma.categoryMarginConfig.findMany({
      where,
      orderBy: { categoryName: 'asc' },
    });

    return list.map(c => ({
      id: c.id,
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      marginMode: c.marginMode,
      marginValue: Number(c.marginValue),
      effectiveFrom: c.effectiveFrom?.toISOString() || null,
      effectiveTo: c.effectiveTo?.toISOString() || null,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      createdBy: c.createdBy,
      updatedBy: c.updatedBy,
    }));
  }

  async getCategoryMargin(idOrName: string) {
    const row = await this.prisma.categoryMarginConfig.findFirst({
      where: {
        OR: [
          { categoryId: idOrName },
          { categoryName: { equals: idOrName, mode: 'insensitive' } },
        ],
      },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      marginMode: row.marginMode,
      marginValue: Number(row.marginValue),
      effectiveFrom: row.effectiveFrom?.toISOString() || null,
      effectiveTo: row.effectiveTo?.toISOString() || null,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy,
    };
  }

  async setCategoryMargin(idOrName: string, dto: SetCategoryMarginDto, user = 'Admin') {
    const existing = await this.prisma.categoryMarginConfig.findFirst({
      where: {
        OR: [
          { categoryId: idOrName },
          { categoryName: { equals: idOrName, mode: 'insensitive' } },
        ],
      },
    });

    const marginValueDecimal = new Prisma.Decimal(dto.marginValue);
    const effFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined;
    const effTo = dto.effectiveTo ? new Date(dto.effectiveTo) : undefined;

    if (existing) {
      const updated = await this.prisma.categoryMarginConfig.update({
        where: { id: existing.id },
        data: {
          categoryName: dto.categoryName || existing.categoryName,
          marginMode: dto.marginMode,
          marginValue: marginValueDecimal,
          status: dto.status ? dto.status.toUpperCase() : existing.status,
          effectiveFrom: effFrom,
          effectiveTo: effTo,
          updatedBy: user,
        },
      });

      return {
        id: updated.id,
        categoryId: updated.categoryId,
        categoryName: updated.categoryName,
        marginMode: updated.marginMode,
        marginValue: Number(updated.marginValue),
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      };
    }

    // Lookup category in catalog categories to get canonical name if not provided
    let catName = dto.categoryName || idOrName;
    const catInDb = await this.prisma.category.findFirst({
      where: {
        OR: [
          { id: idOrName },
          { category: { equals: idOrName, mode: 'insensitive' } },
          { categoryCode: { equals: idOrName, mode: 'insensitive' } },
        ],
      },
    });
    if (catInDb) {
      catName = catInDb.category;
    }

    const created = await this.prisma.categoryMarginConfig.create({
      data: {
        id: `cm_${idOrName}_${Date.now()}`.substring(0, 50),
        categoryId: idOrName,
        categoryName: catName,
        marginMode: dto.marginMode,
        marginValue: marginValueDecimal,
        status: dto.status ? dto.status.toUpperCase() : 'ACTIVE',
        effectiveFrom: effFrom,
        effectiveTo: effTo,
        createdBy: user,
        updatedBy: user,
      },
    });

    return {
      id: created.id,
      categoryId: created.categoryId,
      categoryName: created.categoryName,
      marginMode: created.marginMode,
      marginValue: Number(created.marginValue),
      status: created.status,
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  // =====================================================================
  // MANUFACTURER MARGINS
  // =====================================================================

  async listManufacturerMargins(query?: MarginQueryDto) {
    const where: Prisma.ManufacturerMarginConfigWhereInput = {};
    if (query?.status) {
      where.status = query.status.toUpperCase();
    }
    if (query?.search) {
      where.OR = [
        { manufacturerName: { contains: query.search, mode: 'insensitive' } },
        { manufacturerId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const list = await this.prisma.manufacturerMarginConfig.findMany({
      where,
      orderBy: { manufacturerName: 'asc' },
    });

    return list.map(m => ({
      id: m.id,
      manufacturerId: m.manufacturerId,
      manufacturerName: m.manufacturerName,
      marginMode: m.marginMode,
      marginValue: Number(m.marginValue),
      effectiveFrom: m.effectiveFrom?.toISOString() || null,
      effectiveTo: m.effectiveTo?.toISOString() || null,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      createdBy: m.createdBy,
      updatedBy: m.updatedBy,
    }));
  }

  async getManufacturerMargin(mfgId: string) {
    const row = await this.prisma.manufacturerMarginConfig.findFirst({
      where: {
        OR: [
          { manufacturerId: mfgId },
          { manufacturerName: { equals: mfgId, mode: 'insensitive' } },
        ],
      },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      manufacturerId: row.manufacturerId,
      manufacturerName: row.manufacturerName,
      marginMode: row.marginMode,
      marginValue: Number(row.marginValue),
      effectiveFrom: row.effectiveFrom?.toISOString() || null,
      effectiveTo: row.effectiveTo?.toISOString() || null,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy,
    };
  }

  async setManufacturerMargin(mfgId: string, dto: SetManufacturerMarginDto, user = 'Admin') {
    const existing = await this.prisma.manufacturerMarginConfig.findFirst({
      where: {
        OR: [
          { manufacturerId: mfgId },
          { manufacturerName: { equals: mfgId, mode: 'insensitive' } },
        ],
      },
    });

    const marginValueDecimal = new Prisma.Decimal(dto.marginValue);
    const effFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined;
    const effTo = dto.effectiveTo ? new Date(dto.effectiveTo) : undefined;

    if (existing) {
      const updated = await this.prisma.manufacturerMarginConfig.update({
        where: { id: existing.id },
        data: {
          manufacturerName: dto.manufacturerName || existing.manufacturerName,
          marginMode: dto.marginMode,
          marginValue: marginValueDecimal,
          status: dto.status ? dto.status.toUpperCase() : existing.status,
          effectiveFrom: effFrom,
          effectiveTo: effTo,
          updatedBy: user,
        },
      });

      return {
        id: updated.id,
        manufacturerId: updated.manufacturerId,
        manufacturerName: updated.manufacturerName,
        marginMode: updated.marginMode,
        marginValue: Number(updated.marginValue),
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      };
    }

    // Lookup manufacturer in registrations
    let mfgName = dto.manufacturerName || mfgId;
    const isNumeric = /^\d+$/.test(mfgId);
    const mfgInDb = await this.prisma.manufacturerRegistration.findFirst({
      where: {
        OR: [
          ...(isNumeric ? [{ id: BigInt(mfgId) }] : []),
          { registrationCode: { equals: mfgId, mode: 'insensitive' } },
          { companyName: { equals: mfgId, mode: 'insensitive' } },
        ],
      },
    });
    if (mfgInDb) {
      mfgName = mfgInDb.companyName;
    }

    const created = await this.prisma.manufacturerMarginConfig.create({
      data: {
        id: `mm_${mfgId}_${Date.now()}`.substring(0, 50),
        manufacturerId: mfgId,
        manufacturerName: mfgName,
        marginMode: dto.marginMode,
        marginValue: marginValueDecimal,
        status: dto.status ? dto.status.toUpperCase() : 'ACTIVE',
        effectiveFrom: effFrom,
        effectiveTo: effTo,
        createdBy: user,
        updatedBy: user,
      },
    });

    return {
      id: created.id,
      manufacturerId: created.manufacturerId,
      manufacturerName: created.manufacturerName,
      marginMode: created.marginMode,
      marginValue: Number(created.marginValue),
      status: created.status,
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  // =====================================================================
  // PRODUCT / SKU MARGINS
  // =====================================================================

  async listProductMargins(query: MarginQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query.size) || 50));
    const skip = (page - 1) * size;

    const where: Prisma.ProductMarginConfigWhereInput = {};
    if (query.status) {
      where.status = query.status.toUpperCase();
    }
    if (query.manufacturerId) {
      where.manufacturerId = query.manufacturerId;
    }
    if (query.productId) {
      where.productId = query.productId;
    }
    if (query.search) {
      where.OR = [
        { sku: { contains: query.search, mode: 'insensitive' } },
        { productName: { contains: query.search, mode: 'insensitive' } },
        { manufacturerName: { contains: query.search, mode: 'insensitive' } },
        { productId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.productMarginConfig.count({ where }),
      this.prisma.productMarginConfig.findMany({
        where,
        skip,
        take: size,
        orderBy: [{ productName: 'asc' }, { sku: 'asc' }],
      }),
    ]);

    return {
      items: items.map(p => ({
        id: p.id,
        productId: p.productId,
        sku: p.sku,
        productName: p.productName,
        manufacturerId: p.manufacturerId,
        manufacturerName: p.manufacturerName,
        marginMode: p.marginMode,
        marginValue: Number(p.marginValue),
        status: p.status,
        effectiveFrom: p.effectiveFrom?.toISOString() || null,
        effectiveTo: p.effectiveTo?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        createdBy: p.createdBy,
        updatedBy: p.updatedBy,
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async getProductMargin(productId: string, manufacturerId?: string) {
    const where: Prisma.ProductMarginConfigWhereInput = {
      productId,
    };
    if (manufacturerId) {
      where.manufacturerId = manufacturerId;
    }

    const row = await this.prisma.productMarginConfig.findFirst({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    if (!row) return null;

    return {
      id: row.id,
      productId: row.productId,
      sku: row.sku,
      productName: row.productName,
      manufacturerId: row.manufacturerId,
      manufacturerName: row.manufacturerName,
      marginMode: row.marginMode,
      marginValue: Number(row.marginValue),
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy,
    };
  }

  async setProductMargin(
    productId: string,
    manufacturerId: string,
    dto: SetProductMarginDto,
    user = 'Admin',
  ) {
    const mfgId = manufacturerId || dto.manufacturerId;
    if (!mfgId) {
      throw new BadRequestException('manufacturerId is required');
    }

    const marginValueDecimal = new Prisma.Decimal(dto.marginValue);
    const effFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined;
    const effTo = dto.effectiveTo ? new Date(dto.effectiveTo) : undefined;

    // Resolve product & manufacturer names if not supplied
    let pName = dto.productName;
    let skuVal = dto.sku;
    if (!pName || !skuVal) {
      const prodInDb = await this.prisma.catalogProduct.findFirst({
        where: { OR: [{ id: productId }, { productCode: productId }] },
      });
      if (prodInDb) {
        pName = pName || prodInDb.name;
        skuVal = skuVal || prodInDb.productCode;
      }
    }

    let mName = dto.manufacturerName;
    if (!mName) {
      const isNum = /^\d+$/.test(mfgId);
      const mfgInDb = await this.prisma.manufacturerRegistration.findFirst({
        where: {
          OR: [
            ...(isNum ? [{ id: BigInt(mfgId) }] : []),
            { registrationCode: { equals: mfgId, mode: 'insensitive' } },
            { companyName: { equals: mfgId, mode: 'insensitive' } },
          ],
        },
      });
      if (mfgInDb) {
        mName = mfgInDb.companyName;
      }
    }

    const upserted = await this.prisma.productMarginConfig.upsert({
      where: {
        productId_manufacturerId: {
          productId,
          manufacturerId: mfgId,
        },
      },
      update: {
        sku: skuVal,
        productName: pName,
        manufacturerName: mName,
        marginMode: dto.marginMode,
        marginValue: marginValueDecimal,
        status: dto.status ? dto.status.toUpperCase() : 'ACTIVE',
        effectiveFrom: effFrom,
        effectiveTo: effTo,
        updatedBy: user,
      },
      create: {
        id: `pm_${productId}_${mfgId}_${Date.now()}`.substring(0, 50),
        productId,
        sku: skuVal,
        productName: pName,
        manufacturerId: mfgId,
        manufacturerName: mName,
        marginMode: dto.marginMode,
        marginValue: marginValueDecimal,
        status: dto.status ? dto.status.toUpperCase() : 'ACTIVE',
        effectiveFrom: effFrom,
        effectiveTo: effTo,
        createdBy: user,
        updatedBy: user,
      },
    });

    return {
      id: upserted.id,
      productId: upserted.productId,
      sku: upserted.sku,
      productName: upserted.productName,
      manufacturerId: upserted.manufacturerId,
      manufacturerName: upserted.manufacturerName,
      marginMode: upserted.marginMode,
      marginValue: Number(upserted.marginValue),
      status: upserted.status,
      updatedAt: upserted.updatedAt.toISOString(),
    };
  }

  async bulkImportProductMargins(dto: BulkImportProductMarginsDto, user = 'Admin') {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const row of dto.rows) {
      try {
        const mfgId = row.manufacturerId || 'mfg_fg_direct';
        const mode = (row.marginMode || 'PERCENTAGE').toUpperCase();
        await this.setProductMargin(
          row.productId,
          mfgId,
          {
            productId: row.productId,
            manufacturerId: mfgId,
            sku: row.sku,
            productName: row.productName,
            manufacturerName: row.manufacturerName,
            marginMode: mode,
            marginValue: row.marginValue,
            status: 'ACTIVE',
          },
          user,
        );
        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`Row productId ${row.productId}: ${err?.message || 'Failed'}`);
      }
    }

    return {
      totalRows: dto.rows.length,
      successCount,
      failedCount,
      errors,
    };
  }

  // =====================================================================
  // 4-TIER MARGIN RESOLUTION ENGINE
  // =====================================================================

  /**
   * Priority:
   * Tier 1: Product + Manufacturer specific rule (`product_margin_configs`)
   * Tier 2: Manufacturer rule (`manufacturer_margin_configs`)
   * Tier 3: Category rule (`category_margin_configs`)
   * Tier 4: Platform baseline fallback (10% or platform default)
   */
  async calculateApplicableMargin(params: CalculateMarginDto) {
    const basePrice = Math.max(0, Number(params.basePrice) || 0);
    const platformFeeConfig = await this.getPlatformFee();

    let resolvedMarginMode = 'PERCENTAGE';
    let resolvedMarginValue = 10.0;
    let ruleType: 'PRODUCT' | 'MANUFACTURER' | 'CATEGORY' | 'DEFAULT' = 'DEFAULT';
    let ruleSource = 'Default Platform Margin (Fallback): 10%';

    // Tier 1: Product + Manufacturer specific rule
    if (params.productId || params.sku) {
      const productRule = await this.prisma.productMarginConfig.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [
            ...(params.productId ? [{ productId: params.productId }] : []),
            ...(params.sku ? [{ sku: params.sku }] : []),
          ],
          ...(params.manufacturerId ? { manufacturerId: params.manufacturerId } : {}),
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (productRule) {
        resolvedMarginMode = productRule.marginMode;
        resolvedMarginValue = Number(productRule.marginValue);
        ruleType = 'PRODUCT';
        const formatted = resolvedMarginMode === 'FIXED_RATE'
          ? `₹${resolvedMarginValue}/unit`
          : `${resolvedMarginValue}%`;
        ruleSource = `Product / SKU Margin (${productRule.sku || params.sku || 'SKU'} - ${productRule.manufacturerName || params.manufacturerId}): ${formatted}`;
      }
    }

    // Tier 2: Manufacturer-level rule
    if (ruleType === 'DEFAULT' && params.manufacturerId) {
      const mfgRule = await this.prisma.manufacturerMarginConfig.findFirst({
        where: {
          manufacturerId: params.manufacturerId,
          status: 'ACTIVE',
        },
      });

      if (mfgRule) {
        resolvedMarginMode = mfgRule.marginMode;
        resolvedMarginValue = Number(mfgRule.marginValue);
        ruleType = 'MANUFACTURER';
        const formatted = resolvedMarginMode === 'FIXED_RATE'
          ? `₹${resolvedMarginValue}/unit`
          : `${resolvedMarginValue}%`;
        ruleSource = `Manufacturer Margin (${mfgRule.manufacturerName || params.manufacturerId}): ${formatted}`;
      }
    }

    // Tier 3: Category-level rule
    if (ruleType === 'DEFAULT' && (params.categoryId || params.categoryName)) {
      const catRule = await this.prisma.categoryMarginConfig.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [
            ...(params.categoryId ? [{ categoryId: params.categoryId }] : []),
            ...(params.categoryName ? [{ categoryName: { equals: params.categoryName, mode: 'insensitive' as const } }] : []),
          ],
        },
      });

      if (catRule) {
        resolvedMarginMode = catRule.marginMode;
        resolvedMarginValue = Number(catRule.marginValue);
        ruleType = 'CATEGORY';
        const formatted = resolvedMarginMode === 'FIXED_RATE'
          ? `₹${resolvedMarginValue}/unit`
          : `${resolvedMarginValue}%`;
        ruleSource = `Category Benchmark Margin (${catRule.categoryName}): ${formatted}`;
      }
    }

    // Calculate margin amount
    let marginAmount = 0;
    let marginPercentage = 0;
    let marginRate: number | undefined;

    if (resolvedMarginMode === 'FIXED_RATE') {
      marginAmount = resolvedMarginValue;
      marginRate = resolvedMarginValue;
      marginPercentage = basePrice > 0 ? Number(((resolvedMarginValue / basePrice) * 100).toFixed(2)) : 0;
    } else {
      marginPercentage = resolvedMarginValue;
      marginAmount = Number(((basePrice * resolvedMarginValue) / 100).toFixed(2));
    }

    const sellingPrice = Number((basePrice + marginAmount).toFixed(2));

    // Calculate platform fee
    let platformFeeAmount = 0;
    if (platformFeeConfig.status === 'Active') {
      if (platformFeeConfig.feeMode === 'FIXED_RATE') {
        platformFeeAmount = platformFeeConfig.feeValue;
      } else {
        platformFeeAmount = Number(((basePrice * platformFeeConfig.feeValue) / 100).toFixed(2));
      }
    }

    const commercialPrice = Number((sellingPrice + platformFeeAmount).toFixed(2));

    return {
      baseUnitPrice: basePrice,
      marginMode: resolvedMarginMode,
      marginValue: resolvedMarginValue,
      marginPercentage,
      marginRate,
      marginAmount,
      sellingPrice,
      platformFeeAmount,
      platformFeePercent: platformFeeConfig.feeMode === 'PERCENTAGE' ? platformFeeConfig.feeValue : undefined,
      commercialPrice,
      ruleType,
      ruleSource,
    };
  }
}
