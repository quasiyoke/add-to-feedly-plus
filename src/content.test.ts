import assert from 'node:assert/strict';

import { beforeEach, describe, expect, it } from 'vitest';

import { onlyForTesting as content } from './content.ts';

const { feedLinks, feeds } = content;

describe('feedLinks', () => {
  beforeEach(clearDocumentHead);

  describe('on page without feeds', () => {
    it('returns empty list', () => {
      appendLink({
        type: 'application/json',
        href: 'https://blog.mozilla.org/en/wp-json/wp/v2/pages/63618',
      });
      expect(feedLinks()).toHaveLength(0);
    });
  });

  describe('on page with several RSS feeds', () => {
    it('grabs them', () => {
      appendLink({
        type: 'application/rss+xml',
        href: 'https://blog.mozilla.org/en/feed/',
      });
      appendLink({
        type: 'application/rss+xml',
        href: 'https://blog.mozilla.org/en/comments/feed/',
      });
      expect(feedLinks()).toHaveLength(2);
    });
  });

  describe('on page with `application/rdf+xml` feed', () => {
    it('grabs it', () => {
      appendLink({
        type: 'application/rdf+xml',
        href: 'https://example.com/feed/',
      });
      expect(feedLinks()).toHaveLength(1);
    });
  });

  describe('on page with Atom feed', () => {
    it('grabs it', () => {
      appendLink({
        type: 'application/atom+xml',
        href: 'https://blog.rust-lang.org/feed.xml',
      });
      expect(feedLinks()).toHaveLength(1);
    });
  });

  describe('on page with `application/xml` feed', () => {
    it('grabs it', () => {
      appendLink({
        type: 'application/xml',
        href: 'https://example.com/feed/',
      });
      expect(feedLinks()).toHaveLength(1);
    });
  });

  describe('on page with `text/xml` feed', () => {
    it('grabs it', () => {
      appendLink({
        type: 'text/xml',
        href: 'https://example.com/feed/',
      });
      expect(feedLinks()).toHaveLength(1);
    });
  });

  describe('on page with sitemap-like links', () => {
    describe('which have XML type', () => {
      it('filters them out', () => {
        appendLink({
          type: 'application/xml',
          href: 'https://www.bittorrent.com/sitemap-index.xml',
        });
        appendLink({
          type: 'application/xml',
          href: 'https://khalilstemmler.com/sitemap.xml',
        });
        // Mixed-case link type
        appendLink({
          type: 'application/XML',
          href: 'https://example.com/sitemap.xml',
        });
        // Mixed-case URL
        appendLink({
          type: 'application/xml',
          href: 'https://example.com/SiteMap.xml',
        });
        expect(feedLinks()).toHaveLength(0);
      });
    });

    describe('which have RSS type', () => {
      it('grabs them', () => {
        appendLink({
          type: 'application/rss+xml',
          href: 'https://example.com/sitemap.xml',
        });
        expect(feedLinks()).toHaveLength(1);
      });
    });
  });
});

describe('feeds', () => {
  beforeEach(clearDocumentHead);

  describe('for regular feeds', () => {
    it('extracts their properties', () => {
      const links = linkStubs([
        {
          type: 'application/atom+xml',
          href: 'https://blog.rust-lang.org/feed.xml',
          title: 'Rust Blog',
        },
        {
          type: 'application/rss+xml',
          href: 'https://blog.mozilla.org/en/feed/',
          title: 'The Mozilla Blog » Feed',
        },
      ]);
      expect(feeds(links)).toStrictEqual([
        {
          url: 'https://blog.rust-lang.org/feed.xml',
          title: 'Rust Blog',
        },
        {
          url: 'https://blog.mozilla.org/en/feed/',
          title: 'The Mozilla Blog » Feed',
        },
      ]);
    });
  });

  describe('for feed without title', () => {
    it('returns null', () => {
      const links = linkStubs([
        {
          type: 'application/atom+xml',
          href: 'https://example.com/feed.xml',
        },
      ]);
      expect(feeds(links)[0].title).toBeNull();
    });
  });

  describe('for relative feed reference', () => {
    it('builds absolute URL', () => {
      const links = linkStubs([
        {
          type: 'application/atom+xml',
          href: 'feed.xml',
        },
      ]);
      expect(feeds(links)[0].url).toBe('http://localhost:3000/feed.xml');
    });
  });
});

function clearDocumentHead() {
  const head = document.querySelector('head');
  assert(head);
  head.innerHTML = '';
}

function appendLink(attrs: Record<string, string>) {
  const head = document.querySelector('head');
  assert(head);
  head.appendChild(linkStub(attrs));
}

function linkStubs(attrs: Record<string, string>[]): HTMLLinkElement[] {
  return attrs.map(linkStub);
}

function linkStub(attrs: Record<string, string>): HTMLLinkElement {
  const el = document.createElement('link');
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}
