import type { Tabs } from 'webextension-polyfill';

import type { Brand } from '@/util.ts';
import type { Page } from '@/protocol/page.ts';

export type Tab = {
  pageInfo?: Page;
};

export type TabId = Brand<'TabId', number>;

export function activatedTabId(
  activation: Tabs.OnActivatedActiveInfoType,
): TabId {
  return tabId(activation.tabId);
}

export function browserTabId(tab: Tabs.Tab): TabId | undefined {
  return tab.id == null ? undefined : tabId(tab.id);
}

function tabId(id: number): TabId {
  return id as unknown as TabId;
}
