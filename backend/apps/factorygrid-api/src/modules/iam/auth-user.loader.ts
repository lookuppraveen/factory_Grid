import { Injectable } from '@nestjs/common';
import { AuthUser, AuthUserLoader } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { isActive, isLocked, roleNames, withRoles } from './user-profile';

/** Re-checks the account behind each token, so deactivated or locked users lose access at once. */
@Injectable()
export class PrismaAuthUserLoader implements AuthUserLoader {
  constructor(private readonly prisma: PrismaService) {}

  async load(username: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        ...withRoles,
        buyerRegistrations: { select: { id: true } },
        manufacturerRegistrations: { select: { id: true } },
      },
    });
    if (!user || isLocked(user)) {
      return null;
    }
    const isRegisteredBuyer =
      roleNames(user).includes('ROLE_BUYER') &&
      user.buyerRegistrations.length > 0 &&
      !['SUSPENDED', 'BANNED', 'DELETED'].includes(user.accountStatus.toUpperCase());
    const isRegisteredMfg =
      (roleNames(user).includes('ROLE_MANUFACTURER') || roleNames(user).includes('ROLE_SUPPLIER')) &&
      user.manufacturerRegistrations.length > 0 &&
      !['SUSPENDED', 'BANNED', 'DELETED'].includes(user.accountStatus.toUpperCase());

    if (!isActive(user) && !isRegisteredBuyer && !isRegisteredMfg) {
      return null;
    }
    return { id: Number(user.id), username: user.username, userCode: user.userCode, roles: roleNames(user) };
  }
}
