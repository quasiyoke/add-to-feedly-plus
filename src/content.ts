/**
 * This script will be executed on every browser page's load almost in the "usual" browser scripts' environment.
 */

import { buildBus, type BusWithSource } from '@/bus.ts';
import type { Page } from '@/protocol/page.ts';

export type Bus = BusWithSource<
  'contentScript',
  {
    pageWasShown: { notification: Page };
  }
>;

buildBus<Bus>()
  .withSource('contentScript')
  .notify('pageWasShown', {
    feeds: feeds(feedLinks()),
    title: document.title,
  });

function feedLinks(): HTMLLinkElement[] {
  // Several filters for the `link` `type` attribute are too permissive:
  // - `application/rdf+xml` is technically a correct MIME type for an RSS feed, as RSS is an RDF format.
  // - `application/xml`
  // - `text/xml`
  // We'll continue to allow them until they start causing problems, as they may help spotting some rare feeds.
  return Array.from<HTMLLinkElement>(
    document.querySelectorAll(`
    link[type="application/rss+xml"]
    , link[type="application/rdf+xml"]
    , link[type="application/atom+xml"]
    , link[type="application/xml"]
    , link[type="text/xml"]
  `),
  ).filter((link) => {
    const linkType = link.getAttribute('type')?.toLowerCase();
    if (linkType !== 'application/xml' && linkType !== 'text/xml') {
      return true;
    }
    const path = new URL(link.href).pathname.toLowerCase();
    return !path.startsWith('/sitemap');
  });
}

/**
 * Extracts feeds' info out of `link` DOM nodes.
 */
function feeds(feedLinks: HTMLLinkElement[]) {
  return feedLinks.map((feedLink) => ({
    title: feedLink.getAttribute('title'),
    url: feedLink.href,
  }));
}

export const onlyForTesting = { feeds, feedLinks };
