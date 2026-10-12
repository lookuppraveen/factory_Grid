import { Prisma } from '../../generated/prisma/client';
import { UserProfileDto } from './dto/responses.dto';

export const withRoles = { roles: { include: { role: true } } } satisfies Prisma.UserInclude;

export type UserWithRoles = Prisma.UserGetPayload<{ include: typeof withRoles }>;

export function roleNames(user: UserWithRoles): string[] {
  return user.roles.map((userRole) => userRole.role.name);
}

export function toUserProfile(user: UserWithRoles): UserProfileDto {
  return {
    id: Number(user.id),
    userCode: user.userCode,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    companyName: user.companyName,
    companyCode: user.companyCode,
    department: user.department,
    jobTitle: user.jobTitle,
    accountStatus: user.accountStatus,
    roles: roleNames(user),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

export function isActive(user: { accountStatus: string }): boolean {
  return user.accountStatus.toUpperCase() === 'ACTIVE';
}

export function isLocked(user: { accountLockedUntil: Date | null }, now = new Date()): boolean {
  return user.accountLockedUntil !== null && now <= user.accountLockedUntil;
}
