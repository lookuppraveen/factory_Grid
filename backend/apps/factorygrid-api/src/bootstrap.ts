import { randomUUID } from 'node:crypto';
import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import fastifyMultipart from '@fastify/multipart';
import { createValidationPipe, HttpExceptionFilter } from '@factorygrid/errors';
import { AppModule } from './app.module';
import { Env } from './config/env';

if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

export const API_PREFIX = 'api/v1';

/** Builds the configured app. Shared by main.ts, the tests and the OpenAPI export. */
export async function createApp(options: { logger?: boolean } = {}): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    logger: options.logger === false ? false : { level: process.env.LOG_LEVEL ?? 'info' },
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
    trustProxy: true,
  });
  adapter.getInstance().addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    logger: options.logger === false ? false : undefined,
  });

  await app.register(fastifyMultipart as any, {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 10,
    },
  });


  const config = app.get(ConfigService<Env, true>);
  app.enableCors({
    origin: config.get('CORS_ALLOWED_ORIGINS', { infer: true }),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['x-request-id'],
    maxAge: 3600,
  });
  app.setGlobalPrefix(API_PREFIX, { exclude: [{ path: 'health', method: RequestMethod.GET }, { path: 'actuator/health', method: RequestMethod.GET }] });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  return app;
}

export function buildOpenApi(app: NestFastifyApplication): OpenAPIObject {
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
}
