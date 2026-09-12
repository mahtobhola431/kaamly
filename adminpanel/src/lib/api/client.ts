import { createApiClient } from '@rokdajob/shared';
import { getAccessToken } from '@/lib/auth/session';
import { clientEnv } from '@/lib/env';

/**
 * The admin panel's API client. The request/response contract lives in
 * `@rokdajob/shared`; this file only supplies the environment and the token.
 */
export const api = createApiClient({
  baseUrl: clientEnv.NEXT_PUBLIC_API_URL,
  getToken: () => getAccessToken(),
});

export { ApiClientError } from '@rokdajob/shared';
