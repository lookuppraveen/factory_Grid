import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@factorygrid/errors';
import { Prisma } from '../../generated/prisma/client';
import { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';

type Db = PrismaService | Prisma.TransactionClient;

/** Stores refresh tokens so sessions can be rotated and revoked. */
@Injectable()
export class RefreshTokenService {
  private readonly lifetimeMs: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.lifetimeMs = config.get('JWT_REFRESH_EXPIRATION_MS', { infer: true });
  }

  async create(userId: bigint, db: Db = this.prisma): Promise<string> {
    const token = randomUUID();
    await db.refreshToken.create({
      data: { token, userId, expiryDate: new Date(Date.now() + this.lifetimeMs) },
    });
    return token;
  }

  /** Revokes the presented token and issues a new one for the same user. */
  async rotate(token: string): Promise<{ userId: bigint; token: string }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.refreshToken.findUnique({ where: { token } });
      if (!existing) {
        throw new UnauthorizedException('Refresh token is not in database or is invalid.');
      }
      if (existing.revoked) {
        throw new UnauthorizedException('Refresh token has been revoked. Please sign in again.');
      }
      if (existing.expiryDate <= new Date()) {
        throw new UnauthorizedException('Refresh token was expired. Please make a new sign-in request.');
      }
      await tx.refreshToken.update({ where: { id: existing.id }, data: { revoked: true } });
      return { userId: existing.userId, token: await this.create(existing.userId, tx) };
    });
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
  }
}
