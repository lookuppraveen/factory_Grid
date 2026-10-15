import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { BuyerRegistrationController } from './buyer-registration.controller';
import { BuyerRegistrationService } from './buyer-registration.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [BuyerRegistrationController],
  providers: [BuyerRegistrationService],
  exports: [BuyerRegistrationService],
})
export class BuyerModule {}
