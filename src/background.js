// const { ToggleButton } = require('sdk/ui/button/toggle');
// const tabs = require('sdk/tabs');
// const browserWindows = require('sdk/windows').browserWindows;
// const data = require('sdk/self').data;
// const panel = require('sdk/panel');

/**
 * Stores info about current tab's page.
 *
 * Object containing the following keys:
 * {Array} feeds: array, containing page's feeds in such format:
 *   [{title: 'Example website feed', url: 'http://example.com/feed' }, ... ]
 * {String} title: Title of the webpage.
 */
const BUTTON_DISABLED_ICON = {
  16: './icon-16-d.png',
  32: './icon-32-d.png',
  64: './icon-64-d.png',
};
const BUTTON_ENABLED_ICON = {
  16: './icon-16.png',
  32: './icon-32.png',
  64: './icon-64.png',
};
const BUTTON_LABEL_DEFAULT = 'Add to Feedly';

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

/**
 *  Create Feedly button in toolbar: disabled by default.
 */
// const button = ToggleButton({
//   id: 'add-to-feedly',
//   label: BUTTON_LABEL_DEFAULT,
//   badgeColor: '#00aaaa',
//   icon: BUTTON_DISABLED_ICON,
//   onChange: onButtonChange,
// });

function onMainPanelShow () {
  mainPanel.port.emit('show', page);
}

// const mainPanel = panel.Panel({
//   contentURL: data.url('main-panel.html'),
//   contentScriptFile: data.url('main-panel.js'),
//   onHide() {
//     button.checked = false;
//   },
//   onShow: onMainPanelShow,
// });

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
// disableButton();

// mainPanel.port.on('feedChosen', (url) => {
//   button.checked = false;
//   mainPanel.hide();
//   openFeed(url);
// });

// tabs.on('open', (tab) => {
//   tab.on('ready', onTabReady);
// });
// tabs.on('activate', onTabReady);

/**
 * This event handler is triggered when contentScript reports about RSS links on the page.
 */
function onContentScriptMessage(sender, {
  feeds,
  title: pageTitle,
}) {
  const { tab: { id: tabId } } = sender;
  console.log('Extension message:', sender, pageTitle, feeds, tabId);

  if (feeds.length > 0) {
    enableButton(tabId);
  } else {
    disableButton(tabId);
  }

  setButtonLabel(tabId, createButtonLabel(feeds, pageTitle));
}

function onTabReady (port) {
  port.onMessage.addListener(onContentScriptMessage.bind(null, port.sender));
}

function openFeed (url) {
  tabs.open(`https://feedly.com/i/subscription/feed/${url}`);
}

browser.runtime.onConnect.addListener(onTabReady);
