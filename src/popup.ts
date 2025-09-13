import { buildBus, type BusWithSource } from '@/bus.ts';
import { label as feedLabel, type Feed } from '@/protocol/feed.ts';
import type { Page } from '@/protocol/page.ts';

export type Bus = BusWithSource<
  'popup',
  {
    retrieveContext: {
      request: null;
      response: Page | undefined;
    };
    openFeed: {
      notification: Feed;
    };
  }
>;

const bus = buildBus<Bus>().withSource('popup');
bus
  .request('retrieveContext', null)
  .then(onContextRetrieved, (err: unknown) => {
    console.error('Failed request for popup context', err);
  });

function onContextRetrieved(page: Page | undefined) {
  const menu = document.querySelector('.menu');
  if (menu == null) {
    return;
  }
  menu.textContent = '';
  if (page == null) {
    return;
  }
  page.feeds.forEach((feed) => {
    appendMenuItem(feed, menu);
  });
}

function appendMenuItem(feed: Feed, menu: Element) {
  const feedEl = renderFeed(feed);
  const menuItem = document.createElement('li');
  menuItem.setAttribute('class', 'menu-item');
  menuItem.appendChild(feedEl);
  menu.appendChild(menuItem);
}

function renderFeed(feed: Feed): Element {
  const feedWrap = document.createElement('div');
  feedWrap.appendChild(document.createTextNode(feedLabel(feed, feed.url)));
  feedWrap.setAttribute('class', 'feed-wrap');
  const feedEl = document.createElement('a');
  feedEl.setAttribute('class', 'feed');
  feedEl.setAttribute('href', feed.url);
  feedEl.addEventListener('click', (event) => {
    onClickFeed(feed, event);
  });
  feedEl.appendChild(feedWrap);
  return feedEl;
}

/**
 * We'd like link clicks within the popup to open a new tab with subscription. This is how `target=_blank` links
 * function in Firefox's `pageAction` popup and Chrome's `action` popup. However, in other situations, behavior differs:
 *
 * - In Firefox for Android, the popup opens in an overlay, which itself behaves like a tab, and when a link is clicked,
 *   it opens within the same overlay with limited functionality (for example, the "Open in Feedly app" menu item
 *   is unavailable).
 * - In Firefox's `action` popup, such links do not automatically close the popup. Closing the popup in extension code
 *   when a link is clicked requires workarounds, as without them, links open in a new window.
 *
 * For this reason, we do not use built-in implementations for link navigation from the popup.
 */
function onClickFeed(feed: Feed, event: PointerEvent) {
  event.preventDefault();
  bus.notify('openFeed', feed);
  window.close();
}
