import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: 'src/testUtil.ts',
  },
  define: {
    // We use the `chrome` platform in tests so that `webextension-polyfill` is not excluded after static inlining
    EXTENSION_PLATFORM: JSON.stringify('chrome'),
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
});
