import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RfqController } from './rfq.controller';
import { RfqService } from './rfq.service';
import { ManufacturerRfqController } from './manufacturer-rfq.controller';
import { ManufacturerQuoteController } from './manufacturer-quote.controller';
import { BuyerQuoteComparisonController } from './buyer-quote-comparison.controller';
import { ManufacturerRfqService } from './manufacturer-rfq.service';
import { AdminRfqController } from './admin-rfq.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    RfqController,
    ManufacturerRfqController,
    ManufacturerQuoteController,
    BuyerQuoteComparisonController,
    AdminRfqController,
  ],
  providers: [RfqService, ManufacturerRfqService],
  exports: [RfqService, ManufacturerRfqService],
})
export class RfqModule { }
