#!/usr/bin/env node

import { rm } from 'node:fs/promises';
import { exit } from 'node:process';

import { build as buildBundle } from 'vite';

const MODULES = ['src/background.ts', 'src/content.ts', 'src/popup.ts'];
const OUTPUT_DIR = 'dist';

buildExtension().catch((err: unknown) => {
  console.error(err);
  exit(1);
});

async function buildExtension() {
  // Clear output directory
  await rm(OUTPUT_DIR, { recursive: true }).catch((err: unknown) => {
    // Ignore the error if it is about the directory not existing
    if (!(err instanceof Error && 'code' in err && err.code === 'ENOENT')) {
      throw err;
    }
  });
  // As of Firefox v. 141.0, it doesn't support "module" type content scripts, neither in the documentation
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts
  // nor in practice. Hence, using ES modules and other methods to require chunks into content scripts is challenging.
  // The simplest approach remains building several bundles without shared chunks. This requires running a separate Vite
  // build process for each bundle.
  const bundles = MODULES.map((input) => {
    return buildBundle({
      configFile: false,
      build: {
        rollupOptions: {
          input,
          output: {
            entryFileNames: '[name].js',
          },
        },
        outDir: OUTPUT_DIR,
        emptyOutDir: false,
        target: 'esnext',
      },
      resolve: {
        alias: {
          '@': './src/',
        },
      },
      clearScreen: false,
    });
  });
  await Promise.all(bundles);
}
