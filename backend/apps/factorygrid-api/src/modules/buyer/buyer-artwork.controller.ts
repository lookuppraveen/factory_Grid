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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthUser, CurrentUser, Roles } from '@factorygrid/auth';
import { BuyerArtworkService } from './buyer-artwork.service';
import {
  MasterOrderArtworkSummaryDto,
  OrderArtworkResponseDto,
  SubmitArtworkLinkDto,
  SubmitInHouseArtworkRequestDto,
} from './dto/order-artwork.dto';

@ApiTags('Buyer Order Artwork')
@ApiBearerAuth()
@Roles('BUYER', 'ROLE_BUYER', 'ADMIN', 'ROLE_ADMIN')
@Controller('buyer/orders')
export class BuyerArtworkController {
  constructor(private readonly artworkService: BuyerArtworkService) {}

  @Get(':orderId/artwork')
  @ApiOperation({
    summary: 'Get artwork summary and files for master order',
    description: 'Retrieves all artwork records and product completion status for the master order.',
  })
  @ApiParam({ name: 'orderId', description: 'Master order ID or order number (e.g. MO-2026-1008)' })
  @ApiOkResponse({ type: MasterOrderArtworkSummaryDto })
  async getMasterOrderArtworks(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<MasterOrderArtworkSummaryDto> {
    return this.artworkService.getMasterOrderArtworks(orderId, user);
  }

  @Get(':orderId/artwork/:productId')
  @ApiOperation({
    summary: 'Get artwork items for a specific product in a master order',
  })
  @ApiParam({ name: 'orderId', description: 'Master order ID or order number' })
  @ApiParam({ name: 'productId', description: 'Product identifier or line item key' })
  @ApiOkResponse({ type: [OrderArtworkResponseDto] })
  async getProductArtworks(
    @Param('orderId') orderId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<OrderArtworkResponseDto[]> {
    return this.artworkService.getProductArtworks(orderId, productId, user);
  }

  @Post(':orderId/artwork/:productId/files')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload artwork design files for a product',
    description: 'Uploads 1 to 5 files (PNG, JPG, JPEG, WEBP, PDF, AI, CDR) to S3/MinIO and PostgreSQL.',
  })
  @ApiParam({ name: 'orderId', description: 'Master order ID or order number' })
  @ApiParam({ name: 'productId', description: 'Product identifier or line item key' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Artwork file' },
        subOrderId: { type: 'string', description: 'Optional sub-order code' },
        productName: { type: 'string', description: 'Optional product display name' },
      },
    },
  })
  @ApiOkResponse({ type: [OrderArtworkResponseDto] })
  async uploadFiles(
    @Param('orderId') orderId: string,
    @Param('productId') productId: string,
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<OrderArtworkResponseDto[]> {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data.');
    }

    const files: Array<{ buffer: Buffer; fileName: string; mimeType: string }> = [];
    const fields: Record<string, string> = {};

    const parts = req.parts();
    for await (const p of parts) {
      if (p.type === 'file') {
        const buffer = await p.toBuffer();
        files.push({
          buffer,
          fileName: p.filename,
          mimeType: p.mimetype,
        });
      } else {
        fields[p.fieldname] = p.value as string;
      }
    }

    if (files.length === 0) {
      throw new BadRequestException('At least one file must be selected for upload.');
    }

    return this.artworkService.uploadArtworkFiles(
      orderId,
      productId,
      files,
      {
        subOrderId: fields.subOrderId,
        productName: fields.productName,
      },
      user,
    );
  }

  @Post(':orderId/artwork/:productId/links')
  @ApiOperation({
    summary: 'Submit external artwork link (Drive, Dropbox, OneDrive, etc.)',
  })
  @ApiParam({ name: 'orderId', description: 'Master order ID or order number' })
  @ApiParam({ name: 'productId', description: 'Product identifier or line item key' })
  @ApiOkResponse({ type: OrderArtworkResponseDto })
  async submitLink(
    @Param('orderId') orderId: string,
    @Param('productId') productId: string,
    @Body() dto: SubmitArtworkLinkDto,
    @CurrentUser() user: AuthUser,
  ): Promise<OrderArtworkResponseDto> {
    return this.artworkService.submitArtworkLink(orderId, productId, dto, user);
  }

  @Post(':orderId/artwork/:productId/in-house-request')
  @ApiOperation({
    summary: 'Submit in-house packaging artwork design request',
  })
  @ApiParam({ name: 'orderId', description: 'Master order ID or order number' })
  @ApiParam({ name: 'productId', description: 'Product identifier or line item key' })
  @ApiOkResponse({ type: OrderArtworkResponseDto })
  async submitInHouseRequest(
    @Param('orderId') orderId: string,
    @Param('productId') productId: string,
    @Body() dto: SubmitInHouseArtworkRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<OrderArtworkResponseDto> {
    return this.artworkService.requestInHouseArtwork(orderId, productId, dto, user);
  }

  @Get('artwork/files/:artworkId')
  @Roles('BUYER', 'ROLE_BUYER', 'ADMIN', 'ROLE_ADMIN', 'SUPPLIER', 'ROLE_SUPPLIER')
  @ApiOperation({ summary: 'Download or view uploaded artwork file' })
  @ApiParam({ name: 'artworkId', description: 'Artwork record ID' })
  async downloadArtworkFile(
    @Param('artworkId') artworkId: string,
    @CurrentUser() user: AuthUser,
    @Res() reply: FastifyReply,
  ) {
    const file = await this.artworkService.getArtworkFile(artworkId, user);
    reply.header('Content-Type', file.contentType || 'application/octet-stream');
    reply.header('Content-Disposition', `inline; filename="${file.fileName}"`);
    return reply.send(file.stream);
  }

  @Delete(':orderId/artwork/:artworkId')
  @ApiOperation({ summary: 'Delete artwork file or reference' })
  @ApiParam({ name: 'orderId', description: 'Master order ID or order number' })
  @ApiParam({ name: 'artworkId', description: 'Artwork record ID' })
  async deleteArtwork(
    @Param('artworkId') artworkId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean; message: string }> {
    return this.artworkService.deleteArtwork(artworkId, user);
  }
}
