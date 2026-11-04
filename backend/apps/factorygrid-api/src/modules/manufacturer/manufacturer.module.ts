import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { ManufacturerRegistrationController } from './manufacturer-registration.controller';
import { ManufacturerRegistrationService } from './manufacturer-registration.service';
import { ManufacturerProductController } from './manufacturer-product.controller';
import { ManufacturerProductService } from './manufacturer-product.service';
import { AdminManufacturerController } from './admin-manufacturer.controller';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [
    ManufacturerRegistrationController,
    ManufacturerProductController,
    AdminManufacturerController,
  ],
  providers: [
    ManufacturerRegistrationService,
    ManufacturerProductService,
  ],
  exports: [
    ManufacturerRegistrationService,
    ManufacturerProductService,
  ],
})
export class ManufacturerModule {}
