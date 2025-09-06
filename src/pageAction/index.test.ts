import { expect, it, describe } from 'vitest';

import type { Feed } from '@/protocol/feed.ts';
import { onlyForTesting as pageAction } from './index.ts';

const { badge, actionLabel, pageActionLabel } = pageAction;

describe('badge', () => {
  describe('for empty feeds list', () => {
    it('returns null', () => {
      expect(badge([])).toBeNull();
    });
  });

  describe('for a single-digit feeds count', () => {
    it('produces count', () => {
      expect(badge(feeds(1))).toBe('1');
      expect(badge(feeds(9))).toBe('9');
    });
  });

  describe('for a long feeds list', () => {
    it('nominally indicates "many feeds"', () => {
      expect(badge(feeds(10))).toBe('∞');
      expect(badge(feeds(11))).toBe('∞');
    });
  });
});

describe('pageActionLabel', () => {
  describe('for empty feeds list', () => {
    it('returns placeholder text', () => {
      expect(pageActionLabel([], '')).toBe('Add to Feedly Plus (no feeds)');
    });
  });

  describe('for a single feed', () => {
    it('builds label containing title', () => {
      expect(pageActionLabel(feeds(1), '')).toBe(
        'Add to Feedly: “Example feed 0”',
      );
    });
  });

  describe('for a long feeds list', () => {
    it('builds label containing count', () => {
      expect(pageActionLabel(feeds(2), '')).toBe('Add to Feedly (2)');
      expect(pageActionLabel(feeds(10), '')).toBe('Add to Feedly (10)');
    });
  });
});

describe('actionLabel', () => {
  describe('for empty feeds list', () => {
    it('returns placeholder text', () => {
      expect(actionLabel([], '')).toBe('Add to Feedly Plus (no feeds)');
    });
  });

  describe('for a single feed', () => {
    it('builds label containing title', () => {
      expect(actionLabel(feeds(1), '')).toBe('Add to Feedly: “Example feed 0”');
    });
  });

  describe('for a feeds list of length 2...9 inclusively', () => {
    it('returns extension name', () => {
      expect(actionLabel(feeds(2), '')).toBe('Add to Feedly Plus');
      expect(actionLabel(feeds(9), '')).toBe('Add to Feedly Plus');
    });
  });

  describe('for a feeds list of length starting from 10', () => {
    it('builds label containing count', () => {
      expect(actionLabel(feeds(10), '')).toBe('Add to Feedly (10)');
      expect(actionLabel(feeds(11), '')).toBe('Add to Feedly (11)');
    });
  });
});

function feeds(count: number): Feed[] {
  return [...(Array(count) as undefined[])].map((_, i) => ({
    title: `Example feed ${String(i)}`,
    url: 'https://example.com',
  }));
}
