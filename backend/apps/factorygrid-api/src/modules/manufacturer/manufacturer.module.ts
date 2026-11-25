import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { ManufacturerRegistrationController } from './manufacturer-registration.controller';
import { ManufacturerRegistrationService } from './manufacturer-registration.service';
import { ManufacturerProductController } from './manufacturer-product.controller';
import { ManufacturerProductService } from './manufacturer-product.service';
import { AdminManufacturerController } from './admin-manufacturer.controller';
import { ManufacturerOrderController } from './manufacturer-order.controller';
import { ManufacturerOrderService } from './manufacturer-order.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [
    ManufacturerRegistrationController,
    ManufacturerProductController,
    AdminManufacturerController,
    ManufacturerOrderController,
  ],
  providers: [
    ManufacturerRegistrationService,
    ManufacturerProductService,
    ManufacturerOrderService,
  ],
  exports: [
    ManufacturerRegistrationService,
    ManufacturerProductService,
    ManufacturerOrderService,
  ],
})
export class ManufacturerModule {}
