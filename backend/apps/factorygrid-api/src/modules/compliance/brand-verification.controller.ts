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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { StorageService } from '../storage/storage.service';
import { BrandVerificationService } from './brand-verification.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles('ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
@Controller('compliance/brand-verifications')
export class BrandVerificationController {
  constructor(
    private readonly service: BrandVerificationService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all brand verification records for compliance desk' })
  async listAll(@Query('status') status?: string) {
    return this.service.listAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand verification details by ID' })
  async getById(@Param('id') id: string) {
    return this.service.getById(Number(id));
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve brand authorization' })
  async approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.approve(Number(id), user.username);
  }

  @Post(':id/request-auth')
  @ApiOperation({ summary: 'Request Letter of Authorization / additional documents' })
  async requestAuth(
    @Param('id') id: string,
    @Body('authNotes') authNotes: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.requestAuth(Number(id), user.username, authNotes);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject brand authorization' })
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
  @ApiOperation({ summary: 'Download uploaded brand document file' })
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

