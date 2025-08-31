import browserPolyfill, { type Browser } from 'webextension-polyfill';
export type { Browser, PageAction, Runtime, Tabs } from 'webextension-polyfill';

import { assertExhaustive } from '@/util.ts';

let browser: typeof browserPolyfill;
// The `webextension-polyfill` package is only relevant for Chrome. Use a statically inlined const
// to tree-shake-off the `webextension-polyfill`.
switch (EXTENSION_PLATFORM) {
  case 'web-ext':
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    browser = (globalThis as any).browser as Browser;
    break;
  case 'chrome':
    browser = browserPolyfill;
    break;
  default:
    assertExhaustive(EXTENSION_PLATFORM);
}
export default browser;
