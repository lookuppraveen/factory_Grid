import type { components, paths } from './factorygrid-api';

export type { components, operations, paths } from './factorygrid-api';

/** Shorthand for a named schema, e.g. Schema<'UserProfileDto'>. */
export type Schema<Name extends keyof components['schemas']> = components['schemas'][Name];

export type ApiPaths = paths;
