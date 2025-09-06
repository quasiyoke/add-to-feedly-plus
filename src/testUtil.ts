import assert from 'node:assert/strict';

import { beforeAll, afterAll, beforeEach, describe } from 'vitest';

// We use the `chrome` platform in tests so that `webextension-polyfill` is being activated
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(globalThis as any).EXTENSION_PLATFORM = 'chrome';
beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (globalThis as any).EXTENSION_PLATFORM = 'chrome';
});

// Create a stub for the `chrome` object to make the `webextension-polyfill` work in tests
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(globalThis as any).chrome = { runtime: { id: 'runtime-test-id' } };

const browser = await import('webextension-polyfill');
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(browser.runtime as any).sendMessage = () => {};

export function suppressConsoleError(filter: string) {
  let consoleError: undefined | ((message: string, ...rest: unknown[]) => void);
  beforeAll(() => {
    consoleError = console.error;
    console.error = (message: string, ...rest: unknown[]) => {
      if (!message.includes(filter)) {
        assert(consoleError);
        consoleError(message, ...rest);
      }
    };
  });
  afterAll(() => {
    assert(consoleError);
    console.error = consoleError;
  });
}

export function onEveryPlatform(test: () => void) {
  inWebExtension(test);
  inChrome(test);
}

export function inWebExtension(test: () => void) {
  describe('in WebExtension', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (globalThis as any).EXTENSION_PLATFORM = 'web-ext';
    });
    test();
  });
}

export function inChrome(test: () => void) {
  describe('in Chrome', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (globalThis as any).EXTENSION_PLATFORM = 'chrome';
    });
    test();
  });
}
