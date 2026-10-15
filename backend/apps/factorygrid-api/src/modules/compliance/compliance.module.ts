import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { ComplianceController, ComplianceDocumentController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ComplianceController, ComplianceDocumentController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
