/* eslint-env browser */

import {
  popupWasOpened,
  sendMessage,
} from './messages';
import { createSubscriptionUrl } from './util';

function renderFeed(feed) {
  const menuItem = document.createElement('li');
  menuItem.setAttribute('class', 'menu-item');

  const menu = document.querySelector('.menu');
  menu.appendChild(menuItem);
  const button = document.createElement('a');
  button.setAttribute('href', createSubscriptionUrl(feed.url));
  button.setAttribute('target', '_blank');
  button.setAttribute('rel', 'noopener');
  button.setAttribute('title', feed.title);
  button.setAttribute('class', 'button');
  menuItem.appendChild(button);
  const buttonWrap = document.createElement('div');
  button.appendChild(buttonWrap);
  buttonWrap.appendChild(document.createTextNode(feed.title));
  buttonWrap.setAttribute('class', 'button-wrap');
}

function addTitle(text) {
  const title = document.createElement('h1');
  title.appendChild(document.createTextNode(text));

  const menu = document.querySelector('.menu');
  menu.parentNode.insertBefore(title, menu);
}

const createCommonFeedsTitle = (feeds) => {
  /**
   * The idea behind common title is to get common header for feeds with titles starting identically.
   * Imagine the following feeds list:
   *
   * - The Time » New Articles
   * - The Time » Editor's blog
   * - The Time » Comments
   *
   * In such case our desire is to get common title 'The Time » '.
   */
  if (feeds.length <= 1) {
    return '';
  }
  const firstTitle = feeds[0].title;
  let length;
  outer:
  for (length = 0; length < firstTitle.length; length += 1) {
    const c = firstTitle.charAt(length);
    for (let i = 1; i < feeds.length; i += 1) {
      if (feeds[i].title.charAt(length) !== c) {
        break outer;
      }
    }
  }
  const commonTitle = firstTitle.substr(0, length);
  if (isCommonTitleAdsorbing(commonTitle, feeds)) {
    const match = /^(.+»)[^»]+$/.exec(commonTitle);
    /*
     * For such feeds list:
     *
     * - John Doe's website » Blog
     * - John Doe's website » Blog comments
     *
     * ...common title will be: 'John Doe's website »'
     */
    if (match) {
      commonTitle = match[1];
      /*
       * For such feeds list with common title delimited with em dash:
       *
       * - John Doe's website — Blog
       * - John Doe's website — Blog comments
       *
       * ...common title will be: 'John Doe's website —'
       */
    } else if (match = /^(.+\u2014)[^\u2014]+$/.exec(commonTitle)) {
      commonTitle = match[1];
      /*
       * For such feeds list with common title delimited with en dash:
       *
       * - John Doe's website – Blog
       * - John Doe's website – Blog comments
       *
       * ...common title will be: 'John Doe's website –'
       */
    } else if (match = /^(.+\u2013)[^\u2013]+$/.exec(commonTitle)) {
      commonTitle = match[1];
      /*
       * For such feeds list with common title delimited with figure dash:
       *
       * - John Doe's website ‒ Blog
       * - John Doe's website ‒ Blog comments
       *
       * ...common title will be: 'John Doe's website ‒'
       */
    } else if (match = /^(.+\u2012)[^\u2012]+$/.exec(commonTitle)) {
      commonTitle = match[1];
      /*
       * For such feeds list with common title delimited with hyphen-minus:
       *
       * - John Doe's website - Blog
       * - John Doe's website - Blog comments
       *
       * ...common title will be: 'John Doe's website -'
       */
    } else if (match = /^(.+\-)[^\-]+$/.exec(commonTitle)) {
      commonTitle = match[1];
      /*
       * For such feeds list:
       *
       * - John Doe's blog
       * - John Doe's blog comments
       *
       * ...common title will be: 'John Doe's'
       */
    } else if (match = /^(.+)\s[^\s]+\s*$/.exec(commonTitle)) {
      commonTitle = match[1];
    } else {
      commonTitle = '';
    }
  }
  return commonTitle;
};

class Feed {
  constructor(options) {
    this.url = options.url;
    this.title = options.title || options.url;
  }

  ensureTitle(commonTitleLength) {
    /**
    * Ensures the title is trimmed correctly.
    */
    this.title = this.title.substr(commonTitleLength);
  }
}

const isCommonTitleAdsorbing = (commonTitle, feeds) => {
  /**
  * Example feeds list:
  *
  * - John Doe's blog
  * - John Doe's blog comments
  *
  * In such case straightforward common title will adsorb first feed's title.
  *
  * @return bool Is common title adsorbing any feed's title from feeds list.
  */
  for (let i = 0; i < feeds.length; i += 1) {
    if (commonTitle.length >= feeds[i].title.length) {
      return true;
    }
  }
  return false;
}

function onSetPopupContent({ payload: { feeds, title: pageTitle } }) {
  /* Remove title if present. */
  const titles = document.getElementsByTagName('h1');
  if (titles.length) {
    titles[0].parentNode.removeChild(titles[0]);
  }

  const menu = document.querySelector('.menu');

  menu.textContent = '';
  let commonTitle = createCommonFeedsTitle(feeds);
  let commonTitleLength;
  if (commonTitle) {
    commonTitleLength = commonTitle.length;
    // Trim trailing delimiter char.
    // Quotation mark, hyphen-minus, figure dash, en dash, em dash, respectively.
    const match = /^(.+)[»-\u2012\u2013\u2014]\s*/.exec(commonTitle);
    if (match) {
      commonTitle = match[1];
    }
    addTitle(commonTitle);
  } else {
    commonTitleLength = 0;
  }

  for (let i = 0; i < feeds.length; i += 1) {
    const feed = new Feed(feeds[i]);
    feed.ensureTitle(commonTitleLength);
    renderFeed(feed);
  }
}

sendMessage(popupWasOpened())
  .then(onSetPopupContent);
