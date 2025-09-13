/**
 * `pageAction` represents an action applicable primarily to the current page, rather than all pages. In Firefox,
 * the corresponding button was even located directly in the omnibox or address bar. Such a button is displayed
 * for pages where it's relevant and hidden where it's not needed. We'd like to use `pageAction` exclusively
 * for our extension, as the feed subscription button is relevant only for certain pages — this is the canonical use
 * of `pageAction`, exemplified in the documentation.
 *
 * - Desktop Firefox — OK.
 *
 * - Chrome — was supported only for manifest v. ≤ 2:
 *   https://developer.chrome.com/docs/extensions/mv2/reference/pageAction — so we're forced to use `action` instead
 *   — a button displayed apart from the omnibox, which is always visible if the extension was pinned.
 *
 * - Firefox for Android — supports the `pageAction` API, displays it under the "Extensions" menu item.
 *
 *   Minor detail: starting with Firefox for Android v. 135 (under `menu-redesign` flag, was enabled by default
 *   since v. 142), `pageAction` is not displayed and there's no programmatic way to determine whether it was displayed,
 *   other than checking the browser version: https://bugzil.la/1984835 — the fix for this bug landed in Firefox v. 144.
 *   Unfortunately, providing proper support for the affected Firefox versions is impossible. Including both `action`
 *   and `page_action` in the manifest will cause the browser to display the extension in the menu twice.
 */

import packageManifest from '@/../package.json' with { type: 'json' };
import { assertExhaustive } from '@/util.ts';
import { label as feedLabel, type Feed } from '@/protocol/feed.ts';
import type { Page } from '@/protocol/page.ts';
import type { TabId } from '@/protocol/tab.ts';
import browser, { type Tabs } from '@/webExtension.ts';
import { COMMAND_NAME, PNG_ICON, GRAY_PNG_ICON } from './const.ts';

export async function render(tabId: TabId, page: Page | undefined) {
  const feeds = page?.feeds ?? [];
  await Promise.all([
    toggle(tabId, feeds.length > 0),
    setBadge(tabId, feeds),
    setLabel(tabId, feeds, page?.title),
    togglePopup(tabId, feeds.length > 1),
  ]);
}

const NO_FEEDS_LABEL = `${packageManifest.title} (no feeds)`;

function pageActionLabel(feeds: Feed[], pageTitle: string | undefined): string {
  switch (feeds.length) {
    case 0:
      // - Desktop Firefox — not substantial, `pageAction` button will be hidden when there're no feeds.
      // - Firefox for Android — `pageAction` menu item is visible (grayed out) so it's important to show
      //   appropriate label.
      return NO_FEEDS_LABEL;
    case 1:
      return `Add to Feedly: “${feedLabel(feeds[0], pageTitle)}”`;
    default:
      return `Add to Feedly (${String(feeds.length)})`;
  }
}

/** Maximum number of feeds we specify on the badge */
const MAX_BADGE_COUNT = 9;

function actionLabel(feeds: Feed[], pageTitle: string | undefined): string {
  switch (feeds.length) {
    case 0:
      return NO_FEEDS_LABEL;
    case 1:
      return `Add to Feedly: “${feedLabel(feeds[0], pageTitle)}”`;
    default:
      if (feeds.length <= MAX_BADGE_COUNT) {
        // Don't indicate the number of available feeds: we display it in the badge
        return packageManifest.title;
      } else {
        return `Add to Feedly (${String(feeds.length)})`;
      }
  }
}

function badge(feeds: Feed[]): string | null {
  if (feeds.length === 0) {
    return null;
  } else if (feeds.length <= MAX_BADGE_COUNT) {
    return String(feeds.length);
  } else {
    // There isn't much space on the `action` button, so we nominally indicate "many feeds"
    // to avoid blocking up the icon
    return '∞';
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
        await Promise.all([
          browser.action.enable(tabId),
          // Chrome doesn't display the icon for the `action` button grayed out after the `action` was disabled.
          // A similar bug: https://crbug.com/40148412
          // In a discussion about a similar problem with Chrome, they recommend simply changing the icon manually:
          // https://stackoverflow.com/a/64475504
          browser.action.setIcon({ tabId, path: PNG_ICON }),
        ]);
      } else {
        await Promise.all([
          browser.action.disable(tabId),
          browser.action.setIcon({ tabId, path: GRAY_PNG_ICON }),
        ]);
      }
      break;
    default:
      assertExhaustive(EXTENSION_PLATFORM);
  }
}

async function setBadge(tabId: TabId, feeds: Feed[]) {
  switch (EXTENSION_PLATFORM) {
    case 'web-ext':
      // The WebExtension API doesn't include a built-in way to set a badge for the `pageAction` button.
      // Instead, we indicate the number of available feeds in the `pageAction` label.
      break;
    case 'chrome':
      // We don't change the badge color and its text color. We expect that Chrome by default uses legible
      // and not too distracting colors.
      await browser.action.setBadgeText({
        tabId,
        text: badge(feeds),
      });
      break;
    default:
      assertExhaustive(EXTENSION_PLATFORM);
  }
}

async function setLabel(
  tabId: TabId,
  feeds: Feed[],
  pageTitle: string | undefined,
) {
  switch (EXTENSION_PLATFORM) {
    case 'web-ext':
      browser.pageAction.setTitle({
        tabId,
        title: pageActionLabel(feeds, pageTitle),
      });
      break;
    case 'chrome':
      await browser.action.setTitle({
        tabId,
        title: actionLabel(feeds, pageTitle),
      });
      break;
    default:
      assertExhaustive(EXTENSION_PLATFORM);
  }
}

const POPUP_PATH = 'assets/popup.html';

export async function togglePopup(tabId: TabId, enabled: boolean) {
  switch (EXTENSION_PLATFORM) {
    case 'web-ext': {
      const popup = {
        tabId,
        // If an empty string ("") is passed here, the popup is disabled, and the extension will receive
        // `onClicked` events. If `null` is passed here, the popup is reset to the popup that was specified
        // in the `page_action` manifest key.
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/pageAction/setPopup#parameters
        popup: enabled ? POPUP_PATH : null,
      };
      await browser.pageAction.setPopup(popup);
      break;
    }
    case 'chrome': {
      const popup = {
        tabId,
        // If set to the empty string (""), no popup is shown.
        // https://developer.chrome.com/docs/extensions/reference/api/action#method-setPopup
        popup: enabled ? POPUP_PATH : '',
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

export const onlyForTesting = { badge, pageActionLabel, actionLabel };
