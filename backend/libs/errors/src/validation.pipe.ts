import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ValidationException } from './exceptions';

function collect(errors: ValidationError[], prefix = '', out: Record<string, string> = {}) {
  for (const error of errors) {
    const field = prefix ? `${prefix}.${error.property}` : error.property;
    const messages = Object.values(error.constraints ?? {});
    if (messages.length > 0) {
      out[field] = messages[0];
    }
    if (error.children?.length) {
      collect(error.children, field, out);
    }
  }
  return out;
}

/** Validates DTOs and reports failures as { errors: { field: message } }. */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    stopAtFirstError: true,
    exceptionFactory: (errors) => new ValidationException(collect(errors)),
  });
}
