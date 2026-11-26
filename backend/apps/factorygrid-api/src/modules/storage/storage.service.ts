import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import * as fs from 'node:fs';
import * as path from 'node:path';
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
  private readonly localStorageDir: string;

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

    const rootDir = process.env.STORAGE_LOCAL_DIR
      ? path.resolve(process.env.STORAGE_LOCAL_DIR)
      : (fs.existsSync(path.resolve(process.cwd(), 'backend'))
          ? path.resolve(process.cwd(), 'backend/uploads')
          : path.resolve(process.cwd(), 'uploads'));
    this.localStorageDir = rootDir;
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists();
  }

  /**
   * Checks whether the target S3/MinIO bucket exists; creates it if absent.
   * Ensures local storage fallback directory is also prepared.
   */
  async ensureBucketExists(): Promise<void> {
    try {
      await fs.promises.mkdir(this.localStorageDir, { recursive: true });
      this.logger.log(`Local storage directory verified at "${this.localStorageDir}".`);
    } catch (err: any) {
      this.logger.warn(`Could not ensure local storage directory "${this.localStorageDir}": ${err.message}`);
    }

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
        this.logger.warn(`Could not verify S3 bucket "${this.bucket}": ${err.message}. Local storage at "${this.localStorageDir}" is active.`);
      }
    }
  }

  /**
   * Uploads file buffer directly to S3 / MinIO storage.
   * Seamlessly falls back to local file storage if S3/MinIO is unreachable.
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
    } catch (s3Err: any) {
      this.logger.warn(`S3 upload failed (${s3Err.message}). Storing file locally as fallback.`);

      try {
        const localPath = path.resolve(this.localStorageDir, storageKey);
        await fs.promises.mkdir(path.dirname(localPath), { recursive: true });
        await fs.promises.writeFile(localPath, buffer);
        this.logger.log(`File successfully stored locally at ${localPath}`);

        return {
          storageKey,
          storageBucket: 'local',
          fileSize: buffer.length,
          mimeType,
        };
      } catch (localErr: any) {
        this.logger.error(`Failed to store file locally (${storageKey}): ${localErr.message}`, localErr.stack);
        throw new Error(`Document storage service error: ${localErr.message}`);
      }
    }
  }

  /**
   * Retrieves a file stream from local storage or S3 / MinIO storage.
   */
  async getFile(storageKey: string): Promise<{ stream: Readable; contentType: string; contentLength?: number }> {
    const candidatePaths = [
      path.resolve(this.localStorageDir, storageKey),
      path.resolve(process.cwd(), 'uploads', storageKey),
      path.resolve(process.cwd(), 'backend/uploads', storageKey),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        try {
          const stats = await fs.promises.stat(candidate);
          const stream = fs.createReadStream(candidate);
          return {
            stream,
            contentType: 'application/octet-stream',
            contentLength: stats.size,
          };
        } catch (localErr: any) {
          this.logger.warn(`Could not read local file at ${candidate}: ${localErr.message}`);
        }
      }
    }

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
      this.logger.error(`Failed to retrieve file from storage (${storageKey}): ${err.message}`);
      throw new Error(`File not found or storage error: ${err.message}`);
    }
  }

  /**
   * Deletes a file from local storage and S3 / MinIO storage.
   */
  async deleteFile(storageKey: string): Promise<void> {
    const candidatePaths = [
      path.resolve(this.localStorageDir, storageKey),
      path.resolve(process.cwd(), 'uploads', storageKey),
      path.resolve(process.cwd(), 'backend/uploads', storageKey),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        try {
          await fs.promises.unlink(candidate);
        } catch (localErr: any) {
          this.logger.warn(`Failed to delete local file at ${candidate}: ${localErr.message}`);
        }
      }
    }

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      );
    } catch (err: any) {
      this.logger.warn(`Failed to delete file from S3 (${storageKey}): ${err.message}`);
    }
  }

  /**
   * Health check for storage connectivity (S3 or local directory write access).
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      try {
        await fs.promises.access(this.localStorageDir, fs.constants.W_OK);
        return true;
      } catch {
        return false;
      }
    }
  }
}
