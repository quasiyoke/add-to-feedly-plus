import { vi } from 'vitest';

// Create a stub for the `chrome` object to make the `webextension-polyfill` work in tests
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(globalThis as any).chrome = { runtime: { id: 'runtime-test-id' } };

const browser = await import('webextension-polyfill');
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(browser.runtime as any).connect = vi.fn(() => ({
  postMessage: vi.fn(),
}));
