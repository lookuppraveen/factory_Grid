import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { BuyerRegistrationController } from './buyer-registration.controller';
import { BuyerRegistrationService } from './buyer-registration.service';
import { BuyerBrandDocumentsController } from './buyer-brand-documents.controller';
import { BuyerBrandDocumentsService } from './buyer-brand-documents.service';
import { BuyerTrademarkDocumentsController } from './buyer-trademark-documents.controller';
import { BuyerTrademarkDocumentsService } from './buyer-trademark-documents.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [
    BuyerRegistrationController,
    BuyerBrandDocumentsController,
    BuyerTrademarkDocumentsController,
  ],
  providers: [
    BuyerRegistrationService,
    BuyerBrandDocumentsService,
    BuyerTrademarkDocumentsService,
  ],
  exports: [
    BuyerRegistrationService,
    BuyerBrandDocumentsService,
    BuyerTrademarkDocumentsService,
  ],
})
export class BuyerModule {}

