import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import {
  CreateAchievementDto,
  CreateGalleryEntryDto,
  FactoryGalleryEntryDto,
  ManufacturerAchievementDto,
  ReviewSubmissionDto,
  UpdateAchievementDto,
  UpdateGalleryEntryDto,
} from './dto/gallery-and-achievements.dto';
import { ManufacturerRegistrationService } from './manufacturer-registration.service';

@ApiTags('Manufacturer')
@Controller(['manufacturer', 'manufacturers'])
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
  @Get('categories')
  @ApiOperation({ summary: 'List Category -> Sub-Category -> Sub-Sub-Category hierarchy for manufacturer onboarding' })
  listCategories() {
    return this.service.listCategoryHierarchy();
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
  @ApiQuery({ name: 'issueDate', required: false, example: '2023-04-15' })
  @ApiQuery({ name: 'expiryDate', required: false, example: '2028-04-14' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Certification PDF/Image (max 10MB)' },
      },
      required: ['file'],
    },
  })
  @ApiQuery({ name: 'documentNumber', required: false, description: 'Optional official certificate or license number' })
  async uploadDocument(
    @Req() req: FastifyRequest,
    @Query('category') categoryParam?: string,
    @Query('registrationCode') regCodeParam?: string,
    @Query('issueDate') issueDateParam?: string,
    @Query('expiryDate') expiryDateParam?: string,
    @Query('documentNumber') docNumParam?: string,
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
    const documentNumber = docNumParam || fields.documentNumber?.value;

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
      documentNumber,
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

  // ------------------------------------------------------------- Authenticated Manufacturer Documents (/me/documents)

  @Get('me/documents')
  @ApiBearerAuth()
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Get current authenticated manufacturer uploaded certification documents' })
  getMyDocuments(@CurrentUser() user: AuthUser) {
    return this.service.getMyDocuments(Number(user.id));
  }

  @Post('me/documents')
  @ApiBearerAuth()
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new certification document for the authenticated manufacturer' })
  async uploadMyDocument(
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
    @Query('category') categoryParam?: string,
    @Query('documentType') docTypeParam?: string,
    @Query('issueDate') issueDateParam?: string,
    @Query('expiryDate') expiryDateParam?: string,
    @Query('documentNumber') docNumParam?: string,
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

    const category = categoryParam || docTypeParam || fields.category?.value || fields.documentType?.value;
    const issueDate = issueDateParam || fields.issueDate?.value;
    const expiryDate = expiryDateParam || fields.expiryDate?.value;
    const documentNumber = docNumParam || fields.documentNumber?.value;

    return this.service.uploadMyDocument(
      Number(user.id),
      buffer,
      part.filename,
      part.mimetype,
      category,
      documentNumber,
      issueDate,
      expiryDate,
      user,
    );
  }

  @Put('me/documents/:id')
  @ApiBearerAuth()
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Replace an existing certification document for the authenticated manufacturer' })
  async replaceMyDocument(
    @Req() req: FastifyRequest,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Query('issueDate') issueDateParam?: string,
    @Query('expiryDate') expiryDateParam?: string,
    @Query('documentNumber') docNumParam?: string,
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

    const issueDate = issueDateParam || fields.issueDate?.value;
    const expiryDate = expiryDateParam || fields.expiryDate?.value;
    const documentNumber = docNumParam || fields.documentNumber?.value;

    return this.service.replaceMyDocument(
      Number(user.id),
      id,
      buffer,
      part.filename,
      part.mimetype,
      documentNumber,
      issueDate,
      expiryDate,
      user,
    );
  }

  @Get('me/documents/:id/download')
  @ApiBearerAuth()
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Download or stream an authenticated manufacturer certification document' })
  async downloadMyDocument(
    @Param('id') id: string,
    @Res() res: FastifyReply,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    const file = await this.service.downloadMyDocument(Number(user.id), id, user);
    res.header('Content-Type', file.mimeType || file.contentType || 'application/pdf');
    res.header('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    if (file.contentLength) {
      res.header('Content-Length', file.contentLength);
    }
    return res.send(file.stream);
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

  @Public()
  @Get('documents/:id/download')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download or view a manufacturer certification document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiQuery({ name: 'registrationCode', required: false, description: 'Optional registration code for pre-login draft view' })
  async downloadDocument(
    @Param('id') id: string,
    @Res() res: FastifyReply,
    @Query('registrationCode') registrationCode?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    const file = await this.service.getDocumentForDownload(id, user, registrationCode);
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
  approve(@Param('code') code: string, @CurrentUser() user: AuthUser, @Body() _body?: any) {
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

  // ------------------------------------------------------------- Factory Gallery

  @Public()
  @Get('gallery')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List factory gallery entries for a manufacturer' })
  @ApiQuery({ name: 'registrationCode', required: false, description: 'Optional registration code (or inferred from session)' })
  listGallery(@Query('registrationCode') registrationCode?: string, @CurrentUser() user?: AuthUser) {
    return this.service.listGallery(registrationCode, user);
  }

  @Public()
  @Post('gallery/upload')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a factory photo to the gallery',
    description: 'Accepts multipart/form-data containing image file (JPG, PNG, WebP; max 10MB) and metadata (title, factoryLocation, captureDate, description, gpsCoordinates).',
  })
  async uploadGalleryEntry(
    @Req() req: FastifyRequest,
    @Query('registrationCode') registrationCodeParam?: string,
    @Query('title') titleParam?: string,
    @Query('factoryLocation') locationParam?: string,
    @Query('locationName') locationNameParam?: string,
    @Query('captureDate') captureDateParam?: string,
    @Query('capturedAt') capturedAtParam?: string,
    @Query('description') descriptionParam?: string,
    @Query('gpsCoordinates') gpsParam?: string,
    @Query('latitude') latParam?: string,
    @Query('longitude') lonParam?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data.');
    }

    let fileBuffer: Buffer | null = null;
    let filename = '';
    let mimetype = '';
    const fields: Record<string, string> = {};

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const filePart = part as any;
        fileBuffer = await filePart.toBuffer();
        filename = filePart.filename;
        mimetype = filePart.mimetype;
      } else {
        const fieldPart = part as any;
        fields[fieldPart.fieldname] = typeof fieldPart.value === 'string'
          ? fieldPart.value
          : String(fieldPart.value ?? '');
      }
    }

    if (!fileBuffer) {
      throw new BadRequestException('No file uploaded in "file" field.');
    }

    const title = titleParam || fields.title;
    const factoryLocation = locationParam || locationNameParam || fields.factoryLocation || fields.locationName;
    const registrationCode = registrationCodeParam || fields.registrationCode;
    const captureDate = captureDateParam || capturedAtParam || fields.captureDate || fields.capturedAt;
    const description = descriptionParam || fields.description;
    let gpsCoordinates = gpsParam || fields.gpsCoordinates;
    if (!gpsCoordinates) {
      const lat = latParam || fields.latitude;
      const lon = lonParam || fields.longitude;
      if (lat && lon) {
        gpsCoordinates = `${lat}, ${lon}`;
      }
    }

    if (!title?.trim()) {
      throw new BadRequestException('title is required.');
    }
    if (!factoryLocation?.trim()) {
      throw new BadRequestException('factoryLocation is required.');
    }

    const dto: CreateGalleryEntryDto = {
      title: title.trim(),
      factoryLocation: factoryLocation.trim(),
      registrationCode: registrationCode?.trim() || undefined,
      captureDate: captureDate?.trim() || undefined,
      description: description?.trim() || undefined,
      gpsCoordinates: gpsCoordinates?.trim() || undefined,
    };

    const callerUser = user || ((req as any).user as AuthUser | undefined);
    return this.service.uploadGalleryEntry(fileBuffer, filename, mimetype, dto, callerUser);
  }

  @Public()
  @Get('gallery/:id/image')
  @ApiOperation({ summary: 'Stream factory gallery photo' })
  @ApiParam({ name: 'id', description: 'Gallery entry ID' })
  async getGalleryImage(
    @Param('id') id: string,
    @Res() res: FastifyReply,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    const file = await this.service.getGalleryImage(id, user);
    res.header('Content-Type', file.contentType || 'image/jpeg');
    res.header('Cache-Control', 'public, max-age=86400');
    if (file.contentLength) {
      res.header('Content-Length', file.contentLength);
    }
    return res.send(file.stream);
  }

  @Patch('gallery/:id')
  @ApiBearerAuth()
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Update factory gallery photo metadata' })
  @ApiParam({ name: 'id', description: 'Gallery entry ID' })
  updateGalleryEntry(
    @Param('id') id: string,
    @Body() dto: UpdateGalleryEntryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateGalleryEntry(id, dto, user);
  }

  @Delete('gallery/:id')
  @ApiBearerAuth()
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Delete a factory gallery entry' })
  @ApiParam({ name: 'id', description: 'Gallery entry ID' })
  deleteGalleryEntry(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.deleteGalleryEntry(id, user);
  }

  // ------------------------------------------------------------- Achievements & Awards

  @Public()
  @Get('achievements')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List achievements and awards for a manufacturer' })
  @ApiQuery({ name: 'registrationCode', required: false, description: 'Optional registration code' })
  listAchievements(@Query('registrationCode') registrationCode?: string, @CurrentUser() user?: AuthUser) {
    return this.service.listAchievements(registrationCode, user);
  }

  @Post('achievements')
  @ApiBearerAuth()
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Create an achievement or award record' })
  async createAchievement(
    @Req() req: FastifyRequest,
    @Body() bodyDto: CreateAchievementDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (req.isMultipart()) {
      const part = await req.file();
      const fields = (part?.fields as any) || {};
      const title = fields.title?.value || bodyDto?.title;
      const awardType = fields.awardType?.value || bodyDto?.awardType;
      const issuingOrganization = fields.issuingOrganization?.value || bodyDto?.issuingOrganization;
      const issueDate = fields.issueDate?.value || bodyDto?.issueDate;
      const expiryDate = fields.expiryDate?.value || bodyDto?.expiryDate;
      const description = fields.description?.value || bodyDto?.description;
      const registrationCode = fields.registrationCode?.value || bodyDto?.registrationCode;

      if (!title?.trim() || !awardType?.trim() || !issuingOrganization?.trim() || !issueDate?.trim()) {
        throw new BadRequestException('title, awardType, issuingOrganization, and issueDate are required.');
      }

      let certFile: { buffer: Buffer; fileName: string; mimeType: string } | undefined = undefined;
      if (part) {
        const buffer = await part.toBuffer();
        if (buffer.length > 0) {
          certFile = { buffer, fileName: part.filename, mimeType: part.mimetype };
        }
      }

      return this.service.createAchievement(
        { title, awardType, issuingOrganization, issueDate, expiryDate, description, registrationCode },
        user,
        certFile,
      );
    }

    return this.service.createAchievement(bodyDto, user);
  }

  @Patch('achievements/:id')
  @ApiBearerAuth()
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Update an achievement or award record' })
  @ApiParam({ name: 'id', description: 'Achievement ID' })
  updateAchievement(
    @Param('id') id: string,
    @Body() dto: UpdateAchievementDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateAchievement(id, dto, user);
  }

  @Post('achievements/:id/certificate')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Upload or replace supporting document/certificate for an achievement' })
  @ApiParam({ name: 'id', description: 'Achievement ID' })
  async uploadAchievementCertificate(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data.');
    }
    const part = await req.file();
    if (!part) {
      throw new BadRequestException('No file uploaded in "file" field.');
    }
    const buffer = await part.toBuffer();
    return this.service.uploadAchievementCertificate(id, buffer, part.filename, part.mimetype, user);
  }

  @Public()
  @Get('achievements/:id/certificate')
  @ApiOperation({ summary: 'Download or view achievement supporting certificate' })
  @ApiParam({ name: 'id', description: 'Achievement ID' })
  async getAchievementCertificate(
    @Param('id') id: string,
    @Res() res: FastifyReply,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    const file = await this.service.getAchievementCertificate(id, user);
    res.header('Content-Type', file.contentType || 'application/pdf');
    res.header('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    if (file.contentLength) {
      res.header('Content-Length', file.contentLength);
    }
    return res.send(file.stream);
  }

  @Delete('achievements/:id')
  @ApiBearerAuth()
  @Roles('MANUFACTURER', 'SUPPLIER', 'ROLE_MANUFACTURER', 'ROLE_SUPPLIER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Delete an achievement or award' })
  @ApiParam({ name: 'id', description: 'Achievement ID' })
  deleteAchievement(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.deleteAchievement(id, user);
  }

  // ------------------------------------------------------------- Compliance Review of Gallery & Achievements

  @Post('review/verifications/:code/gallery/:id/review')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin/Compliance: Verify or reject a manufacturer factory gallery entry' })
  @ApiParam({ name: 'code', description: 'Registration Code' })
  @ApiParam({ name: 'id', description: 'Gallery Entry ID' })
  reviewGalleryEntry(
    @Param('code') code: string,
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reviewGalleryEntry(code, id, dto, user.username);
  }

  @Post('review/verifications/:code/achievements/:id/review')
  @ApiBearerAuth()
  @Roles('ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_ADMIN', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Admin/Compliance: Verify or reject a manufacturer achievement or award' })
  @ApiParam({ name: 'code', description: 'Registration Code' })
  @ApiParam({ name: 'id', description: 'Achievement ID' })
  reviewAchievement(
    @Param('code') code: string,
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reviewAchievement(code, id, dto, user.username);
  }
}
