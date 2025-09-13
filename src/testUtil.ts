import assert from 'node:assert/strict';

import { beforeAll, afterAll, beforeEach } from 'vitest';

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
