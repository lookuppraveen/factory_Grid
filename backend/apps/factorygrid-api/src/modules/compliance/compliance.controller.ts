import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import {
  ApproveVerificationDto,
  CustomerVerificationResponseDto,
  RejectVerificationDto,
  RequestMoreDocsDto,
  ReviewDocumentDto,
} from '../buyer/dto/verification.dto';
import { ComplianceService } from './compliance.service';

@ApiTags('Compliance & Customer Verification')
@ApiBearerAuth()
@Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
@Controller('compliance/customer-verifications')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get()
  @ApiOperation({
    summary: 'List all customer verification requests',
    description: 'Retrieves onboarding buyer verification cases with filters for status and search query.',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by verificationStatus (e.g. Under Review, Active)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for company, customer name, GSTIN, etc.' })
  listVerifications(@Query('status') status?: string, @Query('search') search?: string) {
    return this.complianceService.listVerifications(status, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific customer verification case' })
  @ApiParam({ name: 'id', description: 'Request Code (e.g. CUS-VER-101) or database ID' })
  getVerification(@Param('id') id: string) {
    return this.complianceService.getVerification(id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign a compliance officer to a verification case' })
  @ApiParam({ name: 'id', description: 'Request Code or database ID' })
  assignOfficer(
    @Param('id') id: string,
    @Body('officer') officer: string,
  ) {
    return this.complianceService.assignOfficer(id, officer || 'Rajesh Kumar (Compliance Desk A)');
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: 'Approve customer verification case',
    description: 'Generates official customer code (CUS000...), marks case as Active, and activates portal buyer user account.',
  })
  @ApiParam({ name: 'id', description: 'Request Code or database ID' })
  approveVerification(
    @Param('id') id: string,
    @Body() dto?: ApproveVerificationDto,
  ) {
    return this.complianceService.approveVerification(id, dto?.customerCode);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject customer verification case with reason' })
  @ApiParam({ name: 'id', description: 'Request Code or database ID' })
  rejectVerification(
    @Param('id') id: string,
    @Body() dto: RejectVerificationDto,
  ) {
    return this.complianceService.rejectVerification(id, dto.rejectionReason);
  }

  @Post(':id/request-docs')
  @ApiOperation({ summary: 'Request additional regulatory documents from customer' })
  @ApiParam({ name: 'id', description: 'Request Code or database ID' })
  requestMoreDocs(
    @Param('id') id: string,
    @Body() dto: RequestMoreDocsDto,
  ) {
    return this.complianceService.requestMoreDocs(id, dto.notes || []);
  }

  @Post(':id/documents/:docId/review')
  @ApiOperation({
    summary: 'Review an individual uploaded regulatory document',
    description: 'Allows Admin/Compliance Officer to approve, reject, or request replacement for a specific document with reason.',
  })
  @ApiParam({ name: 'id', description: 'Request Code or database ID' })
  @ApiParam({ name: 'docId', description: 'Document ID' })
  reviewDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() dto: ReviewDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.complianceService.reviewDocument(id, docId, { ...dto, reviewer: user.username });
  }

  @Get(':id/documents/:docId/download')
  @ApiOperation({ summary: 'Stream an uploaded buyer document within a customer verification case' })
  async downloadCaseDocument(
    @Param('docId') docId: string,
    @Res() res: FastifyReply,
    @CurrentUser() user: AuthUser,
  ) {
    const file = await this.complianceService.getDocumentForDownload(docId, user);
    res.header('Content-Type', file.mimeType || file.contentType || 'application/pdf');
    res.header('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    if (file.contentLength) {
      res.header('Content-Length', file.contentLength);
    }
    return res.send(file.stream);
  }

  @Post(':id/classification')
  @ApiOperation({ summary: 'Update customer classification (REGULAR or SPECIAL_PARTY)' })
  @ApiParam({ name: 'id', description: 'Request Code or database ID' })
  updateClassification(
    @Param('id') id: string,
    @Body('classification') classification: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.complianceService.updateClassification(id, classification, user?.username || 'Platform Admin');
  }
}

@ApiTags('Compliance Documents')
@ApiBearerAuth()
@Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
@Controller('compliance/documents')
export class ComplianceDocumentController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get(':id/download')
  @ApiOperation({ summary: 'Download or stream uploaded regulatory document for PDF viewer' })
  async downloadDocument(
    @Param('id') id: string,
    @Res() res: FastifyReply,
    @CurrentUser() user: AuthUser,
  ) {
    const file = await this.complianceService.getDocumentForDownload(id, user);
    res.header('Content-Type', file.mimeType || file.contentType || 'application/pdf');
    res.header('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    if (file.contentLength) {
      res.header('Content-Length', file.contentLength);
    }
    return res.send(file.stream);
  }
}

