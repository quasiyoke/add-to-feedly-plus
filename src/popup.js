/* eslint-env browser */

import {
  popupWasOpened,
  sendMessage,
} from './values/message';
import { createSubscriptionUrl } from './util';

function renderFeed(feed) {
  const menuItem = document.createElement('li');
  menuItem.setAttribute('class', 'menu-item');

  const menu = document.querySelector('.menu');

  if (!menu) {
    return;
  }

  menu.appendChild(menuItem);
  const feedEl = document.createElement('a');
  feedEl.setAttribute('href', createSubscriptionUrl(feed.url));
  feedEl.setAttribute('target', '_blank');
  feedEl.setAttribute('rel', 'noopener');
  feedEl.setAttribute('class', 'feed');
  menuItem.appendChild(feedEl);
  const feedWrap = document.createElement('div');
  feedEl.appendChild(feedWrap);
  feedWrap.appendChild(document.createTextNode(feed.title || feed.url));
  feedWrap.setAttribute('class', 'feed-wrap');
}

function onSetPopupContent({ payload }) {
  // $FlowFixMe
  const { feeds } = payload;
  const menu = document.querySelector('.menu');

  if (!menu) {
    return;
  }

  menu.textContent = '';
  feeds.forEach(renderFeed);
}

sendMessage(popupWasOpened())
  .then(onSetPopupContent);
