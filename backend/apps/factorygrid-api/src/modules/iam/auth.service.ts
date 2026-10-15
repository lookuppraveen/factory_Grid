import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AccessTokenClaims } from '@factorygrid/auth';
import {
  ConflictException,
  ForbiddenException,
  LockedException,
  NotFoundException,
  UnauthorizedException,
} from '@factorygrid/errors';
import { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { BuyerRegistrationDto, ManufacturerRegistrationDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  AuthResponseDto,
  RegistrationResponseDto,
  TokenRefreshResponseDto,
  UserProfileDto,
} from './dto/responses.dto';
import { RefreshTokenService } from './refresh-token.service';
import { isActive, isLocked, roleNames, toUserProfile, UserWithRoles, withRoles } from './user-profile';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;
const INVALID_CREDENTIALS = 'Invalid username or password';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ROLE_BUYER: 'Procurement Buyer Role for purchasing entities',
  ROLE_MANUFACTURER: 'Canonical Manufacturer Role mapping to Supplier',
  ROLE_SUPPLIER: 'Manufacturer / Supplier Role for manufacturing units',
};

/** Which roles may sign in to each portal (the optional portalType on login). */
const PORTAL_ROLE_KEYWORDS: Record<string, string[]> = {
  BUYER: ['BUYER', 'ADMIN'],
  BUYER_COMPANY: ['BUYER', 'ADMIN'],
  SUPPLIER: ['SUPPLIER', 'MANUFACTURER', 'ADMIN'],
  MANUFACTURER: ['SUPPLIER', 'MANUFACTURER', 'ADMIN'],
  MANUFACTURER_COMPANY: ['SUPPLIER', 'MANUFACTURER', 'ADMIN'],
  FG_STAFF: ['ADMIN', 'COMPLIANCE', 'SALES', 'ACCOUNTS'],
  STAFF: ['ADMIN', 'COMPLIANCE', 'SALES', 'ACCOUNTS'],
  ADMIN: ['ADMIN', 'COMPLIANCE', 'SALES', 'ACCOUNTS'],
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokenService,
    config: ConfigService<Env, true>,
  ) {
    this.accessTokenMs = config.get('JWT_EXPIRATION_MS', { infer: true });
  }

  registerBuyer(dto: BuyerRegistrationDto): Promise<RegistrationResponseDto> {
    return this.register(dto, 'BUY', ['ROLE_BUYER'], 'Buyer account successfully registered.');
  }

  registerManufacturer(dto: ManufacturerRegistrationDto): Promise<RegistrationResponseDto> {
    return this.register(
      dto,
      'MFG',
      ['ROLE_MANUFACTURER', 'ROLE_SUPPLIER'],
      'Manufacturer account successfully registered.',
    );
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const identifier = dto.usernameOrEmail.trim();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier.toLowerCase() }] },
      include: withRoles,
    });
    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!isActive(user)) {
      const isRegisteredBuyer =
        roleNames(user).includes('ROLE_BUYER') &&
        (await this.prisma.buyerRegistration.count({ where: { userId: user.id } })) > 0;
      const isRegisteredMfg =
        (roleNames(user).includes('ROLE_MANUFACTURER') || roleNames(user).includes('ROLE_SUPPLIER')) &&
        (await this.prisma.manufacturerRegistration.count({ where: { userId: user.id } })) > 0;
      const isPermittedState =
        (isRegisteredBuyer || isRegisteredMfg) &&
        !['SUSPENDED', 'BANNED', 'DELETED'].includes(user.accountStatus.toUpperCase());
      if (!isPermittedState) {
        throw new ForbiddenException(`Account is ${user.accountStatus}. Please contact administrator.`);
      }
    }
    if (isLocked(user)) {
      throw new LockedException('Account is temporarily locked due to multiple failed attempts. Try again later.');
    }
    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      await this.recordFailedLogin(user);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (dto.portalType?.trim() && !this.canUsePortal(user, dto.portalType)) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const signedIn = await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, accountLockedUntil: null, lastLoginAt: new Date() },
      include: withRoles,
    });

    return {
      accessToken: await this.signAccessToken(signedIn),
      refreshToken: await this.refreshTokens.create(signedIn.id),
      tokenType: 'Bearer',
      expiresIn: this.accessTokenMs,
      user: toUserProfile(signedIn),
    };
  }

  async refresh(token: string): Promise<TokenRefreshResponseDto> {
    const rotated = await this.refreshTokens.rotate(token);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: rotated.userId }, include: withRoles });
    return {
      accessToken: await this.signAccessToken(user),
      refreshToken: rotated.token,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenMs,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken?.trim()) {
      await this.refreshTokens.revoke(refreshToken);
    }
  }

  async getProfile(username: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({ where: { username }, include: withRoles });
    if (!user) {
      throw new NotFoundException(`User not found: ${username}`);
    }
    return toUserProfile(user);
  }

  async listUsers(): Promise<UserProfileDto[]> {
    const users = await this.prisma.user.findMany({ include: withRoles, orderBy: { id: 'asc' } });
    return users.map(toUserProfile);
  }

  private async register(
    dto: BuyerRegistrationDto,
    codePrefix: string,
    roles: string[],
    message: string,
  ): Promise<RegistrationResponseDto> {
    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();

    if (await this.prisma.user.findUnique({ where: { username } })) {
      throw new ConflictException(`Username '${username}' is already registered`);
    }
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException(`Email '${email}' is already registered`);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.$transaction(async (tx) => {
      const roleIds: bigint[] = [];
      for (const name of roles) {
        const role = await tx.role.upsert({
          where: { name },
          update: {},
          create: { name, description: ROLE_DESCRIPTIONS[name] },
        });
        roleIds.push(role.id);
      }
      return tx.user.create({
        data: {
          userCode: `USR-${codePrefix}-${Date.now() % 1_000_000}`,
          username,
          email,
          passwordHash,
          fullName: dto.fullName.trim(),
          phone: dto.phone ?? null,
          companyName: dto.companyName.trim(),
          companyCode: dto.companyCode?.trim() || this.generateCompanyCode(codePrefix),
          department: dto.department ?? null,
          jobTitle: dto.jobTitle ?? null,
          roles: { create: roleIds.map((roleId) => ({ roleId })) },
        },
        include: withRoles,
      });
    });

    this.logger.log(`Registered ${roles.join('+')} user ${username} (${user.userCode})`);
    return { success: true, message, user: toUserProfile(user), timestamp: new Date().toISOString() };
  }

  private async recordFailedLogin(user: UserWithRoles): Promise<void> {
    const attempts = user.failedLoginAttempts + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        ...(lock ? { accountLockedUntil: new Date(Date.now() + LOCK_TIME_MS) } : {}),
      },
    });
    if (lock) {
      this.logger.warn(`User ${user.username} locked for 15 minutes after ${attempts} failed attempts`);
    }
  }

  private canUsePortal(user: UserWithRoles, portalType: string): boolean {
    const keywords = PORTAL_ROLE_KEYWORDS[portalType.trim().toUpperCase()] ?? [];
    return roleNames(user).some((role) => keywords.some((keyword) => role.toUpperCase().includes(keyword)));
  }

  private signAccessToken(user: UserWithRoles): Promise<string> {
    const claims: AccessTokenClaims = {
      sub: user.username,
      userId: Number(user.id),
      userCode: user.userCode,
      roles: roleNames(user),
    };
    return this.jwt.signAsync(claims);
  }

  private generateCompanyCode(prefix: string): string {
    const suffix = randomUUID().slice(0, 4).toUpperCase();
    return `${prefix}-${new Date().getFullYear()}-${suffix}`;
  }
}
