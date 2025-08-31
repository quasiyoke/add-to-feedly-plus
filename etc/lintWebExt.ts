#!/usr/bin/env node

import { exit } from 'node:process';

import {
  createInstance as createLinter,
  type Options as LinterOptions,
} from 'addons-linter';

const SOURCE_DIR = 'dist/web-ext/';

main().catch((err: unknown) => {
  console.error(err);
  exit(1);
});

async function main() {
  const config: LinterOptions['config'] = {
    // This mimics the first command line argument from `yargs`, which should be the directory to the extension.
    _: [SOURCE_DIR],
    minManifestVersion: 3,
    maxManifestVersion: 3,
    // Starting with Firefox v. 121, it allows specifying a background script for both the background page
    // and as a service worker, and even suggests doing so in the documentation:
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background#browser_support
    // We will also define the background script using both methods, so that future versions of Firefox can run it
    // as a service worker.
    enableBackgroundServiceWorker: true,
    warningsAsErrors: true,
    logLevel: 'info',
    stack: true,
  };
  // Unfortunately, the option below has not yet been included in the typings and the `web-ext lint` CLI
  Object.assign(config, {
    // https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
    // https://github.com/mozilla/addons-linter/blob/b8a73e44e3dbad03369502c8d2ae9606adab6cd7/src/parsers/manifestjson.js#L541-L554
    enableDataCollectionPermissions: true,
  });
  await createLinter({ config }).run();
}
