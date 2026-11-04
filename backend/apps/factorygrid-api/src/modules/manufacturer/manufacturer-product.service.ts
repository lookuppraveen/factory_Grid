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
  async resolveManufacturer(user: AuthUser) {
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

    if (!reg) {
      throw new ForbiddenException(
        'No manufacturer registration is associated with this account. Please complete facility onboarding first.',
      );
    }

    return reg;
  }

  /**
   * Retrieves summary counts for the authenticated manufacturer
   */
  async getSummary(user: AuthUser) {
    const reg = await this.resolveManufacturer(user);

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
  async listMappedProducts(user: AuthUser, query: ManufacturerProductQueryDto) {
    const reg = await this.resolveManufacturer(user);

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
  async createMapping(user: AuthUser, dto: CreateManufacturerProductDto) {
    const reg = await this.resolveManufacturer(user);

    // 1. Verify that product exists in central catalog
    const product = await this.prisma.catalogProduct.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(
        `Central product with ID "${dto.productId}" not found in master catalogue.`,
      );
    }

    // 2. Prevent duplicate mapping for the same manufacturer and product
    const existing = await this.prisma.manufacturerProduct.findUnique({
      where: {
        registrationId_productId: {
          registrationId: reg.id,
          productId: dto.productId,
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
        productId: dto.productId,
        manufacturerProductCode: dto.manufacturerProductCode?.trim() || null,
        manufacturerPartNumber: dto.manufacturerPartNumber?.trim() || null,
        manufacturerSku: dto.manufacturerSku?.trim() || null,
        moq: dto.moq ?? 1000,
        leadTimeDays: dto.leadTimeDays ?? 14,
        packagingDetails: dto.packagingDetails?.trim() || null,
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
