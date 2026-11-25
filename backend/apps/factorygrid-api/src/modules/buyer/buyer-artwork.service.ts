import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@factorygrid/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  MasterOrderArtworkSummaryDto,
  OrderArtworkResponseDto,
  SubmitArtworkLinkDto,
  SubmitInHouseArtworkRequestDto,
} from './dto/order-artwork.dto';

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'pdf', 'ai', 'cdr'];
const MAX_ARTWORKS_PER_PRODUCT = 5;

@Injectable()
export class BuyerArtworkService {
  private readonly logger = new Logger(BuyerArtworkService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Helper to resolve master order and verify caller ownership
   */
  async resolveAuthorizedMasterOrder(
    orderIdOrNumber: string,
    user: AuthUser,
  ) {
    const isIdNumeric = /^\d+$/.test(orderIdOrNumber);
    const masterOrder = await this.prisma.masterOrder.findFirst({
      where: isIdNumeric
        ? { OR: [{ id: BigInt(orderIdOrNumber) }, { orderNumber: orderIdOrNumber }] }
        : { orderNumber: orderIdOrNumber },
      include: {
        subOrders: {
          include: {
            lines: true,
          },
        },
      },
    });

    if (!masterOrder) {
      throw new NotFoundException(`Master Order "${orderIdOrNumber}" not found.`);
    }

    const isAdmin = user.roles.some((r) =>
      ['ADMIN', 'ROLE_ADMIN', 'COMPLIANCE_OFFICER', 'ROLE_COMPLIANCE_OFFICER'].includes(r),
    );

    if (!isAdmin) {
      const buyerUserId = BigInt(user.id);
      const isOwner = masterOrder.buyerId === buyerUserId;
      if (!isOwner) {
        throw new ForbiddenException(
          'You are not authorized to view or manage artwork for this master order.',
        );
      }
    }

    return masterOrder;
  }

  /**
   * Resolve sub-order ID if passed as numeric or code
   */
  private async resolveSubOrderId(
    masterOrderId: bigint,
    subOrderIdOrCode?: string,
  ): Promise<bigint | null> {
    if (!subOrderIdOrCode) return null;
    if (/^\d+$/.test(subOrderIdOrCode)) {
      return BigInt(subOrderIdOrCode);
    }
    const so = await this.prisma.subOrder.findFirst({
      where: {
        masterOrderId,
        subOrderNumber: subOrderIdOrCode,
      },
    });
    return so ? so.id : null;
  }

  /**
   * Format bytes to readable size
   */
  private formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  }

  /**
   * Friendly display type from extension
   */
  private formatDisplayType(ext: string): string {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return 'PDF Document (.pdf)';
      case 'ai':
        return 'Adobe Illustrator (.ai)';
      case 'cdr':
        return 'CorelDRAW (.cdr)';
      default:
        return `${ext.toUpperCase()} Image (.${ext.toLowerCase()})`;
    }
  }

  /**
   * Map Prisma record to DTO
   */
  private mapToDto(rec: any): OrderArtworkResponseDto {
    return {
      id: String(rec.id),
      masterOrderId: String(rec.masterOrderId),
      subOrderId: rec.subOrderId ? String(rec.subOrderId) : null,
      productId: rec.productId,
      productName: rec.productName || null,
      submissionType: rec.submissionType,
      fileName: rec.fileName || null,
      fileType: rec.fileType || null,
      fileSize: rec.fileSize || null,
      fileUrl: rec.fileUrl || (rec.storageKey ? `/api/v1/buyer/orders/artwork/files/${rec.id}` : null),
      externalUrl: rec.externalUrl || null,
      instructions: rec.instructions || null,
      status: rec.status,
      reviewNotes: rec.reviewNotes || null,
      reviewedBy: rec.reviewedBy || null,
      reviewedAt: rec.reviewedAt ? rec.reviewedAt.toISOString() : null,
      uploadedById: rec.uploadedById ? String(rec.uploadedById) : null,
      uploadedByName: rec.uploadedByName || null,
      createdAt: rec.createdAt.toISOString(),
      updatedAt: rec.updatedAt.toISOString(),
    };
  }

  /**
   * Upload artwork files for a product
   */
  async uploadArtworkFiles(
    orderIdOrNumber: string,
    productId: string,
    files: Array<{ buffer: Buffer; fileName: string; mimeType: string }>,
    metadata: { subOrderId?: string; productName?: string },
    user: AuthUser,
  ): Promise<OrderArtworkResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one artwork file must be provided.');
    }

    const masterOrder = await this.resolveAuthorizedMasterOrder(orderIdOrNumber, user);
    const subOrderId = await this.resolveSubOrderId(masterOrder.id, metadata.subOrderId);

    // Check existing count for quota
    const existingCount = await this.prisma.orderArtwork.count({
      where: {
        masterOrderId: masterOrder.id,
        productId,
      },
    });

    if (existingCount >= MAX_ARTWORKS_PER_PRODUCT) {
      throw new BadRequestException(
        `Maximum ${MAX_ARTWORKS_PER_PRODUCT} artwork files allowed per product. Please delete an existing file first.`,
      );
    }

    const remainingSlots = MAX_ARTWORKS_PER_PRODUCT - existingCount;
    const filesToUpload = files.slice(0, remainingSlots);

    const results: OrderArtworkResponseDto[] = [];
    const dbUser = await this.prisma.user.findUnique({ where: { id: BigInt(user.id) } });
    const uploaderName = dbUser?.username || dbUser?.email || user.username || 'Buyer User';

    for (const f of filesToUpload) {
      const ext = f.fileName.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new BadRequestException(
          `Invalid file format "${ext}". Supported formats: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`,
        );
      }

      const safeName = f.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageKey = `orders/${masterOrder.id}/artworks/${productId}/${Date.now()}_${safeName}`;

      await this.storage.uploadFile(f.buffer, storageKey, f.mimeType);

      const created = await this.prisma.orderArtwork.create({
        data: {
          masterOrderId: masterOrder.id,
          subOrderId,
          productId,
          productName: metadata.productName || null,
          submissionType: 'UPLOAD',
          fileName: f.fileName,
          fileType: this.formatDisplayType(ext),
          fileSize: this.formatFileSize(f.buffer.length),
          storageKey,
          status: 'SUBMITTED',
          uploadedById: BigInt(user.id),
          uploadedByName: uploaderName,
        },
      });

      const fileUrl = `/api/v1/buyer/orders/artwork/files/${created.id}`;
      const updated = await this.prisma.orderArtwork.update({
        where: { id: created.id },
        data: { fileUrl },
      });

      results.push(this.mapToDto(updated));
    }

    return results;
  }

  /**
   * Submit external artwork repository URL
   */
  async submitArtworkLink(
    orderIdOrNumber: string,
    productId: string,
    dto: SubmitArtworkLinkDto,
    user: AuthUser,
  ): Promise<OrderArtworkResponseDto> {
    const masterOrder = await this.resolveAuthorizedMasterOrder(orderIdOrNumber, user);
    const subOrderId = await this.resolveSubOrderId(masterOrder.id, dto.subOrderId);

    const existingCount = await this.prisma.orderArtwork.count({
      where: {
        masterOrderId: masterOrder.id,
        productId,
      },
    });

    if (existingCount >= MAX_ARTWORKS_PER_PRODUCT) {
      throw new BadRequestException(
        `Maximum ${MAX_ARTWORKS_PER_PRODUCT} artwork references allowed per product. Please delete an existing item first.`,
      );
    }

    const cleanUrl = dto.artworkUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new BadRequestException('Artwork link must be a valid HTTP or HTTPS URL.');
    }

    const displayTitle =
      cleanUrl.length > 35 ? `${cleanUrl.substring(0, 32)}...` : cleanUrl;

    const dbUser = await this.prisma.user.findUnique({ where: { id: BigInt(user.id) } });
    const uploaderName = dbUser?.username || dbUser?.email || user.username || 'Buyer User';

    const created = await this.prisma.orderArtwork.create({
      data: {
        masterOrderId: masterOrder.id,
        subOrderId,
        productId,
        productName: dto.productName || null,
        submissionType: 'EXTERNAL_LINK',
        fileName: `URL Link: ${displayTitle}`,
        fileType: 'URL Link Reference',
        fileSize: 'External URL',
        externalUrl: cleanUrl,
        fileUrl: cleanUrl,
        status: 'SUBMITTED',
        uploadedById: BigInt(user.id),
        uploadedByName: uploaderName,
      },
    });

    return this.mapToDto(created);
  }

  /**
   * Request in-house artwork packaging design
   */
  async requestInHouseArtwork(
    orderIdOrNumber: string,
    productId: string,
    dto: SubmitInHouseArtworkRequestDto,
    user: AuthUser,
  ): Promise<OrderArtworkResponseDto> {
    const masterOrder = await this.resolveAuthorizedMasterOrder(orderIdOrNumber, user);
    const subOrderId = await this.resolveSubOrderId(masterOrder.id, dto.subOrderId);

    // Check if in-house request already exists
    const existing = await this.prisma.orderArtwork.findFirst({
      where: {
        masterOrderId: masterOrder.id,
        productId,
        submissionType: 'IN_HOUSE_REQUEST',
      },
    });

    if (existing) {
      return this.mapToDto(existing);
    }

    const dbUser = await this.prisma.user.findUnique({ where: { id: BigInt(user.id) } });
    const uploaderName = dbUser?.username || dbUser?.email || user.username || 'Buyer User';

    const created = await this.prisma.orderArtwork.create({
      data: {
        masterOrderId: masterOrder.id,
        subOrderId,
        productId,
        productName: dto.productName || null,
        submissionType: 'IN_HOUSE_REQUEST',
        fileName: `In-house Artwork Request (${dto.productName || productId})`,
        fileType: 'In-house Design Service',
        fileSize: 'Design Request',
        instructions: dto.notes || 'In-house packaging design team assistance requested.',
        status: 'IN_HOUSE_REQUESTED',
        uploadedById: BigInt(user.id),
        uploadedByName: uploaderName,
      },
    });

    return this.mapToDto(created);
  }

  /**
   * Get all artworks for master order with completion counts
   */
  async getMasterOrderArtworks(
    orderIdOrNumber: string,
    user: AuthUser,
  ): Promise<MasterOrderArtworkSummaryDto> {
    const masterOrder = await this.resolveAuthorizedMasterOrder(orderIdOrNumber, user);

    const artworks = await this.prisma.orderArtwork.findMany({
      where: { masterOrderId: masterOrder.id },
      orderBy: { createdAt: 'asc' },
    });

    // Extract total distinct products across sub-orders
    const productKeysSet = new Set<string>();
    masterOrder.subOrders.forEach((so) => {
      so.lines.forEach((line) => {
        const key = line.id ? String(line.id) : (line.productId || line.productName);
        productKeysSet.add(key);
      });
    });

    artworks.forEach((a) => productKeysSet.add(a.productId));

    const totalProducts = Math.max(productKeysSet.size, 1);

    // Count completed products (at least one uploaded file or in-house request)
    const completedProductKeys = new Set<string>();
    artworks.forEach((a) => {
      if (['SUBMITTED', 'APPROVED', 'IN_HOUSE_REQUESTED', 'UNDER_REVIEW'].includes(a.status)) {
        completedProductKeys.add(a.productId);
      }
    });

    const completedProducts = completedProductKeys.size;
    const isFullyCompleted = completedProducts >= totalProducts;

    return {
      masterOrderId: String(masterOrder.id),
      totalProducts,
      completedProducts,
      isFullyCompleted,
      artworks: artworks.map((a) => this.mapToDto(a)),
    };
  }

  /**
   * Get artworks for a specific product
   */
  async getProductArtworks(
    orderIdOrNumber: string,
    productId: string,
    user: AuthUser,
  ): Promise<OrderArtworkResponseDto[]> {
    const masterOrder = await this.resolveAuthorizedMasterOrder(orderIdOrNumber, user);

    const artworks = await this.prisma.orderArtwork.findMany({
      where: {
        masterOrderId: masterOrder.id,
        productId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return artworks.map((a) => this.mapToDto(a));
  }

  /**
   * Download / stream artwork file
   */
  async getArtworkFile(artworkId: string, user: AuthUser) {
    if (!/^\d+$/.test(artworkId)) {
      throw new BadRequestException('Invalid artwork ID format.');
    }

    const artwork = await this.prisma.orderArtwork.findUnique({
      where: { id: BigInt(artworkId) },
    });

    if (!artwork || !artwork.storageKey) {
      throw new NotFoundException('Artwork file not found.');
    }

    // Verify user authorization for this order
    await this.resolveAuthorizedMasterOrder(String(artwork.masterOrderId), user);

    const file = await this.storage.getFile(artwork.storageKey);
    return {
      stream: file.stream,
      contentType: file.contentType,
      fileName: artwork.fileName || 'artwork-file',
    };
  }

  /**
   * Delete an artwork record and its underlying stored file
   */
  async deleteArtwork(artworkId: string, user: AuthUser): Promise<{ success: boolean; message: string }> {
    if (!/^\d+$/.test(artworkId)) {
      throw new BadRequestException('Invalid artwork ID format.');
    }

    const artwork = await this.prisma.orderArtwork.findUnique({
      where: { id: BigInt(artworkId) },
    });

    if (!artwork) {
      throw new NotFoundException(`Artwork "${artworkId}" not found.`);
    }

    await this.resolveAuthorizedMasterOrder(String(artwork.masterOrderId), user);

    if (artwork.storageKey) {
      try {
        await this.storage.deleteFile(artwork.storageKey);
      } catch (err: any) {
        this.logger.warn(`Storage delete error for ${artwork.storageKey}: ${err.message}`);
      }
    }

    await this.prisma.orderArtwork.delete({
      where: { id: artwork.id },
    });

    return {
      success: true,
      message: `Artwork "${artwork.fileName || artworkId}" successfully removed.`,
    };
  }
}
