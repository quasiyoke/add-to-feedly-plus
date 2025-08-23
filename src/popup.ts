import { popupWasOpened, sendMessage, type Page } from '@/bus.ts';
import { subscriptionUrl, type Feed } from '@/protocol/feed.ts';

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

function onSetPopupContent({ payload }: any) {
  const { feeds } = payload as Page;
  const menu = document.querySelector('.menu');

  if (!menu) {
    return;
  }

  menu.textContent = '';
  feeds.forEach(renderFeed);
}

sendMessage(popupWasOpened()).then(onSetPopupContent, (err: unknown) => {
  console.error('Failed to request popup content', err);
});
