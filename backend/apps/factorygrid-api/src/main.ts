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
  SwaggerModule.setup('docs', app, buildOpenApi(app), { jsonDocumentUrl: 'docs-json' });

  const port = app.get(ConfigService<Env, true>).get('PORT', { infer: true });
  await app.listen({ port, host: '0.0.0.0' });
}

void main();
