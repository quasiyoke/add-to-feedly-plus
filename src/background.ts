/**
 * This file is executed once when the extension was loaded.
 */

import browser, { type PageAction, type Tabs } from 'webextension-polyfill';

import { dispatchMessages } from '@/bus.ts';
import type { Bus as ContentBus } from '@/content.ts';
import type { Bus as PopupBus } from '@/popup.ts';
import { subscriptionUrl, type Feed } from '@/protocol/feed.ts';
import type { Page } from '@/protocol/page.ts';
import {
  activatedTabId,
  browserTabId,
  type Tab,
  type TabId,
} from '@/protocol/tab.ts';

const BUTTON_LABEL_DEFAULT = 'Add to Feedly';

const tabs = new Map<TabId, Tab>();

dispatch();

function dispatch() {
  browser.tabs.onActivated.addListener(onTabActivated);
  browser.tabs.onAttached.addListener(onTabAttached);
  browser.tabs.onRemoved.addListener(onTabRemoved);
  dispatchMessages<ContentBus & PopupBus>({
    pageWasShown: onPageWasShown,
    retrieveContext: retrievePopupContext,
  });
}

/** Handler for notification: "content script notifies about feeds on the page". */
function onPageWasShown(page: Page, tabId: TabId) {
  tabs.set(tabId, { pageInfo: page });
  applyPageInfo(tabId, page);
}

async function retrievePopupContext(): Promise<Page | undefined> {
  const tab = await getActiveTabInfo();
  return tab?.pageInfo;
}

function enableButton(tabId: TabId) {
  browser.pageAction.show(tabId).catch((err: unknown) => {
    console.error('Failed to enable page action', err);
  });
}

function disableButton(tabId: TabId) {
  browser.pageAction.hide(tabId).catch((err: unknown) => {
    console.error('Failed to disable page action', err);
  });
}

function setButtonLabel(tabId: TabId, label: string) {
  browser.pageAction.setTitle({
    tabId,
    title: label,
  });
}

function createFeedLabel({ title }: Feed, pageTitle: string) {
  return title || pageTitle || '(no title)';
}

function createButtonLabel(feeds: Feed[], pageTitle: string) {
  if (feeds.length === 1) {
    return `Add to Feedly: “${createFeedLabel(feeds[0], pageTitle)}”`;
  }

  return `${BUTTON_LABEL_DEFAULT} (${String(feeds.length)})`;
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
function onButtonClicked({ feeds }: Page, _tab: Tabs.Tab) {
  if (feeds.length > 0) {
    openFeed(feeds[0]);
  }
}

let buttonEventsHandler:
  | undefined
  | ((tab: browser.Tabs.Tab, info: PageAction.OnClickData | undefined) => void);

function dispatchButtonEvents(feedsInfo: Page) {
  if (buttonEventsHandler) {
    browser.pageAction.onClicked.removeListener(buttonEventsHandler);
  }

  buttonEventsHandler = onButtonClicked.bind(null, feedsInfo) as (
    tab: browser.Tabs.Tab,
    info: PageAction.OnClickData,
  ) => void;
  browser.pageAction.onClicked.addListener(buttonEventsHandler);
}

function setPopup(tabId: TabId) {
  browser.pageAction
    .setPopup({
      tabId,
      popup: '../assets/popup.html',
    })
    .catch((err: unknown) => {
      console.error('Failed to set popup', err);
    });
}

function removePopup(tabId: TabId) {
  browser.pageAction
    .setPopup({
      tabId,
      popup: null,
    })
    .catch((err: unknown) => {
      console.error('Failed to remove popup', err);
    });
}

function applyPageInfo(tabId: TabId, { feeds, title }: Page) {
  if (feeds.length > 0) {
    enableButton(tabId);

    if (feeds.length > 1) {
      setPopup(tabId);
    }
  } else {
    disableButton(tabId);
    removePopup(tabId);
  }

  setButtonLabel(tabId, createButtonLabel(feeds, title));
  dispatchButtonEvents({
    feeds,
    title,
  });
}

function onTabRemoved(tabId: TabId) {
  tabs.delete(tabId);
}

function refreshTab(tabId: TabId) {
  const page = tabs.get(tabId)?.pageInfo;
  if (page == null) {
    disableButton(tabId);
    removePopup(tabId);
  } else {
    applyPageInfo(tabId, page);
  }
}

function onTabActivated(activation: Tabs.OnActivatedActiveInfoType) {
  refreshTab(activatedTabId(activation));
}

/**
 * Handles event: "Tab was moved to another window and attached to it".
 * Popup's contents should be updated on that otherwise it leads to inconsistent popup's content.
 */
function onTabAttached(tabId: TabId) {
  removePopup(tabId);
  refreshTab(tabId);
}

async function getActiveTabInfo() {
  const activeTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTabs.length < 1) {
    return null;
  }
  const id = browserTabId(activeTabs[0]);
  if (id == null) {
    console.error(
      'Tab ID must be present since we are not querying foreign tab using the `sessions` API',
    );
    return null;
  }
  return tabs.get(id);
}
