import {
  BrandQueryDto,
  CreateBrandDto,
  UpdateBrandDto,
  CreateAdminManufacturerDto,
  UpdateAdminManufacturerDto,
  ManufacturerQueryDto,
  CreateProductManufacturerMappingDto,
  UpdateProductManufacturerMappingDto,
  ProductManufacturerMappingQueryDto,
} from './dto/brand-mfg-mapping.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AttributeDataType,
  AttributeMasterQueryDto,
  CategoryAttributeItemDto,
  CreateAttributeMasterDto,
  CreateProductPriceDto,
  MapProductManufacturerDto,
  UpdateAttributeMasterDto,
} from './dto/attribute-master.dto';
import {
  CreateCatalogProductDto,
  ProductBulkUploadDto,
  ProductBulkUploadItemDto,
  ProductQueryDto,
  UpdateCatalogProductDto,
} from './dto/catalog-product.dto';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto/category-admin.dto';
import {
  CreateCustomerSegmentDto,
  CreatePriceDto,
  CreateProductTaxDto,
  CreateProductUomDto,
  ProductPriceQueryDto,
  ProductTaxQueryDto,
  ProductUomQueryDto,
  UpdateCustomerSegmentDto,
  UpdatePriceDto,
  UpdateProductTaxDto,
  UpdateProductUomDto,
} from './dto/pricing-tax-uom.dto';
import {
  BulkProductTypeAttributesDto,
  CreateProductTypeDto,
  ProductTypeAttributeInputDto,
  ProductTypeAttributeItemDto,
  ProductTypeQueryDto,
  UpdateProductTypeAttributeDto,
  UpdateProductTypeDto,
} from './dto/product-type.dto';
import { getPaginationParams } from '../../common/pagination/pageable.dto';
import { createPageResponse } from '../../common/pagination/page-response.dto';

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

    if (query.dosageForm && query.dosageForm !== 'ALL') {
      where.dosageForm = { equals: query.dosageForm, mode: 'insensitive' };
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

    const totalElements = await this.prisma.catalogProduct.count({ where });

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      created_at: 'createdAt',
      updatedAt: 'updatedAt',
      updated_at: 'updatedAt',
      id: 'id',
      productCode: 'productCode',
      product_code: 'productCode',
      name: 'name',
      genericName: 'genericName',
      generic_name: 'genericName',
      category: 'category',
    };

    const isPaginated = query.page !== undefined || query.size !== undefined || query.limit !== undefined;
    const { skip, take, pageIndex, pageSize, orderBy } = getPaginationParams(
      query,
      allowedSortFields,
      'createdAt',
      'desc'
    );

    const products = await this.prisma.catalogProduct.findMany({
      where,
      include: {
        manufacturerProducts: {
          include: {
            registration: true,
          },
        },
        productAttributes: {
          include: {
            attribute: true,
          },
        },
        productPrices: true,
        productTaxes: true,
        productUoms: true,
      },
      orderBy: orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }, { productCode: 'asc' }],
      ...(isPaginated ? { skip, take } : {}),
    });

    const mappedProducts = products.map((p) => this.toProductResponse(p));

    return createPageResponse(
      mappedProducts,
      totalElements,
      pageIndex,
      isPaginated ? pageSize : totalElements || 1,
      {
        products: mappedProducts,
      }
    );
  }

  async getProductById(id: string) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: {
        OR: [{ id }, { productCode: id }],
      },
      include: {
        manufacturerProducts: {
          include: {
            registration: true,
          },
        },
        productAttributes: {
          include: {
            attribute: true,
          },
        },
        productPrices: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID or code "${id}" not found.`);
    }

    return this.toProductResponse(product);
  }

  async createProduct(dto: CreateCatalogProductDto) {
    const rawCode = dto.productCode || dto.product_code;
    if (!rawCode || !rawCode.trim()) {
      throw new BadRequestException('Product Code is required.');
    }
    const codeClean = rawCode.trim().toUpperCase();

    // Prevent duplicate product code
    const existing = await this.prisma.catalogProduct.findFirst({
      where: { productCode: { equals: codeClean, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException(`Product Code "${codeClean}" already exists. Product Code must be unique across the central master catalog.`);
    }

    // Resolve category details if categoryId is provided or find matching Category record
    const catId = dto.categoryId || dto.category_id;
    let categoryRecord: any = null;
    if (catId) {
      categoryRecord = await this.prisma.category.findFirst({
        where: { OR: [{ id: catId }, { categoryId: catId }] },
      });
    }

    const subCat = dto.subCategory || dto.sub_category;
    const subSubCat = dto.subSubCategory || dto.sub_sub_category;
    if (!categoryRecord && dto.category) {
      categoryRecord = await this.prisma.category.findFirst({
        where: {
          category: { equals: dto.category.trim(), mode: 'insensitive' },
          ...(subCat ? { subCategory: { equals: subCat.trim(), mode: 'insensitive' } } : {}),
          ...(subSubCat ? { subSubCategory: { equals: subSubCat.trim(), mode: 'insensitive' } } : {}),
        },
      });
    }

    const targetId = dto.id?.trim() || dto.productId?.trim() || `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveCategory = dto.category?.trim() || categoryRecord?.category || 'Drugs';
    const effectiveSubCategory = subCat?.trim() || categoryRecord?.subCategory || null;
    const effectiveSubSubCategory = subSubCat?.trim() || categoryRecord?.subSubCategory || null;
    const effectiveProductTypeId = dto.productTypeId?.trim() || dto.product_type_id?.trim() || categoryRecord?.productTypeId || 'pt_med';
    const effectiveGenericName = dto.genericName?.trim() || dto.generic_name?.trim() || dto.shortName?.trim() || dto.short_name?.trim() || dto.name.trim();
    const effectiveDosageForm = dto.dosageForm?.trim() || dto.dosage_form?.trim() || effectiveSubCategory || 'Standard Form';

    const rawLifecycle = dto.lifecycleStatus || dto.lifecycle_status;
    const lifecycleStatus = rawLifecycle ? rawLifecycle.toUpperCase() : 'ACTIVE';
    const active = lifecycleStatus === 'ACTIVE';

    const effectiveBaseUom = dto.baseUom?.trim() || dto.base_uom?.trim() || 'Unit';
    const effectivePackSize = dto.packSize?.trim() || dto.pack_size?.trim() || '10 x 10 Strip';
    const effectivePackUom = dto.packUom?.trim() || dto.pack_uom?.trim() || 'Strip';
    const effectiveAvailFrom = dto.availableFrom || dto.available_from;
    const effectiveDiscOn = dto.discontinuedOn || dto.discontinued_on;
    const effectiveReplId = dto.replacementProductId?.trim() || dto.replacement_product_id?.trim() || null;
    const effectiveIsSellable = dto.isSellable !== undefined ? dto.isSellable : (dto.is_sellable !== undefined ? dto.is_sellable : true);

    // Validate required attributes configured for this product type
    const requiredAttributes = await this.prisma.productTypeAttribute.findMany({
      where: {
        productTypeId: effectiveProductTypeId,
        isRequired: true,
        lifecycleStatus: 'ACTIVE',
      },
      include: { attribute: true, productType: true },
    });

    if (requiredAttributes.length > 0) {
      const incomingAttrs = dto.attributes || {};
      const incomingKeys = new Set<string>();

      if (Array.isArray(incomingAttrs)) {
        for (const item of incomingAttrs) {
          const k = item.attribute_id || item.attributeId || item.id || item.code || item.attribute_code || item.name;
          const v = item.attribute_value !== undefined ? item.attribute_value : (item.value !== undefined ? item.value : item.attributeValue);
          if (k && v !== undefined && v !== null && String(v).trim() !== '') {
            incomingKeys.add(String(k).toLowerCase());
          }
        }
      } else if (typeof incomingAttrs === 'object') {
        for (const [k, v] of Object.entries(incomingAttrs)) {
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            incomingKeys.add(k.toLowerCase());
          }
        }
      }

      for (const req of requiredAttributes) {
        const attrIdLower = req.attributeId.toLowerCase();
        const attrCodeLower = req.attribute.attributeCode.toLowerCase();
        const attrNameLower = req.attribute.attributeName.toLowerCase();
        const hasValue = incomingKeys.has(attrIdLower) || incomingKeys.has(attrCodeLower) || incomingKeys.has(attrNameLower);
        if (!hasValue) {
          throw new BadRequestException(
            `Attribute "${req.attribute.attributeName}" is required for Product Type "${req.productType.productTypeName}".`,
          );
        }
      }
    }

    const created = await this.prisma.catalogProduct.create({
      data: {
        id: targetId,
        productCode: codeClean,
        name: dto.name.trim(),
        shortName: dto.shortName?.trim() || dto.short_name?.trim() || null,
        genericName: effectiveGenericName,
        dosageForm: effectiveDosageForm,
        productTypeId: effectiveProductTypeId,
        categoryId: categoryRecord?.id || catId || null,
        category: effectiveCategory,
        subCategory: effectiveSubCategory,
        subSubCategory: effectiveSubSubCategory,
        brand: dto.brand?.trim() || null,
        brandId: dto.brandId?.trim() || dto.brand_id?.trim() || null,
        description: dto.description?.trim() || null,
        baseUom: effectiveBaseUom,
        packSize: effectivePackSize,
        packUom: effectivePackUom,
        lifecycleStatus,
        availableFrom: effectiveAvailFrom ? new Date(effectiveAvailFrom) : null,
        discontinuedOn: effectiveDiscOn ? new Date(effectiveDiscOn) : null,
        replacementProductId: effectiveReplId,
        isSellable: effectiveIsSellable,
        attributes: dto.attributes ? (dto.attributes as Prisma.InputJsonValue) : Prisma.DbNull,
        active,
      },
    });

    // Synchronize dynamic attributes in product_attributes table
    if (dto.attributes) {
      await this.syncProductAttributes(created.id, dto.attributes);
    }

    return this.getProductById(created.id);
  }
  async bulkUploadProducts(dto: ProductBulkUploadDto) {
    const rows = dto.rows || [];
    const totalRows = rows.length;
    let successfulRows = 0;
    let failedRows = 0;
    let duplicateRows = 0;
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const createdProducts: Array<any> = [];

    const existingProducts = await this.prisma.catalogProduct.findMany({
      select: { productCode: true },
    });
    const existingCodeSet = new Set(
      existingProducts.map((p) => p.productCode.toUpperCase()),
    );
    const seenCodesInBatch = new Set<string>();

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

      let codeClean = row.productCode?.trim().toUpperCase();
      if (!codeClean) {
        codeClean = `PRD${Date.now()}${String(i + 1).padStart(3, '0')}`;
      }

      if (seenCodesInBatch.has(codeClean)) {
        errors.push({
          row: rowNum,
          field: 'productCode',
          message: `Duplicate Product Code "${codeClean}" in uploaded batch.`,
        });
        hasError = true;
        duplicateRows++;
      } else if (existingCodeSet.has(codeClean)) {
        errors.push({
          row: rowNum,
          field: 'productCode',
          message: `Product Code "${codeClean}" already exists in Master Catalog.`,
        });
        hasError = true;
        duplicateRows++;
      }

      if (hasError) {
        failedRows++;
        continue;
      }

      seenCodesInBatch.add(codeClean);
      existingCodeSet.add(codeClean);

      try {
        const targetId = `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const effectiveSubCategory = row.subCategory?.trim() || null;
        const effectiveSubSubCategory = row.subSubCategory?.trim() || null;
        const effectiveProductTypeId = row.productTypeId?.trim() || 'pt_med';
        const effectiveGenericName = row.genericName?.trim() || row.name!.trim();
        const effectiveDosageForm = row.dosageForm?.trim() || effectiveSubCategory || 'Standard Form';
        const effectiveBaseUom = row.baseUom?.trim() || 'Unit';
        const effectivePackSize = row.packSize?.trim() || '10 x 10 Strip';
        const effectivePackUom = 'Strip';

        const created = await this.prisma.catalogProduct.create({
          data: {
            id: targetId,
            productCode: codeClean,
            name: row.name!.trim(),
            genericName: effectiveGenericName,
            dosageForm: effectiveDosageForm,
            productTypeId: effectiveProductTypeId,
            category: row.category!.trim(),
            subCategory: effectiveSubCategory,
            subSubCategory: effectiveSubSubCategory,
            brand: row.brand?.trim() || null,
            description: row.description?.trim() || null,
            baseUom: effectiveBaseUom,
            packSize: effectivePackSize,
            packUom: effectivePackUom,
            lifecycleStatus: 'ACTIVE',
            isSellable: true,
            active: true,
          },
        });

        successfulRows++;
        createdProducts.push({
          id: created.id,
          productCode: created.productCode,
          name: created.name,
          category: created.category,
        });
      } catch (err: any) {
        failedRows++;
        errors.push({
          row: rowNum,
          field: 'general',
          message: err?.message || 'Database insert error.',
        });
      }
    }

    return {
      totalRows,
      successfulRows,
      failedRows,
      duplicateRows,
      errors,
      createdProducts,
    };
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

    await this.prisma.catalogProduct.update({
      where: { id: existing.id },
      data: updateData,
    });

    if (dto.attributes !== undefined) {
      await this.syncProductAttributes(existing.id, dto.attributes);
    }

    return this.getProductById(existing.id);
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
  // PRODUCT DYNAMIC ATTRIBUTES (PRODUCT_ATTRIBUTE)
  // ===================================================================

  async getProductAttributes(productId: string) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: productId }, { productCode: productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found.`);
    }

    const items = await this.prisma.productAttribute.findMany({
      where: { productId: product.id },
      include: { attribute: true },
      orderBy: [{ id: 'asc' }],
    });

    return items.map((pa) => ({
      id: String(pa.id),
      product_id: pa.productId,
      productId: pa.productId,
      attribute_id: pa.attributeId,
      attributeId: pa.attributeId,
      attribute_code: pa.attribute.attributeCode,
      attributeCode: pa.attribute.attributeCode,
      attribute_name: pa.attribute.attributeName,
      attributeName: pa.attribute.attributeName,
      data_type: pa.attribute.dataType,
      dataType: pa.attribute.dataType,
      unit_of_measure: pa.attribute.unitOfMeasure,
      unitOfMeasure: pa.attribute.unitOfMeasure,
      allowed_values: pa.attribute.allowedValues,
      allowedValues: pa.attribute.allowedValues,
      attribute_value: pa.attributeValue,
      attributeValue: pa.attributeValue,
      value: pa.attributeValue,
    }));
  }

  async syncProductAttributes(productId: string, attributesInput: any) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: productId }, { productCode: productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found.`);
    }

    // Fetch all master attributes for flexible lookup
    const allMasters = await this.prisma.attributeMaster.findMany();
    const masterMap = new Map<string, any>();
    for (const m of allMasters) {
      masterMap.set(m.id.toLowerCase(), m);
      masterMap.set(m.attributeCode.toLowerCase(), m);
      masterMap.set(m.attributeName.toLowerCase(), m);
    }

    const normalizedPairs: Array<{ attributeId: string; value: string }> = [];

    if (Array.isArray(attributesInput)) {
      for (const item of attributesInput) {
        const key = item.attribute_id || item.attributeId || item.id || item.code || item.name;
        const val = item.attribute_value !== undefined ? item.attribute_value : (item.value !== undefined ? item.value : item.attributeValue);
        if (key && val !== undefined && val !== null && String(val).trim() !== '') {
          const matched = masterMap.get(String(key).toLowerCase().trim());
          if (matched) {
            normalizedPairs.push({ attributeId: matched.id, value: String(val).trim() });
          }
        }
      }
    } else if (attributesInput && typeof attributesInput === 'object') {
      for (const [key, rawVal] of Object.entries(attributesInput)) {
        if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
          const matched = masterMap.get(key.toLowerCase().trim());
          if (matched) {
            normalizedPairs.push({ attributeId: matched.id, value: String(rawVal).trim() });
          }
        }
      }
    }

    // Upsert into product_attributes
    for (const pair of normalizedPairs) {
      await this.prisma.productAttribute.upsert({
        where: {
          productId_attributeId: {
            productId: product.id,
            attributeId: pair.attributeId,
          },
        },
        update: {
          attributeValue: pair.value,
          updatedAt: new Date(),
        },
        create: {
          productId: product.id,
          attributeId: pair.attributeId,
          attributeValue: pair.value,
        },
      });
    }

    return this.getProductAttributes(product.id);
  }

    // ===================================================================
  // PRODUCT PRICES (PRODUCT_PRICE)
  // ===================================================================

  private mapPriceRecord(pr: any) {
    return {
      id: String(pr.id),
      price_id: String(pr.id),
      product_price_id: String(pr.id),
      productPriceId: String(pr.id),
      productId: pr.productId,
      product_id: pr.productId,
      productName: pr.product?.name || null,
      productCode: pr.product?.productCode || null,
      productManufacturerId: pr.productManufacturerId ? String(pr.productManufacturerId) : null,
      product_manufacturer_id: pr.productManufacturerId ? String(pr.productManufacturerId) : null,
      manufacturerName: pr.manufacturerProduct?.registration?.companyName || null,
      customerSegmentId: pr.customerSegmentId || null,
      customer_segment_id: pr.customerSegmentId || null,
      customerSegmentName: pr.customerSegment?.segmentName || null,
      priceType: pr.priceType || 'BASE',
      price_type: pr.priceType || 'BASE',
      currency: pr.currency || 'INR',
      unitPrice: Number(pr.unitPrice),
      unit_price: Number(pr.unitPrice),
      minQuantity: pr.minQuantity ?? 1,
      min_quantity: pr.minQuantity ?? 1,
      minimum_quantity: pr.minQuantity ?? 1,
      maxQuantity: pr.maxQuantity ?? null,
      max_quantity: pr.maxQuantity ?? null,
      maximum_quantity: pr.maxQuantity ?? null,
      effectiveFrom: pr.effectiveFrom ? pr.effectiveFrom.toISOString().split('T')[0] : null,
      effective_from: pr.effectiveFrom ? pr.effectiveFrom.toISOString().split('T')[0] : null,
      effectiveTo: pr.effectiveTo ? pr.effectiveTo.toISOString().split('T')[0] : null,
      effective_to: pr.effectiveTo ? pr.effectiveTo.toISOString().split('T')[0] : null,
      priceStatus: pr.priceStatus || 'ACTIVE',
      price_status: pr.priceStatus || 'ACTIVE',
      createdAt: pr.createdAt.toISOString(),
      created_at: pr.createdAt.toISOString(),
      updatedAt: pr.updatedAt.toISOString(),
      updated_at: pr.updatedAt.toISOString(),
    };
  }

  async listAllProductPrices(query?: ProductPriceQueryDto) {
    const where: Prisma.ProductPriceWhereInput = {};

    if (query?.productId) {
      where.OR = [
        { productId: query.productId },
        { product: { productCode: query.productId } },
      ];
    }

    if (query?.manufacturerId) {
      const mId = Number(query.manufacturerId);
      if (!isNaN(mId)) {
        where.productManufacturerId = BigInt(mId);
      }
    }

    if (query?.customerSegmentId && query.customerSegmentId !== 'ALL') {
      where.customerSegmentId = query.customerSegmentId;
    }

    if (query?.status && query.status !== 'ALL') {
      where.priceStatus = query.status.toUpperCase();
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { product: { name: { contains: q, mode: 'insensitive' } } },
        { product: { productCode: { contains: q, mode: 'insensitive' } } },
        { priceType: { contains: q, mode: 'insensitive' } },
        { currency: { contains: q, mode: 'insensitive' } },
      ];
    }

    const isPaginated = (query as any)?.page !== undefined || (query as any)?.size !== undefined || (query as any)?.limit !== undefined;
    const { pageIndex, pageSize, skip, take } = getPaginationParams(query as any);

    const [totalElements, prices] = await Promise.all([
      this.prisma.productPrice.count({ where }),
      this.prisma.productPrice.findMany({
        where,
        include: {
          product: true,
          manufacturerProduct: {
            include: { registration: true },
          },
          customerSegment: true,
        },
        orderBy: [{ minQuantity: 'asc' }, { id: 'desc' }],
        ...(isPaginated ? { skip, take } : {}),
      }),
    ]);

    const mapped = prices.map((pr) => this.mapPriceRecord(pr));
    return createPageResponse(mapped, totalElements, pageIndex, isPaginated ? pageSize : totalElements || 1);
  }

  async listProductPrices(productId: string) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: productId }, { productCode: productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found.`);
    }

    const prices = await this.prisma.productPrice.findMany({
      where: { productId: product.id },
      include: {
        product: true,
        manufacturerProduct: {
          include: { registration: true },
        },
        customerSegment: true,
      },
      orderBy: [{ minQuantity: 'asc' }, { id: 'asc' }],
    });

    return prices.map((pr) => this.mapPriceRecord(pr));
  }

  async getProductPriceById(id: string) {
    const price = await this.prisma.productPrice.findUnique({
      where: { id: BigInt(id) },
      include: {
        product: true,
        manufacturerProduct: {
          include: { registration: true },
        },
        customerSegment: true,
      },
    });
    if (!price) {
      throw new NotFoundException(`Product price record "${id}" not found.`);
    }
    return this.mapPriceRecord(price);
  }

  async createProductPrice(dto: CreatePriceDto | CreateProductPriceDto) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: dto.productId }, { productCode: dto.productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${dto.productId}" not found.`);
    }

    if (dto.unitPrice <= 0) {
      throw new BadRequestException('Unit price must be greater than zero.');
    }

    const created = await this.prisma.productPrice.create({
      data: {
        productId: product.id,
        productManufacturerId: dto.productManufacturerId ? BigInt(dto.productManufacturerId) : null,
        customerSegmentId: dto.customerSegmentId || null,
        priceType: dto.priceType || 'BASE',
        currency: dto.currency || 'INR',
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        minQuantity: dto.minQuantity || 1,
        maxQuantity: dto.maxQuantity || null,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        priceStatus: (dto.priceStatus || 'ACTIVE').toUpperCase(),
      },
      include: {
        product: true,
        manufacturerProduct: {
          include: { registration: true },
        },
        customerSegment: true,
      },
    });

    return this.mapPriceRecord(created);
  }

  async updateProductPrice(id: string, dto: UpdatePriceDto) {
    const existing = await this.prisma.productPrice.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Product price "${id}" not found.`);
    }

    if (dto.unitPrice !== undefined && dto.unitPrice <= 0) {
      throw new BadRequestException('Unit price must be greater than zero.');
    }

    const updated = await this.prisma.productPrice.update({
      where: { id: BigInt(id) },
      data: {
        productManufacturerId: dto.productManufacturerId !== undefined
          ? (dto.productManufacturerId ? BigInt(dto.productManufacturerId) : null)
          : undefined,
        customerSegmentId: dto.customerSegmentId !== undefined ? (dto.customerSegmentId || null) : undefined,
        priceType: dto.priceType !== undefined ? dto.priceType : undefined,
        currency: dto.currency !== undefined ? dto.currency : undefined,
        unitPrice: dto.unitPrice !== undefined ? new Prisma.Decimal(dto.unitPrice) : undefined,
        minQuantity: dto.minQuantity !== undefined ? dto.minQuantity : undefined,
        maxQuantity: dto.maxQuantity !== undefined ? (dto.maxQuantity || null) : undefined,
        effectiveFrom: dto.effectiveFrom !== undefined ? (dto.effectiveFrom ? new Date(dto.effectiveFrom) : null) : undefined,
        effectiveTo: dto.effectiveTo !== undefined ? (dto.effectiveTo ? new Date(dto.effectiveTo) : null) : undefined,
        priceStatus: dto.priceStatus ? dto.priceStatus.toUpperCase() : undefined,
      },
      include: {
        product: true,
        manufacturerProduct: {
          include: { registration: true },
        },
        customerSegment: true,
      },
    });

    return this.mapPriceRecord(updated);
  }

  async toggleProductPriceStatus(id: string) {
    const existing = await this.prisma.productPrice.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Product price "${id}" not found.`);
    }

    const nextStatus = existing.priceStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await this.prisma.productPrice.update({
      where: { id: BigInt(id) },
      data: { priceStatus: nextStatus },
      include: {
        product: true,
        manufacturerProduct: {
          include: { registration: true },
        },
        customerSegment: true,
      },
    });

    return this.mapPriceRecord(updated);
  }

  async deleteProductPrice(id: string) {
    const existing = await this.prisma.productPrice.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Product price "${id}" not found.`);
    }

    await this.prisma.productPrice.delete({
      where: { id: BigInt(id) },
    });

    return { success: true, message: `Product price "${id}" deleted successfully.` };
  }

  // ===================================================================
  // PRODUCT TAXES (PRODUCT_TAX)
  // ===================================================================

  private mapTaxRecord(tax: any) {
    return {
      id: String(tax.id),
      tax_id: String(tax.id),
      product_tax_id: String(tax.id),
      productTaxId: String(tax.id),
      productId: tax.productId,
      product_id: tax.productId,
      productName: tax.product?.name || null,
      productCode: tax.product?.productCode || null,
      taxCode: tax.taxCode,
      tax_code: tax.taxCode,
      taxRate: Number(tax.taxRate),
      tax_rate: Number(tax.taxRate),
      effectiveFrom: tax.effectiveFrom ? tax.effectiveFrom.toISOString().split('T')[0] : null,
      effective_from: tax.effectiveFrom ? tax.effectiveFrom.toISOString().split('T')[0] : null,
      effectiveTo: tax.effectiveTo ? tax.effectiveTo.toISOString().split('T')[0] : null,
      effective_to: tax.effectiveTo ? tax.effectiveTo.toISOString().split('T')[0] : null,
      status: tax.status || 'ACTIVE',
      createdAt: tax.createdAt.toISOString(),
      created_at: tax.createdAt.toISOString(),
      updatedAt: tax.updatedAt.toISOString(),
      updated_at: tax.updatedAt.toISOString(),
    };
  }

  async listAllProductTaxes(query?: ProductTaxQueryDto) {
    const where: Prisma.ProductTaxWhereInput = {};

    if (query?.productId) {
      where.OR = [
        { productId: query.productId },
        { product: { productCode: query.productId } },
      ];
    }

    if (query?.status && query.status !== 'ALL') {
      where.status = query.status.toUpperCase();
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { taxCode: { contains: q, mode: 'insensitive' } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
        { product: { productCode: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const isPaginated = (query as any)?.page !== undefined || (query as any)?.size !== undefined || (query as any)?.limit !== undefined;
    const { pageIndex, pageSize, skip, take } = getPaginationParams(query as any);

    const [totalElements, taxes] = await Promise.all([
      this.prisma.productTax.count({ where }),
      this.prisma.productTax.findMany({
        where,
        include: { product: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...(isPaginated ? { skip, take } : {}),
      }),
    ]);

    const mapped = taxes.map((t) => this.mapTaxRecord(t));
    return createPageResponse(mapped, totalElements, pageIndex, isPaginated ? pageSize : totalElements || 1);
  }

  async listProductTaxes(productId: string) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: productId }, { productCode: productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found.`);
    }

    const taxes = await this.prisma.productTax.findMany({
      where: { productId: product.id },
      include: { product: true },
      orderBy: [{ createdAt: 'desc' }],
    });

    return taxes.map((t) => this.mapTaxRecord(t));
  }

  async getProductTaxById(id: string) {
    const tax = await this.prisma.productTax.findUnique({
      where: { id: BigInt(id) },
      include: { product: true },
    });
    if (!tax) {
      throw new NotFoundException(`Product tax record "${id}" not found.`);
    }
    return this.mapTaxRecord(tax);
  }

  async createProductTax(dto: CreateProductTaxDto) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: dto.productId }, { productCode: dto.productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${dto.productId}" not found.`);
    }

    if (dto.taxRate < 0) {
      throw new BadRequestException('Tax rate cannot be negative.');
    }

    const created = await this.prisma.productTax.create({
      data: {
        productId: product.id,
        taxCode: dto.taxCode.trim(),
        taxRate: new Prisma.Decimal(dto.taxRate),
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        status: (dto.status || 'ACTIVE').toUpperCase(),
      },
      include: { product: true },
    });

    return this.mapTaxRecord(created);
  }

  async updateProductTax(id: string, dto: UpdateProductTaxDto) {
    const existing = await this.prisma.productTax.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Product tax record "${id}" not found.`);
    }

    if (dto.taxRate !== undefined && dto.taxRate < 0) {
      throw new BadRequestException('Tax rate cannot be negative.');
    }

    const updated = await this.prisma.productTax.update({
      where: { id: BigInt(id) },
      data: {
        taxCode: dto.taxCode !== undefined ? dto.taxCode.trim() : undefined,
        taxRate: dto.taxRate !== undefined ? new Prisma.Decimal(dto.taxRate) : undefined,
        effectiveFrom: dto.effectiveFrom !== undefined ? (dto.effectiveFrom ? new Date(dto.effectiveFrom) : null) : undefined,
        effectiveTo: dto.effectiveTo !== undefined ? (dto.effectiveTo ? new Date(dto.effectiveTo) : null) : undefined,
        status: dto.status ? dto.status.toUpperCase() : undefined,
      },
      include: { product: true },
    });

    return this.mapTaxRecord(updated);
  }

  async toggleProductTaxStatus(id: string) {
    const existing = await this.prisma.productTax.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Product tax record "${id}" not found.`);
    }

    const nextStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await this.prisma.productTax.update({
      where: { id: BigInt(id) },
      data: { status: nextStatus },
      include: { product: true },
    });

    return this.mapTaxRecord(updated);
  }

  async deleteProductTax(id: string) {
    const existing = await this.prisma.productTax.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Product tax record "${id}" not found.`);
    }

    await this.prisma.productTax.delete({
      where: { id: BigInt(id) },
    });

    return { success: true, message: `Product tax record "${id}" deleted successfully.` };
  }

  // ===================================================================
  // PRODUCT UOM (PRODUCT_UOM)
  // ===================================================================

  private mapUomRecord(uom: any) {
    return {
      id: String(uom.id),
      uom_id: String(uom.id),
      product_uom_id: String(uom.id),
      productUomId: String(uom.id),
      productId: uom.productId,
      product_id: uom.productId,
      productName: uom.product?.name || null,
      productCode: uom.product?.productCode || null,
      uom: uom.uom,
      conversionFactor: Number(uom.conversionFactor),
      conversion_factor: Number(uom.conversionFactor),
      isBaseUom: Boolean(uom.isBaseUom),
      is_base_uom: Boolean(uom.isBaseUom),
      isOrderUom: Boolean(uom.isOrderUom),
      is_order_uom: Boolean(uom.isOrderUom),
      isActive: Boolean(uom.isActive),
      is_active: Boolean(uom.isActive),
      createdAt: uom.createdAt.toISOString(),
      created_at: uom.createdAt.toISOString(),
      updatedAt: uom.updatedAt.toISOString(),
      updated_at: uom.updatedAt.toISOString(),
    };
  }

  async listAllProductUoms(query?: ProductUomQueryDto) {
    const where: Prisma.ProductUomWhereInput = {};

    if (query?.productId) {
      where.OR = [
        { productId: query.productId },
        { product: { productCode: query.productId } },
      ];
    }

    if (query?.active !== undefined && query.active !== 'ALL') {
      where.isActive = query.active === 'true' || query.active === 'ACTIVE';
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { uom: { contains: q, mode: 'insensitive' } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
        { product: { productCode: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const isPaginated = (query as any)?.page !== undefined || (query as any)?.size !== undefined || (query as any)?.limit !== undefined;
    const { pageIndex, pageSize, skip, take } = getPaginationParams(query as any);

    const [totalElements, uoms] = await Promise.all([
      this.prisma.productUom.count({ where }),
      this.prisma.productUom.findMany({
        where,
        include: { product: true },
        orderBy: [{ isBaseUom: 'desc' }, { uom: 'asc' }],
        ...(isPaginated ? { skip, take } : {}),
      }),
    ]);

    const mapped = uoms.map((u) => this.mapUomRecord(u));
    return createPageResponse(mapped, totalElements, pageIndex, isPaginated ? pageSize : totalElements || 1);
  }

  async listProductUoms(productId: string) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: productId }, { productCode: productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found.`);
    }

    const uoms = await this.prisma.productUom.findMany({
      where: { productId: product.id },
      include: { product: true },
      orderBy: [{ isBaseUom: 'desc' }, { conversionFactor: 'asc' }],
    });

    return uoms.map((u) => this.mapUomRecord(u));
  }

  async getProductUomById(id: string) {
    const uom = await this.prisma.productUom.findUnique({
      where: { id: BigInt(id) },
      include: { product: true },
    });
    if (!uom) {
      throw new NotFoundException(`Product UOM record "${id}" not found.`);
    }
    return this.mapUomRecord(uom);
  }

  async createProductUom(dto: CreateProductUomDto) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: dto.productId }, { productCode: dto.productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${dto.productId}" not found.`);
    }

    if (dto.conversionFactor <= 0) {
      throw new BadRequestException('Conversion factor must be a positive number.');
    }

    const uomName = dto.uom.trim();

    // Check duplicate UOM for this product
    const existingDuplicate = await this.prisma.productUom.findFirst({
      where: { productId: product.id, uom: { equals: uomName, mode: 'insensitive' } },
    });
    if (existingDuplicate) {
      throw new ConflictException(`UOM "${uomName}" is already defined for product "${product.name}".`);
    }

    // Atomic transaction: if base UOM, unset base on any existing UOM for this product
    const created = await this.prisma.$transaction(async (tx) => {
      if (dto.isBaseUom) {
        await tx.productUom.updateMany({
          where: { productId: product.id, isBaseUom: true },
          data: { isBaseUom: false },
        });
      }

      return tx.productUom.create({
        data: {
          productId: product.id,
          uom: uomName,
          conversionFactor: new Prisma.Decimal(dto.conversionFactor),
          isBaseUom: dto.isBaseUom ?? false,
          isOrderUom: dto.isOrderUom ?? true,
          isActive: dto.isActive ?? true,
        },
        include: { product: true },
      });
    });

    return this.mapUomRecord(created);
  }

  async updateProductUom(id: string, dto: UpdateProductUomDto) {
    const existing = await this.prisma.productUom.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Product UOM record "${id}" not found.`);
    }

    if (dto.conversionFactor !== undefined && dto.conversionFactor <= 0) {
      throw new BadRequestException('Conversion factor must be a positive number.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isBaseUom) {
        await tx.productUom.updateMany({
          where: { productId: existing.productId, isBaseUom: true, id: { not: existing.id } },
          data: { isBaseUom: false },
        });
      }

      return tx.productUom.update({
        where: { id: BigInt(id) },
        data: {
          uom: dto.uom !== undefined ? dto.uom.trim() : undefined,
          conversionFactor: dto.conversionFactor !== undefined ? new Prisma.Decimal(dto.conversionFactor) : undefined,
          isBaseUom: dto.isBaseUom !== undefined ? dto.isBaseUom : undefined,
          isOrderUom: dto.isOrderUom !== undefined ? dto.isOrderUom : undefined,
          isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        },
        include: { product: true },
      });
    });

    return this.mapUomRecord(updated);
  }

  async toggleProductUomStatus(id: string) {
    const existing = await this.prisma.productUom.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Product UOM record "${id}" not found.`);
    }

    const updated = await this.prisma.productUom.update({
      where: { id: BigInt(id) },
      data: { isActive: !existing.isActive },
      include: { product: true },
    });

    return this.mapUomRecord(updated);
  }

  async deleteProductUom(id: string) {
    const existing = await this.prisma.productUom.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      throw new NotFoundException(`Product UOM record "${id}" not found.`);
    }

    await this.prisma.productUom.delete({
      where: { id: BigInt(id) },
    });

    return { success: true, message: `Product UOM record "${id}" deleted successfully.` };
  }

  // ===================================================================
  // CUSTOMER SEGMENTS (CUSTOMER_SEGMENT)
  // ===================================================================

  private mapSegmentRecord(seg: any) {
    return {
      id: seg.id,
      customer_segment_id: seg.id,
      customerSegmentId: seg.id,
      segmentCode: seg.segmentCode,
      segment_code: seg.segmentCode,
      code: seg.segmentCode,
      segmentName: seg.segmentName,
      segment_name: seg.segmentName,
      name: seg.segmentName,
      description: seg.description || null,
      lifecycleStatus: seg.lifecycleStatus || 'ACTIVE',
      lifecycle_status: seg.lifecycleStatus || 'ACTIVE',
      status: seg.lifecycleStatus === 'ACTIVE' ? 'Active' : 'Inactive',
      is_active: seg.lifecycleStatus === 'ACTIVE',
      createdAt: seg.createdAt.toISOString(),
      created_at: seg.createdAt.toISOString(),
      updatedAt: seg.updatedAt.toISOString(),
      updated_at: seg.updatedAt.toISOString(),
    };
  }

  async listCustomerSegments() {
    const segments = await this.prisma.customerSegment.findMany({
      orderBy: [{ segmentCode: 'asc' }],
    });
    return segments.map((s) => this.mapSegmentRecord(s));
  }

  async getCustomerSegmentById(id: string) {
    const segment = await this.prisma.customerSegment.findUnique({
      where: { id },
    });
    if (!segment) {
      throw new NotFoundException(`Customer segment "${id}" not found.`);
    }
    return this.mapSegmentRecord(segment);
  }

  async createCustomerSegment(dto: CreateCustomerSegmentDto) {
    const code = dto.segmentCode.trim().toUpperCase();
    const existing = await this.prisma.customerSegment.findFirst({
      where: { segmentCode: code },
    });
    if (existing) {
      throw new ConflictException(`Customer segment with code "${code}" already exists.`);
    }

    const id = dto.id?.trim() || `seg_${code.toLowerCase()}`;
    const created = await this.prisma.customerSegment.create({
      data: {
        id,
        segmentCode: code,
        segmentName: dto.segmentName.trim(),
        description: dto.description?.trim() || null,
        lifecycleStatus: (dto.lifecycleStatus || 'ACTIVE').toUpperCase(),
      },
    });

    return this.mapSegmentRecord(created);
  }

  async updateCustomerSegment(id: string, dto: UpdateCustomerSegmentDto) {
    const existing = await this.prisma.customerSegment.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Customer segment "${id}" not found.`);
    }

    const updated = await this.prisma.customerSegment.update({
      where: { id },
      data: {
        segmentCode: dto.segmentCode ? dto.segmentCode.trim().toUpperCase() : undefined,
        segmentName: dto.segmentName ? dto.segmentName.trim() : undefined,
        description: dto.description !== undefined ? (dto.description?.trim() || null) : undefined,
        lifecycleStatus: dto.lifecycleStatus ? dto.lifecycleStatus.toUpperCase() : undefined,
      },
    });

    return this.mapSegmentRecord(updated);
  }

  async deleteCustomerSegment(id: string) {
    const existing = await this.prisma.customerSegment.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Customer segment "${id}" not found.`);
    }

    await this.prisma.customerSegment.delete({
      where: { id },
    });

    return { success: true, message: `Customer segment "${id}" deleted successfully.` };
  }

// ===================================================================
  // PRODUCT MANUFACTURER MAPPINGS (PRODUCT_MANUFACTURER)
  // ===================================================================

  async listProductManufacturers(productId: string) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: productId }, { productCode: productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found.`);
    }

    const mappings = await this.prisma.manufacturerProduct.findMany({
      where: { productId: product.id },
      include: { registration: true },
      orderBy: [{ isPreferred: 'desc' }, { id: 'asc' }],
    });

    return mappings.map((mp) => ({
      id: String(mp.id),
      registrationId: String(mp.registrationId),
      productId: mp.productId,
      companyName: mp.registration?.companyName || 'Verified Manufacturer',
      facilityAddress: mp.registration?.facilityAddress || '',
      city: mp.registration?.city || '',
      state: mp.registration?.state || '',
      manufacturerProductCode: mp.manufacturerProductCode,
      manufacturerPartNumber: mp.manufacturerPartNumber,
      manufacturerSku: mp.manufacturerSku,
      moq: mp.moq,
      leadTimeDays: mp.leadTimeDays,
      lifecycleStatus: mp.lifecycleStatus,
      isPreferred: mp.isPreferred,
      packagingDetails: mp.packagingDetails,
      effectiveFrom: mp.effectiveFrom ? mp.effectiveFrom.toISOString().split('T')[0] : null,
      effectiveTo: mp.effectiveTo ? mp.effectiveTo.toISOString().split('T')[0] : null,
      createdAt: mp.createdAt.toISOString(),
    }));
  }

  async mapProductManufacturer(productId: string, dto: MapProductManufacturerDto) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: productId }, { productCode: productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${productId}" not found.`);
    }

    const regId = BigInt(dto.registrationId);
    const existingReg = await this.prisma.manufacturerRegistration.findUnique({
      where: { id: regId },
    });
    if (!existingReg) {
      throw new NotFoundException(`Manufacturer Registration with ID ${dto.registrationId} not found.`);
    }

    const mapped = await this.prisma.manufacturerProduct.upsert({
      where: {
        registrationId_productId: {
          registrationId: regId,
          productId: product.id,
        },
      },
      update: {
        manufacturerProductCode: dto.manufacturerProductCode || undefined,
        manufacturerPartNumber: dto.manufacturerPartNumber || undefined,
        manufacturerSku: dto.manufacturerSku || undefined,
        moq: dto.moq !== undefined ? dto.moq : undefined,
        leadTimeDays: dto.leadTimeDays !== undefined ? dto.leadTimeDays : undefined,
        lifecycleStatus: dto.lifecycleStatus ? dto.lifecycleStatus.toUpperCase() : 'ACTIVE',
        isPreferred: dto.isPreferred !== undefined ? dto.isPreferred : undefined,
        packagingDetails: dto.packagingDetails || undefined,
        updatedAt: new Date(),
      },
      create: {
        registrationId: regId,
        productId: product.id,
        manufacturerProductCode: dto.manufacturerProductCode || null,
        manufacturerPartNumber: dto.manufacturerPartNumber || null,
        manufacturerSku: dto.manufacturerSku || null,
        moq: dto.moq || 100,
        leadTimeDays: dto.leadTimeDays || 14,
        lifecycleStatus: dto.lifecycleStatus ? dto.lifecycleStatus.toUpperCase() : 'ACTIVE',
        isPreferred: dto.isPreferred || false,
        packagingDetails: dto.packagingDetails || null,
      },
    });

    return {
      id: String(mapped.id),
      registrationId: String(mapped.registrationId),
      productId: mapped.productId,
      lifecycleStatus: mapped.lifecycleStatus,
      isPreferred: mapped.isPreferred,
      companyName: existingReg.companyName,
    };
  }

  // ===================================================================
  // PRODUCT TYPES & CATEGORIES
  // ===================================================================

  async listProductTypes(params?: ProductTypeQueryDto) {
    const where: Prisma.ProductTypeWhereInput = {};
    if (params?.activeOnly) {
      where.lifecycleStatus = 'ACTIVE';
    }
    if (params?.status && params.status !== 'ALL') {
      where.lifecycleStatus = { equals: params.status, mode: 'insensitive' };
    }
    if (params?.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { productTypeCode: { contains: q, mode: 'insensitive' } },
        { productTypeName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const totalElements = await this.prisma.productType.count({ where });

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      created_at: 'createdAt',
      updatedAt: 'updatedAt',
      updated_at: 'updatedAt',
      id: 'id',
      productTypeCode: 'productTypeCode',
      product_type_code: 'productTypeCode',
      productTypeName: 'productTypeName',
      product_type_name: 'productTypeName',
      name: 'productTypeName',
      code: 'productTypeCode',
      displayOrder: 'displayOrder',
      display_order: 'displayOrder',
    };

    const isPaginated = params?.page !== undefined || params?.size !== undefined || params?.limit !== undefined;
    const { skip, take, pageIndex, pageSize, orderBy } = getPaginationParams(
      params || {},
      allowedSortFields,
      'createdAt',
      'desc'
    );

    const [types, catCounts, attrCounts] = await Promise.all([
      this.prisma.productType.findMany({
        where,
        orderBy: orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }, { id: 'desc' }],
        ...(isPaginated ? { skip, take } : {}),
      }),
      this.prisma.category.groupBy({
        by: ['productTypeId'],
        _count: { id: true },
      }),
      this.prisma.productTypeAttribute.groupBy({
        by: ['productTypeId'],
        _count: { id: true },
      }),
    ]);

    const catCountMap = new Map<string, number>();
    for (const c of catCounts) catCountMap.set(c.productTypeId, c._count.id);
    const attrCountMap = new Map<string, number>();
    for (const a of attrCounts) attrCountMap.set(a.productTypeId, a._count.id);

    const mappedTypes = types.map((pt) => ({
      id: pt.id,
      product_type_id: pt.id,
      productTypeId: pt.id,
      code: pt.productTypeCode,
      product_type_code: pt.productTypeCode,
      productTypeCode: pt.productTypeCode,
      name: pt.productTypeName,
      product_type_name: pt.productTypeName,
      productTypeName: pt.productTypeName,
      description: pt.description,
      lifecycle_status: pt.lifecycleStatus,
      lifecycleStatus: pt.lifecycleStatus,
      status: pt.lifecycleStatus,
      display_order: pt.displayOrder,
      displayOrder: pt.displayOrder,
      category_count: catCountMap.get(pt.id) ?? 0,
      categories_count: catCountMap.get(pt.id) ?? 0,
      categoriesCount: catCountMap.get(pt.id) ?? 0,
      attribute_count: attrCountMap.get(pt.id) ?? 0,
      attributes_count: attrCountMap.get(pt.id) ?? 0,
      attributesCount: attrCountMap.get(pt.id) ?? 0,
      created_at: pt.createdAt.toISOString(),
      createdAt: pt.createdAt.toISOString(),
      updated_at: pt.updatedAt.toISOString(),
      updatedAt: pt.updatedAt.toISOString(),
    }));

    return createPageResponse(
      mappedTypes,
      totalElements,
      pageIndex,
      isPaginated ? pageSize : totalElements || 1,
      {
        productTypes: mappedTypes,
      }
    );
  }

  async getProductTypeById(id: string) {
    const pt = await this.prisma.productType.findFirst({
      where: {
        OR: [{ id }, { productTypeCode: id.toUpperCase() }],
      },
    });
    if (!pt) {
      throw new NotFoundException(`Product Type "${id}" not found.`);
    }

    const [attributes, categories] = await Promise.all([
      this.prisma.productTypeAttribute.findMany({
        where: { productTypeId: pt.id },
        include: { attribute: true },
        orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.category.findMany({
        where: { productTypeId: pt.id },
        orderBy: [{ category: 'asc' }, { subCategory: 'asc' }, { displayOrder: 'asc' }],
      }),
    ]);

    const mappedAttributes = attributes.map((pta) => ({
      id: String(pta.id),
      product_type_attribute_id: String(pta.id),
      product_type_id: pta.productTypeId,
      productTypeId: pta.productTypeId,
      attribute_id: pta.attributeId,
      attributeId: pta.attributeId,
      is_required: pta.isRequired,
      isRequired: pta.isRequired,
      display_order: pta.displayOrder,
      displayOrder: pta.displayOrder,
      lifecycle_status: pta.lifecycleStatus,
      lifecycleStatus: pta.lifecycleStatus,
      attribute_code: pta.attribute.attributeCode,
      attributeCode: pta.attribute.attributeCode,
      code: pta.attribute.attributeCode,
      attribute_name: pta.attribute.attributeName,
      attributeName: pta.attribute.attributeName,
      name: pta.attribute.attributeName,
      data_type: pta.attribute.dataType,
      dataType: pta.attribute.dataType,
      unit_of_measure: pta.attribute.unitOfMeasure,
      unitOfMeasure: pta.attribute.unitOfMeasure,
      allowed_values: pta.attribute.allowedValues,
      allowedValues: pta.attribute.allowedValues,
      is_filterable: pta.attribute.isFilterable,
      isFilterable: pta.attribute.isFilterable,
      is_searchable: pta.attribute.isSearchable,
      isSearchable: pta.attribute.isSearchable,
      is_active: pta.attribute.isActive,
      isActive: pta.attribute.isActive,
      remark: pta.attribute.remark || '',
      description: pta.attribute.remark || '',
    }));

    const mappedCategories = categories.map((c) => ({
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
      code: c.categoryCode,
      description: c.description,
      lifecycle_status: c.lifecycleStatus,
      lifecycleStatus: c.lifecycleStatus,
      display_order: c.displayOrder,
      displayOrder: c.displayOrder,
    }));

    return {
      id: pt.id,
      product_type_id: pt.id,
      productTypeId: pt.id,
      code: pt.productTypeCode,
      product_type_code: pt.productTypeCode,
      productTypeCode: pt.productTypeCode,
      name: pt.productTypeName,
      product_type_name: pt.productTypeName,
      productTypeName: pt.productTypeName,
      description: pt.description,
      lifecycle_status: pt.lifecycleStatus,
      lifecycleStatus: pt.lifecycleStatus,
      status: pt.lifecycleStatus,
      display_order: pt.displayOrder,
      displayOrder: pt.displayOrder,
      category_count: categories.length,
      categories_count: categories.length,
      categoriesCount: categories.length,
      attribute_count: attributes.length,
      attributes_count: attributes.length,
      attributesCount: attributes.length,
      attributes: mappedAttributes,
      categories: mappedCategories,
      created_at: pt.createdAt.toISOString(),
      createdAt: pt.createdAt.toISOString(),
      updated_at: pt.updatedAt.toISOString(),
      updatedAt: pt.updatedAt.toISOString(),
    };
  }

  private async syncProductTypeAttributes(
    tx: any,
    productTypeId: string,
    attributes: any[],
    removeMissing = false,
  ) {
    const keepAttributeIds = new Set<string>();

    for (let i = 0; i < attributes.length; i++) {
      const item = attributes[i];
      const attrId = typeof item === 'string'
        ? item.trim()
        : (item?.attributeId || item?.attribute_id || item?.id || '').trim();
      const rawCode = typeof item === 'object' && item !== null
        ? (item.attributeCode || item.attribute_code || item.code || '').trim().toUpperCase()
        : '';

      // Find existing attribute master by ID or by Code
      let master: any = null;
      if (attrId) {
        master = await tx.attributeMaster.findFirst({
          where: {
            OR: [
              { id: attrId },
              { attributeCode: attrId.toUpperCase() },
            ],
          },
        });
      }
      if (!master && rawCode) {
        master = await tx.attributeMaster.findFirst({
          where: { attributeCode: rawCode },
        });
      }

      // Do NOT create new attribute records here. Attributes are maintained in Attribute Master.
      if (!master) {
        continue;
      }

      keepAttributeIds.add(master.id);

      const displayOrder = typeof item === 'object' && item !== null && (item.displayOrder !== undefined || item.display_order !== undefined)
        ? (Number(item.displayOrder ?? item.display_order) || (i + 1))
        : (i + 1);

      const isRequired = typeof item === 'object' && item !== null && (item.isRequired !== undefined || item.is_required !== undefined)
        ? Boolean(item.isRequired ?? item.is_required)
        : Boolean(master.isRequired);

      // Upsert product_type_attributes relation
      await tx.productTypeAttribute.upsert({
        where: {
          productTypeId_attributeId: {
            productTypeId,
            attributeId: master.id,
          },
        },
        update: {
          isRequired,
          displayOrder,
          lifecycleStatus: master.isActive ? 'ACTIVE' : 'INACTIVE',
        },
        create: {
          productTypeId,
          attributeId: master.id,
          isRequired,
          displayOrder,
          lifecycleStatus: master.isActive ? 'ACTIVE' : 'INACTIVE',
        },
      });
    }

    if (removeMissing) {
      await tx.productTypeAttribute.deleteMany({
        where: {
          productTypeId,
          attributeId: { notIn: Array.from(keepAttributeIds) },
        },
      });
    }
  }

  async createProductType(dto: CreateProductTypeDto) {
    const code = (dto.productTypeCode || dto.product_type_code || dto.code || '').trim().toUpperCase();
    if (!code) {
      throw new BadRequestException('Product Type code is required.');
    }
    const name = (dto.productTypeName || dto.product_type_name || dto.name || '').trim();
    if (!name) {
      throw new BadRequestException('Product Type name is required.');
    }

    const existing = await this.prisma.productType.findFirst({
      where: {
        OR: [
          { productTypeCode: { equals: code, mode: 'insensitive' } },
          ...(dto.id ? [{ id: dto.id }] : []),
        ],
      },
    });
    if (existing) {
      throw new ConflictException(`Product Type Code "${code}" already exists.`);
    }

    let id = dto.id?.trim() || dto.product_type_id?.trim() || dto.productTypeId?.trim();
    if (!id) {
      const sanitized = code.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
      const baseId = `pt_${sanitized}`;
      const existingId = await this.prisma.productType.findUnique({ where: { id: baseId } });
      id = existingId ? `${baseId}_${Date.now().toString(36)}` : baseId;
    }
    const rawStatus = dto.lifecycleStatus || dto.lifecycle_status || dto.status;
    const lifecycleStatus = rawStatus ? rawStatus.toUpperCase() : 'ACTIVE';
    const displayOrder = dto.displayOrder ?? dto.display_order ?? 1;

    const created = await this.prisma.$transaction(async (tx) => {
      const pt = await tx.productType.create({
        data: {
          id,
          productTypeCode: code,
          productTypeName: name,
          description: dto.description?.trim() || null,
          lifecycleStatus,
          displayOrder,
        },
      });

      const attrInputs = dto.attributeIds || dto.attribute_ids || dto.attributes;
      if (Array.isArray(attrInputs) && attrInputs.length > 0) {
        await this.syncProductTypeAttributes(tx, pt.id, attrInputs, false);
      }

      return pt;
    });

    return this.getProductTypeById(created.id);
  }

  async updateProductType(id: string, dto: UpdateProductTypeDto) {
    const existing = await this.prisma.productType.findFirst({
      where: {
        OR: [{ id }, { productTypeCode: id.toUpperCase() }],
      },
    });
    if (!existing) {
      throw new NotFoundException(`Product Type "${id}" not found.`);
    }

    const updateData: Prisma.ProductTypeUpdateInput = {};
    const code = dto.productTypeCode || dto.product_type_code || dto.code;
    if (code) {
      updateData.productTypeCode = code.trim().toUpperCase();
    }
    const name = dto.productTypeName || dto.product_type_name || dto.name;
    if (name) {
      updateData.productTypeName = name.trim();
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description?.trim() || null;
    }
    const status = dto.lifecycleStatus || dto.lifecycle_status || dto.status;
    if (status) {
      updateData.lifecycleStatus = status.toUpperCase();
    }
    const order = dto.displayOrder ?? dto.display_order;
    if (order !== undefined) {
      updateData.displayOrder = order;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productType.update({
        where: { id: existing.id },
        data: updateData,
      });

      const attrInputs = dto.attributeIds || dto.attribute_ids || dto.attributes;
      if (Array.isArray(attrInputs)) {
        await this.syncProductTypeAttributes(tx, existing.id, attrInputs, true);
      }
    });

    return this.getProductTypeById(existing.id);
  }

  async toggleProductTypeStatus(id: string) {
    const existing = await this.prisma.productType.findFirst({
      where: {
        OR: [{ id }, { productTypeCode: id.toUpperCase() }],
      },
    });
    if (!existing) {
      throw new NotFoundException(`Product Type "${id}" not found.`);
    }

    const newStatus = existing.lifecycleStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await this.prisma.productType.update({
      where: { id: existing.id },
      data: { lifecycleStatus: newStatus },
    });

    return {
      id: updated.id,
      product_type_id: updated.id,
      lifecycle_status: updated.lifecycleStatus,
      lifecycleStatus: updated.lifecycleStatus,
      status: updated.lifecycleStatus,
      updated_at: updated.updatedAt.toISOString(),
    };
  }

  async deleteProductType(id: string) {
    const existing = await this.prisma.productType.findFirst({
      where: {
        OR: [{ id }, { productTypeCode: id.toUpperCase() }],
      },
    });
    if (!existing) {
      throw new NotFoundException(`Product Type "${id}" not found.`);
    }

    // Check if categories are assigned to this product type
    const categoryCount = await this.prisma.category.count({
      where: { productTypeId: existing.id },
    });
    if (categoryCount > 0) {
      throw new BadRequestException(
        `Cannot delete Product Type "${existing.productTypeName}" because it has ${categoryCount} assigned categories. Deactivate it instead.`
      );
    }

    await this.prisma.productType.delete({
      where: { id: existing.id },
    });

    return {
      success: true,
      message: `Product Type "${existing.productTypeName}" successfully removed.`,
      id: existing.id,
    };
  }

  async listCategories(queryOrPtId?: string | CategoryQueryDto) {
    const isString = typeof queryOrPtId === 'string';
    const productTypeId = isString ? queryOrPtId : queryOrPtId?.productTypeId;
    const query: CategoryQueryDto = isString ? { productTypeId } : (queryOrPtId || {});

    const where: Prisma.CategoryWhereInput = {};
    if (productTypeId && productTypeId !== 'ALL') {
      where.productTypeId = productTypeId;
    }
    if (query.status && query.status !== 'ALL') {
      where.lifecycleStatus = { equals: query.status, mode: 'insensitive' };
    }
    if (query.activeOnly) {
      where.lifecycleStatus = 'ACTIVE';
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { category: { contains: q, mode: 'insensitive' } },
        { subCategory: { contains: q, mode: 'insensitive' } },
        { subSubCategory: { contains: q, mode: 'insensitive' } },
        { categoryCode: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const totalElements = await this.prisma.category.count({ where });

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      created_at: 'createdAt',
      updatedAt: 'updatedAt',
      updated_at: 'updatedAt',
      id: 'id',
      categoryId: 'categoryId',
      category_id: 'categoryId',
      categoryCode: 'categoryCode',
      category_code: 'categoryCode',
      category: 'category',
      productTypeId: 'productTypeId',
      displayOrder: 'displayOrder',
      display_order: 'displayOrder',
    };

    const isPaginated = query.page !== undefined || query.size !== undefined || query.limit !== undefined;
    const { skip, take, pageIndex, pageSize, orderBy } = getPaginationParams(
      query,
      allowedSortFields,
      'createdAt',
      'desc'
    );

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(isPaginated ? { skip, take } : {}),
    });

    const mappedCategories = categories.map((c) => ({
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
    }));

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

    return createPageResponse(
      mappedCategories,
      totalElements,
      pageIndex,
      isPaginated ? pageSize : totalElements || 1,
      {
        categories: mappedCategories,
        tree,
      }
    );
  }

  async getCategoryById(id: string) {
    const cat = await this.prisma.category.findFirst({
      where: {
        OR: [{ id }, { categoryId: id }, { categoryCode: id.toUpperCase() }],
      },
    });

    if (!cat) {
      throw new NotFoundException(`Category with ID or code "${id}" not found.`);
    }

    return {
      id: cat.id,
      category_id: cat.categoryId,
      categoryId: cat.categoryId,
      product_type_id: cat.productTypeId,
      productTypeId: cat.productTypeId,
      category: cat.category,
      sub_category: cat.subCategory,
      subCategory: cat.subCategory,
      sub_sub_category: cat.subSubCategory,
      subSubCategory: cat.subSubCategory,
      category_code: cat.categoryCode,
      categoryCode: cat.categoryCode,
      description: cat.description,
      lifecycle_status: cat.lifecycleStatus,
      lifecycleStatus: cat.lifecycleStatus,
      display_order: cat.displayOrder,
      displayOrder: cat.displayOrder,
    };
  }

  async getCategoryHierarchyOptions(productTypeId?: string) {
    const where: Prisma.CategoryWhereInput = {};
    if (productTypeId && productTypeId !== 'ALL') {
      where.productTypeId = productTypeId;
    }
    const categories = await this.prisma.category.findMany({
      where,
      select: {
        productTypeId: true,
        category: true,
        subCategory: true,
        subSubCategory: true,
      },
      orderBy: [
        { productTypeId: 'asc' },
        { category: 'asc' },
        { subCategory: 'asc' },
        { subSubCategory: 'asc' },
      ],
    });

    const result: Record<string, {
      categories: string[];
      subCategories: Record<string, string[]>;
      subSubCategories: Record<string, Record<string, string[]>>;
    }> = {};

    for (const c of categories) {
      const pt = c.productTypeId;
      if (!result[pt]) {
        result[pt] = { categories: [], subCategories: {}, subSubCategories: {} };
      }
      const cat = c.category.trim();
      if (!result[pt].categories.includes(cat)) {
        result[pt].categories.push(cat);
      }
      if (c.subCategory) {
        const sub = c.subCategory.trim();
        if (!result[pt].subCategories[cat]) {
          result[pt].subCategories[cat] = [];
        }
        if (!result[pt].subCategories[cat].includes(sub)) {
          result[pt].subCategories[cat].push(sub);
        }
        if (c.subSubCategory) {
          const subSub = c.subSubCategory.trim();
          if (!result[pt].subSubCategories[cat]) {
            result[pt].subSubCategories[cat] = {};
          }
          if (!result[pt].subSubCategories[cat][sub]) {
            result[pt].subSubCategories[cat][sub] = [];
          }
          if (!result[pt].subSubCategories[cat][sub].includes(subSub)) {
            result[pt].subSubCategories[cat][sub].push(subSub);
          }
        }
      }
    }

    return result;
  }

  async createCategory(dto: CreateCategoryDto) {
    const ptId = (dto.productTypeId || dto.product_type_id || 'pt_med').trim();
    const pt = await this.prisma.productType.findFirst({
      where: {
        OR: [{ id: ptId }, { productTypeCode: ptId.toUpperCase() }],
      },
    });
    if (!pt) {
      throw new BadRequestException(`Product Type "${ptId}" does not exist in database.`);
    }

    const categoryName = (dto.category || dto.name || '').trim();
    if (!categoryName) {
      throw new BadRequestException('Category name is required.');
    }

    const subCategory = (dto.subCategory || dto.sub_category || '').trim() || null;
    const subSubCategory = (dto.subSubCategory || dto.sub_sub_category || '').trim() || null;

    if (subSubCategory && !subCategory) {
      throw new BadRequestException('Sub-Category is required when specifying a Sub-Sub-Category.');
    }

    // Run inside database transaction with conflict check & deterministic code generation
    return this.prisma.$transaction(async (tx) => {
      // 1. Authoritative Duplicate Hierarchy Check
      const existingHierarchy = await tx.category.findFirst({
        where: {
          productTypeId: pt.id,
          category: { equals: categoryName, mode: 'insensitive' },
          subCategory: subCategory ? { equals: subCategory, mode: 'insensitive' } : null,
          subSubCategory: subSubCategory ? { equals: subSubCategory, mode: 'insensitive' } : null,
        },
      });

      if (existingHierarchy) {
        throw new ConflictException(
          'Category hierarchy already exists for the selected Product Type and placement.'
        );
      }

      // 2. Deterministic Category Code Generation (100% Backend Controlled)
      const toCodePart = (text: string, maxLen = 4): string => {
        const words = text.trim().split(/[\s/&_-]+/).filter(Boolean);
        if (words.length > 1) {
          const initials = words.map((w) => w.replace(/[^A-Za-z0-9]/g, '')[0] || '').join('').toUpperCase();
          if (initials.length >= 2) return initials.slice(0, maxLen);
        }
        const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        return cleaned.slice(0, Math.max(3, maxLen));
      };

      const ptPart = (pt.productTypeCode || 'CAT').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
      const catPart = toCodePart(categoryName);
      const subPart = subCategory ? toCodePart(subCategory) : null;
      const subSubPart = subSubCategory ? toCodePart(subSubCategory) : null;

      // Deterministic hierarchy-aligned base slug
      let baseCode = catPart;
      if (subPart && subSubPart) {
        baseCode = `${catPart}-${subPart}-${subSubPart}`;
      } else if (subPart) {
        baseCode = `${catPart}-${subPart}`;
      }

      // Ensure code is unique in PostgreSQL categories table
      let candidateCode = baseCode;
      const existingCode = await tx.category.findFirst({
        where: { categoryCode: { equals: candidateCode, mode: 'insensitive' } },
      });

      if (existingCode) {
        // First try prepending Product Type prefix
        candidateCode = `${ptPart}-${baseCode}`;
        const secondCheck = await tx.category.findFirst({
          where: { categoryCode: { equals: candidateCode, mode: 'insensitive' } },
        });

        if (secondCheck) {
          // If still collision, append sequential numeric counter
          let seq = 1;
          while (true) {
            const seqCode = `${candidateCode}-${String(seq).padStart(2, '0')}`;
            const exists = await tx.category.findFirst({
              where: { categoryCode: { equals: seqCode, mode: 'insensitive' } },
            });
            if (!exists) {
              candidateCode = seqCode;
              break;
            }
            seq++;
          }
        }
      }

      // 3. Unique Category ID Generation (e.g. CAT039, CAT040...)
      const allCategoryIds = await tx.category.findMany({
        select: { categoryId: true },
      });

      let maxNum = 0;
      for (const item of allCategoryIds) {
        const match = (item.categoryId || '').match(/^CAT(\d+)$/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      }

      const nextNum = maxNum + 1;
      const id = `CAT${String(nextNum).padStart(3, '0')}`;
      const categoryId = id;

      const rawStatus = dto.lifecycleStatus || dto.lifecycle_status || dto.status;
      const lifecycleStatus = rawStatus ? rawStatus.toUpperCase() : 'ACTIVE';
      const displayOrder = dto.displayOrder ?? dto.display_order ?? 1;

      // 4. Atomic PostgreSQL Persistence
      const created = await tx.category.create({
        data: {
          id,
          categoryId,
          productTypeId: pt.id,
          category: categoryName,
          subCategory,
          subSubCategory,
          categoryCode: candidateCode,
          description: dto.description?.trim() || null,
          lifecycleStatus,
          displayOrder,
        },
      });

      // 5. Upsert foreign key capability record in catalog_products
      await tx.catalogProduct.upsert({
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
          productCode: candidateCode,
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

      return {
        id: created.id,
        category_id: created.categoryId,
        categoryId: created.categoryId,
        product_type_id: created.productTypeId,
        productTypeId: created.productTypeId,
        category: created.category,
        sub_category: created.subCategory,
        subCategory: created.subCategory,
        sub_sub_category: created.subSubCategory,
        subSubCategory: created.subSubCategory,
        category_code: created.categoryCode,
        categoryCode: created.categoryCode,
        description: created.description,
        lifecycle_status: created.lifecycleStatus,
        lifecycleStatus: created.lifecycleStatus,
        status: created.lifecycleStatus === 'ACTIVE' ? 'Active' : 'Inactive',
        display_order: created.displayOrder,
        displayOrder: created.displayOrder,
        name: created.subSubCategory || created.subCategory || created.category,
        fullName: [created.category, created.subCategory, created.subSubCategory].filter(Boolean).join(' → '),
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ id }, { categoryId: id }] },
    });
    if (!existing) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }

    const code = dto.categoryCode || dto.category_code || dto.code;
    let codeClean: string | undefined;
    if (code) {
      codeClean = code.trim().toUpperCase();
      if (codeClean !== existing.categoryCode.toUpperCase()) {
        const conflict = await this.prisma.category.findFirst({
          where: { id: { not: existing.id }, categoryCode: { equals: codeClean, mode: 'insensitive' } },
        });
        if (conflict) {
          throw new ConflictException(`Category Code "${codeClean}" already exists.`);
        }
      }
    }

    const updateData: Prisma.CategoryUpdateInput = {};
    if (codeClean) updateData.categoryCode = codeClean;

    const catName = dto.category || dto.name;
    if (catName) updateData.category = catName.trim();

    if (dto.subCategory !== undefined || dto.sub_category !== undefined) {
      updateData.subCategory = (dto.subCategory || dto.sub_category || '').trim() || null;
    }
    if (dto.subSubCategory !== undefined || dto.sub_sub_category !== undefined) {
      updateData.subSubCategory = (dto.subSubCategory || dto.sub_sub_category || '').trim() || null;
    }
    const ptId = dto.productTypeId || dto.product_type_id;
    if (ptId) updateData.productTypeId = ptId.trim();

    if (dto.description !== undefined) {
      updateData.description = dto.description?.trim() || null;
    }
    const status = dto.lifecycleStatus || dto.lifecycle_status || dto.status;
    if (status) updateData.lifecycleStatus = status.toUpperCase();

    const order = dto.displayOrder ?? dto.display_order;
    if (order !== undefined) updateData.displayOrder = order;

    const updated = await this.prisma.category.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Sync to catalog_products if exists
    await this.prisma.catalogProduct.updateMany({
      where: { id: existing.id },
      data: {
        category: updated.category,
        subCategory: updated.subCategory,
        subSubCategory: updated.subSubCategory,
        lifecycleStatus: updated.lifecycleStatus,
        active: updated.lifecycleStatus === 'ACTIVE',
      },
    });

    return this.getCategoryById(existing.id);
  }

  async toggleCategoryStatus(id: string) {
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ id }, { categoryId: id }] },
    });
    if (!existing) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }

    const newStatus = existing.lifecycleStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await this.prisma.category.update({
      where: { id: existing.id },
      data: { lifecycleStatus: newStatus },
    });

    await this.prisma.catalogProduct.updateMany({
      where: { id: existing.id },
      data: {
        lifecycleStatus: newStatus,
        active: newStatus === 'ACTIVE',
      },
    });

    return updated;
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ id }, { categoryId: id }] },
    });
    if (!existing) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }

    await this.prisma.catalogProduct.deleteMany({
      where: { id: existing.id },
    });

    await this.prisma.category.delete({
      where: { id: existing.id },
    });

    return { success: true, message: `Category "${id}" deleted.` };
  }

  async getSubCategories(categoryNameOrId: string) {
    const cats = await this.prisma.category.findMany({
      where: {
        OR: [
          { category: { equals: categoryNameOrId.trim(), mode: 'insensitive' } },
          { categoryId: { equals: categoryNameOrId.trim(), mode: 'insensitive' } },
          { id: categoryNameOrId.trim() },
        ],
        lifecycleStatus: 'ACTIVE',
      },
      select: { subCategory: true },
      distinct: ['subCategory'],
    });

    return Array.from(
      new Set(
        cats
          .map((c) => c.subCategory?.trim())
          .filter((s): s is string => Boolean(s)),
      ),
    );
  }

  async getSubSubCategories(categoryNameOrId: string, subCategory: string) {
    const cats = await this.prisma.category.findMany({
      where: {
        OR: [
          { category: { equals: categoryNameOrId.trim(), mode: 'insensitive' } },
          { categoryId: { equals: categoryNameOrId.trim(), mode: 'insensitive' } },
          { id: categoryNameOrId.trim() },
        ],
        subCategory: { equals: subCategory.trim(), mode: 'insensitive' },
        lifecycleStatus: 'ACTIVE',
      },
      select: { subSubCategory: true },
      distinct: ['subSubCategory'],
    });

    return Array.from(
      new Set(
        cats
          .map((c) => c.subSubCategory?.trim())
          .filter((s): s is string => Boolean(s)),
      ),
    );
  }

  async getSubSubCategoriesBySubCategoryOnly(subCategoryOrId: string) {
    const cats = await this.prisma.category.findMany({
      where: {
        OR: [
          { subCategory: { equals: subCategoryOrId.trim(), mode: 'insensitive' } },
          { id: subCategoryOrId.trim() },
          { categoryId: subCategoryOrId.trim() },
        ],
        lifecycleStatus: 'ACTIVE',
      },
      select: { subSubCategory: true },
      distinct: ['subSubCategory'],
    });

    return Array.from(
      new Set(
        cats
          .map((c) => c.subSubCategory?.trim())
          .filter((s) => Boolean(s)),
      ),
    );
  }


  // ===================================================================
  // PRODUCT TYPE ATTRIBUTE ASSIGNMENTS (PRODUCT_TYPE_ATTRIBUTE)
  // ===================================================================

  async getProductTypeAttributes(productTypeId: string) {
    const pt = await this.prisma.productType.findFirst({
      where: {
        OR: [{ id: productTypeId }, { productTypeCode: productTypeId.toUpperCase() }],
      },
    });
    if (!pt) {
      throw new NotFoundException(`Product Type "${productTypeId}" not found.`);
    }

    const assignments = await this.prisma.productTypeAttribute.findMany({
      where: { productTypeId: pt.id },
      include: { attribute: true },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });

    return assignments.map((pta) => ({
      id: String(pta.id),
      product_type_attribute_id: String(pta.id),
      product_type_id: pta.productTypeId,
      productTypeId: pta.productTypeId,
      attribute_id: pta.attributeId,
      attributeId: pta.attributeId,
      is_required: pta.isRequired,
      isRequired: pta.isRequired,
      display_order: pta.displayOrder,
      displayOrder: pta.displayOrder,
      lifecycle_status: pta.lifecycleStatus,
      lifecycleStatus: pta.lifecycleStatus,
      remark: pta.attribute?.remark,
      attribute_code: pta.attribute?.attributeCode,
      attributeCode: pta.attribute?.attributeCode,
      code: pta.attribute?.attributeCode,
      attribute_name: pta.attribute?.attributeName,
      attributeName: pta.attribute?.attributeName,
      name: pta.attribute?.attributeName,
      data_type: pta.attribute?.dataType,
      dataType: pta.attribute?.dataType,
      unit_of_measure: pta.attribute?.unitOfMeasure,
      unitOfMeasure: pta.attribute?.unitOfMeasure,
      allowed_values: pta.attribute?.allowedValues,
      allowedValues: pta.attribute?.allowedValues,
      is_filterable: pta.attribute?.isFilterable,
      isFilterable: pta.attribute?.isFilterable,
      is_searchable: pta.attribute?.isSearchable,
      isSearchable: pta.attribute?.isSearchable,
      is_active: pta.attribute?.isActive,
      isActive: pta.attribute?.isActive,
    }));
  }

  async assignProductTypeAttribute(productTypeId: string, dto: ProductTypeAttributeItemDto) {
    const pt = await this.prisma.productType.findFirst({
      where: {
        OR: [{ id: productTypeId }, { productTypeCode: productTypeId.toUpperCase() }],
      },
    });
    if (!pt) {
      throw new NotFoundException(`Product Type "${productTypeId}" not found.`);
    }

    const attrTarget = dto.attributeId || dto.attribute_id;
    if (!attrTarget) {
      throw new BadRequestException('Attribute ID is required.');
    }

    const attr = await this.prisma.attributeMaster.findFirst({
      where: {
        OR: [{ id: attrTarget }, { attributeCode: attrTarget.toUpperCase() }],
      },
    });
    if (!attr) {
      throw new NotFoundException(`Attribute "${attrTarget}" not found in Attribute Master.`);
    }

    const isRequired = dto.isRequired !== undefined ? dto.isRequired : (dto.is_required !== undefined ? dto.is_required : false);
    const displayOrder = dto.displayOrder || dto.display_order || 1;
    const rawStatus = dto.lifecycleStatus || dto.lifecycle_status;
    const lifecycleStatus = rawStatus ? rawStatus.toUpperCase() : 'ACTIVE';

    const assigned = await this.prisma.productTypeAttribute.upsert({
      where: {
        productTypeId_attributeId: {
          productTypeId: pt.id,
          attributeId: attr.id,
        },
      },
      update: {
        isRequired,
        displayOrder,
        lifecycleStatus,
        updatedAt: new Date(),
      },
      create: {
        productTypeId: pt.id,
        attributeId: attr.id,
        isRequired,
        displayOrder,
        lifecycleStatus,
      },
      include: { attribute: true },
    });

    return {
      id: String(assigned.id),
      product_type_attribute_id: String(assigned.id),
      productTypeId: assigned.productTypeId,
      attributeId: assigned.attributeId,
      isRequired: assigned.isRequired,
      displayOrder: assigned.displayOrder,
      lifecycleStatus: assigned.lifecycleStatus,
      attribute: this.toAttributeResponse(assigned.attribute),
    };
  }

  async updateProductTypeAttribute(productTypeId: string, attributeId: string, dto: UpdateProductTypeAttributeDto) {
    const pt = await this.prisma.productType.findFirst({
      where: {
        OR: [{ id: productTypeId }, { productTypeCode: productTypeId.toUpperCase() }],
      },
    });
    if (!pt) {
      throw new NotFoundException(`Product Type "${productTypeId}" not found.`);
    }

    const attr = await this.prisma.attributeMaster.findFirst({
      where: {
        OR: [{ id: attributeId }, { attributeCode: attributeId.toUpperCase() }],
      },
    });
    if (!attr) {
      throw new NotFoundException(`Attribute "${attributeId}" not found in Attribute Master.`);
    }

    const existing = await this.prisma.productTypeAttribute.findUnique({
      where: {
        productTypeId_attributeId: {
          productTypeId: pt.id,
          attributeId: attr.id,
        },
      },
    });
    if (!existing) {
      throw new NotFoundException(`Attribute is not assigned to Product Type "${pt.productTypeName}".`);
    }

    const isRequired = dto.isRequired !== undefined ? dto.isRequired : (dto.is_required !== undefined ? dto.is_required : existing.isRequired);
    const displayOrder = dto.displayOrder || dto.display_order || existing.displayOrder;
    const rawStatus = dto.lifecycleStatus || dto.lifecycle_status;
    const lifecycleStatus = rawStatus ? rawStatus.toUpperCase() : existing.lifecycleStatus;

    const updated = await this.prisma.productTypeAttribute.update({
      where: { id: existing.id },
      data: {
        isRequired,
        displayOrder,
        lifecycleStatus,
        updatedAt: new Date(),
      },
      include: { attribute: true },
    });

    return {
      id: String(updated.id),
      product_type_attribute_id: String(updated.id),
      productTypeId: updated.productTypeId,
      attributeId: updated.attributeId,
      isRequired: updated.isRequired,
      displayOrder: updated.displayOrder,
      lifecycleStatus: updated.lifecycleStatus,
      attribute: this.toAttributeResponse(updated.attribute),
    };
  }

  async bulkSaveProductTypeAttributes(productTypeId: string, items: Array<any>) {
    const pt = await this.prisma.productType.findFirst({
      where: {
        OR: [{ id: productTypeId }, { productTypeCode: productTypeId.toUpperCase() }],
      },
    });
    if (!pt) {
      throw new NotFoundException(`Product Type "${productTypeId}" not found.`);
    }

    const allMasters = await this.prisma.attributeMaster.findMany();
    const masterMap = new Map<string, any>();
    for (const m of allMasters) {
      masterMap.set(m.id.toLowerCase(), m);
      masterMap.set(m.attributeCode.toLowerCase(), m);
      masterMap.set(m.attributeName.toLowerCase(), m);
    }

    // Delete existing assignments for this product type to allow clean sync
    await this.prisma.productTypeAttribute.deleteMany({
      where: { productTypeId: pt.id },
    });

    let order = 1;
    for (const item of items) {
      const targetKey = item.attribute_id || item.attributeId || item.id || item.code || item.attribute_code;
      if (!targetKey) continue;

      const matched = masterMap.get(String(targetKey).toLowerCase().trim());
      if (matched) {
        await this.prisma.productTypeAttribute.create({
          data: {
            productTypeId: pt.id,
            attributeId: matched.id,
            isRequired: item.is_required !== undefined ? item.is_required : (item.isRequired !== undefined ? item.isRequired : false),
            displayOrder: item.display_order || item.displayOrder || order++,
            lifecycleStatus: (item.lifecycle_status || item.lifecycleStatus || 'ACTIVE').toUpperCase(),
          },
        });
      }
    }

    return this.getProductTypeAttributes(pt.id);
  }

  async removeProductTypeAttribute(productTypeId: string, attributeId: string) {
    const pt = await this.prisma.productType.findFirst({
      where: {
        OR: [{ id: productTypeId }, { productTypeCode: productTypeId.toUpperCase() }],
      },
    });
    if (!pt) {
      throw new NotFoundException(`Product Type "${productTypeId}" not found.`);
    }

    const attr = await this.prisma.attributeMaster.findFirst({
      where: {
        OR: [{ id: attributeId }, { attributeCode: attributeId.toUpperCase() }],
      },
    });

    if (attr) {
      await this.prisma.productTypeAttribute.deleteMany({
        where: {
          productTypeId: pt.id,
          attributeId: attr.id,
        },
      });
    } else {
      await this.prisma.productTypeAttribute.deleteMany({
        where: {
          productTypeId: pt.id,
          attributeId,
        },
      });
    }

    return {
      success: true,
      message: `Attribute assignment removed from Product Type "${pt.productTypeName}". Global attribute definition was preserved.`,
    };
  }

  // Backward-compatibility helper
  async getCategoryAttributes(categoryId: string) {
    const cat = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: categoryId }, { categoryId }, { categoryCode: categoryId.toUpperCase() }],
      },
    });
    if (!cat) return [];
    return this.getProductTypeAttributes(cat.productTypeId);
  }

  // ===================================================================
  // CENTRAL ATTRIBUTE MASTER (ATTRIBUTE_MASTER)
  // ===================================================================

  async listAttributes(query?: AttributeMasterQueryDto) {
    const where: Prisma.AttributeMasterWhereInput = {};

    if (query?.activeOnly || query?.status === 'ACTIVE') {
      where.isActive = true;
    } else if (query?.status === 'INACTIVE') {
      where.isActive = false;
    }

    if (query?.dataType && query.dataType !== 'ALL') {
      where.dataType = { equals: query.dataType, mode: 'insensitive' };
    }

    const term = query?.search?.trim();
    if (term) {
      where.OR = [
        { attributeCode: { contains: term, mode: 'insensitive' } },
        { attributeName: { contains: term, mode: 'insensitive' } },
        { remark: { contains: term, mode: 'insensitive' } },
      ];
    }

    const totalElements = await this.prisma.attributeMaster.count({ where });

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      created_at: 'createdAt',
      updatedAt: 'updatedAt',
      updated_at: 'updatedAt',
      id: 'id',
      attributeCode: 'attributeCode',
      attribute_code: 'attributeCode',
      attributeName: 'attributeName',
      attribute_name: 'attributeName',
      name: 'attributeName',
      code: 'attributeCode',
      dataType: 'dataType',
      data_type: 'dataType',
    };

    const isPaginated = query?.page !== undefined || query?.size !== undefined || query?.limit !== undefined;
    const { skip, take, pageIndex, pageSize, orderBy } = getPaginationParams(
      query || {},
      allowedSortFields,
      'createdAt',
      'desc'
    );

    const attributes = await this.prisma.attributeMaster.findMany({
      where,
      include: {
        productTypeAttributes: {
          include: { productType: true },
          orderBy: [{ displayOrder: 'asc' }],
        },
      },
      orderBy: orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(isPaginated ? { skip, take } : {}),
    });

    const mappedAttrs = attributes.map((a) => this.toAttributeResponse(a));

    return createPageResponse(
      mappedAttrs,
      totalElements,
      pageIndex,
      isPaginated ? pageSize : totalElements || 1,
      {
        attributes: mappedAttrs,
      }
    );
  }

  async getAttributeById(id: string) {
    const attribute = await this.prisma.attributeMaster.findFirst({
      where: {
        OR: [{ id }, { attributeCode: id.toUpperCase() }],
      },
      include: {
        productTypeAttributes: {
          include: { productType: true },
          orderBy: [{ displayOrder: 'asc' }],
        },
      },
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with ID or code "${id}" not found.`);
    }

    return this.toAttributeResponse(attribute);
  }

  async createAttribute(dto: CreateAttributeMasterDto) {
    const rawCode = dto.attributeCode || dto.attribute_code || dto.code;
    if (!rawCode || !rawCode.trim()) {
      throw new BadRequestException('Attribute code is required.');
    }
    const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    const rawName = dto.attributeName || dto.attribute_name || dto.name;
    if (!rawName || !rawName.trim()) {
      throw new BadRequestException('Attribute name is required.');
    }
    const cleanName = rawName.trim();

    const existing = await this.prisma.attributeMaster.findFirst({
      where: {
        OR: [
          { attributeCode: { equals: cleanCode, mode: 'insensitive' } },
          ...(dto.id ? [{ id: dto.id }] : []),
          ...(dto.attribute_id ? [{ id: dto.attribute_id }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException(`Attribute Code "${cleanCode}" already exists. Attribute codes must be unique.`);
    }

    const id = dto.id?.trim() || dto.attribute_id?.trim() || dto.attributeId?.trim() || `attr_${cleanCode.toLowerCase()}`;
    const rawType = dto.dataType || dto.data_type || 'TEXT';
    const dataType = (typeof rawType === 'string' ? rawType.toUpperCase() : 'TEXT') as AttributeDataType;
    const unitOfMeasure = (dto.unitOfMeasure || dto.unit_of_measure || '').trim() || null;
    const remark = (dto.remark || dto.description || '').trim() || null;
    const allowedValues = dto.allowedValues || dto.allowed_values;
    const isFilterable = dto.isFilterable ?? dto.is_filterable ?? true;
    const isSearchable = dto.isSearchable ?? dto.is_searchable ?? true;
    const isRequired = dto.isRequired ?? dto.is_required ?? false;
    const isActive = dto.isActive ?? dto.is_active ?? true;

    const created = await this.prisma.attributeMaster.create({
      data: {
        id,
        attributeCode: cleanCode,
        attributeName: cleanName,
        dataType,
        unitOfMeasure,
        remark,
        allowedValues: allowedValues ? (allowedValues as Prisma.InputJsonValue) : Prisma.DbNull,
        isFilterable,
        isSearchable,
        isRequired,
        isActive,
      },
    });

    return this.toAttributeResponse(created);
  }

  async updateAttribute(id: string, dto: UpdateAttributeMasterDto) {
    const existing = await this.prisma.attributeMaster.findFirst({
      where: {
        OR: [{ id }, { attributeCode: id.toUpperCase() }],
      },
    });

    if (!existing) {
      throw new NotFoundException(`Attribute with ID or code "${id}" not found.`);
    }

    const rawCode = dto.attributeCode || dto.attribute_code || dto.code;
    let cleanCode: string | undefined;
    if (rawCode) {
      cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      if (cleanCode !== existing.attributeCode) {
        const conflict = await this.prisma.attributeMaster.findFirst({
          where: {
            id: { not: existing.id },
            attributeCode: { equals: cleanCode, mode: 'insensitive' },
          },
        });
        if (conflict) {
          throw new ConflictException(`Attribute Code "${cleanCode}" already exists.`);
        }
      }
    }

    const rawName = dto.attributeName || dto.attribute_name || dto.name;
    const rawType = dto.dataType || dto.data_type;
    const uom = dto.unitOfMeasure !== undefined ? dto.unitOfMeasure : dto.unit_of_measure;
    const rmk = dto.remark !== undefined ? dto.remark : dto.description;
    const allowedVals = dto.allowedValues !== undefined ? dto.allowedValues : dto.allowed_values;
    const filterable = dto.isFilterable !== undefined ? dto.isFilterable : dto.is_filterable;
    const searchable = dto.isSearchable !== undefined ? dto.isSearchable : dto.is_searchable;
    const required = dto.isRequired !== undefined ? dto.isRequired : dto.is_required;
    const active = dto.isActive !== undefined ? dto.isActive : dto.is_active;

    const updated = await this.prisma.attributeMaster.update({
      where: { id: existing.id },
      data: {
        attributeCode: cleanCode || undefined,
        attributeName: rawName !== undefined ? rawName.trim() : undefined,
        dataType: rawType ? (rawType.toUpperCase() as AttributeDataType) : undefined,
        unitOfMeasure: uom !== undefined ? (uom?.trim() || null) : undefined,
        remark: rmk !== undefined ? (rmk?.trim() || null) : undefined,
        allowedValues: allowedVals !== undefined ? (allowedVals as Prisma.InputJsonValue) : undefined,
        isFilterable: filterable !== undefined ? filterable : undefined,
        isSearchable: searchable !== undefined ? searchable : undefined,
        isRequired: required !== undefined ? required : undefined,
        isActive: active !== undefined ? active : undefined,
      },
    });

    return this.toAttributeResponse(updated);
  }

  async toggleAttributeStatus(id: string) {
    const existing = await this.prisma.attributeMaster.findFirst({
      where: {
        OR: [{ id }, { attributeCode: id.toUpperCase() }],
      },
    });

    if (!existing) {
      throw new NotFoundException(`Attribute with ID or code "${id}" not found.`);
    }

    const updated = await this.prisma.attributeMaster.update({
      where: { id: existing.id },
      data: {
        isActive: !existing.isActive,
      },
    });

    return this.toAttributeResponse(updated);
  }

  // ===================================================================
  // HELPER MAPPERS
  // ===================================================================

  private toAttributeResponse(a: any) {
    return {
      id: a.id,
      attribute_id: a.id,
      attributeId: a.id,
      attribute_code: a.attributeCode,
      attributeCode: a.attributeCode,
      code: a.attributeCode,
      attribute_name: a.attributeName,
      attributeName: a.attributeName,
      name: a.attributeName,
      data_type: a.dataType,
      dataType: a.dataType,
      unit_of_measure: a.unitOfMeasure,
      unitOfMeasure: a.unitOfMeasure,
      remark: a.remark,
      allowed_values: a.allowedValues,
      allowedValues: a.allowedValues,
      is_filterable: a.isFilterable,
      isFilterable: a.isFilterable,
      is_searchable: a.isSearchable,
      isSearchable: a.isSearchable,
      is_required: a.isRequired,
      isRequired: a.isRequired,
      is_active: a.isActive,
      isActive: a.isActive,
      status: a.isActive ? 'Active' : 'Inactive',
      created_at: a.createdAt?.toISOString?.() || a.createdAt,
      updated_at: a.updatedAt?.toISOString?.() || a.updatedAt,
      assignedProductTypes: (a.productTypeAttributes || []).map((pta: any) => ({
        id: String(pta.id),
        product_type_attribute_id: String(pta.id),
        productTypeId: pta.productTypeId,
        product_type_id: pta.productTypeId,
        productTypeCode: pta.productType?.productTypeCode,
        product_type_code: pta.productType?.productTypeCode,
        productTypeName: pta.productType?.productTypeName,
        product_type_name: pta.productType?.productTypeName,
        isRequired: pta.isRequired,
        is_required: pta.isRequired,
        displayOrder: pta.displayOrder,
        display_order: pta.displayOrder,
        lifecycleStatus: pta.lifecycleStatus,
        lifecycle_status: pta.lifecycleStatus,
      })),
      productTypes: (a.productTypeAttributes || []).map((pta: any) => pta.productType?.productTypeName || pta.productTypeId),
    };
  }

  private toProductResponse(p: any) {
    const nowIso = new Date().toISOString().split('T')[0];
    const availableFromStr = p.availableFrom ? p.availableFrom.toISOString().split('T')[0] : nowIso;
    const discontinuedOnStr = p.discontinuedOn ? p.discontinuedOn.toISOString().split('T')[0] : null;

    const attributesObj: Record<string, any> = { ...(p.attributes as any || {}) };
    if (p.productAttributes && Array.isArray(p.productAttributes)) {
      for (const pa of p.productAttributes) {
        const attrName = pa.attribute?.attributeName || pa.attributeId;
        const attrCode = pa.attribute?.attributeCode || pa.attributeId;
        attributesObj[attrName] = pa.attributeValue;
        attributesObj[attrCode] = pa.attributeValue;
      }
    }

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
      attributes: attributesObj,
      active: p.active,
      createdAt: p.createdAt ? p.createdAt.toISOString() : nowIso,
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : nowIso,

      // Relational attributes list
      productAttributes: (p.productAttributes || []).map((pa: any) => ({
        id: String(pa.id),
        attributeId: pa.attributeId,
        attribute_id: pa.attributeId,
        attributeCode: pa.attribute?.attributeCode,
        attribute_code: pa.attribute?.attributeCode,
        attributeName: pa.attribute?.attributeName,
        attribute_name: pa.attribute?.attributeName,
        dataType: pa.attribute?.dataType,
        data_type: pa.attribute?.dataType,
        unitOfMeasure: pa.attribute?.unitOfMeasure,
        unit_of_measure: pa.attribute?.unitOfMeasure,
        allowedValues: pa.attribute?.allowedValues,
        allowed_values: pa.attribute?.allowedValues,
        attributeValue: pa.attributeValue,
        attribute_value: pa.attributeValue,
      })),

      // Relational taxes list
      taxes: (p.productTaxes || []).map((t: any) => ({
        id: String(t.id),
        product_tax_id: String(t.id),
        productTaxId: String(t.id),
        productId: t.productId,
        product_id: t.productId,
        taxCode: t.taxCode,
        tax_code: t.taxCode,
        taxRate: Number(t.taxRate),
        tax_rate: Number(t.taxRate),
        effectiveFrom: t.effectiveFrom ? t.effectiveFrom.toISOString().split('T')[0] : null,
        effective_from: t.effectiveFrom ? t.effectiveFrom.toISOString().split('T')[0] : null,
        effectiveTo: t.effectiveTo ? t.effectiveTo.toISOString().split('T')[0] : null,
        effective_to: t.effectiveTo ? t.effectiveTo.toISOString().split('T')[0] : null,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        created_at: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        updated_at: t.updatedAt.toISOString(),
      })),

      // Relational UOMs list
      uoms: (p.productUoms || []).map((u: any) => ({
        id: String(u.id),
        product_uom_id: String(u.id),
        productUomId: String(u.id),
        productId: u.productId,
        product_id: u.productId,
        uom: u.uom,
        conversionFactor: Number(u.conversionFactor),
        conversion_factor: Number(u.conversionFactor),
        isBaseUom: Boolean(u.isBaseUom),
        is_base_uom: Boolean(u.isBaseUom),
        isOrderUom: Boolean(u.isOrderUom),
        is_order_uom: Boolean(u.isOrderUom),
        isActive: Boolean(u.isActive),
        is_active: Boolean(u.isActive),
        createdAt: u.createdAt.toISOString(),
        created_at: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        updated_at: u.updatedAt.toISOString(),
      })),

      // Relational prices list
      prices: (p.productPrices || []).map((pr: any) => ({
        id: String(pr.id),
        priceId: String(pr.id),
        productId: pr.productId,
        product_id: pr.productId,
        productManufacturerId: pr.productManufacturerId ? String(pr.productManufacturerId) : null,
        product_manufacturer_id: pr.productManufacturerId ? String(pr.productManufacturerId) : null,
        customerSegmentId: pr.customerSegmentId,
        customer_segment_id: pr.customerSegmentId,
        priceType: pr.priceType,
        price_type: pr.priceType,
        currency: pr.currency,
        unitPrice: Number(pr.unitPrice),
        unit_price: Number(pr.unitPrice),
        minQuantity: pr.minQuantity,
        min_quantity: pr.minQuantity,
        maxQuantity: pr.maxQuantity,
        max_quantity: pr.maxQuantity,
        effectiveFrom: pr.effectiveFrom ? pr.effectiveFrom.toISOString().split('T')[0] : null,
        effective_from: pr.effectiveFrom ? pr.effectiveFrom.toISOString().split('T')[0] : null,
        effectiveTo: pr.effectiveTo ? pr.effectiveTo.toISOString().split('T')[0] : null,
        effective_to: pr.effectiveTo ? pr.effectiveTo.toISOString().split('T')[0] : null,
        priceStatus: pr.priceStatus,
        price_status: pr.priceStatus,
      })),

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
      manufacturers: (p.manufacturerProducts || [])
        .filter((mp: any) => (mp.lifecycleStatus === 'ACTIVE' || mp.lifecycleStatus === undefined) && mp.registration?.status === 'APPROVED')
        .map((mp: any) => ({
          id: String(mp.registration?.id || mp.registrationId),
          companyName: mp.registration?.companyName || 'Verified Manufacturer',
          registrationCode: mp.registration?.registrationCode || '',
          manufacturerCode: mp.registration?.manufacturerCode || null,
          facilityAddress: mp.registration?.facilityAddress || '',
          city: mp.registration?.city || '',
          state: mp.registration?.state || '',
          moq: mp.moq ?? null,
          leadTimeDays: mp.leadTimeDays ?? null,
          status: mp.registration?.status || 'APPROVED',
        })),
    };
  }

  // ===================================================================
  // BRAND MASTER (BRAND)
  // ===================================================================

  async listBrands(query: BrandQueryDto) {
    const where: any = {};
    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.OR = [
        { brandName: { contains: q, mode: 'insensitive' } },
        { brandCode: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (query.status && query.status.toUpperCase() !== 'ALL') {
      where.lifecycleStatus = query.status.toUpperCase();
    }

    const brands = await this.prisma.brand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.size || 100,
      skip: (query.page || 0) * (query.size || 100),
    });

    return brands.map((b) => ({
      brand_id: b.brandId,
      brand_code: b.brandCode,
      brand_name: b.brandName,
      description: b.description || '',
      lifecycle_status: b.lifecycleStatus,
      created_at: b.createdAt.toISOString().split('T')[0],
      updated_at: b.updatedAt.toISOString().split('T')[0],
      id: b.id,
      code: b.brandCode,
      name: b.brandName,
      status: b.lifecycleStatus,
    }));
  }

  async getBrandById(id: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { OR: [{ id }, { brandId: id }, { brandCode: id }] },
    });
    if (!brand) {
      throw new NotFoundException(`Brand "${id}" not found.`);
    }
    return {
      brand_id: brand.brandId,
      brand_code: brand.brandCode,
      brand_name: brand.brandName,
      description: brand.description || '',
      lifecycle_status: brand.lifecycleStatus,
      created_at: brand.createdAt.toISOString().split('T')[0],
      updated_at: brand.updatedAt.toISOString().split('T')[0],
      id: brand.id,
      code: brand.brandCode,
      name: brand.brandName,
      status: brand.lifecycleStatus,
    };
  }

  async createBrand(dto: CreateBrandDto) {
    const cleanCode = dto.brandCode.trim().toUpperCase();
    const cleanName = dto.brandName.trim();

    const existing = await this.prisma.brand.findFirst({
      where: {
        OR: [
          { brandCode: cleanCode },
          { brandName: { equals: cleanName, mode: 'insensitive' } },
        ],
      },
    });
    if (existing) {
      throw new ConflictException(`Brand with code "${cleanCode}" or name "${cleanName}" already exists.`);
    }

    const brandId = 'brd_' + cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString(36);
    const created = await this.prisma.brand.create({
      data: {
        id: brandId,
        brandId,
        brandCode: cleanCode,
        brandName: cleanName,
        description: dto.description ? dto.description.trim() : null,
        lifecycleStatus: (dto.lifecycleStatus || 'ACTIVE').toUpperCase(),
      },
    });

    return {
      brand_id: created.brandId,
      brand_code: created.brandCode,
      brand_name: created.brandName,
      description: created.description || '',
      lifecycle_status: created.lifecycleStatus,
      created_at: created.createdAt.toISOString().split('T')[0],
      updated_at: created.updatedAt.toISOString().split('T')[0],
      id: created.id,
      code: created.brandCode,
      name: created.brandName,
      status: created.lifecycleStatus,
    };
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findFirst({
      where: { OR: [{ id }, { brandId: id }, { brandCode: id }] },
    });
    if (!brand) {
      throw new NotFoundException(`Brand "${id}" not found.`);
    }

    if (dto.brandCode && dto.brandCode.trim().toUpperCase() !== brand.brandCode) {
      const conflict = await this.prisma.brand.findFirst({
        where: { brandCode: dto.brandCode.trim().toUpperCase(), id: { not: brand.id } },
      });
      if (conflict) {
        throw new ConflictException(`Brand Code "${dto.brandCode}" is already taken.`);
      }
    }

    const updated = await this.prisma.brand.update({
      where: { id: brand.id },
      data: {
        brandCode: dto.brandCode ? dto.brandCode.trim().toUpperCase() : undefined,
        brandName: dto.brandName ? dto.brandName.trim() : undefined,
        description: dto.description !== undefined ? dto.description?.trim() : undefined,
        lifecycleStatus: dto.lifecycleStatus ? dto.lifecycleStatus.toUpperCase() : undefined,
        updatedAt: new Date(),
      },
    });

    return {
      brand_id: updated.brandId,
      brand_code: updated.brandCode,
      brand_name: updated.brandName,
      description: updated.description || '',
      lifecycle_status: updated.lifecycleStatus,
      created_at: updated.createdAt.toISOString().split('T')[0],
      updated_at: updated.updatedAt.toISOString().split('T')[0],
      id: updated.id,
      code: updated.brandCode,
      name: updated.brandName,
      status: updated.lifecycleStatus,
    };
  }

  async toggleBrandStatus(id: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { OR: [{ id }, { brandId: id }, { brandCode: id }] },
    });
    if (!brand) {
      throw new NotFoundException(`Brand "${id}" not found.`);
    }

    const nextStatus = brand.lifecycleStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await this.prisma.brand.update({
      where: { id: brand.id },
      data: { lifecycleStatus: nextStatus, updatedAt: new Date() },
    });

    return {
      brand_id: updated.brandId,
      brand_code: updated.brandCode,
      brand_name: updated.brandName,
      description: updated.description || '',
      lifecycle_status: updated.lifecycleStatus,
      created_at: updated.createdAt.toISOString().split('T')[0],
      updated_at: updated.updatedAt.toISOString().split('T')[0],
      id: updated.id,
      code: updated.brandCode,
      name: updated.brandName,
      status: updated.lifecycleStatus,
    };
  }

  async deleteBrand(id: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { OR: [{ id }, { brandId: id }, { brandCode: id }] },
    });
    if (!brand) {
      throw new NotFoundException(`Brand "${id}" not found.`);
    }

    // Check usage in catalog products
    const productCount = await this.prisma.catalogProduct.count({
      where: { OR: [{ brandId: brand.brandId }, { brand: brand.brandName }] },
    });
    if (productCount > 0) {
      throw new BadRequestException(`Cannot delete brand "${brand.brandName}": it is referenced by ${productCount} products in Catalog Master.`);
    }

    await this.prisma.brand.delete({ where: { id: brand.id } });
    return { success: true, message: `Brand "${brand.brandName}" deleted successfully.` };
  }

  // ===================================================================
  // MANUFACTURER MASTER (MANUFACTURER / ManufacturerRegistration)
  // ===================================================================

  async listAdminManufacturers(query: ManufacturerQueryDto) {
    const where: any = {};
    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.OR = [
        { companyName: { contains: q, mode: 'insensitive' } },
        { manufacturerCode: { contains: q, mode: 'insensitive' } },
        { registrationCode: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (query.status && query.status.toUpperCase() !== 'ALL') {
      const st = query.status.toUpperCase();
      where.OR = [
        { lifecycleStatus: st },
        { status: st === 'ACTIVE' ? 'APPROVED' : 'REJECTED' },
      ];
    }

    const mfgs = await this.prisma.manufacturerRegistration.findMany({
      where,
      orderBy: { id: 'desc' },
      take: query.size || 100,
      skip: (query.page || 0) * (query.size || 100),
    });

    return mfgs.map((m) => this.mapAdminManufacturer(m));
  }

  async getAdminManufacturerById(id: string) {
    const mfg = await this.findManufacturerByIdOrCode(id);
    if (!mfg) {
      throw new NotFoundException(`Manufacturer "${id}" not found.`);
    }
    return this.mapAdminManufacturer(mfg);
  }

  async createAdminManufacturer(dto: CreateAdminManufacturerDto) {
    const cleanCode = (dto.manufacturerCode || 'MFG' + String(Date.now()).slice(-6)).toUpperCase().trim();
    const regCode = 'REG-MFG-' + Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase();

    const created = await this.prisma.manufacturerRegistration.create({
      data: {
        registrationCode: regCode,
        manufacturerCode: cleanCode,
        companyName: dto.companyName.trim(),
        facilityAddress: dto.facilityAddress?.trim() || 'Industrial Estate',
        city: dto.city?.trim() || 'Plant City',
        state: dto.state?.trim() || 'State',
        pincode: dto.pincode?.trim() || '110001',
        contactPerson: dto.contactPerson?.trim() || 'Authorized Plant Head',
        designation: dto.designation?.trim() || 'Director of Operations',
        email: dto.email?.trim() || `mfg_${Date.now()}@factorygrid.in`,
        phone: dto.phone?.trim() || '+91 98000 00000',
        mfgCapacity: dto.mfgCapacity?.trim() || 'High Volume cGMP Facility',
        description: dto.description?.trim() || 'Certified pharmaceutical manufacturing facility and contract manufacturing organization.',
        lifecycleStatus: (dto.lifecycleStatus || 'ACTIVE').toUpperCase(),
        status: 'APPROVED',
        currentStep: 4,
        whoGmpApplicable: true,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        discontinuedOn: dto.discontinuedOn ? new Date(dto.discontinuedOn) : null,
      },
    });

    return this.mapAdminManufacturer(created);
  }

  async updateAdminManufacturer(id: string, dto: UpdateAdminManufacturerDto) {
    const mfg = await this.findManufacturerByIdOrCode(id);
    if (!mfg) {
      throw new NotFoundException(`Manufacturer "${id}" not found.`);
    }

    const updated = await this.prisma.manufacturerRegistration.update({
      where: { id: mfg.id },
      data: {
        companyName: dto.companyName !== undefined ? dto.companyName.trim() : undefined,
        manufacturerCode: dto.manufacturerCode !== undefined ? dto.manufacturerCode.trim().toUpperCase() : undefined,
        facilityAddress: dto.facilityAddress !== undefined ? dto.facilityAddress.trim() : undefined,
        city: dto.city !== undefined ? dto.city.trim() : undefined,
        state: dto.state !== undefined ? dto.state.trim() : undefined,
        pincode: dto.pincode !== undefined ? dto.pincode.trim() : undefined,
        contactPerson: dto.contactPerson !== undefined ? dto.contactPerson.trim() : undefined,
        designation: dto.designation !== undefined ? dto.designation.trim() : undefined,
        email: dto.email !== undefined ? dto.email.trim() : undefined,
        phone: dto.phone !== undefined ? dto.phone.trim() : undefined,
        mfgCapacity: dto.mfgCapacity !== undefined ? dto.mfgCapacity.trim() : undefined,
        description: dto.description !== undefined ? dto.description.trim() : undefined,
        lifecycleStatus: dto.lifecycleStatus !== undefined ? dto.lifecycleStatus.toUpperCase() : undefined,
        effectiveFrom: dto.effectiveFrom !== undefined ? (dto.effectiveFrom ? new Date(dto.effectiveFrom) : null) : undefined,
        discontinuedOn: dto.discontinuedOn !== undefined ? (dto.discontinuedOn ? new Date(dto.discontinuedOn) : null) : undefined,
        updatedAt: new Date(),
      },
    });

    return this.mapAdminManufacturer(updated);
  }

  async toggleAdminManufacturerStatus(id: string) {
    const mfg = await this.findManufacturerByIdOrCode(id);
    if (!mfg) {
      throw new NotFoundException(`Manufacturer "${id}" not found.`);
    }

    const currStatus = mfg.lifecycleStatus || (mfg.status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE');
    const nextStatus = currStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const updated = await this.prisma.manufacturerRegistration.update({
      where: { id: mfg.id },
      data: {
        lifecycleStatus: nextStatus,
        status: nextStatus === 'ACTIVE' ? 'APPROVED' : 'REJECTED',
        updatedAt: new Date(),
      },
    });

    return this.mapAdminManufacturer(updated);
  }

  async deleteAdminManufacturer(id: string) {
    const mfg = await this.findManufacturerByIdOrCode(id);
    if (!mfg) {
      throw new NotFoundException(`Manufacturer "${id}" not found.`);
    }

    const mappingCount = await this.prisma.manufacturerProduct.count({
      where: { registrationId: mfg.id },
    });
    if (mappingCount > 0) {
      throw new BadRequestException(`Cannot delete manufacturer "${mfg.companyName}": it has ${mappingCount} active product mappings. Deactivate or reassign mappings first.`);
    }

    await this.prisma.manufacturerRegistration.delete({ where: { id: mfg.id } });
    return { success: true, message: `Manufacturer "${mfg.companyName}" deleted successfully.` };
  }

  private async findManufacturerByIdOrCode(id: string) {
    try {
      const numId = BigInt(id);
      const byId = await this.prisma.manufacturerRegistration.findUnique({ where: { id: numId } });
      if (byId) return byId;
    } catch {}

    return this.prisma.manufacturerRegistration.findFirst({
      where: {
        OR: [
          { registrationCode: id },
          { manufacturerCode: id },
        ],
      },
    });
  }

  private mapAdminManufacturer(m: any) {
    const strId = String(m.id);
    const code = m.manufacturerCode || m.registrationCode;
    const isAct = (m.lifecycleStatus || (m.status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE';

    return {
      manufacturer_id: strId,
      manufacturer_code: code,
      manufacturer_name: m.companyName,
      description: m.description || 'Certified pharmaceutical manufacturing facility and contract manufacturing organization.',
      lifecycle_status: isAct ? 'ACTIVE' : 'INACTIVE',
      effective_from: m.effectiveFrom ? m.effectiveFrom.toISOString().split('T')[0] : (m.createdAt ? m.createdAt.toISOString().split('T')[0] : '2025-01-01'),
      discontinued_on: m.discontinuedOn ? m.discontinuedOn.toISOString().split('T')[0] : null,
      created_at: m.createdAt ? m.createdAt.toISOString().split('T')[0] : '2025-01-01',
      updated_at: m.updatedAt ? m.updatedAt.toISOString().split('T')[0] : '2026-08-01',

      // Backward compatibility aliases for UI and marketplace
      id: strId,
      code,
      companyName: m.companyName,
      name: m.companyName,
      facilityAddress: m.facilityAddress || '',
      city: m.city || 'Plant Location',
      state: m.state || 'State',
      pincode: m.pincode || '',
      contactPerson: m.contactPerson || 'Authorized Plant Head',
      designation: m.designation || 'Plant Manager',
      email: m.email || '',
      phone: m.phone || '',
      mfgCapacity: m.mfgCapacity || 'High Volume cGMP Facility',
      mfgLicenseNo: 'ML-FORM-25',
      gstin: '02AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      status: isAct ? 'ACTIVE' : 'INACTIVE',
      complianceStatus: m.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
      rating: 4.5,
      activeSubOrders: 0,
    };
  }

  // ===================================================================
  // PRODUCT MANUFACTURER MAPPINGS (PRODUCT_MANUFACTURER) - ADMIN
  // ===================================================================

  async listAdminProductManufacturerMappings(query: ProductManufacturerMappingQueryDto) {
    const where: any = {};

    if (query.productId) {
      where.productId = query.productId;
    }
    if (query.manufacturerId) {
      try {
        where.registrationId = BigInt(query.manufacturerId);
      } catch {}
    }
    if (query.status && query.status.toUpperCase() !== 'ALL') {
      where.lifecycleStatus = query.status.toUpperCase();
    }
    if (query.preferredOnly) {
      where.isPreferred = true;
    }

    const mappings = await this.prisma.manufacturerProduct.findMany({
      where,
      include: {
        registration: true,
        product: true,
      },
      orderBy: [{ isPreferred: 'desc' }, { id: 'desc' }],
      take: query.size || 100,
      skip: (query.page || 0) * (query.size || 100),
    });

    let mapped = mappings.map((mp) => this.mapProductManufacturerItem(mp));

    if (query.q && query.q.trim()) {
      const q = query.q.trim().toLowerCase();
      mapped = mapped.filter((item) =>
        item.productName.toLowerCase().includes(q) ||
        item.manufacturerName.toLowerCase().includes(q) ||
        item.manufacturer_product_code.toLowerCase().includes(q) ||
        item.productId.toLowerCase().includes(q)
      );
    }

    return mapped;
  }

  async getAdminProductManufacturerMappingById(id: string) {
    const numId = BigInt(id);
    const mp = await this.prisma.manufacturerProduct.findUnique({
      where: { id: numId },
      include: { registration: true, product: true },
    });
    if (!mp) {
      throw new NotFoundException(`Product-Manufacturer Mapping with ID "${id}" not found.`);
    }
    return this.mapProductManufacturerItem(mp);
  }

  async createAdminProductManufacturerMapping(dto: CreateProductManufacturerMappingDto) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: dto.productId }, { productCode: dto.productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${dto.productId}" not found.`);
    }

    const mfg = await this.findManufacturerByIdOrCode(dto.manufacturerId);
    if (!mfg) {
      throw new NotFoundException(`Manufacturer "${dto.manufacturerId}" not found.`);
    }

    if (dto.isPreferred) {
      await this.prisma.manufacturerProduct.updateMany({
        where: { productId: product.id },
        data: { isPreferred: false },
      });
    }

    const created = await this.prisma.manufacturerProduct.upsert({
      where: {
        registrationId_productId: {
          registrationId: mfg.id,
          productId: product.id,
        },
      },
      update: {
        manufacturerProductCode: dto.manufacturerProductCode || undefined,
        manufacturerPartNumber: dto.manufacturerPartNumber || undefined,
        manufacturerSku: dto.manufacturerSku || undefined,
        moq: dto.moq !== undefined ? dto.moq : undefined,
        leadTimeDays: dto.leadTimeDays !== undefined ? dto.leadTimeDays : undefined,
        lifecycleStatus: dto.lifecycleStatus ? dto.lifecycleStatus.toUpperCase() : 'ACTIVE',
        isPreferred: dto.isPreferred !== undefined ? dto.isPreferred : undefined,
        packagingDetails: dto.packagingDetails || undefined,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        updatedAt: new Date(),
      },
      create: {
        registrationId: mfg.id,
        productId: product.id,
        manufacturerProductCode: dto.manufacturerProductCode || null,
        manufacturerPartNumber: dto.manufacturerPartNumber || null,
        manufacturerSku: dto.manufacturerSku || null,
        moq: dto.moq || 100,
        leadTimeDays: dto.leadTimeDays || 14,
        lifecycleStatus: dto.lifecycleStatus ? dto.lifecycleStatus.toUpperCase() : 'ACTIVE',
        isPreferred: dto.isPreferred || false,
        packagingDetails: dto.packagingDetails || 'Standard Export Shipper',
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
      include: {
        registration: true,
        product: true,
      },
    });

    return this.mapProductManufacturerItem(created);
  }

  async updateAdminProductManufacturerMapping(id: string, dto: UpdateProductManufacturerMappingDto) {
    const numId = BigInt(id);
    const existing = await this.prisma.manufacturerProduct.findUnique({
      where: { id: numId },
    });
    if (!existing) {
      throw new NotFoundException(`Product-Manufacturer Mapping with ID "${id}" not found.`);
    }

    if (dto.isPreferred) {
      await this.prisma.manufacturerProduct.updateMany({
        where: { productId: existing.productId, id: { not: numId } },
        data: { isPreferred: false },
      });
    }

    const updated = await this.prisma.manufacturerProduct.update({
      where: { id: numId },
      data: {
        manufacturerProductCode: dto.manufacturerProductCode !== undefined ? dto.manufacturerProductCode : undefined,
        manufacturerPartNumber: dto.manufacturerPartNumber !== undefined ? dto.manufacturerPartNumber : undefined,
        manufacturerSku: dto.manufacturerSku !== undefined ? dto.manufacturerSku : undefined,
        moq: dto.moq !== undefined ? dto.moq : undefined,
        leadTimeDays: dto.leadTimeDays !== undefined ? dto.leadTimeDays : undefined,
        lifecycleStatus: dto.lifecycleStatus ? dto.lifecycleStatus.toUpperCase() : undefined,
        isPreferred: dto.isPreferred !== undefined ? dto.isPreferred : undefined,
        packagingDetails: dto.packagingDetails !== undefined ? dto.packagingDetails : undefined,
        effectiveFrom: dto.effectiveFrom !== undefined ? (dto.effectiveFrom ? new Date(dto.effectiveFrom) : null) : undefined,
        effectiveTo: dto.effectiveTo !== undefined ? (dto.effectiveTo ? new Date(dto.effectiveTo) : null) : undefined,
        updatedAt: new Date(),
      },
      include: {
        registration: true,
        product: true,
      },
    });

    return this.mapProductManufacturerItem(updated);
  }

  async setPreferredManufacturerMapping(id: string) {
    const numId = BigInt(id);
    const mapping = await this.prisma.manufacturerProduct.findUnique({
      where: { id: numId },
    });
    if (!mapping) {
      throw new NotFoundException(`Product-Manufacturer Mapping with ID "${id}" not found.`);
    }

    // Unset all other preferred mappings for this product
    await this.prisma.manufacturerProduct.updateMany({
      where: { productId: mapping.productId },
      data: { isPreferred: false },
    });

    const updated = await this.prisma.manufacturerProduct.update({
      where: { id: numId },
      data: { isPreferred: true, updatedAt: new Date() },
      include: { registration: true, product: true },
    });

    return this.mapProductManufacturerItem(updated);
  }

  async toggleAdminProductManufacturerMappingStatus(id: string) {
    const numId = BigInt(id);
    const mapping = await this.prisma.manufacturerProduct.findUnique({
      where: { id: numId },
    });
    if (!mapping) {
      throw new NotFoundException(`Product-Manufacturer Mapping with ID "${id}" not found.`);
    }

    const nextStatus = mapping.lifecycleStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await this.prisma.manufacturerProduct.update({
      where: { id: numId },
      data: { lifecycleStatus: nextStatus, updatedAt: new Date() },
      include: { registration: true, product: true },
    });

    return this.mapProductManufacturerItem(updated);
  }

  async deleteAdminProductManufacturerMapping(id: string) {
    const numId = BigInt(id);
    await this.prisma.manufacturerProduct.delete({ where: { id: numId } });
    return { success: true, message: 'Mapping deleted successfully.' };
  }

  private mapProductManufacturerItem(mp: any) {
    const strId = String(mp.id);
    const regId = String(mp.registrationId);
    const mfgCode = mp.registration?.manufacturerCode || mp.registration?.registrationCode || '';
    const mfgName = mp.registration?.companyName || 'Verified Manufacturer';
    const prdName = mp.product?.name || mp.productId;

    return {
      product_manufacturer_id: strId,
      id: strId,
      product_id: mp.productId,
      productId: mp.productId,
      productName: prdName,
      manufacturer_id: regId,
      manufacturerId: regId,
      manufacturer_code: mfgCode,
      manufacturerCode: mfgCode,
      manufacturer_name: mfgName,
      manufacturerName: mfgName,
      manufacturer_product_code: mp.manufacturerProductCode || '',
      mfgProductCode: mp.manufacturerProductCode || '',
      manufacturer_part_number: mp.manufacturerPartNumber || '',
      manufacturer_sku: mp.manufacturerSku || '',
      moq: mp.moq ?? 100,
      standardLeadTimeDays: mp.leadTimeDays ?? 14,
      lifecycle_status: mp.lifecycleStatus || 'ACTIVE',
      status: mp.lifecycleStatus === 'INACTIVE' ? 'Inactive' : 'Active',
      effective_from: mp.effectiveFrom ? mp.effectiveFrom.toISOString().split('T')[0] : (mp.createdAt ? mp.createdAt.toISOString().split('T')[0] : '2025-01-01'),
      effectiveFrom: mp.effectiveFrom ? mp.effectiveFrom.toISOString().split('T')[0] : (mp.createdAt ? mp.createdAt.toISOString().split('T')[0] : '2025-01-01'),
      effective_to: mp.effectiveTo ? mp.effectiveTo.toISOString().split('T')[0] : null,
      effectiveTo: mp.effectiveTo ? mp.effectiveTo.toISOString().split('T')[0] : null,
      is_preferred: mp.isPreferred || false,
      isPreferred: mp.isPreferred || false,
      packaging: mp.packagingDetails || 'Standard Export Shipper',
      created_at: mp.createdAt ? mp.createdAt.toISOString() : new Date().toISOString(),
      updated_at: mp.updatedAt ? mp.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

}
