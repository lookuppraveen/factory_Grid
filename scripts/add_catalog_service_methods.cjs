const fs = require('fs');
const path = 'backend/apps/factorygrid-api/src/modules/catalog/catalog.service.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add DTO import
if (!code.includes("from './dto/brand-mfg-mapping.dto'")) {
  code = `import {
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
` + code;
}

// 2. Add methods before last closing brace
const methodsToAdd = `
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
      throw new NotFoundException(\`Brand "\${id}" not found.\`);
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
      throw new ConflictException(\`Brand with code "\${cleanCode}" or name "\${cleanName}" already exists.\`);
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
      throw new NotFoundException(\`Brand "\${id}" not found.\`);
    }

    if (dto.brandCode && dto.brandCode.trim().toUpperCase() !== brand.brandCode) {
      const conflict = await this.prisma.brand.findFirst({
        where: { brandCode: dto.brandCode.trim().toUpperCase(), id: { not: brand.id } },
      });
      if (conflict) {
        throw new ConflictException(\`Brand Code "\${dto.brandCode}" is already taken.\`);
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
      throw new NotFoundException(\`Brand "\${id}" not found.\`);
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
      throw new NotFoundException(\`Brand "\${id}" not found.\`);
    }

    // Check usage in catalog products
    const productCount = await this.prisma.catalogProduct.count({
      where: { OR: [{ brandId: brand.brandId }, { brand: brand.brandName }] },
    });
    if (productCount > 0) {
      throw new BadRequestException(\`Cannot delete brand "\${brand.brandName}": it is referenced by \${productCount} products in Catalog Master.\`);
    }

    await this.prisma.brand.delete({ where: { id: brand.id } });
    return { success: true, message: \`Brand "\${brand.brandName}" deleted successfully.\` };
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
      throw new NotFoundException(\`Manufacturer "\${id}" not found.\`);
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
        email: dto.email?.trim() || \`mfg_\${Date.now()}@factorygrid.in\`,
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
      throw new NotFoundException(\`Manufacturer "\${id}" not found.\`);
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
      throw new NotFoundException(\`Manufacturer "\${id}" not found.\`);
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
      throw new NotFoundException(\`Manufacturer "\${id}" not found.\`);
    }

    const mappingCount = await this.prisma.manufacturerProduct.count({
      where: { registrationId: mfg.id },
    });
    if (mappingCount > 0) {
      throw new BadRequestException(\`Cannot delete manufacturer "\${mfg.companyName}": it has \${mappingCount} active product mappings. Deactivate or reassign mappings first.\`);
    }

    await this.prisma.manufacturerRegistration.delete({ where: { id: mfg.id } });
    return { success: true, message: \`Manufacturer "\${mfg.companyName}" deleted successfully.\` };
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
      throw new NotFoundException(\`Product-Manufacturer Mapping with ID "\${id}" not found.\`);
    }
    return this.mapProductManufacturerItem(mp);
  }

  async createAdminProductManufacturerMapping(dto: CreateProductManufacturerMappingDto) {
    const product = await this.prisma.catalogProduct.findFirst({
      where: { OR: [{ id: dto.productId }, { productCode: dto.productId }] },
    });
    if (!product) {
      throw new NotFoundException(\`Product "\${dto.productId}" not found.\`);
    }

    const mfg = await this.findManufacturerByIdOrCode(dto.manufacturerId);
    if (!mfg) {
      throw new NotFoundException(\`Manufacturer "\${dto.manufacturerId}" not found.\`);
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
      throw new NotFoundException(\`Product-Manufacturer Mapping with ID "\${id}" not found.\`);
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
      throw new NotFoundException(\`Product-Manufacturer Mapping with ID "\${id}" not found.\`);
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
      throw new NotFoundException(\`Product-Manufacturer Mapping with ID "\${id}" not found.\`);
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
`;

// Insert methodsToAdd right before the last closing brace
const lastIndex = code.lastIndexOf('}');
code = code.slice(0, lastIndex) + methodsToAdd + '\n}\n';

fs.writeFileSync(path, code, 'utf8');
console.log('catalog.service.ts updated with Brand, Manufacturer, and Mapping methods.');
