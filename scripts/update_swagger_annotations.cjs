const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Helper to replace or report
function updateFile(relPath, replacer) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error('File not found:', fullPath);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  content = replacer(content);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Updated:', relPath);
}

// 1. login.dto.ts
updateFile('backend/apps/factorygrid-api/src/modules/iam/dto/login.dto.ts', () => {
  return `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IsNotBlank } from './not-blank';

export class LoginDto {
  @ApiProperty({
    description: 'Username or registered email address',
    example: 'admin@factorygrid.com',
  })
  @IsNotBlank({ message: 'Username or email is required' })
  usernameOrEmail!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    example: 'Admin12345678',
    type: String,
    format: 'password',
  })
  @IsNotBlank({ message: 'Password is required' })
  password!: string;

  @ApiPropertyOptional({
    description: 'Optional portal check: BUYER, MANUFACTURER, SUPPLIER, or ADMIN',
    example: 'ADMIN',
  })
  @IsOptional()
  @IsString()
  portalType?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Cryptographically secure refresh token UUID received from login or refresh',
    example: '0dcf40ed-cbc8-4432-aec0-f054e2747a30',
  })
  @IsNotBlank({ message: 'Refresh token is required' })
  refreshToken!: string;
}

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Optional refresh token to revoke upon logout',
    example: '0dcf40ed-cbc8-4432-aec0-f054e2747a30',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
`;
});

// 2. register.dto.ts
updateFile('backend/apps/factorygrid-api/src/modules/iam/dto/register.dto.ts', () => {
  return `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { IsNotBlank } from './not-blank';

export class BuyerRegistrationDto {
  @ApiProperty({
    description: 'Desired username (3 to 50 characters)',
    example: 'pharma_buyer_01',
    minLength: 3,
    maxLength: 50,
  })
  @Length(3, 50, { message: 'Username must be between 3 and 50 characters' })
  @IsNotBlank({ message: 'Username is required' })
  username!: string;

  @ApiProperty({
    description: 'Official corporate email address',
    example: 'buyer01@testpharma.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotBlank({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters)',
    example: 'Buyer12345678',
    minLength: 8,
    type: String,
    format: 'password',
  })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotBlank({ message: 'Password is required' })
  password!: string;

  @ApiProperty({
    description: 'Full legal name of the user',
    example: 'Vikramaditya Sharma',
  })
  @IsNotBlank({ message: 'Full name is required' })
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Contact telephone number',
    example: '+919876543210',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Company or business legal name',
    example: 'Apex Healthcare Pvt Ltd',
  })
  @IsNotBlank({ message: 'Company name is required' })
  companyName!: string;

  @ApiPropertyOptional({
    description: 'Company registration or tracking code (auto-generated if omitted)',
    example: 'APEX-HC-001',
  })
  @IsOptional()
  @IsString()
  companyCode?: string;

  @ApiPropertyOptional({
    description: 'Department within company',
    example: 'Central Procurement',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Official job title',
    example: 'Head of Sourcing',
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;
}

export class ManufacturerRegistrationDto extends BuyerRegistrationDto {
  @ApiPropertyOptional({
    description: 'Manufacturing facility details and plant location notes',
    example: 'Plant 1: Formulation unit at Baddi, Himachal Pradesh. WHO-GMP accredited.',
  })
  @IsOptional()
  @IsString()
  factoryDetails?: string;
}
`;
});

// 3. responses.dto.ts
updateFile('backend/apps/factorygrid-api/src/modules/iam/dto/responses.dto.ts', () => {
  return `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Public profile of a user. Never includes the password hash. */
export class UserProfileDto {
  @ApiProperty({ example: 2, description: 'Internal numeric user ID' })
  id!: number;

  @ApiProperty({ example: 'USR-ADM-001', description: 'Business user code' })
  userCode!: string;

  @ApiProperty({ example: 'admin', description: 'Unique username' })
  username!: string;

  @ApiProperty({ example: 'admin@factorygrid.com', description: 'User corporate email' })
  email!: string;

  @ApiProperty({ example: 'System Administrator', description: 'Full user legal name' })
  fullName!: string;

  @ApiPropertyOptional({ example: '+919876543210', nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ example: 'FactoryGrid Platform', nullable: true })
  companyName!: string | null;

  @ApiPropertyOptional({ example: 'FG-HQ-001', nullable: true })
  companyCode!: string | null;

  @ApiPropertyOptional({ example: 'Executive IT & Security', nullable: true })
  department!: string | null;

  @ApiPropertyOptional({ example: 'Super Administrator', nullable: true })
  jobTitle!: string | null;

  @ApiProperty({ example: 'ACTIVE', description: 'Account lifecycle status' })
  accountStatus!: string;

  @ApiProperty({ example: ['ROLE_ADMIN'], type: [String], description: 'Assigned platform RBAC roles' })
  roles!: string[];

  @ApiPropertyOptional({ example: '2026-11-05T11:03:38.110Z', nullable: true })
  lastLoginAt!: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Signed JWT Bearer access token', example: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ description: 'Secure refresh token UUID', example: '0dcf40ed-cbc8-4432-aec0-f054e2747a30' })
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer', description: 'Token scheme type' })
  tokenType!: string;

  @ApiProperty({ example: 86400000, description: 'Access token lifetime in milliseconds (24 hours)' })
  expiresIn!: number;

  @ApiProperty({ type: () => UserProfileDto, description: 'Authenticated user profile' })
  user!: UserProfileDto;
}

export class TokenRefreshResponseDto {
  @ApiProperty({ description: 'Newly generated signed JWT Bearer access token', example: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ description: 'Newly rotated refresh token UUID', example: 'e3f01b17-7a89-498c-bc5d-6e9a03970fd1' })
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: 86400000, description: 'Access token lifetime in milliseconds' })
  expiresIn!: number;
}

export class RegistrationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'User account created successfully' })
  message!: string;

  @ApiProperty({ type: () => UserProfileDto })
  user!: UserProfileDto;

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z' })
  timestamp!: string;
}

export class MessageResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;

  @ApiProperty({ type: Object, nullable: true, example: null })
  data!: null;

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z' })
  timestamp!: string;
}

export class UserListResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Users retrieved successfully' })
  message!: string;

  @ApiProperty({ type: () => [UserProfileDto] })
  data!: UserProfileDto[];

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z' })
  timestamp!: string;
}

export class PortalAccessDataDto {
  @ApiProperty({ example: 'BUYER' })
  portal!: string;

  @ApiProperty({ example: 'buyer_pharma_01' })
  accessibleBy!: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', properties: { authority: { type: 'string' } } },
    example: [{ authority: 'ROLE_BUYER' }],
  })
  authorities!: Array<{ authority: string }>;

  @ApiProperty({ example: 'Welcome to Buyer Procurement Portal.' })
  message!: string;
}

export class PortalAccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Portal access granted' })
  message!: string;

  @ApiProperty({ type: () => PortalAccessDataDto })
  data!: PortalAccessDataDto;

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z' })
  timestamp!: string;
}

export class PortalProfileResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Profile accessed' })
  message!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { username: 'buyer_pharma_01', role: 'BUYER' },
  })
  data!: Record<string, string>;

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z' })
  timestamp!: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 401, description: 'HTTP status code' })
  status!: number;

  @ApiProperty({ example: 'Unauthorized', description: 'HTTP error title' })
  error!: string;

  @ApiProperty({ example: 'Invalid credentials or expired JWT token', description: 'Human-readable error message' })
  message!: string;

  @ApiProperty({ example: '2026-11-05T11:03:38.110Z', description: 'ISO 8601 error timestamp' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/auth/login', description: 'Request URI path' })
  path!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Field-level validation error messages (present on 400 Bad Request)',
    example: { email: 'Please provide a valid email address' },
  })
  errors?: Record<string, string>;
}
`;
});

// 4. auth.controller.ts -> @ApiTags('Authentication')
updateFile('backend/apps/factorygrid-api/src/modules/iam/auth.controller.ts', (c) => {
  return c.replace("@ApiTags('Authentication & Registration')", "@ApiTags('Authentication')");
});

// 5. access.controller.ts
updateFile('backend/apps/factorygrid-api/src/modules/iam/access.controller.ts', (c) => {
  c = c.replace("@ApiTags('Admin Governance')", "@ApiTags('Admin')");
  c = c.replace("@ApiTags('Buyer Access Isolation')", "@ApiTags('Buyer')");
  c = c.replace("@ApiTags('Manufacturer Access Isolation')", "@ApiTags('Manufacturer')");
  return c;
});

// 6. Admin controllers
updateFile('backend/apps/factorygrid-api/src/modules/manufacturer/admin-manufacturer.controller.ts', (c) => {
  return c.replace("@ApiTags('Admin Manufacturer Document Verification')", "@ApiTags('Admin')");
});
updateFile('backend/apps/factorygrid-api/src/modules/compliance/compliance.controller.ts', (c) => {
  c = c.replace("@ApiTags('Compliance & Customer Verification')", "@ApiTags('Admin')");
  c = c.replace("@ApiTags('Compliance Documents')", "@ApiTags('Admin')");
  return c;
});
updateFile('backend/apps/factorygrid-api/src/modules/compliance/brand-verification.controller.ts', (c) => {
  return c.replace("@ApiTags('Admin Brand Verification')", "@ApiTags('Admin')");
});
updateFile('backend/apps/factorygrid-api/src/modules/compliance/trademark-verification.controller.ts', (c) => {
  return c.replace("@ApiTags('Admin Trademark Verification')", "@ApiTags('Admin')");
});

// 7. Buyer controllers
updateFile('backend/apps/factorygrid-api/src/modules/buyer/buyer-registration.controller.ts', (c) => {
  return c.replace("@ApiTags('Buyer Onboarding & Registration')", "@ApiTags('Buyer')");
});
updateFile('backend/apps/factorygrid-api/src/modules/buyer/buyer-brand-documents.controller.ts', (c) => {
  return c.replace("@ApiTags('Buyer Brand Documents')", "@ApiTags('Buyer')");
});
updateFile('backend/apps/factorygrid-api/src/modules/buyer/buyer-trademark-documents.controller.ts', (c) => {
  return c.replace("@ApiTags('Buyer Trademark Documents')", "@ApiTags('Buyer')");
});
updateFile('backend/apps/factorygrid-api/src/modules/rfq/rfq.controller.ts', (c) => {
  return c.replace("@ApiTags('Buyer RFQ Workflow')", "@ApiTags('Buyer')");
});

// 8. Manufacturer controllers
updateFile('backend/apps/factorygrid-api/src/modules/manufacturer/manufacturer-registration.controller.ts', (c) => {
  return c.replace("@ApiTags('Manufacturer Registration & Onboarding')", "@ApiTags('Manufacturer')");
});
updateFile('backend/apps/factorygrid-api/src/modules/manufacturer/manufacturer-product.controller.ts', (c) => {
  return c.replace("@ApiTags('Manufacturer Product Catalog')", "@ApiTags('Manufacturer')");
});

// 9. Catalog controllers
updateFile('backend/apps/factorygrid-api/src/modules/catalog/catalog.controller.ts', (c) => {
  return c.replace("@ApiTags('Product Catalog & Category Master')", "@ApiTags('Product Catalog & Master Data')");
});
updateFile('backend/apps/factorygrid-api/src/modules/catalog/products.controller.ts', (c) => {
  return c.replace("@ApiTags('Products (Catalogue & Procurement)')", "@ApiTags('Product Catalog & Master Data')");
});
updateFile('backend/apps/factorygrid-api/src/modules/catalog/categories.controller.ts', (c) => {
  return c.replace("@ApiTags('Categories & Hierarchies')", "@ApiTags('Product Catalog & Master Data')");
});
updateFile('backend/apps/factorygrid-api/src/modules/catalog/product-types.controller.ts', (c) => {
  return c.replace("@ApiTags('Product Types')", "@ApiTags('Product Catalog & Master Data')");
});
updateFile('backend/apps/factorygrid-api/src/modules/catalog/attributes.controller.ts', (c) => {
  return c.replace("@ApiTags('Attributes (Attribute Master)')", "@ApiTags('Product Catalog & Master Data')");
});

// 10. bootstrap.ts -> Centralized OpenAPI Configuration with Bearer auth and ordered tags
updateFile('backend/apps/factorygrid-api/src/bootstrap.ts', (c) => {
  const oldDoc = `export function buildOpenApi(app: NestFastifyApplication): OpenAPIObject {
  const document = new DocumentBuilder()
    .setTitle('FactoryGrid API')
    .setDescription('FactoryGrid B2B pharmaceutical manufacturing marketplace API.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, document);
}`;
  const newDoc = `export function buildOpenApi(app: NestFastifyApplication): OpenAPIObject {
  const document = new DocumentBuilder()
    .setTitle('FactoryGrid API')
    .setDescription(
      'FactoryGrid B2B Procurement Platform API — Centralized OpenAPI specification and live interactive execution console for Admin, Buyer, Manufacturer, and Central Catalog services.',
    )
    .setVersion('v1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description:
          'Enter your Bearer JWT token to access protected APIs. Example: eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'User authentication, token refresh, logout, session management, and self-registration')
    .addTag('Admin', 'Platform administration, user management, compliance review, and document verification')
    .addTag('Buyer', 'Buyer registration, profile, regulatory compliance, brand & trademark documents, and RFQ workflows')
    .addTag('Manufacturer', 'Manufacturer onboarding, certification documents, facility verification, and product mapping')
    .addTag('Product Catalog & Master Data', 'Central product catalog, Category Master hierarchy, Product Types, dynamic attributes, pricing, tax, and UOM')
    .addTag('Health', 'System liveness, readiness, and PostgreSQL database connectivity check')
    .build();
  return SwaggerModule.createDocument(app, document);
}`;
  if (c.includes(oldDoc)) {
    return c.replace(oldDoc, newDoc);
  } else {
    // If exact match fails, regex replace the buildOpenApi function
    return c.replace(/export function buildOpenApi\(app: NestFastifyApplication\): OpenAPIObject \{[\s\S]*?return SwaggerModule\.createDocument\(app, document\);\s*\}/, newDoc);
  }
});

// 11. main.ts -> Serve Swagger UI at /swagger-ui, /swagger-ui/index.html, /v3/api-docs, /docs, /docs-json
updateFile('backend/apps/factorygrid-api/src/main.ts', () => {
  return `import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { buildOpenApi, createApp } from './bootstrap';
import { Env } from './config/env';

async function main(): Promise<void> {
  try {
    process.loadEnvFile('.env');
  } catch {
    // no .env file: variables come from the environment
  }

  const app = await createApp();
  const document = buildOpenApi(app);

  const swaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'FactoryGrid API Documentation & Testing Console',
  };

  // Primary Swagger UI at /swagger-ui (supports /swagger-ui/index.html, /swagger-ui, /swagger-ui/)
  // with OpenAPI JSON specification at /v3/api-docs
  SwaggerModule.setup('swagger-ui', app, document, {
    ...swaggerCustomOptions,
    jsonDocumentUrl: 'v3/api-docs',
    yamlDocumentUrl: 'v3/api-docs.yaml',
  });

  // Backward-compatible routes: /docs and /docs-json
  SwaggerModule.setup('docs', app, document, {
    ...swaggerCustomOptions,
    jsonDocumentUrl: 'docs-json',
  });

  // Springdoc compatibility endpoint: /v3/api-docs/swagger-config
  const fastify = app.getHttpAdapter().getInstance();
  fastify.get('/v3/api-docs/swagger-config', async (_req, reply) => {
    reply.type('application/json').send({
      configUrl: '/v3/api-docs/swagger-config',
      url: '/v3/api-docs',
    });
  });

  // Convenience redirect from /swagger to /swagger-ui/index.html
  fastify.get('/swagger', async (_req, reply) => {
    reply.redirect('/swagger-ui/index.html');
  });

  const port = app.get(ConfigService<Env, true>).get('PORT', { infer: true });
  await app.listen({ port, host: '0.0.0.0' });
}

void main();
`;
});

console.log('All Swagger updates applied successfully!');

