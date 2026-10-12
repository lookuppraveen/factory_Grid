import { Module } from '@nestjs/common';
import { AUTH_USER_LOADER } from '@factorygrid/auth';
import { AdminController, BuyerAccessController, ManufacturerAccessController } from './access.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaAuthUserLoader } from './auth-user.loader';
import { RefreshTokenService } from './refresh-token.service';

/** Identity and access: registration, sign-in, tokens, roles. Ported from the Java iam-service. */
@Module({
  controllers: [AuthController, AdminController, BuyerAccessController, ManufacturerAccessController],
  providers: [
    AuthService,
    RefreshTokenService,
    { provide: AUTH_USER_LOADER, useClass: PrismaAuthUserLoader },
  ],
  exports: [AUTH_USER_LOADER],
})
export class IamModule {}
