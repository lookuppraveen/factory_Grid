import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { StorageService } from '../storage/storage.service';
import { TrademarkVerificationService } from './trademark-verification.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles('ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
@Controller('compliance/trademark-verifications')
export class TrademarkVerificationController {
  constructor(
    private readonly service: TrademarkVerificationService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all trademark verification records for compliance desk' })
  async listAll(@Query('status') status?: string) {
    return this.service.listAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trademark verification details by ID' })
  async getById(@Param('id') id: string) {
    return this.service.getById(Number(id));
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve trademark filing' })
  async approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.approve(Number(id), user.username);
  }

  @Post(':id/conflict')
  @ApiOperation({ summary: 'Mark conflict on trademark registration' })
  async markConflict(
    @Param('id') id: string,
    @Body('conflictNotes') conflictNotes: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.markConflict(Number(id), user.username, conflictNotes);
  }

  @Post(':id/expired')
  @ApiOperation({ summary: 'Mark trademark registration as expired' })
  async markExpired(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.markExpired(Number(id), user.username);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject trademark filing' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(Number(id), user.username, reason);
  }

  @Post(':id/checks')
  @ApiOperation({ summary: 'Update a specific verification check' })
  async updateCheck(
    @Param('id') id: string,
    @Body() body: { checkKey: string; status: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateCheck(Number(id), user.username, body.checkKey, body.status);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download uploaded trademark certificate file' })
  async download(
    @Param('id') id: string,
    @Res() reply: FastifyReply,
  ) {
    const doc = await this.service.getDocForDownload(Number(id));
    const file = await this.storage.getFile(doc.storageKey);
    reply.header('Content-Type', file.contentType || doc.mimeType);
    reply.header('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return reply.send(file.stream);
  }
}

