import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@factorygrid/auth';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness and database check for load balancers and uptime monitors. */
  @Public()
  @SkipThrottle()
  @Get()
  async check(): Promise<{ status: string; database: string }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'UP', database: 'UP' };
  }
}
