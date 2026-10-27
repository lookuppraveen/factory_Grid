import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCatalogProductDto,
  ProductQueryDto,
  UpdateCatalogProductDto,
} from './dto/catalog-product.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category-admin.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================================================================
  // PRODUCTS
  // ===================================================================

  async listProducts(query: ProductQueryDto) {
    const where: Prisma.CatalogProductWhereInput = {};

    if (query.activeOnly) {
      where.active = true;
    }

    if (query.lifecycleStatus && query.lifecycleStatus !== 'ALL') {
      where.lifecycleStatus = { equals: query.lifecycleStatus, mode: 'insensitive' };
    }

    if (query.productTypeId && query.productTypeId !== 'ALL') {
      where.productTypeId = query.productTypeId;
    }

    if (query.category && query.category !== 'ALL') {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.subCategory && query.subCategory !== 'ALL') {
      where.subCategory = { equals: query.subCategory, mode: 'insensitive' };
    }

    if (query.subSubCategory && query.subSubCategory !== 'ALL') {
      where.subSubCategory = { equals: query.subSubCategory, mode: 'insensitive' };
    }

    const term = query.search?.trim();
    if (term) {
      where.OR = [
        { productCode: { contains: term, mode: 'insensitive' } },
        { name: { contains: term, mode: 'insensitive' } },
        { shortName: { contains: term, mode: 'insensitive' } },
        { genericName: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { subCategory: { contains: term, mode: 'insensitive' } },
        { subSubCategory: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.catalogProduct.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { productCode: 'asc' }],
    });

    return products.map((p) => this.toProductResponse(p));
  }

  async getProductById(id: string) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: {
        OR: [{ id }, { productCode: id }],
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID or code "${id}" not found.`);
    }

    return this.toProductResponse(product);
  }

  async createProduct(dto: CreateCatalogProductDto) {
    const codeClean = dto.productCode.trim().toUpperCase();

    // Prevent duplicate product code
    const existing = await this.prisma.catalogProduct.findFirst({
      where: { productCode: { equals: codeClean, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException(`Product Code "${codeClean}" already exists. Product Code must be unique across the central master catalog.`);
    }

    // Resolve category details if categoryId is provided or find matching Category record
    let categoryRecord: any = null;
    if (dto.categoryId) {
      categoryRecord = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
    }

    if (!categoryRecord && dto.category) {
      categoryRecord = await this.prisma.category.findFirst({
        where: {
          category: { equals: dto.category.trim(), mode: 'insensitive' },
          ...(dto.subCategory ? { subCategory: { equals: dto.subCategory.trim(), mode: 'insensitive' } } : {}),
          ...(dto.subSubCategory ? { subSubCategory: { equals: dto.subSubCategory.trim(), mode: 'insensitive' } } : {}),
        },
      });
    }

    const targetId = `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveCategory = dto.category?.trim() || categoryRecord?.category || 'Drugs';
    const effectiveSubCategory = dto.subCategory?.trim() || categoryRecord?.subCategory || null;
    const effectiveSubSubCategory = dto.subSubCategory?.trim() || categoryRecord?.subSubCategory || null;
    const effectiveProductTypeId = dto.productTypeId?.trim() || categoryRecord?.productTypeId || 'pt_med';
    const effectiveGenericName = dto.genericName?.trim() || dto.shortName?.trim() || dto.name.trim();
    const effectiveDosageForm = dto.dosageForm?.trim() || effectiveSubCategory || 'Standard Form';

    const lifecycleStatus = dto.lifecycleStatus ? dto.lifecycleStatus.toUpperCase() : 'ACTIVE';
    const active = lifecycleStatus === 'ACTIVE';

    const created = await this.prisma.catalogProduct.create({
      data: {
        id: targetId,
        productCode: codeClean,
        name: dto.name.trim(),
        shortName: dto.shortName?.trim() || null,
        genericName: effectiveGenericName,
        dosageForm: effectiveDosageForm,
        productTypeId: effectiveProductTypeId,
        categoryId: categoryRecord?.id || dto.categoryId || null,
        category: effectiveCategory,
        subCategory: effectiveSubCategory,
        subSubCategory: effectiveSubSubCategory,
        brand: dto.brand?.trim() || null,
        brandId: dto.brandId?.trim() || null,
        description: dto.description?.trim() || null,
        baseUom: dto.baseUom?.trim() || 'Unit',
        packSize: dto.packSize?.trim() || '10 x 10 Strip',
        packUom: dto.packUom?.trim() || 'Strip',
        lifecycleStatus,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
        discontinuedOn: dto.discontinuedOn ? new Date(dto.discontinuedOn) : null,
        replacementProductId: dto.replacementProductId?.trim() || null,
        isSellable: dto.isSellable !== undefined ? dto.isSellable : true,
        attributes: dto.attributes ? (dto.attributes as Prisma.InputJsonValue) : Prisma.DbNull,
        active,
      },
    });

    return this.toProductResponse(created);
  }

  async updateProduct(id: string, dto: UpdateCatalogProductDto) {
    const existing = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id }, { productCode: id }] },
    });

    if (!existing) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }

    if (dto.productCode) {
      const codeClean = dto.productCode.trim().toUpperCase();
      if (codeClean !== existing.productCode.toUpperCase()) {
        const conflict = await this.prisma.catalogProduct.findFirst({
          where: {
            id: { not: existing.id },
            productCode: { equals: codeClean, mode: 'insensitive' },
          },
        });
        if (conflict) {
          throw new ConflictException(`Product Code "${codeClean}" already exists.`);
        }
      }
    }

    const updateData: Prisma.CatalogProductUpdateInput = {};

    if (dto.productCode !== undefined) updateData.productCode = dto.productCode.trim().toUpperCase();
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.shortName !== undefined) updateData.shortName = dto.shortName?.trim() || null;
    if (dto.genericName !== undefined) updateData.genericName = dto.genericName.trim();
    if (dto.dosageForm !== undefined) updateData.dosageForm = dto.dosageForm.trim();
    if (dto.productTypeId !== undefined) updateData.productTypeId = dto.productTypeId?.trim() || null;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId?.trim() || null;
    if (dto.category !== undefined) updateData.category = dto.category.trim();
    if (dto.subCategory !== undefined) updateData.subCategory = dto.subCategory?.trim() || null;
    if (dto.subSubCategory !== undefined) updateData.subSubCategory = dto.subSubCategory?.trim() || null;
    if (dto.brand !== undefined) updateData.brand = dto.brand?.trim() || null;
    if (dto.brandId !== undefined) updateData.brandId = dto.brandId?.trim() || null;
    if (dto.description !== undefined) updateData.description = dto.description?.trim() || null;
    if (dto.baseUom !== undefined) updateData.baseUom = dto.baseUom?.trim() || 'Unit';
    if (dto.packSize !== undefined) updateData.packSize = dto.packSize.trim();
    if (dto.packUom !== undefined) updateData.packUom = dto.packUom?.trim() || 'Strip';
    if (dto.lifecycleStatus !== undefined) {
      const statusUpper = dto.lifecycleStatus.toUpperCase();
      updateData.lifecycleStatus = statusUpper;
      updateData.active = statusUpper === 'ACTIVE';
    }
    if (dto.active !== undefined) {
      updateData.active = dto.active;
      if (!dto.lifecycleStatus) {
        updateData.lifecycleStatus = dto.active ? 'ACTIVE' : 'INACTIVE';
      }
    }
    if (dto.availableFrom !== undefined) {
      updateData.availableFrom = dto.availableFrom ? new Date(dto.availableFrom) : null;
    }
    if (dto.discontinuedOn !== undefined) {
      updateData.discontinuedOn = dto.discontinuedOn ? new Date(dto.discontinuedOn) : null;
    }
    if (dto.replacementProductId !== undefined) {
      updateData.replacementProductId = dto.replacementProductId?.trim() || null;
    }
    if (dto.isSellable !== undefined) updateData.isSellable = dto.isSellable;
    if (dto.attributes !== undefined) {
      updateData.attributes = dto.attributes ? (dto.attributes as Prisma.InputJsonValue) : Prisma.DbNull;
    }

    const updated = await this.prisma.catalogProduct.update({
      where: { id: existing.id },
      data: updateData,
    });

    return this.toProductResponse(updated);
  }

  async toggleProductStatus(id: string) {
    const existing = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id }, { productCode: id }] },
    });

    if (!existing) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }

    const isCurrentlyActive = existing.active && existing.lifecycleStatus === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const newActive = !isCurrentlyActive;

    const updated = await this.prisma.catalogProduct.update({
      where: { id: existing.id },
      data: {
        lifecycleStatus: newStatus,
        active: newActive,
      },
    });

    return this.toProductResponse(updated);
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id }, { productCode: id }] },
      include: {
        manufacturerProducts: { select: { id: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }

    // If already mapped by manufacturers, soft delete to preserve historical integrity
    if (existing.manufacturerProducts && existing.manufacturerProducts.length > 0) {
      await this.prisma.catalogProduct.update({
        where: { id: existing.id },
        data: { active: false, lifecycleStatus: 'INACTIVE' },
      });
      return { success: true, message: `Product "${existing.name}" deactivated (preserved for manufacturer history).`, id: existing.id };
    }

    await this.prisma.catalogProduct.delete({
      where: { id: existing.id },
    });

    return { success: true, message: `Product "${existing.name}" deleted successfully.`, id: existing.id };
  }

  // ===================================================================
  // CATEGORIES
  // ===================================================================

  async listCategories(productTypeId?: string) {
    const where: Prisma.CategoryWhereInput = {};
    if (productTypeId && productTypeId !== 'ALL') {
      where.productTypeId = productTypeId;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ productTypeId: 'asc' }, { category: 'asc' }, { displayOrder: 'asc' }],
    });

    const treeMap = new Map<string, {
      category: string;
      productTypeId: string;
      subCategories: Map<string, {
        subCategory: string;
        items: Array<{
          id: string;
          categoryId: string;
          categoryCode: string;
          subSubCategory: string | null;
          name: string;
          description: string | null;
          lifecycleStatus: string;
        }>;
      }>;
    }>();

    for (const cat of categories) {
      const catName = cat.category.trim();
      if (!treeMap.has(catName)) {
        treeMap.set(catName, {
          category: catName,
          productTypeId: cat.productTypeId,
          subCategories: new Map(),
        });
      }
      const catNode = treeMap.get(catName)!;
      const subName = (cat.subCategory || 'General').trim();
      if (!catNode.subCategories.has(subName)) {
        catNode.subCategories.set(subName, {
          subCategory: subName,
          items: [],
        });
      }
      catNode.subCategories.get(subName)!.items.push({
        id: cat.id,
        categoryId: cat.categoryId,
        categoryCode: cat.categoryCode,
        subSubCategory: cat.subSubCategory || null,
        name: cat.subSubCategory || cat.subCategory || cat.category,
        description: cat.description,
        lifecycleStatus: cat.lifecycleStatus,
      });
    }

    const tree = Array.from(treeMap.values()).map((cat) => ({
      category: cat.category,
      productTypeId: cat.productTypeId,
      subCategories: Array.from(cat.subCategories.values()).map((sub) => ({
        subCategory: sub.subCategory,
        items: sub.items,
      })),
    }));

    return {
      categories: categories.map((c) => ({
        id: c.id,
        category_id: c.categoryId,
        categoryId: c.categoryId,
        product_type_id: c.productTypeId,
        productTypeId: c.productTypeId,
        category: c.category,
        sub_category: c.subCategory,
        subCategory: c.subCategory,
        sub_sub_category: c.subSubCategory,
        subSubCategory: c.subSubCategory,
        category_code: c.categoryCode,
        categoryCode: c.categoryCode,
        description: c.description,
        lifecycle_status: c.lifecycleStatus,
        lifecycleStatus: c.lifecycleStatus,
        status: c.lifecycleStatus === 'ACTIVE' ? 'Active' : 'Inactive',
        display_order: c.displayOrder,
        displayOrder: c.displayOrder,
        name: c.subSubCategory || c.subCategory || c.category,
        fullName: [c.category, c.subCategory, c.subSubCategory].filter(Boolean).join(' → '),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      tree,
    };
  }

  async createCategory(dto: CreateCategoryDto) {
    const codeClean = dto.categoryCode.trim().toUpperCase();

    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [
          { categoryCode: { equals: codeClean, mode: 'insensitive' } },
          ...(dto.id ? [{ id: dto.id }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException(`Category Code "${codeClean}" already exists.`);
    }

    const id = dto.id?.trim() || `CAT${Date.now().toString().slice(-6)}`;
    const categoryId = id;
    const lifecycleStatus = dto.lifecycleStatus ? dto.lifecycleStatus.toUpperCase() : 'ACTIVE';

    const created = await this.prisma.category.create({
      data: {
        id,
        categoryId,
        productTypeId: dto.productTypeId?.trim() || 'pt_med',
        category: dto.category.trim(),
        subCategory: dto.subCategory?.trim() || null,
        subSubCategory: dto.subSubCategory?.trim() || null,
        categoryCode: codeClean,
        description: dto.description?.trim() || null,
        lifecycleStatus,
        displayOrder: dto.displayOrder || 1,
      },
    });

    // Also guarantee foreign key integrity for manufacturer capabilities in catalog_products
    await this.prisma.catalogProduct.upsert({
      where: { id },
      update: {
        category: created.category,
        subCategory: created.subCategory,
        subSubCategory: created.subSubCategory,
        productTypeId: created.productTypeId,
        categoryId: created.id,
        lifecycleStatus: created.lifecycleStatus,
        active: created.lifecycleStatus === 'ACTIVE',
      },
      create: {
        id,
        productCode: codeClean,
        name: created.subSubCategory || created.subCategory || created.category,
        genericName: [created.category, created.subCategory].filter(Boolean).join(' - ') || 'Manufacturing Capability',
        dosageForm: created.subCategory || 'Standard',
        category: created.category,
        subCategory: created.subCategory,
        subSubCategory: created.subSubCategory,
        productTypeId: created.productTypeId,
        categoryId: created.id,
        packSize: 'Standard Batch',
        lifecycleStatus: created.lifecycleStatus,
        active: created.lifecycleStatus === 'ACTIVE',
      },
    });

    return created;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }

    if (dto.categoryCode) {
      const codeClean = dto.categoryCode.trim().toUpperCase();
      if (codeClean !== existing.categoryCode.toUpperCase()) {
        const conflict = await this.prisma.category.findFirst({
          where: { id: { not: existing.id }, categoryCode: { equals: codeClean, mode: 'insensitive' } },
        });
        if (conflict) {
          throw new ConflictException(`Category Code "${codeClean}" already exists.`);
        }
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        productTypeId: dto.productTypeId !== undefined ? (dto.productTypeId?.trim() || 'pt_med') : undefined,
        category: dto.category !== undefined ? dto.category.trim() : undefined,
        subCategory: dto.subCategory !== undefined ? (dto.subCategory?.trim() || null) : undefined,
        subSubCategory: dto.subSubCategory !== undefined ? (dto.subSubCategory?.trim() || null) : undefined,
        categoryCode: dto.categoryCode !== undefined ? dto.categoryCode.trim().toUpperCase() : undefined,
        description: dto.description !== undefined ? (dto.description?.trim() || null) : undefined,
        lifecycleStatus: dto.lifecycleStatus !== undefined ? dto.lifecycleStatus.toUpperCase() : undefined,
        displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : undefined,
      },
    });

    // Sync to catalog_products if exists
    await this.prisma.catalogProduct.updateMany({
      where: { id },
      data: {
        category: updated.category,
        subCategory: updated.subCategory,
        subSubCategory: updated.subSubCategory,
        lifecycleStatus: updated.lifecycleStatus,
        active: updated.lifecycleStatus === 'ACTIVE',
      },
    });

    return updated;
  }

  async toggleCategoryStatus(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }

    const newStatus = existing.lifecycleStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await this.prisma.category.update({
      where: { id },
      data: { lifecycleStatus: newStatus },
    });

    await this.prisma.catalogProduct.updateMany({
      where: { id },
      data: {
        lifecycleStatus: newStatus,
        active: newStatus === 'ACTIVE',
      },
    });

    return updated;
  }

  // ===================================================================
  // HELPER MAPPERS
  // ===================================================================

  private toProductResponse(p: any) {
    const nowIso = new Date().toISOString().split('T')[0];
    const availableFromStr = p.availableFrom ? p.availableFrom.toISOString().split('T')[0] : nowIso;
    const discontinuedOnStr = p.discontinuedOn ? p.discontinuedOn.toISOString().split('T')[0] : null;

    return {
      // Backend canonical database schema
      id: p.id,
      productCode: p.productCode,
      name: p.name,
      shortName: p.shortName || p.name,
      genericName: p.genericName || p.name,
      dosageForm: p.dosageForm || 'Standard',
      productTypeId: p.productTypeId || 'pt_med',
      categoryId: p.categoryId,
      category: p.category,
      subCategory: p.subCategory,
      subSubCategory: p.subSubCategory,
      brand: p.brand,
      brandId: p.brandId,
      description: p.description,
      baseUom: p.baseUom || 'Unit',
      packSize: p.packSize || '10 x 10 Strip',
      packUom: p.packUom || 'Strip',
      lifecycleStatus: p.lifecycleStatus || (p.active ? 'ACTIVE' : 'INACTIVE'),
      availableFrom: availableFromStr,
      discontinuedOn: discontinuedOnStr,
      replacementProductId: p.replacementProductId,
      isSellable: p.isSellable !== undefined ? p.isSellable : true,
      attributes: p.attributes || {},
      active: p.active,
      createdAt: p.createdAt ? p.createdAt.toISOString() : nowIso,
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : nowIso,

      // Frontend UI backward-compatibility aliases
      product_id: p.id,
      product_code: p.productCode,
      product_name: p.name,
      product_short_name: p.shortName || p.name,
      product_description: p.description,
      product_type_id: p.productTypeId || 'pt_med',
      category_id: p.categoryId,
      sub_category: p.subCategory,
      sub_sub_category: p.subSubCategory,
      brand_id: p.brandId,
      base_uom: p.baseUom || 'Unit',
      pack_size: p.packSize || '10 x 10 Strip',
      pack_uom: p.packUom || 'Strip',
      lifecycle_status: p.lifecycleStatus || (p.active ? 'ACTIVE' : 'INACTIVE'),
      available_from: availableFromStr,
      discontinued_on: discontinuedOnStr,
      replacement_product_id: p.replacementProductId,
      is_sellable: p.isSellable !== undefined ? p.isSellable : true,
      code: p.productCode,
      uom: p.baseUom || 'Unit',
      status: (p.lifecycleStatus === 'INACTIVE' || p.lifecycleStatus === 'DISCONTINUED' || !p.active) ? 'Inactive' : 'Active',
      brandNames: p.brand ? [p.brand] : [],
    };
  }
}
