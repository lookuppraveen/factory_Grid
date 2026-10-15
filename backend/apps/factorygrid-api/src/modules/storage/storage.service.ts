import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { Env } from '../../config/env';

export interface UploadResult {
  storageKey: string;
  storageBucket: string;
  fileSize: number;
  mimeType: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.bucket = this.config.get('S3_BUCKET', { infer: true });
    this.s3 = new S3Client({
      endpoint: this.config.get('S3_ENDPOINT', { infer: true }),
      region: this.config.get('S3_REGION', { infer: true }),
      credentials: {
        accessKeyId: this.config.get('S3_ACCESS_KEY_ID', { infer: true }),
        secretAccessKey: this.config.get('S3_SECRET_ACCESS_KEY', { infer: true }),
      },
      forcePathStyle: this.config.get('S3_FORCE_PATH_STYLE', { infer: true }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists();
  }

  /**
   * Checks whether the target S3/MinIO bucket exists; creates it if absent.
   */
  async ensureBucketExists(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Storage bucket "${this.bucket}" is available.`);
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        this.logger.warn(`Bucket "${this.bucket}" does not exist. Creating...`);
        try {
          await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Bucket "${this.bucket}" successfully created.`);
        } catch (createErr: any) {
          this.logger.error(`Failed to create bucket "${this.bucket}": ${createErr.message}`);
        }
      } else {
        this.logger.warn(`Could not verify bucket "${this.bucket}": ${err.message}. Storage service will retry on upload.`);
      }
    }
  }

  /**
   * Uploads file buffer directly to S3 / MinIO storage.
   */
  async uploadFile(
    buffer: Buffer,
    storageKey: string,
    mimeType: string,
  ): Promise<UploadResult> {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: buffer,
          ContentType: mimeType,
        }),
      );

      return {
        storageKey,
        storageBucket: this.bucket,
        fileSize: buffer.length,
        mimeType,
      };
    } catch (err: any) {
      this.logger.error(`Failed to upload file to S3 (${storageKey}): ${err.message}`, err.stack);
      throw new Error(`Document storage service error: ${err.message}`);
    }
  }

  /**
   * Retrieves a file stream from S3 / MinIO storage.
   */
  async getFile(storageKey: string): Promise<{ stream: Readable; contentType: string; contentLength?: number }> {
    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      );

      return {
        stream: response.Body as Readable,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength,
      };
    } catch (err: any) {
      this.logger.error(`Failed to retrieve file from S3 (${storageKey}): ${err.message}`);
      throw new Error(`File not found or storage error: ${err.message}`);
    }
  }

  /**
   * Health check for S3 / MinIO connectivity.
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }
}
