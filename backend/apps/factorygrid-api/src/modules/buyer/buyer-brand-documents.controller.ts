import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { StorageService } from '../storage/storage.service';
import { BuyerBrandDocumentsService } from './buyer-brand-documents.service';
import { BuyerBrandDocumentDto } from './dto/brand-trademark-documents.dto';

@ApiTags('Buyer Brand Documents')
@ApiBearerAuth()
@Controller('buyer/brand-documents')
export class BuyerBrandDocumentsController {
  constructor(
    private readonly brandDocsService: BuyerBrandDocumentsService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @Roles('BUYER', 'ROLE_BUYER')
  @ApiOperation({ summary: 'List authenticated buyer brand documents' })
  @ApiOkResponse({ type: [BuyerBrandDocumentDto] })
  async listMyDocuments(@CurrentUser() user: AuthUser): Promise<BuyerBrandDocumentDto[]> {
    return this.brandDocsService.listMyBrandDocuments(Number(user.id));
  }

  @Post()
  @Roles('BUYER', 'ROLE_BUYER')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new brand document' })
  @ApiOkResponse({ type: BuyerBrandDocumentDto })
  async uploadDocument(
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<BuyerBrandDocumentDto> {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data.');
    }

    const part = await req.file();
    if (!part) {
      throw new BadRequestException('File is required in "file" field.');
    }

    const buffer = await part.toBuffer();
    const fields = part.fields as any;

    const brandName = fields?.brandName?.value;
    const brandReference = fields?.brandReference?.value;
    const documentType = fields?.documentType?.value;
    const documentNumber = fields?.documentNumber?.value;
    const dosageForm = fields?.dosageForm?.value;
    const tmRegistrationNo = fields?.tmRegistrationNo?.value;
    const issueDate = fields?.issueDate?.value;
    const expiryDate = fields?.expiryDate?.value;

    return this.brandDocsService.uploadBrandDocument(
      Number(user.id),
      buffer,
      part.filename,
      part.mimetype,
      {
        brandName,
        brandReference,
        documentType,
        documentNumber,
        dosageForm,
        tmRegistrationNo,
        issueDate,
        expiryDate,
      },
    );
  }

  @Put(':id')
  @Roles('BUYER', 'ROLE_BUYER')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update or re-upload a brand document' })
  @ApiOkResponse({ type: BuyerBrandDocumentDto })
  async updateDocument(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<BuyerBrandDocumentDto> {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data.');
    }

    let filePart: { buffer: Buffer; fileName: string; mimeType: string } | undefined;
    const fields: Record<string, string> = {};

    const parts = req.parts();
    for await (const p of parts) {
      if (p.type === 'file') {
        const buffer = await p.toBuffer();
        filePart = { buffer, fileName: p.filename, mimeType: p.mimetype };
      } else {
        fields[p.fieldname] = p.value as string;
      }
    }

    return this.brandDocsService.updateBrandDocument(
      Number(id),
      Number(user.id),
      {
        brandName: fields.brandName,
        brandReference: fields.brandReference,
        documentType: fields.documentType,
        documentNumber: fields.documentNumber,
        dosageForm: fields.dosageForm,
        tmRegistrationNo: fields.tmRegistrationNo,
        issueDate: fields.issueDate,
        expiryDate: fields.expiryDate,
      },
      filePart,
    );
  }

  @Get(':id/download')
  @Roles('BUYER', 'ROLE_BUYER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Download / view authorized brand document' })
  async downloadDocument(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() reply: FastifyReply,
  ) {
    const doc = await this.brandDocsService.getBrandDocument(Number(id), user);
    const file = await this.storage.getFile(doc.storageKey);
    reply.header('Content-Type', file.contentType || doc.mimeType);
    reply.header('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return reply.send(file.stream);
  }
}

