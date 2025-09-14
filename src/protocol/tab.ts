import type { Brand } from '@/util.ts';
import type { Page } from '@/protocol/page.ts';
import type { Tabs } from '@/webExtension.ts';

export type Tab = {
  page?: Page;
};

export type TabId = Brand<'TabId', number>;

export function browserTabId(tab: Tabs.Tab): TabId | undefined {
  return tab.id == null ? undefined : tabId(tab.id);
}

function tabId(id: number): TabId {
  return id as unknown as TabId;
}
