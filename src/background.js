/**
 * This file is executed once when the extension was loaded.
 */

import {
  onMessage,
  setPopupContent,
} from './values/message';
import { createSubscriptionUrl } from './util';

const BUTTON_LABEL_DEFAULT = 'Add to Feedly';

const tabs = {};

function enableButton(tabId) {
  browser.pageAction.show(tabId);
}

function disableButton(tabId) {
  browser.pageAction.hide(tabId);
}

function setButtonLabel(tabId, label) {
  browser.pageAction.setTitle({
    tabId,
    title: label,
  });
}

const createFeedTitle = ({ title }, pageTitle) => title || pageTitle || '(no title)';

function createButtonLabel(feeds, pageTitle) {
  if (feeds.length === 1) {
    return `Add to Feedly: “${createFeedTitle(feeds[0], pageTitle)}”`;
  }

  return `${BUTTON_LABEL_DEFAULT} (${feeds.length})`;
}

function openFeed(url) {
  browser.tabs.create({
    url: createSubscriptionUrl(url),
  });
}

/**
 * Handles event: "page action was clicked".
 * The handler will be fired only if page action's popup wasn't specified.
 */
function onButtonClicked({ feeds }, unusedTab) {
  if (feeds.length > 0) {
    openFeed(feeds[0].url);
  }
}

let buttonEventsHandler;

function dispatchButtonEvents(feedsInfo) {
  if (buttonEventsHandler) {
    browser.pageAction.onClicked.removeListener(buttonEventsHandler);
  }

  buttonEventsHandler = onButtonClicked.bind(null, feedsInfo);
  browser.pageAction.onClicked.addListener(buttonEventsHandler);
}

function setPopup(tabId) {
  browser.pageAction.setPopup({
    tabId,
    popup: '../assets/popup.html',
  });
}

function removePopup(tabId) {
  browser.pageAction.setPopup({
    tabId,
    popup: null,
  });
}

function applyPageInfo(tabId, { feeds, pageTitle }) {
  if (feeds.length > 0) {
    enableButton(tabId);

    if (feeds.length > 1) {
      setPopup(tabId);
    }
  } else {
    disableButton(tabId);
    removePopup(tabId);
  }

  setButtonLabel(tabId, createButtonLabel(feeds, pageTitle));
  dispatchButtonEvents({
    feeds,
    pageTitle,
  });
}

/**
 * This event handler is triggered when contentScript reports about feeds on the page.
 */
function onContentScriptMessage(tabId, { payload: pageInfo }) {
  const tabInfo = tabs[tabId];

  if (tabInfo) {
    tabInfo.pageInfo = pageInfo;
  }

  applyPageInfo(tabId, pageInfo);
}

function ensureTabFlushed(tabId) {
  const tabInfo = tabs[tabId];

  if (!tabInfo) {
    return;
  }

  tabInfo.port.onMessage.removeListener(tabInfo.onMessageHandler);
  delete tabs[tabId];
}

function onContentScriptReady(port) {
  const { sender: { tab: { id: tabId } } } = port;
  ensureTabFlushed(tabId);
  const tabInfo = {
    onMessageHandler: onContentScriptMessage.bind(null, tabId),
    port,
  };
  port.onMessage.addListener(tabInfo.onMessageHandler);
  tabs[tabId] = tabInfo;
}

function refreshTab(tabId) {
  const tabInfo = tabs[tabId];

  if (tabInfo && tabInfo.pageInfo) {
    applyPageInfo(tabId, tabInfo.pageInfo);
  } else {
    disableButton(tabId);
    removePopup(tabId);
  }
}

function onTabActivated({ tabId }) {
  refreshTab(tabId);
}

/**
 * Handles event: "Tab was moved to another window and attached to it".
 * Popup's contents should be updated on that otherwise it leads to inconsistent popup's content.
 */
function onTabAttached(tabId) {
  // We need to make popup push us "popupWasOpened" event to be able to update it with actual data after attaching.
  // To do that we're turning popup off and on (yes, that's hacky, baby).
  removePopup(tabId);
  refreshTab(tabId);
}

const getActiveTabInfo = () => browser.tabs.query({
  active: true,
  currentWindow: true,
})
  .then((activeTabs) => {
    if (activeTabs.length < 1) {
      return null;
    }

    const [activeTab] = activeTabs;
    return tabs[activeTab.id];
  });

function onPopupWasOpened(unusedPayload, unusedSender, sendResponse) {
  getActiveTabInfo()
    .then((tabInfo) => {
      if (tabInfo && tabInfo.pageInfo) {
        sendResponse(setPopupContent(tabInfo.pageInfo));
      }
    });
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
