import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const devApiOrigin = process.env.VITE_DEV_API_ORIGIN ?? 'http://localhost:3000';
const devVitePort = Number(process.env.VITE_DEV_PORT) || 5173;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/pwa.svg', 'img/stickers/*.svg'],
      workbox: {
        /** Jangan fallback SPA ke `/api/*`; hindari SW meng-cache respons API. */
        navigateFallbackDenylist: [/^\/api/, /^\/admin/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: 'Bimo Belajar',
        short_name: 'Bimo',
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
      '@': path.resolve(__dirname, './src'),
      '@server': path.resolve(__dirname, './server'),
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
