import { expect, it, describe } from 'vitest';

import type { Feed } from '@/protocol/feed.ts';
import { onlyForTesting as pageAction } from './index.ts';

const { label } = pageAction;

describe('label', () => {
  describe('for empty feeds list', () => {
    it('returns placeholder text', () => {
      expect(label([], '')).toBe('Add to Feedly Plus (no feeds)');
    });
  });

  describe('for a single feed', () => {
    it('builds label containing title', () => {
      expect(label(feeds(1), '')).toBe('Add to Feedly: “Example feed 0”');
    });
  });

  describe('for a long feeds list', () => {
    it('builds label containing count', () => {
      expect(label(feeds(2), '')).toBe('Add to Feedly (2)');
      expect(label(feeds(10), '')).toBe('Add to Feedly (10)');
    });
  });
});

function feeds(count: number): Feed[] {
  return [...(Array(count) as undefined[])].map((_, i) => ({
    title: `Example feed ${String(i)}`,
    url: 'https://example.com',
  }));
}
