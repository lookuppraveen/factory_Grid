import { ValidateBy, ValidationOptions } from 'class-validator';

/** Rejects missing, empty and whitespace-only strings (Java's @NotBlank). */
export function IsNotBlank(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isNotBlank',
      validator: {
        validate: (value: unknown) => typeof value === 'string' && value.trim().length > 0,
      },
    },
    options,
  );
}
