import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AppException, ValidationException } from './exceptions';
import { ErrorResponse } from './responses';

const REASONS: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  423: 'Locked',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

/** Unparseable request bodies get one stable message instead of parser internals. */
function normalizeBadBody(status: number, message: string): string {
  return status === HttpStatus.BAD_REQUEST && /json/i.test(message) ? 'Malformed JSON request payload' : message;
}

interface ReplyLike {
  status(code: number): ReplyLike;
  send(body: unknown): void;
}

interface RequestLike {
  url: string;
}

/**
 * Turns every thrown error into the standard ErrorResponse body.
 * Unexpected errors are logged with their stack but never leak details to the client.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<ReplyLike>();
    const request = ctx.getRequest<RequestLike>();
    const path = request.url.split('?')[0];

    const { status, message, errors } = this.describe(exception, path);
    const body: ErrorResponse = {
      status,
      error: REASONS[status] ?? HttpStatus[status] ?? 'Error',
      message,
      timestamp: new Date().toISOString(),
      path,
      ...(errors ? { errors } : {}),
    };
    reply.status(status).send(body);
  }

  private describe(
    exception: unknown,
    path: string,
  ): { status: number; message: string; errors?: Record<string, string> } {
    if (exception instanceof ValidationException) {
      return { status: exception.status, message: exception.message, errors: exception.fieldErrors };
    }
    if (exception instanceof AppException) {
      return { status: exception.status, message: exception.message };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === HttpStatus.FORBIDDEN) {
        return { status, message: 'Access denied: You do not have permissions to access this resource' };
      }
      if (status === HttpStatus.UNAUTHORIZED) {
        return { status, message: 'Authentication failed: Missing or invalid token' };
      }
      const response = exception.getResponse();
      const message =
        typeof response === 'object' && response !== null && 'message' in response
          ? String((response as { message: unknown }).message)
          : exception.message;
      return { status, message: normalizeBadBody(status, message) };
    }
    // Fastify raises plain errors with a statusCode, e.g. for malformed JSON bodies.
    const fastifyStatus = (exception as { statusCode?: number })?.statusCode;
    if (typeof fastifyStatus === 'number' && fastifyStatus >= 400 && fastifyStatus < 500) {
      return { status: fastifyStatus, message: normalizeBadBody(fastifyStatus, String((exception as Error).message)) };
    }
    this.logger.error(`Unhandled exception on ${path}`, exception instanceof Error ? exception.stack : String(exception));
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'An unexpected error occurred' };
  }
}
