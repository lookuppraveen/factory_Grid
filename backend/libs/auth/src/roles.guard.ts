import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from './auth-user';
import { ROLES_KEY } from './decorators';

/** Enforces @Roles(): the user needs at least one of the listed roles. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    const user: AuthUser | undefined = context.switchToHttp().getRequest().user;
    const held = new Set(user?.roles ?? []);
    if (!required.some((role) => held.has(role) || held.has(`ROLE_${role}`) || (role.startsWith('ROLE_') && held.has(role.replace(/^ROLE_/, ''))))) {
      throw new ForbiddenException();
    }
    return true;
  }
}
