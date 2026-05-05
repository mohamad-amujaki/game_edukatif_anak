// Klien RPC: `@mainceria/api-client` (`createHcApi`, `unwrapData`) + origin `apiBaseURL()` untuk browser.
import { apiBaseURL } from '@/lib/api-base-url';
import { createHcApi, unwrapData } from '@mainceria/api-client';

export const hcApi = createHcApi(apiBaseURL);
export { unwrapData };
