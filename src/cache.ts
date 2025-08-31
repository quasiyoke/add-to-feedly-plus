/**
 * Is being cleared on browser restart.
 */

import type { Tab, TabId } from '@/protocol/tab.ts';
import browser from '@/webExtension.ts';

export async function storeTab(id: TabId, tab: Tab) {
  await browser.storage.session.set({
    [tabIdKey(id)]: tab,
  });
}

export async function tab(id: TabId): Promise<Tab | undefined> {
  const key = tabIdKey(id);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (await browser.storage.session.get(key))[key] as any;
}

export async function removeTab(id: TabId) {
  await browser.storage.session.remove(tabIdKey(id));
}

function tabIdKey(id: TabId): string {
  return `TabId:${String(id)}`;
}
