import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenClaims, AUTH_USER_LOADER, AuthUserLoader } from './auth-user';
import { IS_PUBLIC_KEY } from './decorators';

/** Requires a valid bearer token on every route not marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(AUTH_USER_LOADER) private readonly users: AuthUserLoader,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    let claims: AccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(header.slice(7));
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.users.load(claims.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    request.user = user;
    return true;
  }
}
