import { describe, expect, it } from 'vitest';

import { subscriptionUrl, type Feed } from './feed.ts';

describe('subscriptionUrl', () => {
  describe('for feed', () => {
    it('builds aggregator subscription URL', () => {
      const feed = feedStubWithUrl('https://blog.mozilla.org/en/feed/');
      expect(subscriptionUrl(feed)).toBe(
        'https://feedly.com/i/subscription/feed%2Fhttps%3A%2F%2Fblog.mozilla.org%2Fen%2Ffeed%2F',
      );
    });
  });

  describe('for feed with URL having querystring', () => {
    it('encodes querystring correctly', () => {
      const feed = feedStubWithUrl(
        'https://wiki.mozilla.org/index.php?title=Special:RecentChanges&feed=atom',
      );
      expect(subscriptionUrl(feed)).toBe(
        'https://feedly.com/i/subscription/feed%2Fhttps%3A%2F%2Fwiki.mozilla.org%2Findex.php%3Ftitle%3DSpecial%3ARecentChanges%26feed%3Datom',
      );
      const feed2 = feedStubWithUrl(
        'https://www.youtube.com/feeds/videos.xml?channel_id=UC_iD0xppBwwsrM9DegC5cQQ',
      );
      expect(subscriptionUrl(feed2)).toBe(
        'https://feedly.com/i/subscription/feed%2Fhttps%3A%2F%2Fwww.youtube.com%2Ffeeds%2Fvideos.xml%3Fchannel_id%3DUC_iD0xppBwwsrM9DegC5cQQ',
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
