/**
 * This script will be executed on every browser page's load almost in the "usual" browser scripts' environment.
 */

/* eslint-env browser */

import { pageWasProcessed } from './values/message';

const getFeedLinks = (): NodeList<HTMLLinkElement> => (
  // Full MIME types list courtesy to Robert MacLean on Stack Overflow
  // http://stackoverflow.com/a/7001617/2449800
  // $FlowFixMe
  document.querySelectorAll(`
    link[type="application/rss+xml"]
    , link[type="application/rdf+xml"]
    , link[type="application/atom+xml"]
    , link[type="application/xml"]
    , link[type="text/xml"]
  `)
);

/**
 * Extracts feeds' info out of `link` DOM nodes.
 */
const createFeeds = feedLinks => Array
  .from(feedLinks)
  .map(feedLink => ({
    title: feedLink.getAttribute('title'),
    url: feedLink.href,
  }));

const getFeeds = () => createFeeds(getFeedLinks());

function getTitle() {
  const titleElement = document.querySelector('title');
  return titleElement ? titleElement.text : null;
}

const port = browser.runtime.connect();
port.postMessage(pageWasProcessed({
  feeds: getFeeds(),
  title: getTitle(),
}));
