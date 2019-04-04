/**
 * This file is executed once when the extension was loaded.
 */

import {
  onMessage,
  sendMessage,
  setPopupContent,
} from './messages';

const BUTTON_LABEL_DEFAULT = 'Add to Feedly';

let currentPageInfo;

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
    url: `https://feedly.com/i/subscription/feed/${url}`,
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

/**
 * This event handler is triggered when contentScript reports about feeds on the page.
 */
function onContentScriptMessage(tabId, { payload: pageInfo }) {
  currentPageInfo = pageInfo;
  const {
    feeds,
    title: pageTitle,
  } = pageInfo;
  console.log('Extension message:', pageTitle, feeds, tabId);

  if (feeds.length > 0) {
    enableButton(tabId);

    if (feeds.length > 1) {
      setPopup(tabId);
    }
  }

  setButtonLabel(tabId, createButtonLabel(feeds, pageTitle));
  dispatchButtonEvents({
    feeds,
    pageTitle,
  });
}

function removePopup(tabId) {
  browser.pageAction.setPopup({
    tabId,
    popup: null,
  });
}

function onContentScriptReady(port) {
  const { sender: { tab: { id: tabId } } } = port;
  port.onMessage.addListener(onContentScriptMessage.bind(null, tabId));
  disableButton(tabId);
  removePopup(tabId);
}

function dispatchEvents() {
  browser.runtime.onConnect.addListener(onContentScriptReady);
  onMessage({
    popupWasOpened(unusedPayload, unusedSender, sendResponse) {
      sendResponse(setPopupContent(currentPageInfo));
    },
  });
}

dispatchEvents();
