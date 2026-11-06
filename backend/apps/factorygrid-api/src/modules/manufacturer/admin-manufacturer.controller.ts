import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { ManufacturerVerificationPatchDto } from './dto/manufacturer-registration.dto';
import { ManufacturerRegistrationService } from './manufacturer-registration.service';

@ApiTags('Admin')
@Controller(['admin/manufacturers', 'admin/manufacturer'])
export class AdminManufacturerController {
  constructor(private readonly service: ManufacturerRegistrationService) {}

  @Get(':manufacturerId/documents')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin: List all uploaded certification documents for a manufacturer' })
  @ApiParam({ name: 'manufacturerId', description: 'Manufacturer ID, Registration Code, or Manufacturer Code' })
  async getDocuments(@Param('manufacturerId') manufacturerId: string) {
    return this.service.getAdminManufacturerDocuments(manufacturerId);
  }

  @Get(':manufacturerId/documents/:documentId/download')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin: Download or stream a manufacturer certification document' })
  @ApiParam({ name: 'manufacturerId', description: 'Manufacturer ID, Registration Code, or Manufacturer Code' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  async downloadDocument(
    @Param('manufacturerId') manufacturerId: string,
    @Param('documentId') documentId: string,
    @Res() res: FastifyReply,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    const file = await this.service.getAdminManufacturerDocumentDownload(manufacturerId, documentId, user);
    res.header('Content-Type', file.mimeType || file.contentType || 'application/pdf');
    res.header('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    if (file.contentLength) {
      res.header('Content-Length', file.contentLength);
    }
    return res.send(file.stream);
  }

  @Patch(':manufacturerId/documents/:documentId/verification')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin: Verify, approve, reject or request replacement for a manufacturer certification document' })
  @ApiParam({ name: 'manufacturerId', description: 'Manufacturer ID, Registration Code, or Manufacturer Code' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  async verifyDocument(
    @Param('manufacturerId') manufacturerId: string,
    @Param('documentId') documentId: string,
    @Body() dto: ManufacturerVerificationPatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.patchAdminManufacturerDocumentVerification(
      manufacturerId,
      documentId,
      dto,
      user.username,
    );
  }
}
