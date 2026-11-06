import 'reflect-metadata';
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
