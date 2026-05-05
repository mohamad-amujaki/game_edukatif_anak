import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const devApiOrigin = process.env.VITE_DEV_API_ORIGIN ?? 'http://localhost:3000';
const devVitePort = Number(process.env.VITE_DEV_PORT) || 5173;
/** Root repo — output `dist/` tetap di sini agar Netlify `publish = dist` tidak berubah. */
const repoRoot = path.resolve(__dirname, '../..');
const appWebRoot = __dirname;

export default defineConfig({
  root: appWebRoot,
  publicDir: 'public',
  build: {
    outDir: path.join(repoRoot, 'dist'),
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/pwa.svg', 'img/stickers/*.svg', 'audio/**/*.mp3'],
      workbox: {
        navigateFallbackDenylist: [/^\/api/, /^\/admin/],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              /^\/api\/profiles\/[^/]+\/dashboard$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'sw-api-profile-dashboard-v1',
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              /^\/api\/profiles\/[^/]+\/stickers$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'sw-api-profile-stickers-v1',
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: 'Nura & Al Fatih Belajar',
        short_name: 'Nual',
        description: 'Game edukatif literasi & matematika untuk anak.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'id',
        start_url: '/',
        icons: [
          {
            src: '/icons/pwa.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.join(appWebRoot, 'src'),
      '@mainceria/api-client': path.resolve(
        repoRoot,
        'packages/api-client/src/index.ts',
      ),
      '@mainceria/ui': path.resolve(repoRoot, 'packages/ui/src/index.ts'),
      '@mainceria/utils': path.resolve(repoRoot, 'packages/utils/src/index.ts'),
      '@mainceria/types': path.resolve(repoRoot, 'packages/types/src/index.ts'),
    },
  },
  server: {
    port: devVitePort,
    strictPort: Boolean(process.env.VITE_DEV_STRICT_PORT),
    host: process.env.VITE_DEV_HOST ?? undefined,
    proxy: {
      '/api': {
        target: devApiOrigin,
        changeOrigin: true,
      },
    },
  },
});
