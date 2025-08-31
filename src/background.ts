/**
 * - In Firefox, this script runs in a persistent background page and stays loaded.
 * - In Chrome, this runs as a service worker that is loaded on demand and could be unloaded when idle,
 *   so globals are lost between activations.
 */

import { dispatchMessages } from '@/bus.ts';
import * as cache from '@/cache.ts';
import type { Bus as ContentBus } from '@/content.ts';
import * as pageAction from '@/pageAction/index.ts';
import type { Bus as PopupBus } from '@/popup.ts';
import { subscriptionUrl, type Feed } from '@/protocol/feed.ts';
import type { Page } from '@/protocol/page.ts';
import { activatedTabId, browserTabId, type TabId } from '@/protocol/tab.ts';
import browser, { type Tabs } from '@/webExtension.ts';

dispatch();

function dispatch() {
  browser.tabs.onActivated.addListener(onTabActivated);
  browser.tabs.onAttached.addListener(onTabAttached);
  browser.tabs.onRemoved.addListener(onTabRemoved);
  dispatchMessages<ContentBus & PopupBus>({
    pageWasShown: onPageWasShown,
    retrieveContext: retrievePopupContext,
  });
  pageAction.dispatchClick(onButtonClicked);
}

/** Handler for notification: "content script notifies about feeds on the page". */
function onPageWasShown(page: Page, tabId: TabId) {
  cache.storeTab(tabId, { page }).catch((err: unknown) => {
    console.error('Failed to store tab on content script ready', err);
  });
  pageAction.render(tabId, page).catch((err: unknown) => {
    console.error('Failed to render `pageAction`', err);
  });
}

async function retrievePopupContext(): Promise<Page | undefined> {
  const tab = await activeTab();
  return tab?.page;
}

function openFeed(feed: Feed) {
  browser.tabs
    .create({
      url: subscriptionUrl(feed),
    })
    .catch((err: unknown) => {
      console.error('Failed to open feed', err);
    });
}

/**
 * Handles event: "`pageAction` button was clicked".
 * The handler will be fired only if `pageAction`'s popup wasn't specified.
 */
function onButtonClicked(tab: Tabs.Tab) {
  const id = browserTabId(tab);
  if (id == null) {
    console.error(
      'Tab ID must be present since we are not querying foreign tab using the `sessions` API',
    );
    return;
  }
  cache.tab(id).then(
    (tab) => {
      const feeds = tab?.page?.feeds;
      if (feeds != null && feeds.length > 0) {
        openFeed(feeds[0]);
      }
    },
    (err: unknown) => {
      console.error('Failed to get active tab', err);
    },
  );
}

async function refreshTab(tabId: TabId) {
  const tab = await cache.tab(tabId);
  await pageAction.render(tabId, tab?.page);
}

function onTabActivated(activation: Tabs.OnActivatedActiveInfoType) {
  refreshTab(activatedTabId(activation)).catch((err: unknown) => {
    console.error('Failed to refresh tab', err);
  });
}

/**
 * Handles event: "Tab was moved to another window and attached to it".
 * Popup's contents should be updated on that otherwise it leads to inconsistent popup's content.
 */
function onTabAttached(tabId: TabId) {
  pageAction
    .togglePopup(tabId, false)
    .then(async () => {
      await refreshTab(tabId);
    })
    .catch((err: unknown) => {
      console.error('Failed to handle attached tab', err);
    });
}

function onTabRemoved(tabId: TabId) {
  cache.removeTab(tabId).catch((err: unknown) => {
    console.error('Failed to ensure tab was flushed', err);
  });
}

async function activeTab() {
  const activeTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTabs.length < 1) {
    return;
  }
  const id = browserTabId(activeTabs[0]);
  if (id == null) {
    console.error(
      'Tab ID must be present since we are not querying foreign tab using the `sessions` API',
    );
    return;
  }
  return await cache.tab(id);
}
