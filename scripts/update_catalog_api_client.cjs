const fs = require('fs');
const path = 'frontend/src/services/catalogApi.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Update imports
code = code.replace(
  "import { Product, Category, AttributeMaster, CategoryAttribute, ProductAttribute, ProductType, ProductTypeAttribute, ProductPrice, ProductTax, ProductUom, CustomerSegment, PageResponse, PageableQuery } from '../types';",
  "import { Product, Category, AttributeMaster, CategoryAttribute, ProductAttribute, ProductType, ProductTypeAttribute, ProductPrice, ProductTax, ProductUom, CustomerSegment, Brand, Manufacturer, ProductManufacturer, PageResponse, PageableQuery } from '../types';"
);

// 2. Add methods before last closing brace
const methodsToAdd = `
  // ── BRAND MASTER (/api/v1/catalog/brands) ──
  async listBrands(params: { q?: string; status?: string; page?: number; size?: number } = {}): Promise<Brand[]> {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.status) sp.set('status', params.status);
    if (params.page !== undefined) sp.set('page', String(params.page));
    if (params.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString() ? \`?\${sp.toString()}\` : '';
    return request<Brand[]>(\`\${BASE}/brands\${qs}\`, { method: 'GET' });
  },

  async getBrand(id: string): Promise<Brand> {
    return request<Brand>(\`\${BASE}/brands/\${encodeURIComponent(id)}\`, { method: 'GET' });
  },

  async createBrand(payload: Partial<Brand>): Promise<Brand> {
    return request<Brand>(\`\${BASE}/brands\`, {
      method: 'POST',
      body: JSON.stringify({
        brandCode: payload.brand_code || payload.code,
        brandName: payload.brand_name || payload.name,
        description: payload.description,
        lifecycleStatus: payload.lifecycle_status || payload.status || 'ACTIVE',
      }),
    });
  },

  async updateBrand(id: string, payload: Partial<Brand>): Promise<Brand> {
    return request<Brand>(\`\${BASE}/brands/\${encodeURIComponent(id)}\`, {
      method: 'PUT',
      body: JSON.stringify({
        brandCode: payload.brand_code || payload.code,
        brandName: payload.brand_name || payload.name,
        description: payload.description,
        lifecycleStatus: payload.lifecycle_status || payload.status,
      }),
    });
  },

  async toggleBrandStatus(id: string): Promise<Brand> {
    return request<Brand>(\`\${BASE}/brands/\${encodeURIComponent(id)}/status\`, {
      method: 'PATCH',
    });
  },

  async deleteBrand(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(\`\${BASE}/brands/\${encodeURIComponent(id)}\`, {
      method: 'DELETE',
    });
  },

  // ── MANUFACTURER MASTER (/api/v1/catalog/manufacturers) ──
  async listManufacturers(params: { q?: string; status?: string; page?: number; size?: number } = {}): Promise<Manufacturer[]> {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.status) sp.set('status', params.status);
    if (params.page !== undefined) sp.set('page', String(params.page));
    if (params.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString() ? \`?\${sp.toString()}\` : '';
    return request<Manufacturer[]>(\`\${BASE}/manufacturers\${qs}\`, { method: 'GET' });
  },

  async getManufacturer(id: string): Promise<Manufacturer> {
    return request<Manufacturer>(\`\${BASE}/manufacturers/\${encodeURIComponent(id)}\`, { method: 'GET' });
  },

  async createManufacturer(payload: Partial<Manufacturer>): Promise<Manufacturer> {
    return request<Manufacturer>(\`\${BASE}/manufacturers\`, {
      method: 'POST',
      body: JSON.stringify({
        manufacturerCode: payload.manufacturer_code || payload.code,
        companyName: payload.manufacturer_name || payload.companyName || payload.name,
        facilityAddress: payload.facilities?.headquarters || payload.city,
        city: payload.city,
        state: payload.state,
        contactPerson: payload.contactPerson,
        email: payload.email,
        phone: payload.phone,
        description: payload.description,
        lifecycleStatus: payload.lifecycle_status || (payload.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'),
        effectiveFrom: payload.effective_from,
        discontinuedOn: payload.discontinued_on,
      }),
    });
  },

  async updateManufacturer(id: string, payload: Partial<Manufacturer>): Promise<Manufacturer> {
    return request<Manufacturer>(\`\${BASE}/manufacturers/\${encodeURIComponent(id)}\`, {
      method: 'PUT',
      body: JSON.stringify({
        manufacturerCode: payload.manufacturer_code || payload.code,
        companyName: payload.manufacturer_name || payload.companyName || payload.name,
        facilityAddress: payload.facilities?.headquarters || payload.city,
        city: payload.city,
        state: payload.state,
        contactPerson: payload.contactPerson,
        email: payload.email,
        phone: payload.phone,
        description: payload.description,
        lifecycleStatus: payload.lifecycle_status || (payload.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'),
        effectiveFrom: payload.effective_from,
        discontinuedOn: payload.discontinued_on,
      }),
    });
  },

  async toggleManufacturerStatus(id: string): Promise<Manufacturer> {
    return request<Manufacturer>(\`\${BASE}/manufacturers/\${encodeURIComponent(id)}/status\`, {
      method: 'PATCH',
    });
  },

  async deleteManufacturer(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(\`\${BASE}/manufacturers/\${encodeURIComponent(id)}\`, {
      method: 'DELETE',
    });
  },

  // ── PRODUCT MANUFACTURER MAPPINGS (/api/v1/catalog/product-manufacturers) ──
  async listMappings(params: { productId?: string; manufacturerId?: string; status?: string; preferredOnly?: boolean; q?: string; page?: number; size?: number } = {}): Promise<ProductManufacturer[]> {
    const sp = new URLSearchParams();
    if (params.productId) sp.set('productId', params.productId);
    if (params.manufacturerId) sp.set('manufacturerId', params.manufacturerId);
    if (params.status) sp.set('status', params.status);
    if (params.preferredOnly) sp.set('preferredOnly', 'true');
    if (params.q) sp.set('q', params.q);
    if (params.page !== undefined) sp.set('page', String(params.page));
    if (params.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString() ? \`?\${sp.toString()}\` : '';
    return request<ProductManufacturer[]>(\`\${BASE}/product-manufacturers\${qs}\`, { method: 'GET' });
  },

  async getMapping(id: string): Promise<ProductManufacturer> {
    return request<ProductManufacturer>(\`\${BASE}/product-manufacturers/\${encodeURIComponent(id)}\`, { method: 'GET' });
  },

  async createMapping(payload: Partial<ProductManufacturer>): Promise<ProductManufacturer> {
    return request<ProductManufacturer>(\`\${BASE}/product-manufacturers\`, {
      method: 'POST',
      body: JSON.stringify({
        productId: payload.product_id || payload.productId,
        manufacturerId: payload.manufacturer_id || payload.manufacturerId,
        manufacturerProductCode: payload.manufacturer_product_code || payload.mfgProductCode,
        manufacturerPartNumber: payload.manufacturer_part_number,
        manufacturerSku: payload.manufacturer_sku,
        moq: payload.moq,
        leadTimeDays: payload.standardLeadTimeDays,
        lifecycleStatus: payload.lifecycle_status || (payload.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'),
        isPreferred: payload.is_preferred ?? payload.isPreferred ?? false,
        packagingDetails: payload.packaging,
        effectiveFrom: payload.effective_from || payload.effectiveFrom,
        effectiveTo: payload.effective_to || payload.effectiveTo,
      }),
    });
  },

  async updateMapping(id: string, payload: Partial<ProductManufacturer>): Promise<ProductManufacturer> {
    return request<ProductManufacturer>(\`\${BASE}/product-manufacturers/\${encodeURIComponent(id)}\`, {
      method: 'PUT',
      body: JSON.stringify({
        manufacturerProductCode: payload.manufacturer_product_code || payload.mfgProductCode,
        manufacturerPartNumber: payload.manufacturer_part_number,
        manufacturerSku: payload.manufacturer_sku,
        moq: payload.moq,
        leadTimeDays: payload.standardLeadTimeDays,
        lifecycleStatus: payload.lifecycle_status || (payload.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'),
        isPreferred: payload.is_preferred ?? payload.isPreferred,
        packagingDetails: payload.packaging,
        effectiveFrom: payload.effective_from || payload.effectiveFrom,
        effectiveTo: payload.effective_to || payload.effectiveTo,
      }),
    });
  },

  async setPreferredMapping(id: string): Promise<ProductManufacturer> {
    return request<ProductManufacturer>(\`\${BASE}/product-manufacturers/\${encodeURIComponent(id)}/preferred\`, {
      method: 'PATCH',
    });
  },

  async toggleMappingStatus(id: string): Promise<ProductManufacturer> {
    return request<ProductManufacturer>(\`\${BASE}/product-manufacturers/\${encodeURIComponent(id)}/status\`, {
      method: 'PATCH',
    });
  },

  async deleteMapping(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(\`\${BASE}/product-manufacturers/\${encodeURIComponent(id)}\`, {
      method: 'DELETE',
    });
  },
`;

const lastIndex = code.lastIndexOf('}');
code = code.slice(0, lastIndex) + methodsToAdd + '\n};\n';

fs.writeFileSync(path, code, 'utf8');
console.log('frontend catalogApi.ts updated with Brand, Manufacturer, and Mapping methods.');
