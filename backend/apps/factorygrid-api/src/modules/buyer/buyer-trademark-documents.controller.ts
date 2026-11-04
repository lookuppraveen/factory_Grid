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
import { BuyerTrademarkDocumentsService } from './buyer-trademark-documents.service';
import { BuyerTrademarkDocumentDto } from './dto/brand-trademark-documents.dto';

@ApiTags('Buyer Trademark Documents')
@ApiBearerAuth()
@Controller('buyer/trademark-documents')
export class BuyerTrademarkDocumentsController {
  constructor(
    private readonly tmDocsService: BuyerTrademarkDocumentsService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @Roles('BUYER', 'ROLE_BUYER')
  @ApiOperation({ summary: 'List authenticated buyer trademark documents' })
  @ApiOkResponse({ type: [BuyerTrademarkDocumentDto] })
  async listMyDocuments(@CurrentUser() user: AuthUser): Promise<BuyerTrademarkDocumentDto[]> {
    return this.tmDocsService.listMyTrademarkDocuments(Number(user.id));
  }

  @Post()
  @Roles('BUYER', 'ROLE_BUYER')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new trademark document' })
  @ApiOkResponse({ type: BuyerTrademarkDocumentDto })
  async uploadDocument(
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<BuyerTrademarkDocumentDto> {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data.');
    }

    const part = await req.file();
    if (!part) {
      throw new BadRequestException('File is required in "file" field.');
    }

    const buffer = await part.toBuffer();
    const fields = part.fields as any;

    const trademarkName = fields?.trademarkName?.value;
    const tmNumber = fields?.tmNumber?.value;
    const tmClass = fields?.tmClass?.value;
    const documentType = fields?.documentType?.value;
    const verificationSource = fields?.verificationSource?.value;
    const issueDate = fields?.issueDate?.value;
    const expiryDate = fields?.expiryDate?.value;

    return this.tmDocsService.uploadTrademarkDocument(
      Number(user.id),
      buffer,
      part.filename,
      part.mimetype,
      {
        trademarkName,
        tmNumber,
        tmClass,
        documentType,
        verificationSource,
        issueDate,
        expiryDate,
      },
    );
  }

  @Put(':id')
  @Roles('BUYER', 'ROLE_BUYER')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update or re-upload a trademark document' })
  @ApiOkResponse({ type: BuyerTrademarkDocumentDto })
  async updateDocument(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<BuyerTrademarkDocumentDto> {
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

    return this.tmDocsService.updateTrademarkDocument(
      Number(id),
      Number(user.id),
      {
        trademarkName: fields.trademarkName,
        tmNumber: fields.tmNumber,
        tmClass: fields.tmClass,
        documentType: fields.documentType,
        verificationSource: fields.verificationSource,
        issueDate: fields.issueDate,
        expiryDate: fields.expiryDate,
      },
      filePart,
    );
  }

  @Get(':id/download')
  @Roles('BUYER', 'ROLE_BUYER', 'ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER')
  @ApiOperation({ summary: 'Download / view authorized trademark document' })
  async downloadDocument(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() reply: FastifyReply,
  ) {
    const doc = await this.tmDocsService.getTrademarkDocument(Number(id), user);
    const file = await this.storage.getFile(doc.storageKey);
    reply.header('Content-Type', file.contentType || doc.mimeType);
    reply.header('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return reply.send(file.stream);
  }
}

