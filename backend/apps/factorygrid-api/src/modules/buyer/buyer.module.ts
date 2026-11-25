import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { BuyerRegistrationController } from './buyer-registration.controller';
import { BuyerRegistrationService } from './buyer-registration.service';
import { BuyerBrandDocumentsController } from './buyer-brand-documents.controller';
import { BuyerBrandDocumentsService } from './buyer-brand-documents.service';
import { BuyerTrademarkDocumentsController } from './buyer-trademark-documents.controller';
import { BuyerTrademarkDocumentsService } from './buyer-trademark-documents.service';
import { BuyerOrderController } from './buyer-order.controller';
import { BuyerOrderService } from './buyer-order.service';
import { BuyerArtworkController } from './buyer-artwork.controller';
import { BuyerArtworkService } from './buyer-artwork.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [
    BuyerRegistrationController,
    BuyerBrandDocumentsController,
    BuyerTrademarkDocumentsController,
    BuyerOrderController,
    BuyerArtworkController,
  ],
  providers: [
    BuyerRegistrationService,
    BuyerBrandDocumentsService,
    BuyerTrademarkDocumentsService,
    BuyerOrderService,
    BuyerArtworkService,
  ],
  exports: [
    BuyerRegistrationService,
    BuyerBrandDocumentsService,
    BuyerTrademarkDocumentsService,
    BuyerOrderService,
    BuyerArtworkService,
  ],
})
export class BuyerModule {}

