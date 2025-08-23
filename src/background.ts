/**
 * This file is executed once when the extension was loaded.
 */

import browser, {
  type PageAction,
  type Runtime,
  type Tabs,
} from 'webextension-polyfill';

import {
  onMessage,
  setPopupContent,
  type PopupWasOpenedMessage,
  type PageWasProcessedMessage,
  type Page,
} from '@/bus.ts';
import { type Feed } from '@/protocol/feed.ts';
import { createSubscriptionUrl } from '@/util.ts';

type Tab = {
  onMessageHandler: () => void;
  pageInfo?: Page;
  port: Runtime.Port;
};

const BUTTON_LABEL_DEFAULT = 'Add to Feedly';

const tabs = new Map<number, Tab>();

function enableButton(tabId: number) {
  browser.pageAction.show(tabId).catch((err: unknown) => {
    console.error('Failed to enable page action', err);
  });
}

function disableButton(tabId: number) {
  browser.pageAction.hide(tabId).catch((err: unknown) => {
    console.error('Failed to disable page action', err);
  });
}

function setButtonLabel(tabId: number, label: string) {
  browser.pageAction.setTitle({
    tabId,
    title: label,
  });
}

function createFeedLabel({ title }: Feed, pageTitle: string | null) {
  return title || pageTitle || '(no title)';
}

function createButtonLabel(feeds: Feed[], pageTitle: string | null) {
  if (feeds.length === 1) {
    return `Add to Feedly: “${createFeedLabel(feeds[0], pageTitle)}”`;
  }

  return `${BUTTON_LABEL_DEFAULT} (${String(feeds.length)})`;
}

function openFeed(url: string) {
  browser.tabs
    .create({
      url: createSubscriptionUrl(url),
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
    openFeed(feeds[0].url);
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

function setPopup(tabId: number) {
  browser.pageAction
    .setPopup({
      tabId,
      popup: '../assets/popup.html',
    })
    .catch((err: unknown) => {
      console.error('Failed to set popup', err);
    });
}

function removePopup(tabId: number) {
  browser.pageAction
    .setPopup({
      tabId,
      popup: null,
    })
    .catch((err: unknown) => {
      console.error('Failed to remove popup', err);
    });
}

function applyPageInfo(tabId: number, { feeds, title }: Page) {
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

/**
 * This event handler is triggered when contentScript reports about feeds on the page.
 */
function onContentScriptMessage(
  tabId: number,
  { payload: pageInfo }: PageWasProcessedMessage,
) {
  const tabInfo = tabs.get(tabId);

  if (tabInfo) {
    tabInfo.pageInfo = pageInfo;
  }

  applyPageInfo(tabId, pageInfo);
}

function ensureTabFlushed(tabId: number) {
  const tabInfo = tabs.get(tabId);

  if (!tabInfo) {
    return;
  }

  tabInfo.port.onMessage.removeListener(tabInfo.onMessageHandler);
  tabs.delete(tabId);
}

function onContentScriptReady(port: Runtime.Port) {
  const { sender } = port;
  if (sender == null) {
    console.error(
      'Sender must be present since the port was passed to `onConnect` listener',
    );
    return;
  }
  if (sender.tab == null) {
    console.error(
      'Tab must be present since the connection was opened from a content script and the receiver is an extension',
    );
    return;
  }
  const { id: tabId } = sender.tab;
  if (tabId == null) {
    console.error(
      'Tab ID must be present since we are not querying foreign tab using the `sessions` API',
    );
    return;
  }
  ensureTabFlushed(tabId);
  const tab: Tab = {
    onMessageHandler: onContentScriptMessage.bind(null, tabId) as () => void,
    port,
  };
  port.onMessage.addListener(tab.onMessageHandler);
  tabs.set(tabId, tab);
}

function refreshTab(tabId: number) {
  const page = tabs.get(tabId)?.pageInfo;
  if (page == null) {
    disableButton(tabId);
    removePopup(tabId);
  } else {
    applyPageInfo(tabId, page);
  }
}

function onTabActivated({ tabId }: Tabs.OnActivatedActiveInfoType) {
  refreshTab(tabId);
}

/**
 * Handles event: "Tab was moved to another window and attached to it".
 * Popup's contents should be updated on that otherwise it leads to inconsistent popup's content.
 */
function onTabAttached(tabId: number) {
  // We need to make popup push us `popupWasOpened` event to be able to update it with actual data after attaching.
  // To do that we're turning popup off and on (yes, that's hacky, baby).
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
  const [{ id }] = activeTabs;
  if (id == null) {
    console.error(
      'Tab ID must be present since we are not querying foreign tab using the `sessions` API',
    );
    return null;
  }
  return tabs.get(id);
}

function onPopupWasOpened(
  _payload: PopupWasOpenedMessage,
  _sender: Runtime.MessageSender,
  sendResponse: (response: any) => void,
): true {
  getActiveTabInfo().then(
    (tabInfo) => {
      const page = tabInfo?.pageInfo;
      if (page != null) {
        sendResponse(setPopupContent(page));
      }
    },
    (err: unknown) => {
      console.error('Failed to handle opened popup', err);
    },
  );
  return true; // To indicate that we'll use `sendResponse` asynchronously.
}

function dispatchEvents() {
  browser.runtime.onConnect.addListener(onContentScriptReady);
  browser.tabs.onActivated.addListener(onTabActivated);
  browser.tabs.onAttached.addListener(onTabAttached);
  browser.tabs.onRemoved.addListener(ensureTabFlushed);
  onMessage({
    popupWasOpened: onPopupWasOpened,
  });
}

dispatchEvents();
