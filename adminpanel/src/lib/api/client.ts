import { createApiClient } from '@rokdajob/shared';
import { getAccessToken } from '@/lib/auth/session';
import { apiBaseUrl } from '@/lib/env';

/**
 * The admin panel's API client. The request/response contract lives in
 * `@rokdajob/shared`; this file only supplies the environment and the token.
 */
export const api = createApiClient({
  baseUrl: apiBaseUrl(),
  getToken: () => getAccessToken(),
});

export { ApiClientError } from '@rokdajob/shared';
