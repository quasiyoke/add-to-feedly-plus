import { buildBus, type BusWithSource } from '@/bus.ts';
import { subscriptionUrl, type Feed } from '@/protocol/feed.ts';
import type { Page } from '@/protocol/page.ts';

export type Bus = BusWithSource<
  'popup',
  {
    retrieveContext: {
      request: null;
      response: Page | undefined;
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
  page.feeds.forEach(renderFeed);
}

function renderFeed(feed: Feed) {
  const menuItem = document.createElement('li');
  menuItem.setAttribute('class', 'menu-item');

  const menu = document.querySelector('.menu');

  if (!menu) {
    return;
  }

  menu.appendChild(menuItem);
  const feedEl = document.createElement('a');
  feedEl.setAttribute('href', subscriptionUrl(feed));
  feedEl.setAttribute('target', '_blank');
  feedEl.setAttribute('rel', 'noopener');
  feedEl.setAttribute('class', 'feed');
  menuItem.appendChild(feedEl);
  const feedWrap = document.createElement('div');
  feedEl.appendChild(feedWrap);
  feedWrap.appendChild(document.createTextNode(feed.title || feed.url));
  feedWrap.setAttribute('class', 'feed-wrap');
}
