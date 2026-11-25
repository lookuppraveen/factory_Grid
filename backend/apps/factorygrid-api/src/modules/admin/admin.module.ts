import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminOrderController } from './admin-order.controller';
import { AdminOrderService } from './admin-order.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminOrderController],
  providers: [AdminOrderService],
  exports: [AdminOrderService],
})
export class AdminModule {}
