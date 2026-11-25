import { Controller, Get, HttpStatus, Logger, Res } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@factorygrid/auth';
import { SkipThrottle } from '@nestjs/throttler';
import { FastifyReply } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller(['health', 'actuator/health', 'api/v1/health', 'api/v1/actuator/health'])
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Liveness and database connectivity check for load balancers, uptime monitors, and Kubernetes probes. */
  @Public()
  @SkipThrottle()
  @Get()
  @ApiOkResponse({
    description: 'PostgreSQL database is connected and healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'UP' },
        database: { type: 'string', example: 'UP' },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'PostgreSQL database is unavailable or query execution failed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'DOWN' },
        database: { type: 'string', example: 'DOWN' },
      },
    },
  })
  async check(@Res({ passthrough: true }) res: FastifyReply): Promise<{ status: string; database: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      res.status(HttpStatus.OK);
      return { status: 'UP', database: 'UP' };
    } catch (error) {
      this.logger.error(
        'Database health check failed: unable to execute query on PostgreSQL database',
        error instanceof Error ? error.stack : String(error),
      );
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'DOWN', database: 'DOWN' };
    }
  }
}
