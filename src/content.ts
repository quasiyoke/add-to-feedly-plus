/**
 * This script will be executed on every browser page's load almost in the "usual" browser scripts' environment.
 */

import browser from 'webextension-polyfill';

import { pageWasProcessed } from '@/bus.ts';

function getFeedLinks(): NodeListOf<HTMLLinkElement> {
  // Full MIME types list courtesy to Robert MacLean on Stack Overflow
  // http://stackoverflow.com/a/7001617/2449800
  return document.querySelectorAll(`
    link[type="application/rss+xml"]
    , link[type="application/rdf+xml"]
    , link[type="application/atom+xml"]
    , link[type="application/xml"]
    , link[type="text/xml"]
  `);
}

/**
 * Extracts feeds' info out of `link` DOM nodes.
 */
function createFeeds(feedLinks: NodeListOf<HTMLLinkElement>) {
  return Array.from(feedLinks).map((feedLink) => ({
    title: feedLink.getAttribute('title'),
    url: feedLink.href,
  }));
}

function getTitle() {
  const titleElement = document.querySelector('title');
  return titleElement ? titleElement.text : null;
}

const port = browser.runtime.connect();
port.postMessage(
  pageWasProcessed({
    feeds: createFeeds(getFeedLinks()),
    title: getTitle(),
  }),
);
