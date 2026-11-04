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
  ProductQueryDto,
  UpdateCatalogProductDto,
} from './dto/catalog-product.dto';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto/category-admin.dto';
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
        manufacturerProduct: {
          include: { registration: true },
        },
      },
      orderBy: [{ minQuantity: 'asc' }, { id: 'asc' }],
    });

    return prices.map((pr) => ({
      id: String(pr.id),
      price_id: String(pr.id),
      productId: pr.productId,
      product_id: pr.productId,
      productManufacturerId: pr.productManufacturerId ? String(pr.productManufacturerId) : null,
      product_manufacturer_id: pr.productManufacturerId ? String(pr.productManufacturerId) : null,
      manufacturerName: pr.manufacturerProduct?.registration?.companyName || null,
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
      createdAt: pr.createdAt.toISOString(),
      updatedAt: pr.updatedAt.toISOString(),
    }));
  }

  async createProductPrice(dto: CreateProductPriceDto) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: dto.productId }, { productCode: dto.productId }] },
    });
    if (!product) {
      throw new NotFoundException(`Product "${dto.productId}" not found.`);
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
    });

    return {
      id: String(created.id),
      productId: created.productId,
      unitPrice: Number(created.unitPrice),
      currency: created.currency,
      priceType: created.priceType,
      minQuantity: created.minQuantity,
      priceStatus: created.priceStatus,
      createdAt: created.createdAt.toISOString(),
    };
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

  async createCategory(dto: CreateCategoryDto) {
    const rawCode = dto.categoryCode || dto.category_code || dto.code;
    if (!rawCode || !rawCode.trim()) {
      throw new BadRequestException('Category Code is required.');
    }
    const codeClean = rawCode.trim().toUpperCase();

    const categoryName = (dto.category || dto.name || '').trim();
    if (!categoryName) {
      throw new BadRequestException('Category name is required.');
    }

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

    const id = dto.id?.trim() || dto.category_id?.trim() || dto.categoryId?.trim() || `CAT${Date.now().toString().slice(-6)}`;
    const categoryId = id;
    const rawStatus = dto.lifecycleStatus || dto.lifecycle_status || dto.status;
    const lifecycleStatus = rawStatus ? rawStatus.toUpperCase() : 'ACTIVE';
    const productTypeId = (dto.productTypeId || dto.product_type_id || 'pt_med').trim();
    const subCategory = (dto.subCategory || dto.sub_category || '').trim() || null;
    const subSubCategory = (dto.subSubCategory || dto.sub_sub_category || '').trim() || null;
    const displayOrder = dto.displayOrder ?? dto.display_order ?? 1;

    const created = await this.prisma.category.create({
      data: {
        id,
        categoryId,
        productTypeId,
        category: categoryName,
        subCategory,
        subSubCategory,
        categoryCode: codeClean,
        description: dto.description?.trim() || null,
        lifecycleStatus,
        displayOrder,
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
    return this.getCategoryById(created.id);
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
}
