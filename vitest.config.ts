import path from 'node:path';
import { defineConfig } from 'vitest/config';

const repoRoot = path.resolve(__dirname);

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(repoRoot, 'apps/web/src'),
      '@mainceria/api-client': path.join(
        repoRoot,
        'packages/api-client/src/index.ts',
      ),
      '@mainceria/types': path.join(repoRoot, 'packages/types/src/index.ts'),
      '@mainceria/ui': path.join(repoRoot, 'packages/ui/src/index.ts'),
      '@mainceria/utils': path.join(repoRoot, 'packages/utils/src/index.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: [
      'apps/web/src/**/*.test.ts',
      'apps/api/src/**/*.test.ts',
      'packages/utils/src/**/*.test.ts',
      'packages/api-client/src/**/*.test.ts',
    ],
    environmentMatchGlobs: [
      ['apps/api/src/**', 'node'],
      ['apps/web/src/**', 'happy-dom'],
      ['packages/utils/src/**', 'happy-dom'],
      ['packages/api-client/src/**', 'happy-dom'],
    ],
  },
});
