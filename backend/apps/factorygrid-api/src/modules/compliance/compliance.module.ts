import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { ComplianceController, ComplianceDocumentController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { BrandVerificationController } from './brand-verification.controller';
import { BrandVerificationService } from './brand-verification.service';
import { TrademarkVerificationController } from './trademark-verification.controller';
import { TrademarkVerificationService } from './trademark-verification.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [
    ComplianceController,
    ComplianceDocumentController,
    BrandVerificationController,
    TrademarkVerificationController,
  ],
  providers: [
    ComplianceService,
    BrandVerificationService,
    TrademarkVerificationService,
  ],
  exports: [
    ComplianceService,
    BrandVerificationService,
    TrademarkVerificationService,
  ],
})
export class ComplianceModule {}

