import { createApiClient } from '@rokdajob/shared';
import { getAccessToken } from '@/lib/auth/session';
import { clientEnv } from '@/lib/env';

/**
 * The web app's API client. The request/response contract lives in
 * `@rokdajob/shared`; this file only supplies the environment and the token.
 *
 * `getToken` reads the stored access token, so signed-in requests carry it without every
 * call site remembering to. Silent refresh on a 401 is not wired yet — see
 * `lib/auth/session.ts`.
 */
export const api = createApiClient({
  baseUrl: clientEnv.NEXT_PUBLIC_API_URL,
  getToken: () => getAccessToken(),
});

export { ApiClientError } from '@rokdajob/shared';
