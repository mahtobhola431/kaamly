import type { AdminLevel, UserRole } from '@rokdajob/shared';

/** Identity attached by the `authenticate` middleware. */
export interface AuthContext {
  userId: string;
  role: UserRole;
  adminLevel?: AdminLevel;
  /** JWT id of the access token, used for audit trails. */
  tokenId: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      /** Output of `validate()`; typed per route through the generic helper. */
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
