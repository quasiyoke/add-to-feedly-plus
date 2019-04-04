/**
 * This file is executed once when the extension was loaded.
 */

import {
  onMessage,
  setPopupContent,
} from './messages';
import { createSubscriptionUrl } from './util';

const BUTTON_LABEL_DEFAULT = 'Add to Feedly';

const tabs = {};
let currentTabId;

function onButtonChange(unusedState) {
  this.state('window', null);
  this.checked = !this.checked;
  if (this.checked) {
    mainPanel.show({
      position: button,
    });
  } else {
    mainPanel.hide();
  }
}

function onMainPanelShow () {
  mainPanel.port.emit('show', page);
}

function showPopup() {
  console.log('showPopup');
  browser.pageAction.openPopup();
}

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
    return `Add “${createFeedTitle(feeds[0], pageTitle)}” to Feedly`;
  }

  return `${BUTTON_LABEL_DEFAULT} (${feeds.length})`;
}

// mainPanel.port.on('feedChosen', (url) => {
//   button.checked = false;
//   mainPanel.hide();
//   openFeed(url);
// });

// tabs.on('open', (tab) => {
//   tab.on('ready', onContentScriptReady);
// });
// tabs.on('activate', onContentScriptReady);

function openFeed(url) {
  browser.tabs.create({
    url: createSubscriptionUrl(url),
  });
}

function onButtonClicked(
  {
    feeds,
    pageTitle,
  },
  unusedTab,
) {
  if (feeds.length === 1) {
    openFeed(feeds[0].url);
  } else {
    showPopup();
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

function onTabActivated({ tabId }) {
  const tabInfo = tabs[tabId];
  currentTabId = tabId;

  if (tabInfo && tabInfo.pageInfo) {
    applyPageInfo(tabId, tabInfo.pageInfo);
  } else {
    disableButton(tabId);
    removePopup(tabId);
  }
}

function onTabRemoved({ tabId }) {
  ensureTabFlushed(tabId);
}

function getCurrentTabInfo() {
  if (!currentTabId) {
    return null;
  }

  return tabs[currentTabId];
}

function dispatchEvents() {
  browser.runtime.onConnect.addListener(onContentScriptReady);
  browser.tabs.onActivated.addListener(onTabActivated);
  browser.tabs.onRemoved.addListener(onTabRemoved);
  onMessage({
    popupWasOpened(unusedPayload, unusedSender, sendResponse) {
      const tabInfo = getCurrentTabInfo();

      if (tabInfo && tabInfo.pageInfo) {
        sendResponse(setPopupContent(tabInfo.pageInfo));
      }
    },
  });
}

dispatchEvents();
