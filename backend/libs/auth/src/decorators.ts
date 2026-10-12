import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { AuthUser } from './auth-user';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Marks a route as reachable without a token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Allows the route only to users holding at least one of these roles (without the ROLE_ prefix). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/** Injects the signed-in user into a controller method. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
