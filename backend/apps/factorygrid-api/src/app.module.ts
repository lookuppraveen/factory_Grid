import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard, jwtAlgorithmFor, RolesGuard } from '@factorygrid/auth';
import { Env, validateEnv } from './config/env';
import { HealthController } from './health/health.controller';
import { IamModule } from './modules/iam/iam.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * One deployable app made of modules that keep the plan's service boundaries.
 * Each later module (partner, catalog, sourcing, ...) is added here.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const secret = config.get('JWT_SECRET', { infer: true });
        const algorithm = jwtAlgorithmFor(secret);
        return {
          secret,
          signOptions: { algorithm, expiresIn: Math.floor(config.get('JWT_EXPIRATION_MS', { infer: true }) / 1000) },
          verifyOptions: { algorithms: [algorithm] },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [{ ttl: 60_000, limit: 300 }],
        skipIf: () => config.get('THROTTLE_DISABLED', { infer: true }),
      }),
    }),
    PrismaModule,
    IamModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
