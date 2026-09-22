import { Customer, Manufacturer, Product, RFQ, ManufacturerQuote, MasterOrder, Invoice, ComplianceCase, NotificationItem, ManufacturerProductMapping, CustomerVerificationRequest, CategoryMaster, SubCategoryMaster, SubSubCategoryMaster, CategoryMargin, MarginRule, InternalPriceListItem } from '../types';

export const mockCustomers: Customer[] = [
  {
    id: 'c1',
    code: 'CUS000101',
    name: 'Apex Pharma PCD Franchise',
    type: 'PCD',
    customerClassification: 'REGULAR',
    gstin: '07AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    drugLicenseNo: 'DL-DL-2024-88912',
    contactPerson: 'Rajesh Sharma',
    email: 'procurement@apexpharma.com',
    phone: '+91 98765 43210',
    city: 'New Delhi',
    state: 'Delhi',
    status: 'ACTIVE',
    complianceStatus: 'APPROVED',
    creditLimit: 2500000,
    availableCredit: 1650000,
    creditDays: 45,
    riskScore: 'LOW',
    joinedDate: '2025-02-10'
  },
  {
    id: 'c2',
    code: 'CUS000102',
    name: 'BioCure Healthcare (TPM)',
    type: 'TPM',
    customerClassification: 'REGULAR',
    gstin: '27BBBBB1111B1Z2',
    pan: 'BBBBB1111B',
    drugLicenseNo: 'MH-DL-2025-33412',
    contactPerson: 'Priya Nair',
    email: 'tpm@biocurehealth.in',
    phone: '+91 98111 22334',
    city: 'Mumbai',
    state: 'Maharashtra',
    status: 'ACTIVE',
    complianceStatus: 'APPROVED',
    creditLimit: 5000000,
    availableCredit: 2400000,
    creditDays: 60,
    riskScore: 'LOW',
    joinedDate: '2024-11-15'
  },
  {
    id: 'c3',
    code: 'CUS000103',
    name: 'Metro City Multi-Specialty Hospital',
    type: 'HOSPITAL',
    customerClassification: 'REGULAR',
    gstin: '29CCCCC2222C1Z8',
    pan: 'CCCCC2222C',
    drugLicenseNo: 'KA-DL-2024-99120',
    contactPerson: 'Dr. Suresh Rao',
    email: 'purchase@metrohospital.org',
    phone: '+91 99000 55443',
    city: 'Bengaluru',
    state: 'Karnataka',
    status: 'ACTIVE',
    complianceStatus: 'APPROVED',
    creditLimit: 3000000,
    availableCredit: 3000000,
    creditDays: 30,
    riskScore: 'LOW',
    joinedDate: '2025-01-20'
  },
  {
    id: 'c4',
    code: 'CUS000104',
    name: 'Zenith Global Pharma Exporters',
    type: 'EXPORT',
    customerClassification: 'REGULAR',
    gstin: '24DDDDD3333D1Z9',
    pan: 'DDDDD3333D',
    drugLicenseNo: 'GJ-DL-2026-11002',
    contactPerson: 'Vikram Mehta',
    email: 'exports@zenithpharma.com',
    phone: '+91 97222 88990',
    city: 'Ahmedabad',
    state: 'Gujarat',
    status: 'PENDING',
    complianceStatus: 'UNDER_REVIEW',
    creditLimit: 0,
    availableCredit: 0,
    creditDays: 0,
    riskScore: 'MEDIUM',
    joinedDate: '2026-07-28'
  },
  {
    id: 'c5',
    code: 'CUS000105',
    name: 'MediPlus Healthcare (Special Party Demo)',
    type: 'PCD',
    customerClassification: 'SPECIAL_PARTY',
    gstin: '06EEEEE5555E1Z7',
    pan: 'EEEEE5555E',
    drugLicenseNo: 'HR-DL-2025-44912',
    contactPerson: 'Dr. Ananya Sharma',
    email: 'procurement@mediplushealth.com',
    phone: '+91 98123 45678',
    city: 'Gurugram',
    state: 'Haryana',
    status: 'ACTIVE',
    complianceStatus: 'APPROVED',
    creditLimit: 7500000,
    availableCredit: 5200000,
    creditDays: 60,
    riskScore: 'LOW',
    joinedDate: '2025-01-15'
  }
];

export const mockManufacturers: Manufacturer[] = [
  {
    id: 'm1',
    code: 'MFG000401',
    name: 'SunBio LifeSciences Ltd',
    companyName: 'SunBio LifeSciences Ltd',
    mfgLicenseNo: 'HP-MFG-2021-99881',
    gstin: '02EEEEE4444E1Z4',
    pan: 'EEEEE4444E',
    contactPerson: 'Amit Gupta',
    email: 'orders@sunbiolife.com',
    phone: '+91 98450 11223',
    city: 'Baddi',
    state: 'Himachal Pradesh',
    certifications: [
      { id: 'cert1', name: 'WHO-GMP', certificateNo: 'WHO-GMP-2024-912', issuedBy: 'CDSCO', issueDate: '2024-01-10', expiryDate: '2027-01-09', status: 'VALID' },
      { id: 'cert2', name: 'ISO 9001:2015', certificateNo: 'ISO-9001-8841', issuedBy: 'TUV SUD', issueDate: '2023-05-15', expiryDate: '2026-05-14', status: 'EXPIRING_SOON' },
      { id: 'cert3_cdsco', name: 'CDSCO Form 25/28', certificateNo: 'CDSCO-LIC-44812', issuedBy: 'CDSCO North Zone', issueDate: '2022-09-01', expiryDate: '2027-08-31', status: 'VALID' }
    ],
    rating: 4.8,
    complianceStatus: 'APPROVED',
    status: 'ACTIVE',
    activeSubOrders: 4,
    description: 'Verified WHO-GMP compliant contract pharmaceutical manufacturing plant specializing in solid oral dosages and liquid formulations.',
    establishedYear: 2012,
    facilityInfo: {
      areaSqFt: '45,000 sq ft',
      cleanroomClass: 'Class 100,000 (ISO 8)',
      productionLines: '3 High-Speed Compression Lines, 2 Blister Packaging Lines, 1 Liquid Filling Line',
      rndCenter: true
    },
    manufacturingTypes: ['Contract Manufacturing (TPM)', 'Third Party Formulations', 'PCD Franchise Supply', 'Export Formulations'],
    capabilities: [
      { category: 'Tablets', monthlyCapacity: '25 Million Tabs / Month', dosageForms: ['Uncoated', 'Film Coated', 'Effervescent', 'Bilayered'], techTags: ['High Speed Rotary Press', 'Auto Coater', 'Alu-Alu Strip Packaging'] },
      { category: 'Capsules', monthlyCapacity: '12 Million Caps / Month', dosageForms: ['Hard Gelatin', 'HPMC Vegetarian Caps', 'Pellet In Capsule'], techTags: ['Automatic Encapsulation', 'Band Sealing'] },
      { category: 'Syrups & Liquids', monthlyCapacity: '3.5 Million Bottles / Month', dosageForms: ['Oral Suspension', 'Expectorants', 'Dry Syrup'], techTags: ['Monoblock Liquid Filling', 'RO Purified Water System'] },
      { category: 'Nutraceuticals', monthlyCapacity: '8 Million Tablets / Month', dosageForms: ['Multivitamin Chewable', 'Mineral Tablets', 'Effervescent Granules'], techTags: ['FSSAI Compliant Facility', 'Dehumidified Storage'] }
    ],
    shortlisted: true,
    performanceMetrics: {
      ordersCompleted: 24,
      onTimeDeliveryRate: 98.4,
      batchQualityPassRate: 99.8,
      avgRfqResponseHours: 14
    },
    ratingDetails: {
      overallRating: 4.8,
      totalReviews: 128,
      distribution: {
        fiveStar: 78,
        fourStar: 15,
        threeStar: 5,
        twoStar: 2,
        oneStar: 0
      },
      categoryRatings: {
        delivery: 4.8,
        quality: 4.9,
        communication: 4.7,
        compliance: 4.9
      },
      performance: {
        onTimeDeliveryRate: 98.4,
        qualityPassRate: 99.8,
        rfqResponseRate: 98.0,
        completedOrdersCount: 128
      },
      recentReviews: [
        {
          id: 'rev_1',
          buyerName: 'Apex Pharma Ltd',
          buyerCode: 'BUY-2026-001',
          orderNumber: 'MO-2026-1001',
          productName: 'Amoxyclav 625mg Tablets',
          rating: 5,
          date: '2026-08-10',
          comment: 'Apex Pharma delivered the order within the committed timeline with flawless COA clearance.',
          verifiedBuyer: true
        },
        {
          id: 'rev_2',
          buyerName: 'MedLife Hospital Chain',
          buyerCode: 'BUY-2026-002',
          orderNumber: 'MO-2026-1002',
          productName: 'Paracetamol 650mg ER Tablets',
          rating: 5,
          date: '2026-07-28',
          comment: 'Excellent Alu-Alu strip packaging and on-time cold chain dispatch.',
          verifiedBuyer: true
        },
        {
          id: 'rev_3',
          buyerName: 'BioCure Healthcare',
          buyerCode: 'BUY-2026-003',
          orderNumber: 'MO-2026-0988',
          productName: 'Pantoprazole 40mg Injection',
          rating: 4,
          date: '2026-06-15',
          comment: 'High quality batch documentation and prompt customer service response.',
          verifiedBuyer: true
        }
      ]
    }
  },
  {
    id: 'm2',
    code: 'MFG000402',
    name: 'Cipla Partner Formulations Ltd',
    companyName: 'Cipla Partner Formulations Ltd',
    mfgLicenseNo: 'GJ-MFG-2020-55123',
    gstin: '24FFFFF5555F1Z1',
    pan: 'FFFFF5555F',
    contactPerson: 'Karan Patel',
    email: 'b2b@ciplapartner.com',
    phone: '+91 98250 44556',
    city: 'Vapi',
    state: 'Gujarat',
    certifications: [
      { id: 'cert3', name: 'WHO-GMP', certificateNo: 'WHO-GMP-2023-401', issuedBy: 'CDSCO', issueDate: '2023-08-01', expiryDate: '2026-07-31', status: 'EXPIRING_SOON' },
      { id: 'cert4', name: 'EU-GMP Certified', certificateNo: 'EUGMP-9012', issuedBy: 'EMA', issueDate: '2024-03-12', expiryDate: '2027-03-11', status: 'VALID' },
      { id: 'cert5_iso', name: 'ISO 14001:2015', certificateNo: 'ISO-14001-9921', issuedBy: 'DNV', issueDate: '2023-01-15', expiryDate: '2026-01-14', status: 'VALID' }
    ],
    rating: 4.9,
    complianceStatus: 'APPROVED',
    status: 'ACTIVE',
    activeSubOrders: 6,
    description: 'Premier EU-GMP and WHO-GMP approved contract manufacturing facility with automated cleanroom lines.',
    establishedYear: 2008,
    facilityInfo: {
      areaSqFt: '72,000 sq ft',
      cleanroomClass: 'Class 10,000 (ISO 7)',
      productionLines: '5 High-Speed Compression Lines, 4 Blister Lines, 2 Injectable Lines',
      rndCenter: true
    },
    manufacturingTypes: ['Contract Manufacturing (TPM)', 'Export Formulations', 'Specialty Injectables'],
    capabilities: [
      { category: 'Tablets', monthlyCapacity: '40 Million Tabs / Month', dosageForms: ['Sustained Release', 'Enteric Coated', 'Dispersible'], techTags: ['Fette Rotary Press', 'Laser Inspection System'] },
      { category: 'Injectables', monthlyCapacity: '5 Million Vials / Month', dosageForms: ['Liquid Vials', 'Lyophilized Powders', 'Ampoules'], techTags: ['Aseptic Filling Line', 'Terminal Sterilization'] },
      { category: 'Capsules', monthlyCapacity: '18 Million Caps / Month', dosageForms: ['Hard Gelatin', 'Modified Release Granules'], techTags: ['Bosch Capsule Filler'] }
    ],
    shortlisted: false,
    performanceMetrics: {
      ordersCompleted: 38,
      onTimeDeliveryRate: 99.1,
      batchQualityPassRate: 99.9,
      avgRfqResponseHours: 8
    },
    ratingDetails: {
      overallRating: 4.9,
      totalReviews: 184,
      distribution: {
        fiveStar: 86,
        fourStar: 11,
        threeStar: 3,
        twoStar: 0,
        oneStar: 0
      },
      categoryRatings: {
        delivery: 4.9,
        quality: 5.0,
        communication: 4.8,
        compliance: 4.9
      },
      performance: {
        onTimeDeliveryRate: 99.1,
        qualityPassRate: 99.9,
        rfqResponseRate: 99.0,
        completedOrdersCount: 184
      },
      recentReviews: [
        {
          id: 'rev_m2_1',
          buyerName: 'Global Health Alliance',
          buyerCode: 'BUY-2026-004',
          orderNumber: 'MO-2026-1004',
          productName: 'Specialty Injectable Ampoules',
          rating: 5,
          date: '2026-08-12',
          comment: 'EU-GMP standards adhered to 100%. Outstanding batch consistency.',
          verifiedBuyer: true
        }
      ]
    }
  },
  {
    id: 'm3',
    code: 'MFG000403',
    name: 'Lupin Bio-Tech Labs',
    companyName: 'Lupin Bio-Tech Labs',
    mfgLicenseNo: 'MP-MFG-2022-77412',
    gstin: '23GGGGG6666G1Z7',
    pan: 'GGGGG6666G',
    contactPerson: 'Sneha Verma',
    email: 'supply@lupinbiotech.com',
    phone: '+91 97555 33221',
    city: 'Pithampur',
    state: 'Madhya Pradesh',
    certifications: [
      { id: 'cert5', name: 'WHO-GMP', certificateNo: 'WHO-GMP-2025-102', issuedBy: 'CDSCO', issueDate: '2025-01-05', expiryDate: '2028-01-04', status: 'VALID' },
      { id: 'cert6_iso', name: 'ISO 9001:2015', certificateNo: 'ISO-9001-3321', issuedBy: 'BSI', issueDate: '2024-06-10', expiryDate: '2027-06-09', status: 'VALID' }
    ],
    rating: 4.6,
    complianceStatus: 'APPROVED',
    status: 'ACTIVE',
    activeSubOrders: 2,
    description: 'WHO-GMP certified oral solid dosage and nutraceutical manufacturing facility located in Pithampur SEZ.',
    establishedYear: 2016,
    facilityInfo: {
      areaSqFt: '38,000 sq ft',
      cleanroomClass: 'Class 100,000 (ISO 8)',
      productionLines: '2 Tablet Lines, 2 Capsule Lines',
      rndCenter: false
    },
    manufacturingTypes: ['Third Party Formulation', 'PCD Franchise Supply'],
    capabilities: [
      { category: 'Tablets', monthlyCapacity: '18 Million Tabs / Month', dosageForms: ['Film Coated', 'Chewable'], techTags: ['High Speed Press', 'Cold Form Blister'] },
      { category: 'Nutraceuticals', monthlyCapacity: '6 Million Units / Month', dosageForms: ['Effervescent Granules', 'Multivitamin Strips'], techTags: ['Humidity Controlled Cleanroom'] }
    ],
    shortlisted: false,
    performanceMetrics: {
      ordersCompleted: 15,
      onTimeDeliveryRate: 96.5,
      batchQualityPassRate: 99.4,
      avgRfqResponseHours: 18
    },
    ratingDetails: {
      overallRating: 4.6,
      totalReviews: 64,
      distribution: {
        fiveStar: 68,
        fourStar: 22,
        threeStar: 7,
        twoStar: 3,
        oneStar: 0
      },
      categoryRatings: {
        delivery: 4.5,
        quality: 4.7,
        communication: 4.6,
        compliance: 4.7
      },
      performance: {
        onTimeDeliveryRate: 96.5,
        qualityPassRate: 99.4,
        rfqResponseRate: 94.0,
        completedOrdersCount: 64
      },
      recentReviews: [
        {
          id: 'rev_m3_1',
          buyerName: 'Zenith Global Exporters',
          buyerCode: 'BUY-2026-005',
          orderNumber: 'MO-2026-0955',
          productName: 'Effervescent Granules',
          rating: 5,
          date: '2026-07-20',
          comment: 'Great support for export documentation and WHO-GMP compliance certificates.',
          verifiedBuyer: true
        }
      ]
    }
  },
  {
    id: 'm4',
    code: 'MFG000404',
    name: 'BioCure Pharmaceuticals Ltd',
    companyName: 'BioCure Pharmaceuticals Ltd',
    brandName: 'BioCure',
    mfgLicenseNo: 'MH-MFG-2022-88192',
    gstin: '27GGGGG7777G1Z5',
    pan: 'GGGGG7777G',
    contactPerson: 'Priya Nair',
    email: 'orders@biocurepharma.com',
    phone: '+91 98111 22334',
    city: 'Mumbai',
    state: 'Maharashtra',
    certifications: [
      { id: 'cert_bc_1', name: 'WHO-GMP', certificateNo: 'WHO-GMP-2024-512', issuedBy: 'CDSCO', issueDate: '2024-02-10', expiryDate: '2027-02-09', status: 'VALID' },
      { id: 'cert_bc_2', name: 'ISO 9001:2015', certificateNo: 'ISO-9001-9941', issuedBy: 'TUV', issueDate: '2023-04-15', expiryDate: '2026-04-14', status: 'VALID' }
    ],
    rating: 4.7,
    complianceStatus: 'APPROVED',
    status: 'ACTIVE',
    activeSubOrders: 3,
    description: 'Specialized formulation facility producing solid oral dosages, topical dermatological products, and contract manufactured pharmaceuticals.',
    establishedYear: 2014,
    facilityInfo: {
      areaSqFt: '50,000 sq ft',
      cleanroomClass: 'Class 10,000 (ISO 7)',
      productionLines: '3 Tablet Lines, 2 Capsule Lines, 1 Ointment/Gel Line',
      rndCenter: true
    },
    manufacturingTypes: ['Contract Manufacturing (TPM)', 'Third Party Formulations', 'Topical Solutions'],
    capabilities: [
      { category: 'Tablets', monthlyCapacity: '30 Million Tabs / Month', dosageForms: ['Film Coated', 'Dispersible', 'Effervescent'], techTags: ['High Speed Compression', 'Auto Coater'] },
      { category: 'Capsules', monthlyCapacity: '15 Million Caps / Month', dosageForms: ['Hard Gelatin', 'Modified Release'], techTags: ['Automatic Encapsulation'] }
    ],
    shortlisted: true,
    performanceMetrics: {
      ordersCompleted: 28,
      onTimeDeliveryRate: 98.0,
      batchQualityPassRate: 99.7,
      avgRfqResponseHours: 12
    }
  },
  {
    id: 'mfg_fg_direct',
    code: 'FGD-001',
    name: 'FactoryGrid Direct / Generic Supply',
    companyName: 'FactoryGrid Direct / Generic Supply',
    brandName: 'FactoryGrid Direct',
    mfgLicenseNo: 'DL-FG-DIRECT-2026-001',
    gstin: '29AAFCS9999P1Z8',
    pan: 'AAFCS9999P',
    contactPerson: 'Generic Supply Desk',
    email: 'generics@factorygrid.com',
    phone: '+91 80 4567 8900',
    city: 'Bengaluru',
    state: 'Karnataka',
    rating: 4.9,
    complianceStatus: 'APPROVED',
    status: 'ACTIVE',
    activeSubOrders: 0,
    description: 'Internal procurement and direct wholesale supply channel for unbranded Generic Medicines. Operates on transparent platform cost-plus pricing.',
    manufacturingTypes: ['Generic Direct Sourcing', 'Platform Supply Pool'],
    establishedYear: 2024,
    capabilities: [
      { category: 'Drugs', monthlyCapacity: '100 Million Units / Month', dosageForms: ['Tablets', 'Capsules', 'Injections', 'Syrups'], techTags: ['Internal Price List Sourced', 'Direct Distribution'] }
    ],
    performanceMetrics: {
      ordersCompleted: 45,
      onTimeDeliveryRate: 99.5,
      batchQualityPassRate: 99.9,
      avgRfqResponseHours: 1
    }
  }
];

export const mockCategories: CategoryMaster[] = [
  {
    id: 'cat_drugs',
    code: 'CAT-DRG',
    name: 'Drugs',
    description: 'Allopathic pharmaceutical drug formulations including tablets, capsules, injections, syrups, and topical forms',
    status: 'Active',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10',
    productCount: 13
  },
  {
    id: 'cat_nutra',
    code: 'CAT-NUT',
    name: 'Nutraceuticals/Food',
    description: 'Dietary supplements, nutraceutical formulations, functional foods, vitamins, minerals, and botanical extracts',
    status: 'Active',
    createdAt: '2026-01-15',
    updatedAt: '2026-08-10',
    productCount: 1
  },
  {
    id: 'cat_cos',
    code: 'CAT-COS',
    name: 'Cosmetics',
    description: 'Cosmetic and personal care formulations including serums, creams, gels, shampoos, lotions, and patches',
    status: 'Active',
    createdAt: '2026-01-20',
    updatedAt: '2026-08-01',
    productCount: 0
  },
  {
    id: 'cat_ayur',
    code: 'CAT-AYR',
    name: 'Ayur/Herbal',
    description: 'Ayurvedic and herbal formulations including syrups, juices, malts, powders, granules, gels, and creams',
    status: 'Active',
    createdAt: '2026-02-01',
    updatedAt: '2026-08-05',
    productCount: 0
  },
  {
    id: 'cat_vet',
    code: 'CAT-VET',
    name: 'Veterinary',
    description: 'Veterinary pharmaceutical and health products for animal care',
    status: 'Active',
    createdAt: '2026-02-10',
    updatedAt: '2026-07-25',
    productCount: 0
  },
  {
    id: 'cat_surg',
    code: 'CAT-SRG',
    name: 'Surgical',
    description: 'Surgical consumables and equipment including gloves, kits, cannula, IV sets, syringes, hospital beds, and equipments',
    status: 'Active',
    createdAt: '2026-02-15',
    updatedAt: '2026-08-02',
    productCount: 0
  }
];

export const mockSubCategories: SubCategoryMaster[] = [
  // ── Drugs ─────────────────────────────────────────────
  { id: 'sub_drg_1', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Tablets', code: 'SUB-DRG-TAB', description: 'Solid unit dosage formulations, compressed tablets', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_2', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Effervescent Tablets', code: 'SUB-DRG-EFF', description: 'Soluble effervescent solid oral formulations', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_3', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Soft Gelatin Capsule', code: 'SUB-DRG-SGC', description: 'Encapsulated liquid/semi-solid oil-based formulations', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_4', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Hard Gelatin Capsule', code: 'SUB-DRG-HGC', description: 'Two-piece gelatin shell encapsulated dry powder formulations', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_5', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Liquid Injections', code: 'SUB-DRG-LIQ', description: 'Sterile ready-to-inject small and large volume parenterals', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_6', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Dry Injections', code: 'SUB-DRG-DRY', description: 'Sterile lyophilized/dry powder injectable vials', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_7', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'I.V.', code: 'SUB-DRG-IV', description: 'Large volume intravenous infusion formulations (BFS/FFS)', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_8', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Syrup', code: 'SUB-DRG-SYR', description: 'Oral liquid solution and flavored pharmaceutical syrups', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_9', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Suspension', code: 'SUB-DRG-SUS', description: 'Oral heterogeneous liquid suspensions and pediatric drops', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_10', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Ointments/Gel/Cream', code: 'SUB-DRG-OGC', description: 'Topical semi-solid dermatological creams, gels, and ointments', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_11', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Powder/Sachets', code: 'SUB-DRG-POW', description: 'Oral rehydration and therapeutic powders in moisture-barrier sachets', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_12', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Eye/Ear Drops', code: 'SUB-DRG-EED', description: 'Sterile ophthalmic and otic drop formulations', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },
  { id: 'sub_drg_13', categoryId: 'cat_drugs', parentCategory: 'Drugs', name: 'Solutions', code: 'SUB-DRG-SOL', description: 'External, oral, and antiseptic pharmaceutical solutions', status: 'Active', createdAt: '2026-01-10', updatedAt: '2026-08-10' },

  // ── Nutraceuticals / Food ─────────────────────────────
  { id: 'sub_nut_1', categoryId: 'cat_nutra', parentCategory: 'Nutraceuticals/Food', name: 'Tablets', code: 'SUB-NUT-TAB', description: 'Dietary supplement, multivitamin, and mineral tablets', status: 'Active', createdAt: '2026-01-15', updatedAt: '2026-08-10' },
  { id: 'sub_nut_2', categoryId: 'cat_nutra', parentCategory: 'Nutraceuticals/Food', name: 'Effervescent Tablets', code: 'SUB-NUT-EFF', description: 'Fast-dissolving vitamin C and electrolyte effervescent tablets', status: 'Active', createdAt: '2026-01-15', updatedAt: '2026-08-10' },
  { id: 'sub_nut_3', categoryId: 'cat_nutra', parentCategory: 'Nutraceuticals/Food', name: 'Soft Gelatin Capsule', code: 'SUB-NUT-SGC', description: 'Omega-3, Fish oil, CoQ10, and fat-soluble vitamin softgels', status: 'Active', createdAt: '2026-01-15', updatedAt: '2026-08-10' },
  { id: 'sub_nut_4', categoryId: 'cat_nutra', parentCategory: 'Nutraceuticals/Food', name: 'Hard Gelatin Capsule', code: 'SUB-NUT-HGC', description: 'Probiotic and herbal extract dietary supplement capsules', status: 'Active', createdAt: '2026-01-15', updatedAt: '2026-08-10' },
  { id: 'sub_nut_5', categoryId: 'cat_nutra', parentCategory: 'Nutraceuticals/Food', name: 'Syrup', code: 'SUB-NUT-SYR', description: 'Nutritional tonics, iron and multivitamin oral syrups', status: 'Active', createdAt: '2026-01-15', updatedAt: '2026-08-10' },
  { id: 'sub_nut_6', categoryId: 'cat_nutra', parentCategory: 'Nutraceuticals/Food', name: 'Suspension', code: 'SUB-NUT-SUS', description: 'Oral liquid calcium, vitamin D3, and zinc suspensions', status: 'Active', createdAt: '2026-01-15', updatedAt: '2026-08-10' },
  { id: 'sub_nut_7', categoryId: 'cat_nutra', parentCategory: 'Nutraceuticals/Food', name: 'Gel/Cream', code: 'SUB-NUT-GCR', description: 'Nutritional edible gels and fortified topical nourishment', status: 'Active', createdAt: '2026-01-15', updatedAt: '2026-08-10' },
  { id: 'sub_nut_8', categoryId: 'cat_nutra', parentCategory: 'Nutraceuticals/Food', name: 'Powder/Sachets', code: 'SUB-NUT-POW', description: 'Protein powders, collagen peptide and prebiotic sachets', status: 'Active', createdAt: '2026-01-15', updatedAt: '2026-08-10' },
  { id: 'sub_nut_9', categoryId: 'cat_nutra', parentCategory: 'Nutraceuticals/Food', name: 'Granules', code: 'SUB-NUT-GRA', description: 'Fortified nutritional and dietary food granules', status: 'Active', createdAt: '2026-01-15', updatedAt: '2026-08-10' },

  // ── Cosmetics ─────────────────────────────────────────
  { id: 'sub_cos_1', categoryId: 'cat_cos', parentCategory: 'Cosmetics', name: 'Serums', code: 'SUB-COS-SER', description: 'Facial active serums, Vitamin C, Hyaluronic acid serums', status: 'Active', createdAt: '2026-01-20', updatedAt: '2026-08-01' },
  { id: 'sub_cos_2', categoryId: 'cat_cos', parentCategory: 'Cosmetics', name: 'Gel', code: 'SUB-COS-GEL', description: 'Aloe vera, soothing, and hydrating cosmetic facial gels', status: 'Active', createdAt: '2026-01-20', updatedAt: '2026-08-01' },
  { id: 'sub_cos_3', categoryId: 'cat_cos', parentCategory: 'Cosmetics', name: 'Cream', code: 'SUB-COS-CRM', description: 'Moisturizing, anti-aging, and brightening cosmetic creams', status: 'Active', createdAt: '2026-01-20', updatedAt: '2026-08-01' },
  { id: 'sub_cos_4', categoryId: 'cat_cos', parentCategory: 'Cosmetics', name: 'Powder', code: 'SUB-COS-POW', description: 'Cosmetic setting, brightening, and dermatological powders', status: 'Active', createdAt: '2026-01-20', updatedAt: '2026-08-01' },
  { id: 'sub_cos_5', categoryId: 'cat_cos', parentCategory: 'Cosmetics', name: 'Shampoo', code: 'SUB-COS-SHM', description: 'Cleansing, anti-dandruff, and hair nourishing shampoos', status: 'Active', createdAt: '2026-01-20', updatedAt: '2026-08-01' },
  { id: 'sub_cos_6', categoryId: 'cat_cos', parentCategory: 'Cosmetics', name: 'Lotions', code: 'SUB-COS-LOT', description: 'Body hydrating lotions and sunscreens', status: 'Active', createdAt: '2026-01-20', updatedAt: '2026-08-01' },
  { id: 'sub_cos_7', categoryId: 'cat_cos', parentCategory: 'Cosmetics', name: 'Patches', code: 'SUB-COS-PAT', description: 'Under-eye, hydrocolloid, and dermal cosmetic patches', status: 'Active', createdAt: '2026-01-20', updatedAt: '2026-08-01' },

  // ── Ayur/Herbal ───────────────────────────────────────
  { id: 'sub_ayr_1', categoryId: 'cat_ayur', parentCategory: 'Ayur/Herbal', name: 'Syrup', code: 'SUB-AYR-SYR', description: 'Classical and proprietary ayurvedic liquid syrups and asavas', status: 'Active', createdAt: '2026-02-01', updatedAt: '2026-08-05' },
  { id: 'sub_ayr_2', categoryId: 'cat_ayur', parentCategory: 'Ayur/Herbal', name: 'Juices', code: 'SUB-AYR-JUC', description: 'Pure herbal juices like Amla, Aloe Vera, Giloy, Karela', status: 'Active', createdAt: '2026-02-01', updatedAt: '2026-08-05' },
  { id: 'sub_ayr_3', categoryId: 'cat_ayur', parentCategory: 'Ayur/Herbal', name: 'Malt', code: 'SUB-AYR-MLT', description: 'Nutritive herbal malts, Chyawanprash, and herbal lehyams', status: 'Active', createdAt: '2026-02-01', updatedAt: '2026-08-05' },
  { id: 'sub_ayr_4', categoryId: 'cat_ayur', parentCategory: 'Ayur/Herbal', name: 'Powder', code: 'SUB-AYR-POW', description: 'Ayurvedic churnas, botanical powders, and herb blends', status: 'Active', createdAt: '2026-02-01', updatedAt: '2026-08-05' },
  { id: 'sub_ayr_5', categoryId: 'cat_ayur', parentCategory: 'Ayur/Herbal', name: 'Gel', code: 'SUB-AYR-GEL', description: 'Herbal pain-relief and skin rejuvenation ayurvedic gels', status: 'Active', createdAt: '2026-02-01', updatedAt: '2026-08-05' },
  { id: 'sub_ayr_6', categoryId: 'cat_ayur', parentCategory: 'Ayur/Herbal', name: 'Cream', code: 'SUB-AYR-CRM', description: 'Herbal antiseptic, soothing, and restorative creams', status: 'Active', createdAt: '2026-02-01', updatedAt: '2026-08-05' },
  { id: 'sub_ayr_7', categoryId: 'cat_ayur', parentCategory: 'Ayur/Herbal', name: 'Granules', code: 'SUB-AYR-GRA', description: 'Herbal tea granules, kwath granules, and soluble extracts', status: 'Active', createdAt: '2026-02-01', updatedAt: '2026-08-05' },

  // ── Surgical ──────────────────────────────────────────
  { id: 'sub_srg_1', categoryId: 'cat_surg', parentCategory: 'Surgical', name: 'Gloves', code: 'SUB-SRG-GLV', description: 'Sterile surgical examination latex and nitrile gloves', status: 'Active', createdAt: '2026-02-15', updatedAt: '2026-08-02' },
  { id: 'sub_srg_2', categoryId: 'cat_surg', parentCategory: 'Surgical', name: 'Kits', code: 'SUB-SRG-KIT', description: 'Surgical drapes, gown kits, and pre-op procedure packs', status: 'Active', createdAt: '2026-02-15', updatedAt: '2026-08-02' },
  { id: 'sub_srg_3', categoryId: 'cat_surg', parentCategory: 'Surgical', name: 'Canula', code: 'SUB-SRG-CAN', description: 'I.V. Cannula with port and wings, radio-opaque catheter', status: 'Active', createdAt: '2026-02-15', updatedAt: '2026-08-02' },
  { id: 'sub_srg_4', categoryId: 'cat_surg', parentCategory: 'Surgical', name: 'IV sets', code: 'SUB-SRG-IVS', description: 'Sterile vented infusion sets and blood administration sets', status: 'Active', createdAt: '2026-02-15', updatedAt: '2026-08-02' },
  { id: 'sub_srg_5', categoryId: 'cat_surg', parentCategory: 'Surgical', name: 'Syringes', code: 'SUB-SRG-SYR', description: 'Disposable single-use sterile syringes with hypodermic needles', status: 'Active', createdAt: '2026-02-15', updatedAt: '2026-08-02' },
  { id: 'sub_srg_6', categoryId: 'cat_surg', parentCategory: 'Surgical', name: 'Hospital beds', code: 'SUB-SRG-BED', description: 'ICU hospital beds, semi-fowler, and manual recovery patient beds', status: 'Active', createdAt: '2026-02-15', updatedAt: '2026-08-02' },
  { id: 'sub_srg_7', categoryId: 'cat_surg', parentCategory: 'Surgical', name: 'Consumable', code: 'SUB-SRG-CON', description: 'Gauze, bandages, cotton, surgical blades, and consumables', status: 'Active', createdAt: '2026-02-15', updatedAt: '2026-08-02' },
  { id: 'sub_srg_8', categoryId: 'cat_surg', parentCategory: 'Surgical', name: 'Equipments', code: 'SUB-SRG-EQP', description: 'Autoclaves, suction apparatus, and diagnostic surgical instruments', status: 'Active', createdAt: '2026-02-15', updatedAt: '2026-08-02' }
];

export const mockSubSubCategories: SubSubCategoryMaster[] = [
  // ── Tablets (sub_drg_1 under Drugs) ────────────────────────
  {
    id: 'ssc_drg_tab_1',
    subCategoryId: 'sub_drg_1',
    categoryId: 'cat_drugs',
    parentCategory: 'Drugs',
    parentSubCategory: 'Tablets',
    name: 'Uncoated Tablets',
    code: 'SSC-DRG-TAB-UNC',
    description: 'Directly compressed solid unit dosage tablets without specialized coating film',
    status: 'Active',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10'
  },
  {
    id: 'ssc_drg_tab_2',
    subCategoryId: 'sub_drg_1',
    categoryId: 'cat_drugs',
    parentCategory: 'Drugs',
    parentSubCategory: 'Tablets',
    name: 'Film Coated Tablets',
    code: 'SSC-DRG-TAB-FLM',
    description: 'Tablets coated with thin aqueous or solvent-based polymeric protective film for swallowability',
    status: 'Active',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10'
  },
  {
    id: 'ssc_drg_tab_3',
    subCategoryId: 'sub_drg_1',
    categoryId: 'cat_drugs',
    parentCategory: 'Drugs',
    parentSubCategory: 'Tablets',
    name: 'Enteric Coated Tablets',
    code: 'SSC-DRG-TAB-ENT',
    description: 'Delayed-release gastro-resistant coated tablets engineered for intestinal dissolution',
    status: 'Active',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10'
  },
  {
    id: 'ssc_drg_tab_4',
    subCategoryId: 'sub_drg_1',
    categoryId: 'cat_drugs',
    parentCategory: 'Drugs',
    parentSubCategory: 'Tablets',
    name: 'Chewable Tablets',
    code: 'SSC-DRG-TAB-CHW',
    description: 'Flavored, palatably formulated tablets designed to be masticated prior to ingestion',
    status: 'Active',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10'
  },

  // ── Capsules (sub_drg_3 & sub_drg_4 under Drugs) ────────────
  {
    id: 'ssc_drg_cap_1',
    subCategoryId: 'sub_drg_4',
    categoryId: 'cat_drugs',
    parentCategory: 'Drugs',
    parentSubCategory: 'Hard Gelatin Capsule',
    name: 'Hard Gelatin Capsules',
    code: 'SSC-DRG-HGC-STD',
    description: 'Two-piece telescoping gelatin capsule shells filled with dry powder, granules, or pellets',
    status: 'Active',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10'
  },
  {
    id: 'ssc_drg_cap_2',
    subCategoryId: 'sub_drg_3',
    categoryId: 'cat_drugs',
    parentCategory: 'Drugs',
    parentSubCategory: 'Soft Gelatin Capsule',
    name: 'Soft Gelatin Capsules',
    code: 'SSC-DRG-SGC-STD',
    description: 'Hermetically sealed one-piece softgel capsules encapsulating liquid or semi-solid formulations',
    status: 'Active',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10'
  },

  // ── Injections (sub_drg_5 under Drugs) ──────────────────────
  {
    id: 'ssc_drg_inj_1',
    subCategoryId: 'sub_drg_5',
    categoryId: 'cat_drugs',
    parentCategory: 'Drugs',
    parentSubCategory: 'Liquid Injections',
    name: 'IV Injection',
    code: 'SSC-DRG-LIQ-IV',
    description: 'Sterile intravenous injections for direct venous administration and bolus infusions',
    status: 'Active',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10'
  },
  {
    id: 'ssc_drg_inj_2',
    subCategoryId: 'sub_drg_5',
    categoryId: 'cat_drugs',
    parentCategory: 'Drugs',
    parentSubCategory: 'Liquid Injections',
    name: 'IM Injection',
    code: 'SSC-DRG-LIQ-IM',
    description: 'Sterile intramuscular parenterals formulated for deep muscular tissue injection',
    status: 'Active',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10'
  },
  {
    id: 'ssc_drg_inj_3',
    subCategoryId: 'sub_drg_5',
    categoryId: 'cat_drugs',
    parentCategory: 'Drugs',
    parentSubCategory: 'Liquid Injections',
    name: 'SC Injection',
    code: 'SSC-DRG-LIQ-SC',
    description: 'Sterile subcutaneous parenterals for hypodermic adipose tissue administration',
    status: 'Active',
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10'
  }
];

export const mockCategoryMargins: CategoryMargin[] = [
  {
    categoryId: 'cat_drugs',
    categoryName: 'Drugs',
    categoryCode: 'CAT-DRG',
    marginType: 'PERCENTAGE',
    marginPercentage: 10,
    status: 'Active',
    updatedAt: '2026-08-15',
    updatedBy: 'Admin (System)'
  },
  {
    categoryId: 'cat_nutra',
    categoryName: 'Nutraceuticals/Food',
    categoryCode: 'CAT-NUT',
    marginType: 'PERCENTAGE',
    marginPercentage: 12,
    status: 'Active',
    updatedAt: '2026-08-15',
    updatedBy: 'Admin (System)'
  },
  {
    categoryId: 'cat_cos',
    categoryName: 'Cosmetics',
    categoryCode: 'CAT-COS',
    marginType: 'PERCENTAGE',
    marginPercentage: 8,
    status: 'Active',
    updatedAt: '2026-08-15',
    updatedBy: 'Admin (System)'
  },
  {
    categoryId: 'cat_ayur',
    categoryName: 'Ayur/Herbal',
    categoryCode: 'CAT-AYR',
    marginType: 'PERCENTAGE',
    marginPercentage: 10,
    status: 'Active',
    updatedAt: '2026-08-15',
    updatedBy: 'Admin (System)'
  },
  {
    categoryId: 'cat_vet',
    categoryName: 'Veterinary',
    categoryCode: 'CAT-VET',
    marginType: 'PERCENTAGE',
    marginPercentage: 10,
    status: 'Active',
    updatedAt: '2026-08-15',
    updatedBy: 'Admin (System)'
  },
  {
    categoryId: 'cat_surg',
    categoryName: 'Surgical',
    categoryCode: 'CAT-SRG',
    marginType: 'PERCENTAGE',
    marginPercentage: 7,
    status: 'Active',
    updatedAt: '2026-08-15',
    updatedBy: 'Admin (System)'
  }
];

export const mockMarginRules: MarginRule[] = [
  // 1. Default Platform Margin Rule (Priority 5)
  {
    margin_rule_id: 'mr_default',
    manufacturer_id: null,
    category_id: null,
    product_id: null,
    sku_id: null,
    margin_percentage: 10,
    priority: 5,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin (System)',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // 2. Category Margin Rules (Priority 4)
  {
    margin_rule_id: 'mr_cat_drugs',
    manufacturer_id: null,
    category_id: 'cat_drugs',
    category_name: 'Drugs',
    product_id: null,
    sku_id: null,
    margin_percentage: 10,
    priority: 4,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin (System)',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  {
    margin_rule_id: 'mr_cat_nutra',
    manufacturer_id: null,
    category_id: 'cat_nutra',
    category_name: 'Nutraceuticals/Food',
    product_id: null,
    sku_id: null,
    margin_percentage: 12,
    priority: 4,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin (System)',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  {
    margin_rule_id: 'mr_cat_cos',
    manufacturer_id: null,
    category_id: 'cat_cos',
    category_name: 'Cosmetics',
    product_id: null,
    sku_id: null,
    margin_percentage: 8,
    priority: 4,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin (System)',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  {
    margin_rule_id: 'mr_cat_ayur',
    manufacturer_id: null,
    category_id: 'cat_ayur',
    category_name: 'Ayur/Herbal',
    product_id: null,
    sku_id: null,
    margin_percentage: 10,
    priority: 4,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin (System)',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  {
    margin_rule_id: 'mr_cat_vet',
    manufacturer_id: null,
    category_id: 'cat_vet',
    category_name: 'Veterinary',
    product_id: null,
    sku_id: null,
    margin_percentage: 10,
    priority: 4,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin (System)',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  {
    margin_rule_id: 'mr_cat_surg',
    manufacturer_id: null,
    category_id: 'cat_surg',
    category_name: 'Surgical',
    product_id: null,
    sku_id: null,
    margin_percentage: 7,
    priority: 4,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin (System)',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // 3. Manufacturer-Level Margin Rules (Priority 3)
  // Manufacturer: Cipla, Margin: 10% (Percentage)
  {
    margin_rule_id: 'mr_mfg_cipla',
    scope_type: 'MANUFACTURER',
    manufacturer_id: 'm2',
    manufacturer_name: 'Cipla Partner Formulations Ltd',
    category_id: null,
    category_name: null,
    product_id: null,
    sku_id: null,
    margin_type: 'PERCENTAGE',
    margin_value: 10,
    margin_percentage: 10,
    priority: 3,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // Manufacturer: SunBio LifeSciences, Margin: 12% (Percentage)
  {
    margin_rule_id: 'mr_mfg_sunbio',
    scope_type: 'MANUFACTURER',
    manufacturer_id: 'm1',
    manufacturer_name: 'SunBio LifeSciences Ltd',
    category_id: null,
    category_name: null,
    product_id: null,
    sku_id: null,
    margin_type: 'PERCENTAGE',
    margin_value: 12,
    margin_percentage: 12,
    priority: 3,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // Manufacturer: Lupin Bio-Tech Labs, Margin: ₹5/unit (Fixed Rate)
  {
    margin_rule_id: 'mr_mfg_lupin',
    scope_type: 'MANUFACTURER',
    manufacturer_id: 'm3',
    manufacturer_name: 'Lupin Bio-Tech Labs',
    category_id: null,
    category_name: null,
    product_id: null,
    sku_id: null,
    margin_type: 'FIXED_RATE',
    margin_value: 5,
    margin_rate: 5,
    margin_percentage: 0,
    priority: 3,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // Manufacturer: BioCure, Margin: 8% (Percentage)
  {
    margin_rule_id: 'mr_mfg_biocure',
    scope_type: 'MANUFACTURER',
    manufacturer_id: 'm4',
    manufacturer_name: 'BioCure Pharmaceuticals Ltd',
    category_id: null,
    category_name: null,
    product_id: null,
    sku_id: null,
    margin_type: 'PERCENTAGE',
    margin_value: 8,
    margin_percentage: 8,
    priority: 3,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // FactoryGrid Direct / Generic Supply (Generic products supplier/source)
  {
    margin_rule_id: 'mr_mfg_fg_direct',
    scope_type: 'MANUFACTURER',
    manufacturer_id: 'mfg_fg_direct',
    manufacturer_name: 'FactoryGrid Direct / Generic Supply',
    category_id: null,
    category_name: null,
    product_id: null,
    sku_id: null,
    margin_type: 'PERCENTAGE',
    margin_value: 10,
    margin_percentage: 10,
    priority: 3,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // 4. Manufacturer + Category Margin Rules (Priority 2)
  // Cipla + Drugs = 12%
  {
    margin_rule_id: 'mr_mfg_cat_cipla_drugs',
    manufacturer_id: 'm2',
    manufacturer_name: 'Cipla Partner Formulations Ltd',
    category_id: 'cat_drugs',
    category_name: 'Drugs',
    product_id: null,
    sku_id: null,
    margin_percentage: 12,
    priority: 2,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // Cipla + Cosmetics = 15%
  {
    margin_rule_id: 'mr_mfg_cat_cipla_cosmetics',
    manufacturer_id: 'm2',
    manufacturer_name: 'Cipla Partner Formulations Ltd',
    category_id: 'cat_cos',
    category_name: 'Cosmetics',
    product_id: null,
    sku_id: null,
    margin_percentage: 15,
    priority: 2,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // 5. Product/SKU-Specific Margin Rules (Priority 1 - Authoritative Single Source of Truth)
  // Cipla Partner Formulations: Paracetamol 500mg = 10% (Percentage)
  {
    margin_rule_id: 'mr_sku_cipla_pcm_500',
    scope_type: 'PRODUCT',
    manufacturer_id: 'm2',
    manufacturer_name: 'Cipla Partner Formulations Ltd',
    category_id: null,
    category_name: null,
    product_id: 'p6',
    sku_id: 'PCM-500',
    margin_type: 'PERCENTAGE',
    margin_value: 10,
    margin_percentage: 10,
    priority: 1,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // Cipla Partner Formulations: Paracetamol 650mg = ₹15/unit (Fixed Rate)
  {
    margin_rule_id: 'mr_sku_cipla_pcm_650',
    scope_type: 'PRODUCT',
    manufacturer_id: 'm2',
    manufacturer_name: 'Cipla Partner Formulations Ltd',
    category_id: null,
    category_name: null,
    product_id: 'p2',
    sku_id: 'PCM-650',
    margin_type: 'FIXED_RATE',
    margin_value: 15,
    margin_rate: 15,
    margin_percentage: 0,
    priority: 1,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // Cipla Partner Formulations: Azithromycin 500mg = 12% (Percentage)
  {
    margin_rule_id: 'mr_sku_cipla_azi_500',
    scope_type: 'PRODUCT',
    manufacturer_id: 'm2',
    manufacturer_name: 'Cipla Partner Formulations Ltd',
    category_id: null,
    category_name: null,
    product_id: 'p3',
    sku_id: 'AZI-500',
    margin_type: 'PERCENTAGE',
    margin_value: 12,
    margin_percentage: 12,
    priority: 1,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // SunBio LifeSciences: Amoxyclav 625mg = 8% (Percentage)
  {
    margin_rule_id: 'mr_sku_sunbio_amx_625',
    scope_type: 'PRODUCT',
    manufacturer_id: 'm1',
    manufacturer_name: 'SunBio LifeSciences Ltd',
    category_id: null,
    category_name: null,
    product_id: 'p1',
    sku_id: 'AMX-625',
    margin_type: 'PERCENTAGE',
    margin_value: 8,
    margin_percentage: 8,
    priority: 1,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // SunBio LifeSciences: Paracetamol 500mg = 15% (Percentage) [Different from Cipla's 10%]
  {
    margin_rule_id: 'mr_sku_sunbio_pcm_500',
    scope_type: 'PRODUCT',
    manufacturer_id: 'm1',
    manufacturer_name: 'SunBio LifeSciences Ltd',
    category_id: null,
    category_name: null,
    product_id: 'p6',
    sku_id: 'PCM-500',
    margin_type: 'PERCENTAGE',
    margin_value: 15,
    margin_percentage: 15,
    priority: 1,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // SunBio LifeSciences: Paracetamol 650mg = ₹20/unit (Fixed Rate) [Different from Cipla's ₹15]
  {
    margin_rule_id: 'mr_sku_sunbio_pcm_650',
    scope_type: 'PRODUCT',
    manufacturer_id: 'm1',
    manufacturer_name: 'SunBio LifeSciences Ltd',
    category_id: null,
    category_name: null,
    product_id: 'p2',
    sku_id: 'PCM-650',
    margin_type: 'FIXED_RATE',
    margin_value: 20,
    margin_rate: 20,
    margin_percentage: 0,
    priority: 1,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // Lupin Bio-Tech Labs: Pantoprazole + Domperidone = ₹5/unit (Fixed Rate)
  {
    margin_rule_id: 'mr_sku_lupin_pan_070',
    scope_type: 'PRODUCT',
    manufacturer_id: 'm3',
    manufacturer_name: 'Lupin Bio-Tech Labs',
    category_id: null,
    category_name: null,
    product_id: 'p4',
    sku_id: 'PAN-070',
    margin_type: 'FIXED_RATE',
    margin_value: 5,
    margin_rate: 5,
    margin_percentage: 0,
    priority: 1,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  },
  // BioCure Pharmaceuticals: Metformin SR 500mg = 8% (Percentage)
  {
    margin_rule_id: 'mr_sku_biocure_met_500',
    scope_type: 'PRODUCT',
    manufacturer_id: 'm4',
    manufacturer_name: 'BioCure Pharmaceuticals Ltd',
    category_id: null,
    category_name: null,
    product_id: 'p5',
    sku_id: 'MET-500',
    margin_type: 'PERCENTAGE',
    margin_value: 8,
    margin_percentage: 8,
    priority: 1,
    status: 'Active',
    effective_from: '2026-01-01',
    created_by: 'Admin',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-08-15T00:00:00.000Z'
  }
];

export const mockInternalPriceList: InternalPriceListItem[] = [
  {
    id: 'fgi-001',
    molecule: 'Paracetamol',
    productName: 'Paracetamol 500mg Tablets (Generic)',
    dosageForm: 'Tablet',
    strength: '500mg',
    packSize: '10 x 10 Strip',
    internalPrice: 4.20,
    currency: 'INR',
    moq: 1000,
    effectiveDate: '2026-01-01',
    category: 'Drugs',
    status: 'ACTIVE'
  },
  {
    id: 'fgi-002',
    molecule: 'Paracetamol',
    productName: 'Paracetamol 650mg Tablets (Generic)',
    dosageForm: 'Tablet',
    strength: '650mg',
    packSize: '10 x 15 Strip',
    internalPrice: 6.80,
    currency: 'INR',
    moq: 1000,
    effectiveDate: '2026-01-01',
    category: 'Drugs',
    status: 'ACTIVE'
  },
  {
    id: 'fgi-003',
    molecule: 'Amoxicillin',
    productName: 'Amoxicillin 250mg Capsules (Generic)',
    dosageForm: 'Capsule',
    strength: '250mg',
    packSize: '10 x 10 Strip',
    internalPrice: 16.50,
    currency: 'INR',
    moq: 1000,
    effectiveDate: '2026-01-01',
    category: 'Drugs',
    status: 'ACTIVE'
  },
  {
    id: 'fgi-004',
    molecule: 'Amoxicillin + Clavulanate',
    productName: 'Amoxicillin 500mg + Clavulanic Acid 125mg Tablets (Generic)',
    dosageForm: 'Tablet',
    strength: '625mg',
    packSize: '10 x 1 x 10 Strip',
    internalPrice: 32.00,
    currency: 'INR',
    moq: 1000,
    effectiveDate: '2026-01-01',
    category: 'Drugs',
    status: 'ACTIVE'
  },
  {
    id: 'fgi-005',
    molecule: 'Azithromycin',
    productName: 'Azithromycin 500mg Tablets (Generic)',
    dosageForm: 'Tablet',
    strength: '500mg',
    packSize: '10 x 3 Strip',
    internalPrice: 11.20,
    currency: 'INR',
    moq: 500,
    effectiveDate: '2026-01-01',
    category: 'Drugs',
    status: 'ACTIVE'
  },
  {
    id: 'fgi-006',
    molecule: 'Pantoprazole',
    productName: 'Pantoprazole 40mg Tablets (Generic)',
    dosageForm: 'Tablet',
    strength: '40mg',
    packSize: '10 x 10 Strip',
    internalPrice: 8.50,
    currency: 'INR',
    moq: 1000,
    effectiveDate: '2026-01-01',
    category: 'Drugs',
    status: 'ACTIVE'
  },
  {
    id: 'fgi-007',
    molecule: 'Metformin',
    productName: 'Metformin 500mg SR Tablets (Generic)',
    dosageForm: 'Tablet',
    strength: '500mg',
    packSize: '10 x 15 Strip',
    internalPrice: 3.80,
    currency: 'INR',
    moq: 2000,
    effectiveDate: '2026-01-01',
    category: 'Drugs',
    status: 'ACTIVE'
  },
  {
    id: 'fgi-008',
    molecule: 'Ceftriaxone',
    productName: 'Ceftriaxone 1000mg Injection Vial (Generic)',
    dosageForm: 'Injection',
    strength: '1g',
    packSize: '1 Vial + WFI',
    internalPrice: 48.00,
    currency: 'INR',
    moq: 500,
    effectiveDate: '2026-01-01',
    category: 'Drugs',
    status: 'ACTIVE'
  },
  {
    id: 'fgi-009',
    molecule: 'Atorvastatin',
    productName: 'Atorvastatin 10mg Tablets (Generic)',
    dosageForm: 'Tablet',
    strength: '10mg',
    packSize: '10 x 10 Strip',
    internalPrice: 5.40,
    currency: 'INR',
    moq: 1000,
    effectiveDate: '2026-01-01',
    category: 'Drugs',
    status: 'ACTIVE'
  }
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    code: 'PRD001001',
    sku: 'AMX-625',
    name: 'Amoxyclav 625mg Tablets',
    genericName: 'Amoxicillin + Potassium Clavulanate',
    saltCombination: 'Amoxicillin Trihydrate 500mg + Clavulanic Acid 125mg',
    dosageForm: 'Tablet',
    strength: '625mg',
    packSize: '10 x 1 x 10 Strip',
    uom: 'Boxes',
    description: 'Broad spectrum antibiotic tablet with ALU-ALU packaging',
    category: 'Drugs',
    subCategory: 'Tablets',
    subSubCategory: 'Film Coated Tablets',
    basePrice: 45.00,
    manufacturersCount: 3,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Required', 'CDSCO Applicable', 'Schedule H']
  },
  {
    id: 'p2',
    code: 'PRD001002',
    sku: 'PCM-650',
    name: 'Paracetamol 650mg ER Tablets',
    genericName: 'Paracetamol Extended Release',
    saltCombination: 'Paracetamol IP 650mg',
    dosageForm: 'Tablet',
    strength: '650mg',
    packSize: '10 x 15 Strip',
    uom: 'Boxes',
    description: 'Analgesic and antipyretic extended release tablets',
    category: 'Drugs',
    subCategory: 'Tablets',
    subSubCategory: 'Uncoated Tablets',
    basePrice: 12.00,
    manufacturersCount: 3,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Required', 'CDSCO Applicable', 'Form 20B/21B']
  },
  {
    id: 'p3',
    code: 'PRD001003',
    sku: 'AZI-500',
    name: 'Azithromycin 500mg Tablets',
    genericName: 'Azithromycin Dihydrate',
    saltCombination: 'Azithromycin IP 500mg',
    dosageForm: 'Tablet',
    strength: '500mg',
    packSize: '10 x 3 Strip',
    uom: 'Boxes',
    description: 'Macrolide antibiotic for respiratory tract infections',
    category: 'Drugs',
    basePrice: 58.00,
    manufacturersCount: 2,
    moq: 500,
    regulatoryInfo: ['WHO-GMP Required', 'Schedule H1', 'CDSCO Applicable']
  },
  {
    id: 'p4',
    code: 'PRD001004',
    sku: 'PAN-070',
    name: 'Pantoprazole 40mg + Domperidone 30mg SR',
    genericName: 'Pantoprazole + Domperidone SR',
    saltCombination: 'Pantoprazole Sodium 40mg + Domperidone 30mg SR',
    dosageForm: 'Capsule',
    strength: '70mg Total',
    packSize: '10 x 10 Strip',
    uom: 'Boxes',
    description: 'Proton pump inhibitor with prokinetic agent',
    category: 'Drugs',
    basePrice: 32.00,
    manufacturersCount: 2,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Required', 'Schedule H', 'CDSCO Applicable']
  },
  {
    id: 'p5',
    code: 'PRD001005',
    sku: 'MET-500',
    name: 'Metformin SR 500mg Tablets',
    genericName: 'Metformin Hydrochloride Sustained Release',
    saltCombination: 'Metformin HCl IP 500mg',
    dosageForm: 'Tablet',
    strength: '500mg',
    packSize: '10 x 15 Strip',
    uom: 'Boxes',
    description: 'First-line medication for type 2 diabetes management',
    category: 'Drugs',
    basePrice: 15.00,
    manufacturersCount: 2,
    moq: 2000,
    regulatoryInfo: ['WHO-GMP Required', 'Schedule H', 'CDSCO Applicable']
  },
  {
    id: 'p6',
    code: 'PRD001006',
    sku: 'PCM-500',
    name: 'Paracetamol 500mg Tablets',
    genericName: 'Paracetamol',
    saltCombination: 'Paracetamol IP 500mg',
    dosageForm: 'Tablet',
    strength: '500mg',
    packSize: '10 x 10 Strip',
    uom: 'Boxes',
    description: 'Analgesic and antipyretic tablets 500mg',
    category: 'Drugs',
    basePrice: 10.00,
    manufacturersCount: 3,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Required', 'CDSCO Applicable', 'Form 20B/21B']
  },
  {
    id: 'p7',
    code: 'PRD001007',
    sku: 'DXM-100',
    name: 'Cough Relief Dextromethorphan Syrup 100ml',
    genericName: 'Dextromethorphan Hydrobromide + Chlorpheniramine',
    saltCombination: 'Dextromethorphan 10mg + CPM 2mg / 5ml',
    dosageForm: 'Syrup',
    strength: '100ml',
    packSize: '1 x 100ml Bottle',
    uom: 'Bottles',
    description: 'Antitussive and antihistaminic oral syrup for non-productive cough',
    category: 'Drugs',
    basePrice: 38.00,
    manufacturersCount: 2,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Required', 'CDSCO Applicable']
  },
  {
    id: 'p8',
    code: 'PRD001008',
    sku: 'CEF-1000',
    name: 'Ceftriaxone 1000mg Injection Vial',
    genericName: 'Ceftriaxone Sodium Sterile',
    saltCombination: 'Ceftriaxone Sodium IP 1000mg with WFI',
    dosageForm: 'Injection',
    strength: '1g',
    packSize: '1 Vial + Sterile Water',
    uom: 'Vials',
    description: 'Third-generation cephalosporin sterile injectable antibiotic',
    category: 'Drugs',
    basePrice: 72.00,
    manufacturersCount: 2,
    moq: 500,
    regulatoryInfo: ['WHO-GMP Required', 'Schedule H1', 'Sterility Tested']
  },
  {
    id: 'p9',
    code: 'PRD001009',
    sku: 'DIC-030',
    name: 'Diclofenac Diethylamine Gel 30g',
    genericName: 'Diclofenac + Linseed Oil + Methyl Salicylate',
    saltCombination: 'Diclofenac Diethylamine 1.16% w/w',
    dosageForm: 'Ointment',
    strength: '30g',
    packSize: '1 x 30g Lami Tube',
    uom: 'Tubes',
    description: 'Topical analgesic anti-inflammatory pain relief gel',
    category: 'Drugs',
    basePrice: 28.00,
    manufacturersCount: 2,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Required', 'CDSCO Applicable']
  },
  {
    id: 'p10',
    code: 'PRD001010',
    sku: 'CIP-500',
    name: 'Ciprofloxacin 500mg Tablets',
    genericName: 'Ciprofloxacin Hydrochloride',
    saltCombination: 'Ciprofloxacin IP 500mg',
    dosageForm: 'Tablet',
    strength: '500mg',
    packSize: '10 x 10 Strip',
    uom: 'Boxes',
    description: 'Broad spectrum fluoroquinolone antibiotic formulation',
    category: 'Drugs',
    basePrice: 36.00,
    manufacturersCount: 2,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Required', 'Schedule H1', 'CDSCO Applicable']
  },
  {
    id: 'p11',
    code: 'PRD001011',
    sku: 'IBU-400',
    name: 'Ibuprofen 400mg Film-Coated Tablets',
    genericName: 'Ibuprofen',
    saltCombination: 'Ibuprofen IP 400mg',
    dosageForm: 'Tablet',
    strength: '400mg',
    packSize: '10 x 10 Strip',
    uom: 'Boxes',
    description: 'Non-steroidal anti-inflammatory and analgesic tablets',
    category: 'Drugs',
    basePrice: 18.00,
    manufacturersCount: 2,
    moq: 1500,
    regulatoryInfo: ['WHO-GMP Required', 'CDSCO Applicable']
  },
  {
    id: 'p12',
    code: 'PRD001012',
    sku: 'OME-020',
    name: 'Omeprazole 20mg Delayed Release Capsules',
    genericName: 'Omeprazole',
    saltCombination: 'Omeprazole IP 20mg (Enteric-coated pellets)',
    dosageForm: 'Capsule',
    strength: '20mg',
    packSize: '10 x 15 Strip',
    uom: 'Boxes',
    description: 'Proton pump inhibitor for acid peptic disorders and GERD',
    category: 'Drugs',
    basePrice: 24.00,
    manufacturersCount: 2,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Required', 'Schedule H', 'CDSCO Applicable']
  },
  {
    id: 'p13',
    code: 'PRD001013',
    sku: 'GLI-002',
    name: 'Glimepiride 2mg Tablets',
    genericName: 'Glimepiride',
    saltCombination: 'Glimepiride IP 2mg',
    dosageForm: 'Tablet',
    strength: '2mg',
    packSize: '10 x 10 Strip',
    uom: 'Boxes',
    description: 'Second-generation sulfonylurea for glycemic control in type 2 diabetes',
    category: 'Drugs',
    basePrice: 22.00,
    manufacturersCount: 2,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Required', 'Schedule H', 'CDSCO Applicable']
  },
  {
    id: 'p14',
    code: 'PRD001014',
    sku: 'MVT-030',
    name: 'Multivitamin & Mineral Softgel Capsules',
    genericName: 'Multivitamins with Zinc & Ginseng Extract',
    saltCombination: 'Vitamin A, B-Complex, C, D3, E + Zinc 15mg + Ginseng 42.5mg',
    dosageForm: 'Capsule',
    strength: 'Softgel',
    packSize: '3 x 10 Blister Pack',
    uom: 'Boxes',
    description: 'Daily dietary supplement with essential vitamins and trace minerals',
    category: 'Nutraceuticals/Food',
    basePrice: 48.00,
    manufacturersCount: 2,
    moq: 500,
    regulatoryInfo: ['FSSAI Compliant', 'Nutraceutical Grade', 'Non-Rx']
  },
  {
    id: 'p15',
    code: 'PRD001015',
    sku: 'DERM-030',
    name: 'Dermacare Vitamin C Radiance Serum 30ml',
    genericName: 'Vitamin C + Ferulic Acid + Hyaluronic Acid',
    saltCombination: 'L-Ascorbic Acid 15% + Ferulic Acid 1% + Sodium Hyaluronate 1%',
    dosageForm: 'Cosmetics',
    strength: '15% Serum',
    packSize: '1 x 30ml Dropper Bottle',
    uom: 'Bottles',
    description: 'Advanced antioxidant and skin brightening dermatological cosmetic serum formulation',
    category: 'Cosmetics',
    basePrice: 120.00,
    manufacturersCount: 1,
    moq: 200,
    regulatoryInfo: ['Dermatologically Tested', 'Cosmetic Grade Form 32']
  },
  {
    id: 'gen-p1',
    code: 'GEN001001',
    sku: 'GEN-PCM-500',
    name: 'Paracetamol 500mg Tablets (Generic)',
    genericName: 'Paracetamol',
    saltCombination: 'Paracetamol IP 500mg',
    dosageForm: 'Tablet',
    strength: '500mg',
    packSize: '10 x 10 Strip',
    uom: 'Boxes',
    description: 'Direct platform unbranded generic analgesic antipyretic tablets sourced via FactoryGrid Direct',
    category: 'Drugs',
    basePrice: 4.20,
    manufacturersCount: 1,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Direct Supply', 'Form 20B/21B', 'Schedule H'],
    isGeneric: true,
    supplierSource: 'FactoryGrid Direct / Generic Supply'
  },
  {
    id: 'gen-p2',
    code: 'GEN001002',
    sku: 'GEN-AMX-250',
    name: 'Amoxicillin 250mg Capsules (Generic)',
    genericName: 'Amoxicillin',
    saltCombination: 'Amoxicillin Trihydrate IP 250mg',
    dosageForm: 'Capsule',
    strength: '250mg',
    packSize: '10 x 10 Strip',
    uom: 'Boxes',
    description: 'Direct platform unbranded generic antibiotic formulation sourced via FactoryGrid Direct',
    category: 'Drugs',
    basePrice: 16.50,
    manufacturersCount: 1,
    moq: 1000,
    regulatoryInfo: ['WHO-GMP Direct Supply', 'Schedule H'],
    isGeneric: true,
    supplierSource: 'FactoryGrid Direct / Generic Supply'
  }
];

export const mockManufacturerProductMappings: ManufacturerProductMapping[] = [
  // SunBio LifeSciences Ltd (m1) - Varied margins per product
  {
    id: 'map-m1-p1',
    productId: 'p1',
    manufacturerId: 'm1',
    manufacturerCode: 'MFG000401',
    manufacturerName: 'SunBio LifeSciences Ltd',
    mfgProductCode: 'SUN-AMX-625',
    moq: 1000,
    standardLeadTimeDays: 18,
    unitPriceEstimate: 45.00,
    packaging: '10 x 10 Alu-Alu Blister Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 8,
    marginRate: 3.60,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-21'
  },
  {
    id: 'map-m1-p6',
    productId: 'p6',
    manufacturerId: 'm1',
    manufacturerCode: 'MFG000401',
    manufacturerName: 'SunBio LifeSciences Ltd',
    mfgProductCode: 'SUN-PCM-500',
    moq: 1000,
    standardLeadTimeDays: 14,
    unitPriceEstimate: 9.50,
    packaging: '10 x 10 Blister Pack',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 15,
    marginRate: 1.425,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-21'
  },
  {
    id: 'map-m1-p2',
    productId: 'p2',
    manufacturerId: 'm1',
    manufacturerCode: 'MFG000401',
    manufacturerName: 'SunBio LifeSciences Ltd',
    mfgProductCode: 'SUN-PCM-650',
    moq: 2000,
    standardLeadTimeDays: 10,
    unitPriceEstimate: 11.50,
    packaging: '10 x 10 Blister Pack',
    status: 'Active',
    marginType: 'FIXED_RATE',
    marginValue: 20,
    marginRate: 20,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-21'
  },
  {
    id: 'map-m1-p3',
    productId: 'p3',
    manufacturerId: 'm1',
    manufacturerCode: 'MFG000401',
    manufacturerName: 'SunBio LifeSciences Ltd',
    mfgProductCode: 'SUN-AZI-500',
    moq: 500,
    standardLeadTimeDays: 14,
    unitPriceEstimate: 58.00,
    packaging: '10 x 3 Blister Pack',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 10,
    marginRate: 5.80,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-19'
  },
  {
    id: 'map-m1-p4',
    productId: 'p4',
    manufacturerId: 'm1',
    manufacturerCode: 'MFG000401',
    manufacturerName: 'SunBio LifeSciences Ltd',
    mfgProductCode: 'SUN-PAN-D',
    moq: 1000,
    standardLeadTimeDays: 14,
    unitPriceEstimate: 38.00,
    packaging: '10 x 10 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 9,
    marginRate: 3.42,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-19'
  },
  {
    id: 'map-m1-p5',
    productId: 'p5',
    manufacturerId: 'm1',
    manufacturerCode: 'MFG000401',
    manufacturerName: 'SunBio LifeSciences Ltd',
    mfgProductCode: 'SUN-MET-500',
    moq: 2000,
    standardLeadTimeDays: 14,
    unitPriceEstimate: 6.50,
    packaging: '10 x 15 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 8,
    marginRate: 0.52,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-19'
  },
  {
    id: 'map-m1-p10',
    productId: 'p10',
    manufacturerId: 'm1',
    manufacturerCode: 'MFG000401',
    manufacturerName: 'SunBio LifeSciences Ltd',
    mfgProductCode: 'SUN-CIP-500',
    moq: 1000,
    standardLeadTimeDays: 14,
    unitPriceEstimate: 36.00,
    packaging: '10 x 10 Strip',
    status: 'Active',
    marginType: 'FIXED_RATE',
    marginValue: 6,
    marginRate: 6,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-19'
  },
  {
    id: 'map-m1-p11',
    productId: 'p11',
    manufacturerId: 'm1',
    manufacturerCode: 'MFG000401',
    manufacturerName: 'SunBio LifeSciences Ltd',
    mfgProductCode: 'SUN-IBU-400',
    moq: 1500,
    standardLeadTimeDays: 12,
    unitPriceEstimate: 18.00,
    packaging: '10 x 10 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 7,
    marginRate: 1.26,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-19'
  },
  {
    id: 'map-m1-p13',
    productId: 'p13',
    manufacturerId: 'm1',
    manufacturerCode: 'MFG000401',
    manufacturerName: 'SunBio LifeSciences Ltd',
    mfgProductCode: 'SUN-GLI-002',
    moq: 1000,
    standardLeadTimeDays: 14,
    unitPriceEstimate: 22.00,
    packaging: '10 x 10 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 10,
    marginRate: 2.20,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-19'
  },

  // Cipla Partner Formulations Ltd (m2) - Varied margins per product
  {
    id: 'map-m2-p6',
    productId: 'p6',
    manufacturerId: 'm2',
    manufacturerCode: 'MFG000402',
    manufacturerName: 'Cipla Partner Formulations Ltd',
    mfgProductCode: 'CIP-PCM-500',
    moq: 2000,
    standardLeadTimeDays: 12,
    unitPriceEstimate: 10.00,
    packaging: '10 x 10 Blister Pack',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 10,
    marginRate: 1.00,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-20'
  },
  {
    id: 'map-m2-p2',
    productId: 'p2',
    manufacturerId: 'm2',
    manufacturerCode: 'MFG000402',
    manufacturerName: 'Cipla Partner Formulations Ltd',
    mfgProductCode: 'CIP-PCM-650',
    moq: 1000,
    standardLeadTimeDays: 12,
    unitPriceEstimate: 12.00,
    packaging: '10 x 10 Blister Pack',
    status: 'Active',
    marginType: 'FIXED_RATE',
    marginValue: 15,
    marginRate: 15,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-20'
  },
  {
    id: 'map-m2-p3',
    productId: 'p3',
    manufacturerId: 'm2',
    manufacturerCode: 'MFG000402',
    manufacturerName: 'Cipla Partner Formulations Ltd',
    mfgProductCode: 'CIP-AZI-500',
    moq: 500,
    standardLeadTimeDays: 15,
    unitPriceEstimate: 58.00,
    packaging: '10 x 3 Blister Pack',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 12,
    marginRate: 6.96,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-20'
  },
  {
    id: 'map-m2-p1',
    productId: 'p1',
    manufacturerId: 'm2',
    manufacturerCode: 'MFG000402',
    manufacturerName: 'Cipla Partner Formulations Ltd',
    mfgProductCode: 'CIP-AMX-625',
    moq: 500,
    standardLeadTimeDays: 14,
    unitPriceEstimate: 48.50,
    packaging: '10 x 10 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 10,
    marginRate: 4.85,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-18'
  },
  {
    id: 'map-m2-p12',
    productId: 'p12',
    manufacturerId: 'm2',
    manufacturerCode: 'MFG000402',
    manufacturerName: 'Cipla Partner Formulations Ltd',
    mfgProductCode: 'CIP-OME-020',
    moq: 1000,
    standardLeadTimeDays: 15,
    unitPriceEstimate: 24.00,
    packaging: '10 x 15 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 8,
    marginRate: 1.92,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-18'
  },
  {
    id: 'map-m2-p15',
    productId: 'p15',
    manufacturerId: 'm2',
    manufacturerCode: 'MFG000402',
    manufacturerName: 'Cipla Partner Formulations Ltd',
    mfgProductCode: 'CIP-DERM-030',
    moq: 200,
    standardLeadTimeDays: 10,
    unitPriceEstimate: 120.00,
    packaging: '1 x 30g Tube',
    status: 'Active',
    marginType: 'FIXED_RATE',
    marginValue: 25,
    marginRate: 25,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-18'
  },

  // Lupin Bio-Tech Labs (m3) - Varied margins per product
  {
    id: 'map-m3-p4',
    productId: 'p4',
    manufacturerId: 'm3',
    manufacturerCode: 'MFG000403',
    manufacturerName: 'Lupin Bio-Tech Labs',
    mfgProductCode: 'LUP-PAN-D',
    moq: 1000,
    standardLeadTimeDays: 14,
    unitPriceEstimate: 38.00,
    packaging: '10 x 10 Strip',
    status: 'Active',
    marginType: 'FIXED_RATE',
    marginValue: 5,
    marginRate: 5,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-20'
  },
  {
    id: 'map-m3-p1',
    productId: 'p1',
    manufacturerId: 'm3',
    manufacturerCode: 'MFG000403',
    manufacturerName: 'Lupin Bio-Tech Labs',
    mfgProductCode: 'LUP-AMX-625',
    moq: 2000,
    standardLeadTimeDays: 21,
    unitPriceEstimate: 42.00,
    packaging: '10 x 10 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 10,
    marginRate: 4.20,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-20'
  },
  {
    id: 'map-m3-p5',
    productId: 'p5',
    manufacturerId: 'm3',
    manufacturerCode: 'MFG000403',
    manufacturerName: 'Lupin Bio-Tech Labs',
    mfgProductCode: 'LUP-MET-500',
    moq: 3000,
    standardLeadTimeDays: 20,
    unitPriceEstimate: 9.50,
    packaging: '10 x 15 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 10,
    marginRate: 0.95,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-20'
  },
  {
    id: 'map-m3-p6',
    productId: 'p6',
    manufacturerId: 'm3',
    manufacturerCode: 'MFG000403',
    manufacturerName: 'Lupin Bio-Tech Labs',
    mfgProductCode: 'LUP-PCM-500',
    moq: 1500,
    standardLeadTimeDays: 15,
    unitPriceEstimate: 9.80,
    packaging: '10 x 10 Blister Pack',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 12,
    marginRate: 1.176,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-20'
  },
  {
    id: 'map-m3-p14',
    productId: 'p14',
    manufacturerId: 'm3',
    manufacturerCode: 'MFG000403',
    manufacturerName: 'Lupin Bio-Tech Labs',
    mfgProductCode: 'LUP-MVT-030',
    moq: 500,
    standardLeadTimeDays: 18,
    unitPriceEstimate: 48.00,
    packaging: '1 x 30 Tablets Bottle',
    status: 'Active',
    marginType: 'FIXED_RATE',
    marginValue: 8,
    marginRate: 8,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-20'
  },

  // BioCure Pharmaceuticals Ltd (m4) - Varied margins per product
  {
    id: 'map-m4-p5',
    productId: 'p5',
    manufacturerId: 'm4',
    manufacturerCode: 'MFG000404',
    manufacturerName: 'BioCure Pharmaceuticals Ltd',
    mfgProductCode: 'BIO-MET-500',
    moq: 1000,
    standardLeadTimeDays: 14,
    unitPriceEstimate: 6.50,
    packaging: '10 x 15 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 8,
    marginRate: 0.52,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-21'
  },
  {
    id: 'map-m4-p2',
    productId: 'p2',
    manufacturerId: 'm4',
    manufacturerCode: 'MFG000404',
    manufacturerName: 'BioCure Pharmaceuticals Ltd',
    mfgProductCode: 'BIO-PCM-650',
    moq: 1000,
    standardLeadTimeDays: 14,
    unitPriceEstimate: 12.50,
    packaging: '10 x 10 Blister Pack',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 14,
    marginRate: 1.75,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-21'
  },
  {
    id: 'map-m4-p9',
    productId: 'p9',
    manufacturerId: 'm4',
    manufacturerCode: 'MFG000404',
    manufacturerName: 'BioCure Pharmaceuticals Ltd',
    mfgProductCode: 'BIO-DIC-030',
    moq: 1000,
    standardLeadTimeDays: 12,
    unitPriceEstimate: 28.00,
    packaging: '1 x 30g Tube',
    status: 'Active',
    marginType: 'FIXED_RATE',
    marginValue: 4,
    marginRate: 4,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-21'
  },

  // FactoryGrid Direct / Generic Supply (mfg_fg_direct)
  {
    id: 'map-fgd-p1',
    productId: 'gen-p1',
    manufacturerId: 'mfg_fg_direct',
    manufacturerCode: 'FGD-001',
    manufacturerName: 'FactoryGrid Direct / Generic Supply',
    mfgProductCode: 'FGD-PCM-500',
    moq: 1000,
    standardLeadTimeDays: 5,
    unitPriceEstimate: 4.20,
    packaging: '10 x 10 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 5,
    marginRate: 0.21,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-21'
  },
  {
    id: 'map-fgd-p2',
    productId: 'gen-p2',
    manufacturerId: 'mfg_fg_direct',
    manufacturerCode: 'FGD-001',
    manufacturerName: 'FactoryGrid Direct / Generic Supply',
    mfgProductCode: 'FGD-AMX-250',
    moq: 1000,
    standardLeadTimeDays: 5,
    unitPriceEstimate: 16.50,
    packaging: '10 x 10 Strip',
    status: 'Active',
    marginType: 'PERCENTAGE',
    marginValue: 6,
    marginRate: 0.99,
    marginStatus: 'Configured',
    marginUpdatedAt: '2026-09-21'
  }
];

export const mockRFQs: RFQ[] = [
  {
    id: 'rfq-8801',
    rfqNumber: 'RFQ-2026-8801',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-18',
    deadlineDate: '2026-09-05',
    status: 'Submitted',
    quoteStatus: 'ACTION NEEDED',
    remarks: 'Urgent quarterly stock replenishment for Azithromycin 500mg.',
    priority: 'HIGH',
    deliveryLocation: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    lines: [
      { id: 'rl-8801-1', productId: 'p3', productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', packSize: '10 x 3 Strip', quantity: 2000, requiredDate: '2026-09-01', targetPrice: 12.00, remarks: 'Export quality blister packing', eligibleManufacturersCount: 3, eligibleManufacturerIds: ['m1', 'm2', 'm3'] },
      { id: 'rl-8801-2', productId: 'p1', productName: 'Amoxicillin 500mg Capsules', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 5000, requiredDate: '2026-09-05', targetPrice: 24.00, remarks: 'WHO-GMP certified batch required', eligibleManufacturersCount: 3, eligibleManufacturerIds: ['m1', 'm2', 'm3'] },
      { id: 'rl-8801-3', productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 3000, requiredDate: '2026-09-10', targetPrice: 14.50, remarks: 'Alu-Alu blister packaging', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2'] },
      { id: 'rl-8801-4', productId: 'p5', productName: 'Metformin 500mg SR Tablets', dosageForm: 'Tablet', packSize: '10 x 15 Strip', quantity: 15000, requiredDate: '2026-09-15', targetPrice: 6.50, remarks: 'High volume bulk formulation', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2', 'm3'] }
    ]
  },
  {
    id: 'rfq-8802',
    rfqNumber: 'RFQ-2026-8802',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-19',
    deadlineDate: '2026-08-30',
    status: 'Draft',
    quoteStatus: 'DRAFT',
    remarks: 'Draft requisition pending final approval from Sourcing Committee.',
    priority: 'STANDARD',
    deliveryLocation: 'Apex Central Depot, Off NH-44, Ambala Cantt, Haryana',
    lines: [
      { id: 'rl-8802-1', productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 3000, requiredDate: '2026-09-10', targetPrice: 14.50, remarks: 'Alu-Alu blister packaging', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2'] },
      { id: 'rl-8802-2', productId: 'p2', productName: 'Paracetamol 650mg ER Tablets', dosageForm: 'Tablet', packSize: '10 x 15 Strip', quantity: 8000, requiredDate: '2026-09-12', targetPrice: 8.50, remarks: 'Standard strip packing', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm3'] },
      { id: 'rl-8802-3', productId: 'p3', productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', packSize: '10 x 3 Strip', quantity: 1500, requiredDate: '2026-09-14', targetPrice: 12.00, remarks: 'Blister packing', eligibleManufacturersCount: 3, eligibleManufacturerIds: ['m1', 'm2', 'm3'] }
    ]
  },
  {
    id: 'rfq-8803',
    rfqNumber: 'RFQ-2026-8803',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-17',
    deadlineDate: '2026-09-02',
    status: 'Submitted',
    quoteStatus: 'NEGOTIATION',
    remarks: 'Requisition floated to qualified CDMO manufacturers for competitive quotes.',
    priority: 'HIGH',
    deliveryLocation: 'Baddi Industrial Area, Phase II, Himachal Pradesh - 173205',
    lines: [
      { id: 'rl-8803-1', productId: 'p1', productName: 'Amoxicillin 500mg Capsules', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 5000, requiredDate: '2026-09-15', targetPrice: 24.00, remarks: 'WHO-GMP certified batch required', eligibleManufacturersCount: 3, eligibleManufacturerIds: ['m1', 'm2', 'm3'] },
      { id: 'rl-8803-2', productId: 'p5', productName: 'Metformin 500mg SR Tablets', dosageForm: 'Tablet', packSize: '10 x 15 Strip', quantity: 20000, requiredDate: '2026-09-18', targetPrice: 6.50, remarks: 'Bulk supply requirement', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2'] },
      { id: 'rl-8803-3', productId: 'p3', productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', packSize: '10 x 3 Strip', quantity: 3000, requiredDate: '2026-09-20', targetPrice: 12.00, remarks: 'Export packaging', eligibleManufacturersCount: 3, eligibleManufacturerIds: ['m1', 'm2', 'm3'] },
      { id: 'rl-8803-4', productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 4000, requiredDate: '2026-09-22', targetPrice: 14.50, remarks: 'Alu-Alu blister', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2'] }
    ]
  },
  {
    id: 'rfq-8804',
    rfqNumber: 'RFQ-2026-8804',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-15',
    deadlineDate: '2026-08-28',
    status: 'Pricing In Progress',
    quoteStatus: 'SUBMITTED',
    remarks: 'Manufacturers preparing cost breakup and lead time feasibility.',
    priority: 'URGENT',
    deliveryLocation: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    lines: [
      { id: 'rl-8804-1', productId: 'p5', productName: 'Metformin 500mg SR Tablets', dosageForm: 'Tablet', packSize: '10 x 15 Strip', quantity: 20000, requiredDate: '2026-09-05', targetPrice: 6.50, remarks: 'High volume bulk formulation', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2', 'm3'] },
      { id: 'rl-8804-2', productId: 'p2', productName: 'Paracetamol 650mg ER Tablets', dosageForm: 'Tablet', packSize: '10 x 15 Strip', quantity: 12000, requiredDate: '2026-09-08', targetPrice: 8.50, remarks: 'Analgesic stock', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm3'] },
      { id: 'rl-8804-3', productId: 'p1', productName: 'Amoxicillin 500mg Capsules', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 6000, requiredDate: '2026-09-12', targetPrice: 24.00, remarks: 'WHO-GMP batch', eligibleManufacturersCount: 3, eligibleManufacturerIds: ['m1', 'm2', 'm3'] }
    ]
  },
  {
    id: 'rfq-8805',
    rfqNumber: 'RFQ-2026-8805',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-12',
    deadlineDate: '2026-09-08',
    status: 'Submitted',
    quoteStatus: 'ACTION NEEDED',
    remarks: 'New seasonal demand requirement for Cefixime 200mg.',
    priority: 'HIGH',
    deliveryLocation: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    lines: [
      { id: 'rl-8805-1', productId: 'p5', productName: 'Cefixime 200mg Tablets', dosageForm: 'Tablet', packSize: '10 x 10 Strip', quantity: 4000, requiredDate: '2026-09-02', targetPrice: 18.00, remarks: 'Pending commercial quote submission', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2'] },
      { id: 'rl-8805-2', productId: 'p3', productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', packSize: '10 x 3 Strip', quantity: 2500, requiredDate: '2026-09-06', targetPrice: 12.00, remarks: 'Seasonal demand batch', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2'] },
      { id: 'rl-8805-3', productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 3500, requiredDate: '2026-09-10', targetPrice: 14.50, remarks: 'Alu-Alu strip', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2'] }
    ]
  },
  {
    id: 'rfq-8806',
    rfqNumber: 'RFQ-2026-8806',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-10',
    deadlineDate: '2026-08-27',
    status: 'Submitted',
    quoteStatus: 'SUBMITTED',
    remarks: 'Requisition floated for Atorvastatin 10mg bulk supply.',
    priority: 'STANDARD',
    deliveryLocation: 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi',
    lines: [
      { id: 'rl-8806-1', productId: 'p2', productName: 'Atorvastatin 10mg Tablets', dosageForm: 'Tablet', packSize: '10 x 10 Strip', quantity: 10000, requiredDate: '2026-08-30', targetPrice: 8.50, remarks: 'Supplier unit price quote submitted', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm3'] },
      { id: 'rl-8806-2', productId: 'p1', productName: 'Amoxicillin 500mg Capsules', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 4000, requiredDate: '2026-09-04', targetPrice: 24.00, remarks: 'Bulk supply', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2'] },
      { id: 'rl-8806-3', productId: 'p5', productName: 'Metformin 500mg SR Tablets', dosageForm: 'Tablet', packSize: '10 x 15 Strip', quantity: 12000, requiredDate: '2026-09-08', targetPrice: 6.50, remarks: 'Fast delivery required', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm3'] }
    ]
  },
  {
    id: 'rfq-8807',
    rfqNumber: 'RFQ-2026-8807',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-05',
    deadlineDate: '2026-08-15',
    status: 'Closed',
    quoteStatus: 'EXPIRED',
    remarks: 'RFQ response period expired.',
    priority: 'STANDARD',
    deliveryLocation: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    lines: [
      { id: 'rl-8807-1', productId: 'p6', productName: 'Telmisartan 40mg Tablets', dosageForm: 'Tablet', packSize: '10 x 10 Strip', quantity: 15000, requiredDate: '2026-08-24', targetPrice: 9.20, remarks: 'Deadline passed without quote', eligibleManufacturersCount: 3, eligibleManufacturerIds: ['m1', 'm2', 'm3'] }
    ]
  },
  {
    id: 'rfq-8808',
    rfqNumber: 'RFQ-2026-8808',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-01',
    deadlineDate: '2026-08-10',
    status: 'Closed',
    quoteStatus: 'EXPIRED',
    remarks: 'Requisition expired past response window.',
    priority: 'STANDARD',
    deliveryLocation: 'Apex Central Depot, Ambala Cantt, Haryana',
    lines: [
      { id: 'rl-8808-1', productId: 'p2', productName: 'Vitamin D3 60K Capsules', dosageForm: 'Capsule', packSize: '4 x 1 x 10 Softgel', quantity: 8000, requiredDate: '2026-08-20', targetPrice: 35.00, remarks: 'Expired before quote submission', eligibleManufacturersCount: 2, eligibleManufacturerIds: ['m1', 'm2'] }
    ]
  },
  {
    id: 'rfq-8899',
    rfqNumber: 'RFQ-2026-8899',
    customerId: 'c5',
    customerName: 'MediPlus Healthcare (Special Party Demo)',
    customerCode: 'CUS000105',
    customerClassification: 'SPECIAL_PARTY',
    createdDate: '2026-08-22',
    deadlineDate: '2026-09-25',
    status: 'Submitted',
    quoteStatus: 'ACTION NEEDED',
    remarks: 'Pre-negotiated contract procurement: Buyer-provided benchmark rates for quarterly replenishment.',
    priority: 'HIGH',
    deliveryLocation: 'MediPlus Central Hub, Sector 18, Gurugram, Haryana - 122015',
    lines: [
      { id: 'rl-8899-1', productId: 'p3', productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', packSize: '10 x 3 Strip', quantity: 3000, requiredDate: '2026-09-12', targetPrice: 12.00, buyerProvidedPrice: 11.50, remarks: 'Agreed contract rate ₹11.50/unit', eligibleManufacturersCount: 1, eligibleManufacturerIds: ['m1'] },
      { id: 'rl-8899-2', productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 4000, requiredDate: '2026-09-18', targetPrice: 14.50, buyerProvidedPrice: 14.20, remarks: 'Agreed contract rate ₹14.20/unit', eligibleManufacturersCount: 1, eligibleManufacturerIds: ['m1'] }
    ]
  },
  {
    id: 'rfq-8820-gen',
    rfqNumber: 'RFQ-2026-8820',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-25',
    deadlineDate: '2026-09-10',
    status: 'Submitted',
    quoteStatus: 'PENDING_PRICING',
    isGeneric: true,
    genericStatus: 'SUBMITTED',
    remarks: 'Generic Medicine procurement requisition: Sourced via FactoryGrid internal price list.',
    priority: 'HIGH',
    deliveryLocation: 'Baddi Industrial Area, Phase II, Himachal Pradesh - 173205',
    lines: [
      {
        id: 'rl-8820-1',
        productId: 'gen_pcm_500',
        productName: 'Paracetamol 500mg Tablets (Generic)',
        genericName: 'Paracetamol',
        molecule: 'Paracetamol',
        productType: 'GENERIC',
        dosageForm: 'Tablet',
        packSize: '10 x 10 Strip',
        quantity: 10000,
        requiredDate: '2026-09-15',
        targetPrice: 4.50,
        internalPrice: 4.20,
        adminProcessingStatus: 'SUBMITTED',
        remarks: 'Direct generic requisition',
        eligibleManufacturersCount: 0
      }
    ]
  },
  {
    id: 'rfq-9482-gen',
    rfqNumber: 'RFQ-2026-9482',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-09-08',
    deadlineDate: '2026-09-25',
    status: 'Approved',
    quoteStatus: 'SUBMITTED',
    isGeneric: true,
    genericStatus: 'PRICED',
    internalPriceTotal: 42000,
    remarks: 'Generic Medicine procurement requisition: Sourced via FactoryGrid internal price list.',
    priority: 'HIGH',
    deliveryLocation: 'Industrial Zone, Plot 14, Phase I, Delhi',
    lines: [
      {
        id: 'rl-9482-1',
        productId: 'gen_paracetamol_500',
        productName: 'Paracetamol 500mg Tablets (Generic)',
        genericName: 'Paracetamol',
        molecule: 'Paracetamol',
        productType: 'GENERIC',
        dosageForm: 'Tablet',
        packSize: '10 x 10 Strip',
        quantity: 10000,
        requiredDate: '2026-09-15',
        targetPrice: 4.50,
        internalPrice: 4.20,
        adminProcessingStatus: 'PRICED',
        remarks: 'Direct generic requisition',
        eligibleManufacturersCount: 0
      }
    ]
  }
];

export const mockQuotes: ManufacturerQuote[] = [
  {
    id: 'QTE-GEN-9482',
    rfqId: 'rfq-9482-gen',
    rfqNumber: 'RFQ-2026-9482',
    manufacturerId: 'mfg_factorygrid',
    manufacturerName: 'FactoryGrid Direct (Generic Supply)',
    submissionDate: '2026-09-08',
    lastUpdated: '2026-09-08',
    validUntil: '2026-10-08',
    status: 'SUBMITTED',
    totalAmount: 42000,
    remarks: 'Official FactoryGrid Direct quotation priced via internal price list.',
    quoteLines: [
      {
        rfqLineId: 'rl-9482-1',
        productId: 'gen_paracetamol_500',
        productName: 'Paracetamol 500mg Tablets (Generic)',
        unitPrice: 4.20,
        calculatedFinalPrice: 4.20,
        buyerUnitPrice: 4.20,
        leadTimeDays: 7,
        moq: 1000
      }
    ]
  },
  {
    id: 'QTE-2026-8802',
    rfqId: 'rfq-8802',
    rfqNumber: 'RFQ-2026-8802',
    manufacturerId: 'm1',
    manufacturerName: 'SunBio LifeSciences Ltd',
    submissionDate: '2026-08-20',
    lastUpdated: '2026-08-22',
    validUntil: '2026-09-30',
    status: 'DRAFT',
    totalAmount: 43500,
    remarks: 'Draft quote saved for Pantoprazole 40mg + Domperidone 30mg SR Capsules.',
    quoteLines: [
      { rfqLineId: 'rl-8802-1', productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules', unitPrice: 14.50, leadTimeDays: 14, moq: 1000 }
    ]
  },
  {
    id: 'QTE-2026-8803',
    rfqId: 'rfq-8803',
    rfqNumber: 'RFQ-2026-8803',
    manufacturerId: 'm1',
    manufacturerName: 'SunBio LifeSciences Ltd',
    submissionDate: '2026-08-21',
    lastUpdated: '2026-08-24',
    validUntil: '2026-09-30',
    status: 'NEGOTIATION',
    totalAmount: 120000,
    remarks: 'Buyer counter-offer under negotiation for compressed lead time.',
    quoteLines: [
      { rfqLineId: 'rl-8803-1', productId: 'p1', productName: 'Amoxicillin 500mg Capsules', unitPrice: 24.00, leadTimeDays: 14, moq: 1000 }
    ]
  },
  {
    id: 'QTE-2026-8804',
    rfqId: 'rfq-8804',
    rfqNumber: 'RFQ-2026-8804',
    manufacturerId: 'm1',
    manufacturerName: 'SunBio LifeSciences Ltd',
    submissionDate: '2026-08-22',
    lastUpdated: '2026-08-22',
    validUntil: '2026-09-30',
    status: 'SUBMITTED',
    totalAmount: 130000,
    remarks: 'Official commercial offer submitted for Metformin 500mg SR Tablets.',
    quoteLines: [
      { rfqLineId: 'rl-8804-1', productId: 'p5', productName: 'Metformin 500mg SR Tablets', unitPrice: 6.50, leadTimeDays: 14, moq: 2000 }
    ]
  },
  {
    id: 'QTE-2026-8806',
    rfqId: 'rfq-8806',
    rfqNumber: 'RFQ-2026-8806',
    manufacturerId: 'm1',
    manufacturerName: 'SunBio LifeSciences Ltd',
    submissionDate: '2026-08-23',
    lastUpdated: '2026-08-23',
    validUntil: '2026-09-30',
    status: 'SUBMITTED',
    totalAmount: 85000,
    remarks: 'Sealed commercial quote submitted for Atorvastatin 10mg Tablets.',
    quoteLines: [
      { rfqLineId: 'rl-8806-1', productId: 'p2', productName: 'Atorvastatin 10mg Tablets', unitPrice: 8.50, leadTimeDays: 12, moq: 1000 }
    ]
  }
];

export const mockMasterOrders: MasterOrder[] = [
  {
    id: 'mo-5870',
    orderNumber: 'MO-2026-5870',
    poNumber: 'PO-2026-5870',
    poStatus: 'AUTO-GENERATED',
    rfqId: 'rfq-9482-gen',
    rfqNumber: 'RFQ-2026-9482',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    isGeneric: true,
    orderType: 'GENERIC',
    createdDate: '2026-09-08',
    expectedDeliveryDate: '2026-09-15',
    status: 'OPEN',
    totalAmount: 42000,
    shippingAddress: 'Industrial Zone, Plot 14, Phase I, Delhi',
    billingAddress: 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi - 110001',
    paymentTerms: 'Net 30',
    currency: 'INR',
    subOrders: [
      {
        id: 'so-5870-01',
        subOrderNumber: 'SO-2026-5870-01',
        masterOrderId: 'mo-5870',
        masterOrderNumber: 'MO-2026-5870',
        poNumber: 'PO-SO-2026-5870-01',
        poStatus: 'AUTO-GENERATED',
        manufacturerId: 'mfg_factorygrid',
        manufacturerName: 'FactoryGrid Direct (Generic Supply)',
        status: 'OPEN',
        customerClassification: 'REGULAR',
        totalAmount: 42000,
        startDate: '2026-09-08',
        expectedDeliveryDate: '2026-09-15',
        isGeneric: true,
        lines: [
          {
            id: 'sol-5870-1',
            productId: 'gen_paracetamol_500',
            productName: 'Paracetamol 500mg Tablets (Generic)',
            molecule: 'Paracetamol',
            dosageForm: 'Tablet',
            quantity: 10000,
            unitPrice: 4.20,
            totalPrice: 42000,
            productType: 'GENERIC'
          }
        ]
      }
    ]
  },
  {
    id: 'mo-5228',
    orderNumber: 'MO-2026-5228',
    poNumber: 'PO-2026-5228',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-19',
    expectedDeliveryDate: '2026-09-01',
    updatedDate: '2026-08-27',
    status: 'IN_TRANSIT',
    totalAmount: 75600,
    currency: 'INR',
    shippingAddress: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    billingAddress: 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi - 110001',
    paymentTerms: 'Net 30',
    subOrders: [
      {
        id: 'so-5228-01',
        subOrderNumber: 'SO-2026-5228-01',
        masterOrderId: 'mo-5228',
        masterOrderNumber: 'MO-2026-5228',
        poNumber: 'PO-SO-2026-5228-01',
        manufacturerId: 'm1',
        manufacturerName: 'SunBio LifeSciences Ltd',
        status: 'DELIVERED',
        totalAmount: 195300,
        startDate: '2026-08-20',
        expectedDeliveryDate: '2026-08-28',
        transporterName: 'ColdEx Logistics',
        awbNumber: 'TRK-COL-88963',
        lines: [
          { id: 'sol-5228-1', productId: 'p6', productName: 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', quantity: 10000, unitPrice: 9.66, totalPrice: 96600 },
          { id: 'sol-5228-2', productId: 'p3', productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', quantity: 2000, unitPrice: 15.00, totalPrice: 30000 }
        ]
      },
      {
        id: 'so-5228-02',
        subOrderNumber: 'SO-2026-5228-02',
        masterOrderId: 'mo-5228',
        masterOrderNumber: 'MO-2026-5228',
        poNumber: 'PO-SO-2026-5228-02',
        manufacturerId: 'm2',
        manufacturerName: 'Cipla Partner Formulations Ltd',
        status: 'IN_TRANSIT',
        totalAmount: 48720,
        startDate: '2026-08-21',
        expectedDeliveryDate: '2026-09-01',
        transporterName: 'BlueDart Express',
        awbNumber: 'TRK-BLU-77421',
        lines: [
          { id: 'sol-5228-2', productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules', dosageForm: 'Capsule', quantity: 3000, unitPrice: 14.50, totalPrice: 43500 }
        ]
      }
    ]
  },
  {
    id: 'mo-5229',
    orderNumber: 'MO-2026-5229',
    poNumber: 'PO-2026-5229',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-12',
    expectedDeliveryDate: '2026-08-25',
    updatedDate: '2026-08-25',
    status: 'CLOSED',
    totalAmount: 128800,
    currency: 'INR',
    shippingAddress: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    billingAddress: 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi - 110001',
    paymentTerms: 'Net 30',
    subOrders: [
      {
        id: 'so-5229-01',
        subOrderNumber: 'SO-2026-5229-01',
        masterOrderId: 'mo-5229',
        masterOrderNumber: 'MO-2026-5229',
        poNumber: 'PO-SO-2026-5229-01',
        manufacturerId: 'm1',
        manufacturerName: 'SunBio LifeSciences Ltd',
        status: 'DELIVERED',
        totalAmount: 128800,
        startDate: '2026-08-14',
        expectedDeliveryDate: '2026-08-25',
        transporterName: 'Safexpress Cold Fleet',
        awbNumber: 'TRK-SAF-99412',
        lines: [
          { id: 'sol-5229-1', productId: 'p2', productName: 'Paracetamol 650mg ER Tablets', dosageForm: 'Tablet', quantity: 10000, unitPrice: 11.50, totalPrice: 115000 }
        ]
      }
    ]
  },
  {
    id: 'mo-5001',
    orderNumber: 'MO-2026-5001',
    poNumber: 'PO-2026-5001',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-07-10',
    expectedDeliveryDate: '2026-08-05',
    updatedDate: '2026-08-05',
    status: 'CLOSED',
    totalAmount: 252800,
    currency: 'INR',
    shippingAddress: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    billingAddress: 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi - 110001',
    paymentTerms: 'Net 30',
    subOrders: [
      {
        id: 'so-5001-01',
        subOrderNumber: 'SO-2026-5001-01',
        masterOrderId: 'mo-5001',
        masterOrderNumber: 'MO-2026-5001',
        poNumber: 'PO-SO-2026-5001-01',
        manufacturerId: 'm1',
        manufacturerName: 'SunBio LifeSciences Ltd',
        status: 'DELIVERED',
        totalAmount: 195300,
        startDate: '2026-07-12',
        expectedDeliveryDate: '2026-07-28',
        transporterName: 'ColdEx Logistics',
        awbNumber: 'TRK-COL-99011',
        lines: [
          { id: 'sol-5001-1', productId: 'p6', productName: 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', quantity: 10000, unitPrice: 9.66, totalPrice: 96600 },
          { id: 'sol-5001-2', productId: 'p3', productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', quantity: 2000, unitPrice: 15.00, totalPrice: 30000 }
        ]
      },
      {
        id: 'so-5001-02',
        subOrderNumber: 'SO-2026-5001-02',
        masterOrderId: 'mo-5001',
        masterOrderNumber: 'MO-2026-5001',
        poNumber: 'PO-SO-2026-5001-02',
        manufacturerId: 'm2',
        manufacturerName: 'Cipla Partner Formulations Ltd',
        status: 'DELIVERED',
        totalAmount: 57500,
        startDate: '2026-07-14',
        expectedDeliveryDate: '2026-08-05',
        transporterName: 'BlueDart Express',
        awbNumber: 'TRK-BLU-88210',
        lines: [
          { id: 'sol-5001-3', productId: 'p4', productName: 'Amoxicillin 250mg Tablets', dosageForm: 'Capsule', quantity: 5000, unitPrice: 11.50, totalPrice: 57500 }
        ]
      }
    ]
  },
  {
    id: 'mo-5230',
    orderNumber: 'MO-2026-5230',
    poNumber: 'PO-2026-5230',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-15',
    expectedDeliveryDate: '2026-09-05',
    updatedDate: '2026-08-22',
    status: 'IN_PRODUCTION',
    totalAmount: 252000,
    currency: 'INR',
    shippingAddress: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    billingAddress: 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi - 110001',
    paymentTerms: 'Net 30',
    subOrders: [
      {
        id: 'so-5230-01',
        subOrderNumber: 'SO-2026-5230-01',
        masterOrderId: 'mo-5230',
        masterOrderNumber: 'MO-2026-5230',
        poNumber: 'PO-SO-2026-5230-01',
        manufacturerId: 'm1',
        manufacturerName: 'SunBio LifeSciences Ltd',
        status: 'IN_PRODUCTION',
        totalAmount: 252000,
        startDate: '2026-08-18',
        expectedDeliveryDate: '2026-09-05',
        transporterName: 'V-Trans Express',
        awbNumber: 'VT-8820194',
        lines: [
          { id: 'sol-5230-1', productId: 'p1', productName: 'Amoxyclav 625mg Tablets', dosageForm: 'Tablet', quantity: 5000, unitPrice: 45.00, totalPrice: 225000 }
        ]
      }
    ]
  },
  {
    id: 'mo-5231',
    orderNumber: 'MO-2026-5231',
    poNumber: 'PO-2026-5231',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-16',
    expectedDeliveryDate: '2026-08-30',
    updatedDate: '2026-08-26',
    status: 'READY_TO_DISPATCH',
    totalAmount: 161280,
    currency: 'INR',
    shippingAddress: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    billingAddress: 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi - 110001',
    paymentTerms: 'Net 30',
    subOrders: [
      {
        id: 'so-5231-01',
        subOrderNumber: 'SO-2026-5231-01',
        masterOrderId: 'mo-5231',
        masterOrderNumber: 'MO-2026-5231',
        poNumber: 'PO-SO-2026-5231-01',
        manufacturerId: 'm2',
        manufacturerName: 'Cipla Partner Formulations Ltd',
        status: 'READY_TO_DISPATCH',
        totalAmount: 161280,
        startDate: '2026-08-18',
        expectedDeliveryDate: '2026-08-30',
        transporterName: 'BlueDart Surface',
        awbNumber: 'BD-9940128',
        lines: [
          { id: 'sol-5231-1', productId: 'p5', productName: 'Ciprofloxacin 500mg Tablets', dosageForm: 'Tablet', quantity: 8000, unitPrice: 18.00, totalPrice: 144000 }
        ]
      }
    ]
  },
  {
    id: 'mo-5232',
    orderNumber: 'MO-2026-5232',
    poNumber: 'PO-2026-5232',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-14',
    expectedDeliveryDate: '2026-08-27',
    updatedDate: '2026-08-27',
    status: 'PENDING_RECEIPT',
    totalAmount: 114240,
    currency: 'INR',
    shippingAddress: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    billingAddress: 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi - 110001',
    paymentTerms: 'Net 30',
    subOrders: [
      {
        id: 'so-5232-01',
        subOrderNumber: 'SO-2026-5232-01',
        masterOrderId: 'mo-5232',
        masterOrderNumber: 'MO-2026-5232',
        poNumber: 'PO-SO-2026-5232-01',
        manufacturerId: 'm1',
        manufacturerName: 'SunBio LifeSciences Ltd',
        status: 'PENDING_RECEIPT',
        totalAmount: 114240,
        startDate: '2026-08-16',
        expectedDeliveryDate: '2026-08-27',
        transporterName: 'TCI Express',
        awbNumber: 'TRK-TCI-88102',
        lines: [
          { id: 'sol-5232-1', productId: 'p7', productName: 'Ceftriaxone 1g Injection', dosageForm: 'Injection', quantity: 1200, unitPrice: 85.00, totalPrice: 102000 }
        ]
      }
    ]
  },
  {
    id: 'mo-5233',
    orderNumber: 'MO-2026-5233',
    poNumber: 'PO-2026-5233',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-10',
    expectedDeliveryDate: '2026-08-26',
    updatedDate: '2026-08-26',
    status: 'GOODS_RECEIVED',
    totalAmount: 145600,
    currency: 'INR',
    shippingAddress: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    billingAddress: 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi - 110001',
    paymentTerms: 'Net 30',
    subOrders: [
      {
        id: 'so-5233-01',
        subOrderNumber: 'SO-2026-5233-01',
        masterOrderId: 'mo-5233',
        masterOrderNumber: 'MO-2026-5233',
        poNumber: 'PO-SO-2026-5233-01',
        manufacturerId: 'm2',
        manufacturerName: 'Cipla Partner Formulations Ltd',
        status: 'GOODS_RECEIVED',
        totalAmount: 145600,
        startDate: '2026-08-12',
        expectedDeliveryDate: '2026-08-26',
        transporterName: 'ColdEx Express Fleet',
        awbNumber: 'TRK-COL-99012',
        lines: [
          { id: 'sol-5233-1', productId: 'p8', productName: 'Metformin 500mg SR Tablets', dosageForm: 'Tablet', quantity: 20000, unitPrice: 6.50, totalPrice: 130000 }
        ]
      }
    ]
  },
  {
    id: 'mo-5234',
    orderNumber: 'MO-2026-5234',
    poNumber: 'PO-2026-5234',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    customerClassification: 'REGULAR',
    createdDate: '2026-08-05',
    expectedDeliveryDate: '2026-08-24',
    updatedDate: '2026-08-28',
    status: 'CLOSED',
    totalAmount: 154560,
    currency: 'INR',
    shippingAddress: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
    billingAddress: 'Apex Corporate Office, Barakhamba Road, Connaught Place, New Delhi - 110001',
    paymentTerms: 'Net 30',
    subOrders: [
      {
        id: 'so-5234-01',
        subOrderNumber: 'SO-2026-5234-01',
        masterOrderId: 'mo-5234',
        masterOrderNumber: 'MO-2026-5234',
        poNumber: 'PO-SO-2026-5234-01',
        manufacturerId: 'm1',
        manufacturerName: 'SunBio LifeSciences Ltd',
        status: 'CLOSED',
        totalAmount: 154560,
        startDate: '2026-08-08',
        expectedDeliveryDate: '2026-08-24',
        transporterName: 'TCI Express Cold Fleet',
        awbNumber: 'TRK-TCI-77129',
        lines: [
          { id: 'sol-5234-1', productId: 'p9', productName: 'Telmisartan 40mg Tablets', dosageForm: 'Tablet', quantity: 15000, unitPrice: 9.20, totalPrice: 138000 }
        ]
      }
    ]
  },
  {
    id: 'mo-5899',
    orderNumber: 'MO-2026-5899',
    poNumber: 'PO-2026-5899',
    poStatus: 'AUTO-GENERATED',
    customerId: 'c5',
    customerName: 'MediPlus Healthcare (Special Party Demo)',
    customerCode: 'CUS000105',
    customerClassification: 'SPECIAL_PARTY',
    createdDate: '2026-08-23',
    expectedDeliveryDate: '2026-09-10',
    updatedDate: '2026-08-25',
    status: 'OPEN',
    totalAmount: 91300,
    currency: 'INR',
    shippingAddress: 'MediPlus Central Hub, Sector 18, Gurugram, Haryana - 122015',
    billingAddress: 'MediPlus Healthcare Corp, Cyber City, Phase II, Gurugram - 122002',
    paymentTerms: 'Special Party Direct Settlement (Net 60)',
    subOrders: [
      {
        id: 'so-5899-01',
        subOrderNumber: 'SO-2026-5899-01',
        masterOrderId: 'mo-5899',
        masterOrderNumber: 'MO-2026-5899',
        poNumber: 'PO-SO-2026-5899-01',
        poStatus: 'AUTO-GENERATED',
        manufacturerId: 'm1',
        manufacturerName: 'SunBio LifeSciences Ltd',
        status: 'OPEN',
        customerClassification: 'SPECIAL_PARTY',
        totalAmount: 91300,
        startDate: '2026-08-24',
        expectedDeliveryDate: '2026-09-10',
        transporterName: 'ColdEx Logistics',
        awbNumber: 'TRK-COL-99201',
        lines: [
          { id: 'sol-5899-1', productId: 'p3', productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', quantity: 3000, unitPrice: 11.50, totalPrice: 34500 },
          { id: 'sol-5899-2', productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules', dosageForm: 'Capsule', quantity: 4000, unitPrice: 14.20, totalPrice: 56800 }
        ]
      }
    ]
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-4407',
    sentToCustomer: true,
    invoiceNumber: 'INV-2026-4407',
    masterOrderId: 'mo-5228',
    orderNumber: 'MO-2026-5228',
    subOrderId: 'so-5228-01',
    subOrderNumber: 'SO-2026-5228-01',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    manufacturerId: 'm1',
    manufacturerName: 'SunBio LifeSciences Ltd',
    invoiceDate: '2026-08-28',
    dueDate: '2026-09-28',
    subtotal: 24000,
    taxTotal: 2880,
    totalAmount: 26880,
    paidAmount: 26880,
    balanceAmount: 0,
    status: 'PAID',
    currency: 'INR',
    lines: [
      { id: 'il-4407-1', productId: 'p3', productName: 'Azithromycin 500mg Tablets', hsnCode: '30049099', quantity: 2000, unitPrice: 12.00, taxAmount: 2880, totalAmount: 26880 }
    ],
    payments: [
      {
        id: 'pay-4407-1',
        invoiceId: 'inv-4407',
        amount: 26880,
        currency: 'INR',
        paymentMethod: 'RTGS / Bank Transfer',
        paymentDate: '2026-08-28',
        reference: 'UTR-RTGS-884920',
        status: 'COMPLETED',
        remarks: 'Full payment received upon goods delivery'
      }
    ]
  },
  {
    id: 'inv-4408',
    sentToCustomer: true,
    invoiceNumber: 'INV-2026-4408',
    masterOrderId: 'mo-5228',
    orderNumber: 'MO-2026-5228',
    subOrderId: 'so-5228-02',
    subOrderNumber: 'SO-2026-5228-02',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    manufacturerId: 'm2',
    manufacturerName: 'Cipla Partner Formulations Ltd',
    invoiceDate: '2026-08-27',
    dueDate: '2026-09-28',
    subtotal: 43500,
    taxTotal: 5220,
    totalAmount: 48720,
    paidAmount: 0,
    balanceAmount: 48720,
    status: 'UNPAID',
    currency: 'INR',
    lines: [
      { id: 'il-4408-1', productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR Capsules', hsnCode: '30049099', quantity: 3000, unitPrice: 14.50, taxAmount: 5220, totalAmount: 48720 }
    ],
    payments: []
  },
  {
    id: 'inv1',
    sentToCustomer: true,
    invoiceNumber: 'INV-2026-4401',
    masterOrderId: 'mo1',
    orderNumber: 'MO-2026-1001',
    subOrderId: 'so1',
    subOrderNumber: 'SO-2026-1001-01',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    manufacturerId: 'm1',
    manufacturerName: 'SunBio LifeSciences Ltd',
    invoiceDate: '2026-08-04',
    dueDate: '2026-09-18',
    subtotal: 154199.99,
    taxTotal: 18504.01,
    totalAmount: 172704,
    paidAmount: 70000,
    balanceAmount: 102704,
    status: 'PARTIAL_PAYMENT',
    currency: 'INR',
    lines: [
      { id: 'il1', productId: 'p1', productName: 'Amoxyclav 625mg Tablets', hsnCode: '30049099', quantity: 2000, unitPrice: 43.20, taxAmount: 10368, totalAmount: 96768 },
      { id: 'il2', productId: 'p2', productName: 'Paracetamol 650mg ER Tablets', hsnCode: '30049060', quantity: 5000, unitPrice: 10.925, taxAmount: 6100, totalAmount: 56932 }
    ],
    payments: [
      {
        id: 'pay_demo_1',
        invoiceId: 'inv1',
        amount: 70000,
        currency: 'INR',
        paymentMethod: 'NEFT',
        paymentDate: '2026-08-04',
        reference: 'UTR-458373',
        status: 'COMPLETED',
        remarks: 'First partial payment'
      }
    ]
  },
  {
    id: 'inv2',
    sentToCustomer: true,
    invoiceNumber: 'INV-2026-4402',
    masterOrderId: 'mo2',
    orderNumber: 'MO-2026-0988',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    manufacturerId: 'm1',
    manufacturerName: 'SunBio LifeSciences Ltd',
    invoiceDate: '2026-06-15',
    dueDate: '2026-08-14',
    subtotal: 500000,
    taxTotal: 60000,
    totalAmount: 560000,
    paidAmount: 0,
    balanceAmount: 560000,
    status: 'OVERDUE',
    currency: 'INR',
    lines: [
      { id: 'il4', productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR', hsnCode: '30049099', quantity: 15000, unitPrice: 33.33, taxAmount: 60000, totalAmount: 560000 }
    ],
    payments: []
  },
  {
    id: 'inv3',
    status: 'GENERATED',
    sentToCustomer: false,
    invoiceNumber: 'INV-2026-4819',
    masterOrderId: 'mo1',
    orderNumber: 'MO-2026-1001',
    subOrderId: 'SO-1001-01',
    subOrderNumber: 'SO-1001-01',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    customerCode: 'CUS000101',
    manufacturerId: 'm1',
    manufacturerName: 'SunBio LifeSciences Ltd',
    invoiceDate: '2026-08-10',
    dueDate: '2026-09-10',
    subtotal: 25700,
    taxTotal: 3084,
    totalAmount: 28784,
    paidAmount: 23456,
    balanceAmount: 5328,
    status: 'PARTIAL_PAYMENT',
    currency: 'INR',
    lines: [
      { id: 'il5', productId: 'p1', productName: 'Paracetamol 500mg & Azithromycin 500mg', hsnCode: '30049099', quantity: 12000, unitPrice: 2.14, taxAmount: 3084, totalAmount: 28784 }
    ],
    payments: [
      {
        id: 'pay_4819_1',
        invoiceId: 'inv3',
        amount: 23456,
        currency: 'INR',
        paymentMethod: 'Bank Transfer',
        paymentDate: '2026-08-12',
        reference: 'UTR-987412',
        status: 'COMPLETED',
        remarks: 'Initial advance payment'
      }
    ]
  }
];

export const mockComplianceCases: ComplianceCase[] = [
  {
    id: 'comp1',
    caseNumber: 'CMP-2026-091',
    entityType: 'CUSTOMER',
    entityId: 'c4',
    entityName: 'Zenith Global Pharma Exporters',
    caseType: 'KYC',
    status: 'UNDER_REVIEW',
    assignedOfficer: 'Compliance Officer (You)',
    createdDate: '2026-07-28',
    updatedDate: '2026-08-02',
    riskScore: 'MEDIUM',
    checklist: [
      { title: 'GSTIN Registration Verification (15 Digits)', mandatory: true, passed: true },
      { title: 'PAN Format & Name Cross-Match', mandatory: true, passed: true },
      { title: 'Drug License 20B/21B Validity Audit', mandatory: true, passed: true },
      { title: 'Incorporation & Export Code Verification', mandatory: true, passed: false },
      { title: 'Cancelled Cheque & Bank Account Audit', mandatory: true, passed: false }
    ],
    documents: [
      { name: 'GST Certificate.pdf', url: '#', verified: true },
      { name: 'Drug License Copy.pdf', url: '#', verified: true, expiryDate: '2028-12-31' },
      { name: 'Incorporation Certificate.pdf', url: '#', verified: false }
    ]
  },
  {
    id: 'comp2',
    caseNumber: 'CMP-2026-088',
    entityType: 'MANUFACTURER',
    entityId: 'm1',
    entityName: 'SunBio LifeSciences Ltd',
    caseType: 'DRUG_LICENSE',
    status: 'APPROVED',
    assignedOfficer: 'Compliance Officer (You)',
    createdDate: '2026-06-10',
    updatedDate: '2026-06-12',
    riskScore: 'LOW',
    checklist: [
      { title: 'Manufacturing License Verification', mandatory: true, passed: true },
      { title: 'WHO-GMP Audit Certificate', mandatory: true, passed: true },
      { title: 'Pollution Control NOC Audit', mandatory: true, passed: true }
    ],
    documents: [
      { name: 'Mfg License Baddi.pdf', url: '#', verified: true, expiryDate: '2027-05-30' },
      { name: 'WHO-GMP Cert.pdf', url: '#', verified: true, expiryDate: '2027-01-09' }
    ]
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Sub-Order SO-2026-1001-02 Ready to Dispatch',
    message: 'Cipla Partner Formulations has updated sub-order status to READY_TO_DISPATCH.',
    timestamp: '10 mins ago',
    type: 'INFO',
    read: false,
    link: 'orders'
  },
  {
    id: 'n2',
    title: 'New Sealed Quote Received',
    message: 'SunBio LifeSciences Ltd submitted a quote for RFQ-2026-8801 ($154,560 Total).',
    timestamp: '1 hour ago',
    type: 'SUCCESS',
    read: false,
    link: 'quotes'
  },
  {
    id: 'n3',
    title: 'Certificate Expiry Alert',
    message: 'SunBio ISO 9001:2015 certificate expires in 60 days. Request renewal document.',
    timestamp: '3 hours ago',
    type: 'WARNING',
    category: 'COMPLIANCE',
    read: true,
    link: 'compliance'
  },
  {
    id: 'n4',
    title: 'Cold-Chain Telemetry Warning',
    message: 'Shipment SHP-9042 temperature registered 7.8°C (upper limit alert threshold).',
    timestamp: '4 hours ago',
    type: 'WARNING',
    category: 'DISPATCH',
    read: false,
    link: 'orders'
  },
  {
    id: 'n5',
    title: 'Invoice INV-2026-4401 Payment Received',
    message: 'Payment of ₹1,00,000 received via RTGS for Apex Pharma.',
    timestamp: '1 day ago',
    type: 'SUCCESS',
    category: 'PAYMENT',
    read: true,
    link: 'invoices'
  }
];

export const mockBuyerOnboardings: any[] = [
  {
    id: 'bo1',
    companyName: 'Zenith Global Pharma Exporters',
    gstin: '24DDDDD3333D1Z9',
    pan: 'DDDDD3333D',
    drugLicenseNo: 'GJ-DL-2026-11002',
    address: 'Plot 45, GIDC Industrial Estate, Naroda, Ahmedabad, Gujarat',
    contactPerson: 'Vikram Mehta',
    email: 'exports@zenithpharma.com',
    phone: '+91 97222 88990',
    documents: [
      { name: 'GST_Certificate.pdf', type: 'GST', status: 'VERIFIED', url: '#' },
      { name: 'Drug_License_20B_21B.pdf', type: 'DRUG_LICENSE', status: 'VERIFIED', url: '#' },
      { name: 'WHO_GMP_Certificate.pdf', type: 'WHO_GMP', status: 'PENDING', url: '#' },
      { name: 'Trademark_Reg.pdf', type: 'TRADEMARK', status: 'PENDING', url: '#' }
    ],
    status: 'UNDER_REVIEW',
    buyerCode: 'BUY-2026-104',
    submittedDate: '2026-07-28'
  }
];

export const mockManufacturerOnboardings: any[] = [
  {
    id: 'mo1',
    companyName: 'NovaMed Formulations Pvt Ltd',
    factoryDetails: '3-Line Automated Sterile Injections & Tablet Facility (35,000 sq ft)',
    mfgCapacity: '50 Million Tablets / Month',
    whoGmpNo: 'WHO-GMP-HP-2025-092',
    drugCategories: ['Antibiotics', 'Analgesics', 'Cardiovascular'],
    factoryLocation: 'Baddi Industrial Area, Solan, Himachal Pradesh',
    gstin: '02MMM3344K1Z2',
    pan: 'MMM3344K',
    mfgLicenseNo: 'HP-MFG-2023-44102',
    contactPerson: 'Dr. Rajesh Vardhan',
    email: 'regulatory@novamedpharma.com',
    phone: '+91 98160 55443',
    certifications: ['WHO-GMP', 'ISO 9001:2015', 'EU-GMP Compliant'],
    documents: [
      { name: 'Mfg_License_Baddi.pdf', type: 'LICENSE', status: 'VERIFIED', url: '#' },
      { name: 'WHO_GMP_Master.pdf', type: 'WHO_GMP', status: 'VERIFIED', url: '#' }
    ],
    status: 'UNDER_REVIEW',
    manufacturerCode: 'MFG-2026-089',
    submittedDate: '2026-08-01'
  }
];

export const mockShipments: any[] = [
  {
    id: 'shp1',
    subOrderId: 'so1',
    subOrderNumber: 'SO-2026-1001-01',
    masterOrderNumber: 'MO-2026-1001',
    manufacturerName: 'SunBio LifeSciences Ltd',
    customerName: 'Apex Pharma PCD Franchise',
    vehicleNumber: 'HP 12 B 9042 (Refrigerated Truck)',
    courierName: 'ColdEx Pharma Express Logistics',
    trackingNumber: 'TRK-COLD-9042881',
    driverName: 'Ramesh Singh',
    driverPhone: '+91 98450 11223',
    gpsLocation: { lat: 28.6139, lng: 77.209, address: 'NH-44 Toll Plaza, Ambala - En Route to Delhi hub' },
    coldChainRequired: true,
    coldChainStatus: 'COMPLIANT (2°C - 8°C)',
    tempLogs: [
      { timestamp: '08:00 AM', temperatureC: 4.2, status: 'NORMAL' },
      { timestamp: '10:00 AM', temperatureC: 4.8, status: 'NORMAL' },
      { timestamp: '12:00 PM', temperatureC: 5.1, status: 'NORMAL' },
      { timestamp: '02:00 PM', temperatureC: 4.5, status: 'NORMAL' },
      { timestamp: '04:00 PM', temperatureC: 4.9, status: 'NORMAL' }
    ],
    dispatchDate: '2026-08-04',
    eta: '2026-08-07',
    status: 'IN_TRANSIT',
    timeline: [
      { title: 'Quality Batch Clearance & COA Uploaded', timestamp: '2026-08-03 16:00', completed: true },
      { title: 'Loaded into Cold Chain Refrigerated Container', timestamp: '2026-08-04 09:30', completed: true },
      { title: 'Dispatched from Baddi Plant (HP)', timestamp: '2026-08-04 11:00', completed: true },
      { title: 'In Transit - Ambala Checkpoint Passed', timestamp: '2026-08-05 14:20', completed: true },
      { title: 'Out for Delivery to Apex Warehouse', timestamp: 'Pending', completed: false },
      { title: 'Proof of Delivery (POD) Signed', timestamp: 'Pending', completed: false }
    ]
  }
];

export const mockCRMLeads: any[] = [
  {
    id: 'crm1',
    customerId: 'c1',
    customerName: 'Apex Pharma PCD Franchise',
    contactPerson: 'Rajesh Sharma',
    email: 'procurement@apexpharma.com',
    phone: '+91 98765 43210',
    stage: 'NEGOTIATION',
    priority: 'HIGH',
    annualRevenue: 15000000,
    assignedRep: 'Siddharth Varma (Key Account Manager)',
    notes: 'Primary PCD distributor in North India. Requesting credit limit expansion to ₹35L upon MO-2026-1001 fulfillment.',
    interactions: [
      { id: 'i1', date: '2026-08-04', type: 'MEETING', summary: 'Reviewed quarterly RFQ volume & upcoming winter antibiotic requirements.', author: 'Siddharth Varma' },
      { id: 'i2', date: '2026-07-25', type: 'CALL', summary: 'Discussed pricing discount on Amoxicillin 500mg bulk order.', author: 'Siddharth Varma' }
    ]
  },
  {
    id: 'crm2',
    customerId: 'c2',
    customerName: 'BioCure Healthcare (TPM)',
    contactPerson: 'Priya Nair',
    email: 'tpm@biocurehealth.in',
    phone: '+91 98111 22334',
    stage: 'QUALIFIED',
    priority: 'MEDIUM',
    annualRevenue: 28000000,
    assignedRep: 'Neha Kapoor',
    notes: 'Third party manufacturing account with recurring monthly volume of Pantoprazole capsules.',
    interactions: [
      { id: 'i3', date: '2026-08-01', type: 'EMAIL', summary: 'Sent updated product catalog and WHO-GMP audit reports.', author: 'Neha Kapoor' }
    ]
  }
];

export const mockPaymentTransactions: any[] = [
  {
    id: 'tx1',
    transactionRef: 'RTGS-HDFC-9910283',
    invoiceId: 'inv1',
    invoiceNumber: 'INV-2026-4401',
    customerName: 'Apex Pharma PCD Franchise',
    date: '2026-08-02',
    amount: 100000,
    paymentMethod: 'RTGS',
    status: 'COMPLETED',
    remarks: 'Advance payment against Order MO-2026-1001'
  },
  {
    id: 'tx2',
    transactionRef: 'NEFT-ICICI-4410291',
    invoiceId: 'inv2',
    invoiceNumber: 'INV-2026-4402',
    customerName: 'BioCure Healthcare (TPM)',
    date: '2026-07-28',
    amount: 450000,
    paymentMethod: 'NEFT',
    status: 'COMPLETED',
    remarks: 'Full settlement for Invoice INV-2026-4402'
  }
];

export const mockAuditLogs: any[] = [
  {
    id: 'log1',
    timestamp: '2026-08-06 18:40:12',
    userName: 'Compliance Officer',
    userRole: 'COMPLIANCE_OFFICER',
    module: 'Compliance Desk',
    action: 'Approved Drug License DL-DL-2024-88912 for Apex Pharma',
    ipAddress: '192.168.1.104'
  },
  {
    id: 'log2',
    timestamp: '2026-08-06 17:15:00',
    userName: 'Rajesh Sharma (Buyer)',
    userRole: 'BUYER',
    module: 'RFQ Center',
    action: 'Created RFQ-2026-8801 with 3 lines',
    ipAddress: '103.44.12.89'
  },
  {
    id: 'log3',
    timestamp: '2026-08-06 16:30:45',
    userName: 'SunBio LifeSciences',
    userRole: 'SUPPLIER',
    module: 'Quote Matrix',
    action: 'Submitted Quote QTE-2026-901 for RFQ-2026-8801',
    ipAddress: '115.242.9.12'
  }
];

export const mockCustomerVerifications: CustomerVerificationRequest[] = [
  {
    id: 'CUS-VER-101',
    customerName: 'Rajesh Sharma',
    companyName: 'Apex Pharma PCD Franchise',
    customerType: 'PCD',
    customerClassification: 'REGULAR',
    registrationDate: '2026-07-15',
    verificationStatus: 'Active',
    assignedComplianceOfficer: 'Rajesh Kumar (Compliance Desk A)',
    
    // Company Info
    businessType: 'Private Limited',
    gstNumber: '07AAAAA0000A1Z5',
    panNumber: 'AAAAA0000A',
    drugLicenseNumber: 'DL-DL-2024-88912 (Form 20B/21B)',
    cinNumber: 'U24232DL2020PTC361234',
    website: 'https://apexpharma.com',

    // Contact Info
    contactPerson: 'Rajesh Sharma',
    designation: 'Managing Director',
    mobileNumber: '+91 98765 43210',
    email: 'procurement@apexpharma.com',

    // Address Info
    billingAddress: 'Plot 42, Okhla Industrial Area Phase III, New Delhi',
    shippingAddress: 'Plot 42, Okhla Industrial Area Phase III, New Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '110020',

    // PCD Details
    pcdDetails: {
      territory: 'North India Zone A',
      state: 'Delhi NCR',
      district: 'South Delhi',
      monopolyRights: true,
      brandPortfolio: 'Cardiology, Diabetology, General Formulations'
    },

    documents: [
      { id: 'd101', documentType: 'GST Certificate', fileName: 'GST_Certificate_Apex.pdf', fileSize: '1.2 MB', uploadedAt: '2026-07-15', status: 'Valid', url: '#' },
      { id: 'd102', documentType: 'PAN Card', fileName: 'PAN_Card_Apex.pdf', fileSize: '850 KB', uploadedAt: '2026-07-15', status: 'Valid', url: '#' },
      { id: 'd103', documentType: 'Drug License', fileName: 'Drug_License_Form_20B_21B.pdf', fileSize: '2.4 MB', uploadedAt: '2026-07-15', status: 'Valid', url: '#' },
      { id: 'd104', documentType: 'Incorporation Certificate', fileName: 'COI_Apex_Pharma.pdf', fileSize: '1.8 MB', uploadedAt: '2026-07-15', status: 'Valid', url: '#' },
      { id: 'd105', documentType: 'Cancelled Cheque', fileName: 'HDFC_Bank_Cancelled_Cheque.pdf', fileSize: '620 KB', uploadedAt: '2026-07-15', status: 'Valid', url: '#' },
      { id: 'd106', documentType: 'Signed Agreement', fileName: 'FG_Master_Service_Agreement.pdf', fileSize: '3.1 MB', uploadedAt: '2026-07-15', status: 'Valid', url: '#' }
    ],
    autoValidation: {
      gstCheck: 'Valid',
      panCheck: 'Valid',
      requiredDocsCheck: 'Valid',
      requiredFieldsCheck: 'Valid',
      overallStatus: 'Valid',
      validationDetails: [
        'GSTIN format (15 characters) verified against GST Portal API.',
        'PAN 10-character structure valid and matched company name.',
        'All 6 mandatory onboarding documents present.',
        'Required corporate details fully populated.'
      ]
    },
    businessVerification: {
      gstActiveStatus: 'Active',
      panValidation: 'Verified',
      companyRegistrationValidation: 'Verified (ROC)',
      cinValidation: 'Active & Verified'
    },
    regulatoryVerification: {
      drugLicenseValidity: 'Valid (Form 20B/21B)',
      licenseExpiryCheck: 'Valid until 15-Oct-2028 (792 days remaining)',
      stateRegulatoryAuthorityValidation: 'Verified with State FDA'
    },
    financialVerification: {
      bankVerification: 'Verified (Penny Drop Passed)',
      creditRating: 'AAA (Low Risk)',
      riskClassification: 'LOW'
    },
    customerCode: 'CUS000101',
    portalLoginCreated: true,
    portalUsername: 'procurement@apexpharma.com',
    approvedAt: '2026-07-16'
  },
  {
    id: 'CUS-VER-102',
    customerName: 'Priya Nair',
    companyName: 'BioCure Healthcare (TPM)',
    customerType: 'TPM',
    customerClassification: 'REGULAR',
    registrationDate: '2026-08-01',
    verificationStatus: 'Under Review',
    assignedComplianceOfficer: 'Sneha Patel (Senior Auditor)',

    // Company Info
    businessType: 'Public Limited',
    gstNumber: '27BBBBB1111B1Z2',
    panNumber: 'BBBBB1111B',
    drugLicenseNumber: 'MH-DL-2025-33412',
    cinNumber: 'U24239MH2018PLC309876',
    website: 'https://biocurehealth.in',

    // Contact Info
    contactPerson: 'Priya Nair',
    designation: 'Head of Regulatory Affairs',
    mobileNumber: '+91 98111 22334',
    email: 'tpm@biocurehealth.in',

    // Address Info
    billingAddress: '701, Trade Tower, Bandra East, Mumbai',
    shippingAddress: 'Plot 12, Tarapur MIDC, Palghar',
    state: 'Maharashtra',
    country: 'India',
    pincode: '400051',

    // TPM Details
    tpmDetails: {
      brandName: 'BioCure Formulations',
      packagingRequirements: 'Alu-Alu & Blister Pack in Dehumidified Lines',
      artworkApproval: true,
      regulatoryRequirements: 'Form 25/28 CDSCO Clearance Required',
      moqAgreement: true
    },

    documents: [
      { id: 'd201', documentType: 'GST Certificate', fileName: 'BioCure_GSTIN_Reg.pdf', fileSize: '1.4 MB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' },
      { id: 'd202', documentType: 'PAN Card', fileName: 'BioCure_Company_PAN.pdf', fileSize: '790 KB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' },
      { id: 'd203', documentType: 'Drug License', fileName: 'MH_FDA_Form25_28_License.pdf', fileSize: '2.1 MB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' },
      { id: 'd204', documentType: 'Incorporation Certificate', fileName: 'ROC_Incorporation_BioCure.pdf', fileSize: '1.9 MB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' },
      { id: 'd205', documentType: 'Cancelled Cheque', fileName: 'ICICI_Bank_Cheque_BioCure.pdf', fileSize: '550 KB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' },
      { id: 'd206', documentType: 'Signed Agreement', fileName: 'Signed_Vendor_Agreement.pdf', fileSize: '2.9 MB', uploadedAt: '2026-08-01', status: 'Pending Review', url: '#' }
    ],
    autoValidation: {
      gstCheck: 'Valid',
      panCheck: 'Valid',
      requiredDocsCheck: 'Valid',
      requiredFieldsCheck: 'Valid',
      overallStatus: 'Valid',
      validationDetails: [
        'GSTIN format verified.',
        'PAN format verified.',
        'All 6 required documents uploaded.',
        'Contact & location fields complete.'
      ]
    },
    businessVerification: {
      gstActiveStatus: 'Active',
      panValidation: 'Verified',
      companyRegistrationValidation: 'Verified (ROC)',
      cinValidation: 'Active & Verified'
    },
    regulatoryVerification: {
      drugLicenseValidity: 'Valid (Form 20B/21B)',
      licenseExpiryCheck: 'Valid until 20-Sep-2027 (402 days remaining)',
      stateRegulatoryAuthorityValidation: 'Verified with State FDA'
    },
    financialVerification: {
      bankVerification: 'Verified (Penny Drop Passed)',
      creditRating: 'AA (Moderate Risk)',
      riskClassification: 'LOW'
    }
  },
  {
    id: 'CUS-VER-103',
    customerName: 'Dr. Suresh Rao',
    companyName: 'Metro City Multi-Specialty Hospital',
    customerType: 'Hospital',
    customerClassification: 'REGULAR',
    registrationDate: '2026-08-05',
    verificationStatus: 'Need More Docs',
    assignedComplianceOfficer: 'Rajesh Kumar (Compliance Desk A)',

    // Company Info
    businessType: 'Healthcare Institution',
    gstNumber: '29CCCCC2222C1Z8',
    panNumber: 'CCCCC2222C',
    drugLicenseNumber: 'KA-DL-2024-99120',
    cinNumber: 'U85110KA2015PTC081234',
    website: 'https://metrohospital.org',

    // Contact Info
    contactPerson: 'Dr. Suresh Rao',
    designation: 'Director of Pharmacy Procurement',
    mobileNumber: '+91 99000 55443',
    email: 'purchase@metrohospital.org',

    // Address Info
    billingAddress: '12 Hospital Road, Indiranagar, Bengaluru',
    shippingAddress: 'Central Pharmacy Store, Block B, Metro Hospital, Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560038',

    // Hospital Details
    hospitalDetails: {
      procurementDepartment: 'Central Clinical Procurement Cell',
      tenderReference: 'MCH-TENDER-2026-089',
      contractValidity: 'Valid till 31-Dec-2027'
    },

    documents: [
      { id: 'd301', documentType: 'GST Certificate', fileName: 'GST_Metro_Hospital.pdf', fileSize: '1.1 MB', uploadedAt: '2026-08-05', status: 'Valid', url: '#' },
      { id: 'd302', documentType: 'PAN Card', fileName: 'PAN_Metro_Hospital.pdf', fileSize: '680 KB', uploadedAt: '2026-08-05', status: 'Valid', url: '#' },
      { id: 'd303', documentType: 'Drug License', fileName: 'Form20B_KA_License.pdf', fileSize: '1.7 MB', uploadedAt: '2026-08-05', status: 'Valid', url: '#' },
      { id: 'd304', documentType: 'Incorporation Certificate', fileName: 'COI_MetroHospital.pdf', fileSize: '1.3 MB', uploadedAt: '2026-08-05', status: 'Valid', url: '#' },
      { id: 'd305', documentType: 'Cancelled Cheque', fileName: 'Cancelled_Cheque_Blurry.pdf', fileSize: '320 KB', uploadedAt: '2026-08-05', status: 'Invalid', notes: 'Cheque image blurry, IFSC code not legible', url: '#' },
      { id: 'd306', documentType: 'Signed Agreement', fileName: 'Unsigned_Agreement_Draft.pdf', fileSize: '2.1 MB', uploadedAt: '2026-08-05', status: 'Invalid', notes: 'Missing authorized signatory signature on page 8', url: '#' }
    ],
    autoValidation: {
      gstCheck: 'Valid',
      panCheck: 'Valid',
      requiredDocsCheck: 'Invalid',
      requiredFieldsCheck: 'Valid',
      overallStatus: 'Invalid',
      validationDetails: [
        'GST & PAN formats match statutory rules.',
        'Cancelled Cheque image failed clear legibility check.',
        'Signed agreement missing final signature block.'
      ]
    },
    businessVerification: {
      gstActiveStatus: 'Active',
      panValidation: 'Verified',
      companyRegistrationValidation: 'Verified (ROC)',
      cinValidation: 'Active & Verified'
    },
    regulatoryVerification: {
      drugLicenseValidity: 'Valid (Form 20B/21B)',
      licenseExpiryCheck: 'Valid until 12-Nov-2027 (455 days remaining)',
      stateRegulatoryAuthorityValidation: 'Verified with State FDA'
    },
    financialVerification: {
      bankVerification: 'Unverified',
      creditRating: 'AA (Moderate Risk)',
      riskClassification: 'MEDIUM'
    },
    requestedDocumentsNotes: [
      'Re-upload Cancelled Cheque with clear bank account & IFSC print.',
      'Re-upload Signed Agreement with official signature and hospital seal on page 8.'
    ]
  },
  {
    id: 'CUS-VER-104',
    customerName: 'Vikram Mehta',
    companyName: 'Zenith Global Pharma Exporters',
    customerType: 'Export',
    customerClassification: 'REGULAR',
    registrationDate: '2026-08-10',
    verificationStatus: 'Pending',
    assignedComplianceOfficer: 'Unassigned',

    // Company Info
    businessType: 'Export House',
    gstNumber: '24DDDDD3333D1Z9',
    panNumber: 'DDDDD3333D',
    drugLicenseNumber: 'GJ-DL-2026-11002',
    cinNumber: 'U24231GJ2021PLC098765',
    website: 'https://zenithpharma.com',

    // Contact Info
    contactPerson: 'Vikram Mehta',
    designation: 'Head of Global Trade',
    mobileNumber: '+91 97222 88990',
    email: 'exports@zenithpharma.com',

    // Address Info
    billingAddress: '404 GIDC Electronics Zone, Gandhinagar, Gujarat',
    shippingAddress: 'Customs Warehouse, Port of Hazira, Gujarat',
    state: 'Gujarat',
    country: 'India',
    pincode: '382010',

    // Export Details
    exportDetails: {
      targetRegions: 'LATAM, CIS Countries, Southeast Asia',
      iecCode: '0304991204 (Active)'
    },

    documents: [
      { id: 'd401', documentType: 'GST Certificate', fileName: 'Zenith_GSTIN.pdf', fileSize: '1.5 MB', uploadedAt: '2026-08-10', status: 'Pending Review', url: '#' },
      { id: 'd402', documentType: 'PAN Card', fileName: 'Zenith_PAN.pdf', fileSize: '810 KB', uploadedAt: '2026-08-10', status: 'Pending Review', url: '#' },
      { id: 'd403', documentType: 'Drug License', fileName: 'GJ_Form_20B_21B.pdf', fileSize: '2.8 MB', uploadedAt: '2026-08-10', status: 'Pending Review', url: '#' },
      { id: 'd404', documentType: 'Incorporation Certificate', fileName: 'Zenith_COI.pdf', fileSize: '1.6 MB', uploadedAt: '2026-08-10', status: 'Pending Review', url: '#' },
      { id: 'd405', documentType: 'Cancelled Cheque', fileName: 'SBI_Cheque_Zenith.pdf', fileSize: '700 KB', uploadedAt: '2026-08-10', status: 'Pending Review', url: '#' },
      { id: 'd406', documentType: 'Signed Agreement', fileName: 'Zenith_Platform_Agreement.pdf', fileSize: '3.4 MB', uploadedAt: '2026-08-10', status: 'Pending Review', url: '#' }
    ],
    autoValidation: {
      gstCheck: 'Valid',
      panCheck: 'Valid',
      requiredDocsCheck: 'Valid',
      requiredFieldsCheck: 'Valid',
      overallStatus: 'Valid',
      validationDetails: [
        'GSTIN format valid.',
        'PAN format valid.',
        'All 6 required documents attached.',
        'Export registration details submitted.'
      ]
    },
    businessVerification: {
      gstActiveStatus: 'Active',
      panValidation: 'Verified',
      companyRegistrationValidation: 'Verified (ROC)',
      cinValidation: 'Active & Verified'
    },
    regulatoryVerification: {
      drugLicenseValidity: 'Valid (Form 20B/21B)',
      licenseExpiryCheck: 'Valid until 15-Oct-2026 (62 days remaining)',
      stateRegulatoryAuthorityValidation: 'Pending'
    },
    financialVerification: {
      bankVerification: 'Pending',
      creditRating: 'Unrated',
      riskClassification: 'LOW'
    }
  },
  {
    id: 'CUS-VER-105',
    customerName: 'Amit Verma',
    companyName: 'MedSupply Wholesale Distributors',
    customerType: 'Distributor',
    customerClassification: 'REGULAR',
    registrationDate: '2026-07-20',
    verificationStatus: 'Approved',
    assignedComplianceOfficer: 'Sneha Patel (Senior Auditor)',

    // Company Info
    businessType: 'Partnership Firm',
    gstNumber: '09AAAAM5544K1Z1',
    panNumber: 'AAAAM5544K',
    drugLicenseNumber: 'UP-DL-2024-55112',
    cinNumber: 'U51909UP2019PTC112233',
    website: 'https://medsupplydist.in',

    // Contact Info
    contactPerson: 'Amit Verma',
    designation: 'Managing Partner',
    mobileNumber: '+91 94150 77889',
    email: 'contact@medsupplydist.in',

    // Address Info
    billingAddress: 'Industrial Area Phase 2, Transport Nagar, Lucknow',
    shippingAddress: 'Industrial Area Phase 2, Transport Nagar, Lucknow',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '226012',

    // Distributor Details
    distributorDetails: {
      distributionTerritory: 'Central UP & Purvanchal Region',
      salesChannel: 'Retail Pharmacy Networks & Nursing Homes',
      warehouseLocations: 'Lucknow Central Warehouse (15,000 sq ft)'
    },

    documents: [
      { id: 'd501', documentType: 'GST Certificate', fileName: 'MedSupply_GST.pdf', fileSize: '1.0 MB', uploadedAt: '2026-07-20', status: 'Valid', url: '#' },
      { id: 'd502', documentType: 'PAN Card', fileName: 'MedSupply_PAN.pdf', fileSize: '650 KB', uploadedAt: '2026-07-20', status: 'Valid', url: '#' },
      { id: 'd503', documentType: 'Drug License', fileName: 'UP_Drug_License.pdf', fileSize: '2.0 MB', uploadedAt: '2026-07-20', status: 'Valid', url: '#' },
      { id: 'd504', documentType: 'Incorporation Certificate', fileName: 'MedSupply_Incorporation.pdf', fileSize: '1.5 MB', uploadedAt: '2026-07-20', status: 'Valid', url: '#' },
      { id: 'd505', documentType: 'Cancelled Cheque', fileName: 'AxisBank_Cheque.pdf', fileSize: '480 KB', uploadedAt: '2026-07-20', status: 'Valid', url: '#' },
      { id: 'd506', documentType: 'Signed Agreement', fileName: 'Signed_Agreement_MedSupply.pdf', fileSize: '2.8 MB', uploadedAt: '2026-07-20', status: 'Valid', url: '#' }
    ],
    autoValidation: {
      gstCheck: 'Valid',
      panCheck: 'Valid',
      requiredDocsCheck: 'Valid',
      requiredFieldsCheck: 'Valid',
      overallStatus: 'Valid',
      validationDetails: [
        'Automated checks cleared.',
        'Regulatory documents verified against UP FDA database.'
      ]
    },
    businessVerification: {
      gstActiveStatus: 'Active',
      panValidation: 'Verified',
      companyRegistrationValidation: 'Verified (ROC)',
      cinValidation: 'Active & Verified'
    },
    regulatoryVerification: {
      drugLicenseValidity: 'Valid (Form 20B/21B)',
      licenseExpiryCheck: 'Valid until 30-Jun-2028 (685 days remaining)',
      stateRegulatoryAuthorityValidation: 'Verified with State FDA'
    },
    financialVerification: {
      bankVerification: 'Verified (Penny Drop Passed)',
      creditRating: 'AAA (Low Risk)',
      riskClassification: 'LOW'
    },
    customerCode: 'CUS000105',
    portalLoginCreated: true,
    portalUsername: 'contact@medsupplydist.in',
    approvedAt: '2026-07-21'
  },
  {
    id: 'CUS-VER-106',
    customerName: 'Sunil Kapoor',
    companyName: 'Unverified Wholesale Traders',
    customerType: 'Wholesaler',
    customerClassification: 'REGULAR',
    registrationDate: '2026-07-10',
    verificationStatus: 'Rejected',
    assignedComplianceOfficer: 'Rajesh Kumar (Compliance Desk A)',

    // Company Info
    businessType: 'Proprietorship',
    gstNumber: '09UNV8899K1Z1',
    panNumber: 'UNV8899K1Z',
    drugLicenseNumber: 'EXPIRED-DL-2020-001',
    cinNumber: 'INVALID-CIN-NUMBER',
    website: 'http://unverifiedtraders.org',

    // Contact Info
    contactPerson: 'Sunil Kapoor',
    designation: 'Proprietor',
    mobileNumber: '+91 91234 56789',
    email: 'unverified@tradersnet.org',

    // Address Info
    billingAddress: 'Main Market Road, Kanpur',
    shippingAddress: 'Main Market Road, Kanpur',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '208001',

    // Wholesaler Details
    wholesalerDetails: {
      storageCapacitySqFt: '2,500 sq ft',
      coldChainStorage: false,
      networkSize: '15 retail shops'
    },

    documents: [
      { id: 'd601', documentType: 'GST Certificate', fileName: 'Cancelled_GST_Reg.pdf', fileSize: '900 KB', uploadedAt: '2026-07-10', status: 'Invalid', notes: 'GSTIN cancelled by tax authorities', url: '#' },
      { id: 'd602', documentType: 'PAN Card', fileName: 'Unmatched_PAN.pdf', fileSize: '500 KB', uploadedAt: '2026-07-10', status: 'Invalid', url: '#' },
      { id: 'd603', documentType: 'Drug License', fileName: 'Expired_Drug_License_2020.pdf', fileSize: '1.2 MB', uploadedAt: '2026-07-10', status: 'Invalid', notes: 'Drug license expired on 31-Dec-2020', url: '#' },
      { id: 'd604', documentType: 'Incorporation Certificate', fileName: 'Dummy_Doc.pdf', fileSize: '300 KB', uploadedAt: '2026-07-10', status: 'Invalid', url: '#' },
      { id: 'd605', documentType: 'Cancelled Cheque', fileName: 'Cheque.pdf', fileSize: '400 KB', uploadedAt: '2026-07-10', status: 'Invalid', url: '#' },
      { id: 'd606', documentType: 'Signed Agreement', fileName: 'Agreement.pdf', fileSize: '1.0 MB', uploadedAt: '2026-07-10', status: 'Invalid', url: '#' }
    ],
    autoValidation: {
      gstCheck: 'Invalid',
      panCheck: 'Invalid',
      requiredDocsCheck: 'Invalid',
      requiredFieldsCheck: 'Valid',
      overallStatus: 'Invalid',
      validationDetails: [
        'GSTIN status reported as CANCELLED by GSTN.',
        'PAN checksum failed validation.',
        'Drug License expired over 180 days ago.',
        'CIN lookup failed MCA corporate index.'
      ]
    },
    businessVerification: {
      gstActiveStatus: 'Inactive',
      panValidation: 'Mismatch',
      companyRegistrationValidation: 'Unverified',
      cinValidation: 'Invalid'
    },
    regulatoryVerification: {
      drugLicenseValidity: 'Expired',
      licenseExpiryCheck: 'Expired on 31-Dec-2020 (-2053 days remaining)',
      stateRegulatoryAuthorityValidation: 'Under Audit'
    },
    financialVerification: {
      bankVerification: 'Unverified',
      creditRating: 'B (High Risk)',
      riskClassification: 'HIGH'
    },
    rejectionReason: 'Rejected due to cancelled GSTIN, invalid PAN, expired Drug License (2020), and failed corporate MCA registration audit.'
  },
  {
    id: 'CUS-VER-107',
    customerName: 'Dr. Ananya Sharma',
    companyName: 'MediPlus Healthcare (Special Party Demo)',
    customerType: 'PCD',
    customerClassification: 'SPECIAL_PARTY',
    registrationDate: '2026-08-01',
    verificationStatus: 'Active',
    assignedComplianceOfficer: 'Sneha Patel (Senior Auditor)',
    businessType: 'Private Limited',
    gstNumber: '06EEEEE5555E1Z7',
    panNumber: 'EEEEE5555E',
    drugLicenseNumber: 'HR-DL-2025-44912',
    cinNumber: 'U24239HR2021PTC099123',
    website: 'https://mediplushealth.com',
    contactPerson: 'Dr. Ananya Sharma',
    designation: 'Procurement Director',
    mobileNumber: '+91 98123 45678',
    email: 'procurement@mediplushealth.com',
    billingAddress: 'Tower B, Cyber City, DLF Phase 2, Gurugram',
    shippingAddress: 'Central Distribution Warehouse, Manesar, Haryana',
    state: 'Haryana',
    country: 'India',
    pincode: '122002',
    pcdDetails: {
      territory: 'North India & NCR',
      state: 'Haryana & Delhi NCR',
      district: 'Gurugram',
      monopolyRights: true,
      brandPortfolio: 'Critical Care, Antibiotics, Nutraceuticals'
    },
    documents: [
      { id: 'd501', documentType: 'GST Certificate', fileName: 'GST_MediPlus.pdf', fileSize: '1.4 MB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' },
      { id: 'd502', documentType: 'PAN Card', fileName: 'PAN_MediPlus.pdf', fileSize: '720 KB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' },
      { id: 'd503', documentType: 'Drug License', fileName: 'Form20B_HR_MediPlus.pdf', fileSize: '2.1 MB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' },
      { id: 'd504', documentType: 'Incorporation Certificate', fileName: 'COI_MediPlus.pdf', fileSize: '1.9 MB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' },
      { id: 'd505', documentType: 'Cancelled Cheque', fileName: 'ICICI_Cancelled_Cheque.pdf', fileSize: '540 KB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' },
      { id: 'd506', documentType: 'Signed Agreement', fileName: 'FG_Special_Party_Contract.pdf', fileSize: '3.4 MB', uploadedAt: '2026-08-01', status: 'Valid', url: '#' }
    ],
    autoValidation: {
      gstCheck: 'Valid',
      panCheck: 'Valid',
      requiredDocsCheck: 'Valid',
      requiredFieldsCheck: 'Valid',
      overallStatus: 'Valid',
      validationDetails: [
        'GSTIN format verified against GST Portal API.',
        'Special Party enterprise authorization verified.',
        'All 6 statutory documents verified.'
      ]
    },
    businessVerification: {
      gstActiveStatus: 'Active',
      panValidation: 'Verified',
      companyRegistrationValidation: 'Verified (ROC)',
      cinValidation: 'Active & Verified'
    },
    regulatoryVerification: {
      drugLicenseValidity: 'Valid (Form 20B/21B)',
      licenseExpiryCheck: 'Valid until 18-Dec-2028 (840 days remaining)',
      stateRegulatoryAuthorityValidation: 'Verified with Haryana FDA'
    },
    financialVerification: {
      bankVerification: 'Verified (Penny Drop Passed)',
      creditRating: 'AAA (Premium Special Party)',
      riskClassification: 'LOW'
    },
    customerCode: 'CUS000105',
    portalLoginCreated: true,
    creditLimitAssigned: 7500000,
    creditDaysAssigned: 60
  }
];


