import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthUser, CurrentUser, Public, Roles } from '@factorygrid/auth';
import {
  MANUFACTURER_CATEGORY_KEYS,
  ManufacturerReviewDocumentDto,
  ManufacturerStep1Dto,
  ManufacturerStep2Dto,
  ManufacturerStep3Dto,
  ManufacturerStep4Dto,
  ManufacturerStepResponseDto,
  ManufacturerSubmitDto,
} from './dto/manufacturer-registration.dto';
import { ManufacturerRegistrationService } from './manufacturer-registration.service';

@ApiTags('Manufacturer Registration & Onboarding')
@Controller('manufacturer')
export class ManufacturerRegistrationController {
  constructor(private readonly service: ManufacturerRegistrationService) {}

  @Public()
  @Get('catalog')
  @ApiOperation({ summary: 'List master product catalogue for manufacturer capabilities' })
  @ApiQuery({ name: 'search', required: false, description: 'Filter by name, generic name, category' })
  listCatalog(@Query('search') search?: string) {
    return this.service.listCatalog(search);
  }

  @Public()
  @Post('registration/step-1')
  @ApiOperation({ summary: 'Step 1: Save Company & Plant Information' })
  @ApiQuery({ name: 'registrationCode', required: false, description: 'Optional code when updating an existing draft' })
  @ApiCreatedResponse({ type: ManufacturerStepResponseDto })
  saveStep1(
    @Body() dto: ManufacturerStep1Dto,
    @Query('registrationCode') registrationCode?: string,
  ): Promise<ManufacturerStepResponseDto> {
    return this.service.saveStep1(dto, registrationCode);
  }

  @Public()
  @Post('documents/upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Step 2 & Document Re-upload: Upload Mandatory Certification Document',
    description: 'Accepts multipart/form-data for one of the 6 mandatory certification categories. Stores file in MinIO/S3 and records metadata.',
  })
  @ApiQuery({ name: 'category', required: true, enum: MANUFACTURER_CATEGORY_KEYS })
  @ApiQuery({ name: 'registrationCode', required: true })
  @ApiQuery({ name: 'issueDate', required: true, example: '2023-04-15' })
  @ApiQuery({ name: 'expiryDate', required: true, example: '2028-04-14' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Certification PDF/Image (max 10MB)' },
      },
      required: ['file'],
    },
  })
  async uploadDocument(
    @Req() req: FastifyRequest,
    @Query('category') categoryParam?: string,
    @Query('registrationCode') regCodeParam?: string,
    @Query('issueDate') issueDateParam?: string,
    @Query('expiryDate') expiryDateParam?: string,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data.');
    }
    const part = await req.file();
    if (!part) {
      throw new BadRequestException('No file uploaded in "file" field.');
    }
    const buffer = await part.toBuffer();
    const fields = (part.fields as any) || {};

    const category = categoryParam || fields.category?.value;
    const regCode = regCodeParam || fields.registrationCode?.value;
    const issueDate = issueDateParam || fields.issueDate?.value;
    const expiryDate = expiryDateParam || fields.expiryDate?.value;

    const callerUser = (req as any).user as AuthUser | undefined;

    return this.service.uploadDocument(
      buffer,
      part.filename,
      part.mimetype,
      category,
      regCode,
      issueDate,
      expiryDate,
      callerUser,
    );
  }

  @Delete('documents/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an uploaded document before submission' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  removeDocument(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.service.removeDocument(id, user);
  }

  @Public()
  @Post('registration/step-2')
  @ApiOperation({ summary: 'Step 2: Save Certification Expiry and Issue Dates' })
  @ApiQuery({ name: 'registrationCode', required: true })
  saveStep2(
    @Body() dto: ManufacturerStep2Dto,
    @Query('registrationCode') registrationCode: string,
  ): Promise<ManufacturerStepResponseDto> {
    if (!registrationCode) {
      throw new BadRequestException('registrationCode query parameter is required.');
    }
    return this.service.saveStep2(dto, registrationCode);
  }

  @Public()
  @Post('registration/step-3')
  @ApiOperation({ summary: 'Step 3: Save Product Manufacturing Capabilities' })
  @ApiQuery({ name: 'registrationCode', required: true })
  saveStep3(
    @Body() dto: ManufacturerStep3Dto,
    @Query('registrationCode') registrationCode: string,
  ): Promise<ManufacturerStepResponseDto> {
    if (!registrationCode) {
      throw new BadRequestException('registrationCode query parameter is required.');
    }
    return this.service.saveStep3(dto, registrationCode);
  }

  @Public()
  @Post('registration/step-4')
  @ApiOperation({ summary: 'Step 4: Save MOQ and Delivery Schedule' })
  @ApiQuery({ name: 'registrationCode', required: true })
  saveStep4(
    @Body() dto: ManufacturerStep4Dto,
    @Query('registrationCode') registrationCode: string,
  ): Promise<ManufacturerStepResponseDto> {
    if (!registrationCode) {
      throw new BadRequestException('registrationCode query parameter is required.');
    }
    return this.service.saveStep4(dto, registrationCode);
  }

  @Public()
  @Post('registration/submit')
  @ApiOperation({ summary: 'Step 5: Review & Submit Complete Manufacturer Registration' })
  submit(@Body() dto: ManufacturerSubmitDto) {
    return this.service.submit(dto);
  }

  @Get('my-registration')
  @ApiBearerAuth()
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Get current authenticated manufacturer registration details, documents, and status' })
  getMyRegistration(@CurrentUser() user: AuthUser) {
    return this.service.getMyRegistration(Number(user.id));
  }

  @Public()
  @Get('registration/:code')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get manufacturer registration by registration code' })
  @ApiParam({ name: 'code', description: 'Registration code (REG-MFG-...)' })
  getRegistration(@Param('code') code: string, @CurrentUser() user?: AuthUser) {
    return this.service.getRegistration(code, user);
  }

  @Public()
  @Get('documents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List certifications for a registration' })
  @ApiQuery({ name: 'registrationCode', required: false, description: 'Optional for authenticated manufacturer' })
  async getDocuments(@Query('registrationCode') registrationCode?: string, @CurrentUser() user?: AuthUser) {
    let regCode = registrationCode;
    if (!regCode && user) {
      const myReg = await this.service.getMyRegistration(Number(user.id));
      regCode = myReg.registrationCode;
    }
    if (!regCode) {
      throw new BadRequestException('registrationCode query parameter is required.');
    }
    return this.service.getDocuments(regCode, user);
  }

  @Get('documents/:id/download')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER', 'MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER')
  @ApiOperation({ summary: 'Download a manufacturer certification document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async downloadDocument(
    @Param('id') id: string,
    @Res() res: FastifyReply,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    const file = await this.service.getDocumentForDownload(id, user);
    res.header('Content-Type', file.mimeType || file.contentType || 'application/pdf');
    res.header('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    if (file.contentLength) {
      res.header('Content-Length', file.contentLength);
    }
    return res.send(file.stream);
  }

  // ------------------------------------------------------------- Compliance Review
  @Get('review/verifications')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin/Compliance: List submitted manufacturer registrations for review' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  listForReview(@Query('status') status?: string, @Query('search') search?: string) {
    return this.service.listForReview(status, search);
  }

  @Get('review/verifications/:code')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin/Compliance: Get single manufacturer registration with documents for audit' })
  @ApiParam({ name: 'code', description: 'Registration Code' })
  getForReview(@Param('code') code: string) {
    return this.service.getForReview(code);
  }

  @Post('review/verifications/:code/documents/:docId/review')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin/Compliance: Approve, reject, or request replacement for a manufacturer certification' })
  @ApiParam({ name: 'code', description: 'Registration Code' })
  @ApiParam({ name: 'docId', description: 'Document ID' })
  reviewDocument(
    @Param('code') code: string,
    @Param('docId') docId: string,
    @Body() dto: ManufacturerReviewDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reviewDocument(code, docId, dto, user.username);
  }

  @Post('review/verifications/:code/approve')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin/Compliance: Final approve manufacturer registration and activate account' })
  @ApiParam({ name: 'code', description: 'Registration Code' })
  approve(@Param('code') code: string, @CurrentUser() user: AuthUser) {
    return this.service.approve(code, user.username);
  }

  @Post('review/verifications/:code/reject')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin/Compliance: Reject manufacturer registration with reason' })
  @ApiParam({ name: 'code', description: 'Registration Code' })
  reject(
    @Param('code') code: string,
    @Body('rejectionReason') rejectionReason: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reject(code, rejectionReason, user.username);
  }

  @Post('review/verifications/:code/request-docs')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin/Compliance: Request replacement/additional certifications with notes' })
  @ApiParam({ name: 'code', description: 'Registration Code' })
  requestDocs(
    @Param('code') code: string,
    @Body('notes') notes: string | string[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.requestDocs(code, notes, user.username);
  }
}
