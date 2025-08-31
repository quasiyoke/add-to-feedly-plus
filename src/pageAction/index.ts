/**
 * `pageAction` represents an action applicable primarily to the current page, rather than all pages. In Firefox,
 * the corresponding button was even located directly in the omnibox or address bar. Such a button is displayed
 * for pages where it's relevant and hidden where it's not needed. We'd like to use `pageAction` exclusively
 * for our extension, as the feed subscription button is relevant only for certain pages — this is the canonical use
 * of `pageAction`, exemplified in the documentation.
 *
 * `pageAction` is natively supported by Firefox, but for Chrome, we are forced to provide equivalent functionality
 * through `chrome.action` — a button displayed apart from the omnibox, which is always visible if the extension
 * was pinned.
 */

import packageManifest from '@/../package.json' with { type: 'json' };
import { assertExhaustive } from '@/util.ts';
import { label as feedLabel, type Feed } from '@/protocol/feed.ts';
import type { Page } from '@/protocol/page.ts';
import type { TabId } from '@/protocol/tab.ts';
import browser, { type Tabs } from '@/webExtension.ts';
import { COMMAND_NAME } from './const.ts';

export async function render(tabId: TabId, page: Page | undefined) {
  const feeds = page?.feeds ?? [];
  await Promise.all([
    toggle(tabId, feeds.length > 0),
    setLabel(tabId, label(feeds, page?.title)),
    togglePopup(tabId, feeds.length > 1),
  ]);
}

const NO_FEEDS_LABEL = `${packageManifest.title} (no feeds)`;

function label(feeds: Feed[], pageTitle: string | undefined): string {
  switch (feeds.length) {
    case 0:
      return NO_FEEDS_LABEL;
    case 1:
      return `Add to Feedly: “${feedLabel(feeds[0], pageTitle)}”`;
    default:
      return `Add to Feedly (${String(feeds.length)})`;
  }
}

export function dispatchClick(handler: (tab: Tabs.Tab) => void) {
  switch (EXTENSION_PLATFORM) {
    case 'web-ext':
      browser.pageAction.onClicked.addListener(handler);
      break;
    case 'chrome':
      // Chrome doesn't provide `OnClickData` for the `onClicked` event, unlike Firefox:
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/action/onClicked#addlistenerlistener
      // https://developer.chrome.com/docs/extensions/reference/api/action#event-onClicked
      browser.action.onClicked.addListener(handler);
      break;
    default:
      assertExhaustive(EXTENSION_PLATFORM);
  }
}

/**
 * Specifies handler for the event: "`pageAction` command (keyboard shortcut) was ordered". Should function as a click
 * on the `pageAction` button.
 *
 * The handler is only applicable to Chrome. In Firefox, we use the built-in implementation `_execute_page_action`.
 */
export function dispatchCommand(handler: (tab: Tabs.Tab | undefined) => void) {
  switch (EXTENSION_PLATFORM) {
    case 'web-ext':
      break;
    case 'chrome':
      browser.commands.onCommand.addListener((name, tab) => {
        if (name !== COMMAND_NAME) {
          console.error('Unknown command', name);
          return;
        }
        handler(tab);
      });
      break;
    default:
      assertExhaustive(EXTENSION_PLATFORM);
  }
}

async function toggle(tabId: TabId, enabled: boolean) {
  switch (EXTENSION_PLATFORM) {
    case 'web-ext':
      if (enabled) {
        await browser.pageAction.show(tabId);
      } else {
        await browser.pageAction.hide(tabId);
      }
      break;
    case 'chrome':
      if (enabled) {
        await browser.action.enable(tabId);
      } else {
        await browser.action.disable(tabId);
      }
      break;
    default:
      assertExhaustive(EXTENSION_PLATFORM);
  }
}

async function setLabel(tabId: TabId, label: string) {
  const details = {
    tabId,
    title: label,
  };
  switch (EXTENSION_PLATFORM) {
    case 'web-ext':
      browser.pageAction.setTitle(details);
      break;
    case 'chrome':
      await browser.action.setTitle(details);
      break;
    default:
      assertExhaustive(EXTENSION_PLATFORM);
  }
}

const POPUP_PATH = 'assets/popup.html';

export async function togglePopup(tabId: TabId, enabled: boolean) {
  switch (EXTENSION_PLATFORM) {
    case 'web-ext': {
      const popup = enabled
        ? {
            tabId,
            popup: POPUP_PATH,
          }
        : {
            tabId,
            // If an empty string ("") is passed here, the popup is disabled, and the extension will receive
            // `onClicked` events. If `null` is passed here, the popup is reset to the popup that was specified
            // in the `page_action` manifest key.
            // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/pageAction/setPopup#parameters
            popup: null,
          };
      await browser.pageAction.setPopup(popup);
      break;
    }
    case 'chrome': {
      const popup = enabled
        ? {
            tabId,
            popup: POPUP_PATH,
          }
        : {
            tabId,
            // If set to the empty string (""), no popup is shown.
            // https://developer.chrome.com/docs/extensions/reference/api/action#method-setPopup
            popup: '',
          };
      await browser.action.setPopup(popup);
      break;
    }
    default:
      assertExhaustive(EXTENSION_PLATFORM);
  }
}

export async function openPopup() {
  switch (EXTENSION_PLATFORM) {
    case 'web-ext':
      await browser.pageAction.openPopup();
      break;
    case 'chrome':
      await browser.action.openPopup();
      break;
    default:
      assertExhaustive(EXTENSION_PLATFORM);
  }
}

export const onlyForTesting = { label };
