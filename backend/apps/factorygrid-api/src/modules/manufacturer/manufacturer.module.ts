import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { ManufacturerRegistrationController } from './manufacturer-registration.controller';
import { ManufacturerRegistrationService } from './manufacturer-registration.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ManufacturerRegistrationController],
  providers: [ManufacturerRegistrationService],
  exports: [ManufacturerRegistrationService],
})
export class ManufacturerModule {}
