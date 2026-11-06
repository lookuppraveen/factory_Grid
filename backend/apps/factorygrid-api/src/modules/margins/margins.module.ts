import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarginsController } from './margins.controller';
import { MarginsService } from './margins.service';

@Module({
  imports: [PrismaModule],
  controllers: [MarginsController],
  providers: [MarginsService],
  exports: [MarginsService],
})
export class MarginsModule {}

