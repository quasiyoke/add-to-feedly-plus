import { describe, expect, it } from 'vitest';

import { subscriptionUrl, type Feed } from './feed.ts';

describe('subscriptionUrl', () => {
  describe('for feed', () => {
    it('builds aggregator subscription URL', () => {
      expect(
        subscriptionUrl(feedStubWithUrl('https://blog.mozilla.org/en/feed/')),
      ).toBe(
        'https://feedly.com/i/subscription/feed/https://blog.mozilla.org/en/feed/',
      );
    });
  });
});

function feedStubWithUrl(url: string): Feed {
  return {
    url,
    title: null,
  };
}
