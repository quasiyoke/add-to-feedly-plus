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
import { browserTabId, type TabId } from '@/protocol/tab.ts';
import browser, { type Tabs } from '@/webExtension.ts';

dispatch();

function dispatch() {
  dispatchTabs();
  dispatchMessages<ContentBus & PopupBus>({
    pageWasShown: onPageWasShown,
    retrieveContext: retrievePopupContext,
    openFeed,
  });
  pageAction.dispatchClick(onPageActionClicked);
  pageAction.dispatchCommand(onPageActionCommand);
}

function dispatchTabs() {
  browser.tabs.onAttached.addListener(onTabAttached);
  browser.tabs.onRemoved.addListener(onTabRemoved);
  // The WebExtension API allows specifying a filter for tab updates we subscribe to:
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated#filter
  // In our case, we are only interested in updates regarding the `status` attribute of the tab:
  // `filter = { properties: ['status'] }` — can be specified as the second argument during subscription.
  //
  // - Desktop Firefox supports the `filter`.
  // - Firefox for Android – attempt to subscribe with a `filter` results in the error "Incorrect argument types
  //   for tabs.onUpdated".
  // - Chrome does not support the `filter`:
  //   https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onUpdated
  //   — and attempting to specify `filter` as an extraneous argument (since it's usually harmless and simply ignored
  //   — the `filter` could start working in future Chrome versions) leads to an error: "TypeError: This event
  //   does not support filters".
  //
  // For this reason (mainly due to Firefox for Android), we are subscribing without using a filter in all browsers.
  browser.tabs.onUpdated.addListener(onTabUpdated);
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
function onPageActionClicked(tab: Tabs.Tab) {
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

/**
 * Handles event: "`pageAction` command (keyboard shortcut) was ordered". Should function as a click on the `pageAction`
 * button.
 *
 * The handler is only applicable to Chrome. In Firefox, we use the built-in implementation `_execute_page_action`.
 */
function onPageActionCommand(tab: Tabs.Tab | undefined) {
  if (tab == null) {
    return; // If we don't know which tab requested the action, we don't even know which feeds we're talking about.
  }
  const id = browserTabId(tab);
  if (id == null) {
    console.error(
      'Tab ID must be present since we are not querying foreign tab using the `sessions` API',
    );
    return;
  }
  cache
    .tab(id)
    .then(async (tab) => {
      const feeds = tab?.page?.feeds;
      if (feeds == null) {
        return;
      }
      if (feeds.length === 1) {
        openFeed(feeds[0]);
      } else if (feeds.length > 1) {
        await pageAction.openPopup().catch((err: unknown) => {
          // https://source.chromium.org/chromium/chromium/src/+/c05ced707f290eff36b86db1fd657d55b688aa46:chrome/browser/extensions/api/extension_action/extension_action_api.cc;l=670
          if (
            err instanceof Error &&
            err.message === 'Could not find an active browser window.'
          ) {
            console.debug(
              "Cannot open the popup. It has already been opened, or it's unclear which browser window to open it in.",
            );
            return;
          }
          throw err;
        });
      }
    })
    .catch((err: unknown) => {
      console.error('Failed to handle `pageAction` command', err);
    });
}

function onTabUpdated(
  tabId: TabId,
  change: Tabs.OnUpdatedChangeInfoType,
  tab: Tabs.Tab,
) {
  // When a user navigates to a link, the typical sequence of events is as follows:
  // 1. Tab status = "loading" → we clear the cache of feeds available in the tab.
  // 2. The page loads, the content script executes, we obtain the current list of feeds from the content script →
  //    we add the feeds related to the tab to the cache.
  // 3. Tab status = "complete" → we do nothing.
  if (change.status == null || change.status === 'complete') {
    return;
  }
  cache.removeTab(tabId).catch((err: unknown) => {
    console.error('Failed removing tab from the cache', tab, change, err);
  });
  // In Firefox for Android, the popup appears in an overlay that functions as a tab, and for which typical tab events,
  // including `onUpdated`, also occur. Attempting to toggle a `pageAction` for such a "tab" results
  // in an "Invalid tab ID" error. Fortunately, `pageAction` was never enabled for popups and other utility pages
  // (without a URL or with a URL starting with "moz-extension://"), so there's no need to disable it.
  //
  // In Firefox, accessing a tab's URL requires a matching host permission (which we requested).
  // In Chrome, accessing a tab's URL requires a "tabs" permission (which we generally don't need), so we always execute
  // `pageAction.render()` in Chrome.
  if (
    EXTENSION_PLATFORM === 'chrome' ||
    !(tab.url == null || tab.url.startsWith('moz-extension://'))
  ) {
    pageAction.render(tabId, undefined).catch((err: unknown) => {
      console.error('Failed updated tab handling', change, err);
    });
  }
}

/**
 * Handles event: "Tab was moved to another window and attached to it".
 * Popup's contents should be updated on that otherwise it leads to inconsistent popup's content.
 */
function onTabAttached(tabId: TabId) {
  pageAction
    .togglePopup(tabId, false)
    .then(async () => {
      const tab = await cache.tab(tabId);
      await pageAction.render(tabId, tab?.page);
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
