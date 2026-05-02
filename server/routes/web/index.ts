import { Hono } from 'hono';
import { gameplayApp } from './gameplay';
import { parentAreaApp } from './parent-area';
import { profilesCrudApp } from './profiles-crud';

/**
 * Gabungan rute domain `/api/*` untuk permainan & orang tua.
 * Root app memasang dengan `.route('/', webApi)`.
 */
export const webApi = new Hono();
webApi.route('/', profilesCrudApp);
webApi.route('/', gameplayApp);
webApi.route('/', parentAreaApp);
