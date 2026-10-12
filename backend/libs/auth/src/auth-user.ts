/** The signed-in user attached to each authenticated request. */
export interface AuthUser {
  id: number;
  username: string;
  userCode: string;
  /** Role names as stored, e.g. ROLE_BUYER. */
  roles: string[];
}

/** Claims carried in every access token. */
export interface AccessTokenClaims {
  sub: string;
  userId: number;
  userCode: string;
  roles: string[];
}

/**
 * Looks up the user behind a valid token on every request, so a deactivated
 * or locked account loses access immediately. Provided by the IAM module.
 */
export interface AuthUserLoader {
  load(username: string): Promise<AuthUser | null>;
}

export const AUTH_USER_LOADER = Symbol('AUTH_USER_LOADER');
