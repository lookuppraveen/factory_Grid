import { HttpStatus } from '@nestjs/common';

/** Base for domain errors that map to a fixed HTTP status. */
export class AppException extends Error {
  constructor(
    readonly status: HttpStatus,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ConflictException extends AppException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, message);
  }
}

export class NotFoundException extends AppException {
  constructor(message: string) {
    super(HttpStatus.NOT_FOUND, message);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message: string) {
    super(HttpStatus.UNAUTHORIZED, message);
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string) {
    super(HttpStatus.FORBIDDEN, message);
  }
}

export class LockedException extends AppException {
  constructor(message: string) {
    super(HttpStatus.LOCKED, message);
  }
}

export class ValidationException extends AppException {
  constructor(readonly fieldErrors: Record<string, string>) {
    super(HttpStatus.BAD_REQUEST, 'Validation failed');
  }
}
