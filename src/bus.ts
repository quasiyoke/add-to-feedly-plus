import browser, { type Runtime } from 'webextension-polyfill';

import type { Feed } from '@/protocol/feed.ts';

export type PageWasProcessedMessage = {
  type: 'pageWasProcessed';
  payload: Page;
};
export type PopupWasOpenedMessage = {
  type: 'popupWasOpened';
  payload: null;
};
export type SetPopupContentMessage = {
  type: 'setPopupContent';
  payload: Page;
};
export type Message =
  | PageWasProcessedMessage
  | PopupWasOpenedMessage
  | SetPopupContentMessage;

export type Page = {
  feeds: Feed[];
  title: string | null;
};

type Handler = (
  payload: any,
  sender: Runtime.MessageSender,
  sendResponse: (response: any) => void,
) => true | undefined;

export function onMessage(handlersMap: Record<string, Handler>) {
  browser.runtime.onMessage.addListener(
    (
      message: unknown,
      sender: Runtime.MessageSender,
      sendResponse: (response: any) => void,
    ): any => {
      if (
        message == null ||
        typeof message !== 'object' ||
        !('type' in message) ||
        typeof message.type !== 'string' ||
        !('payload' in message) ||
        typeof message.payload !== 'object'
      ) {
        return;
      }

      const { type, payload } = message as { type: string; payload: unknown };
      const handler = handlersMap[type] as Handler | undefined;

      if (handler == null) {
        return;
      }

      return handler(payload, sender, sendResponse);
    },
  );
}

export const pageWasProcessed = ({
  feeds,
  title,
}: Page): PageWasProcessedMessage => ({
  type: 'pageWasProcessed',
  payload: {
    feeds,
    title,
  },
});

export const popupWasOpened = (): PopupWasOpenedMessage => ({
  type: 'popupWasOpened',
  payload: null,
});

export function sendMessage(message: Message): Promise<Message> {
  return browser.runtime.sendMessage(message);
}

export const setPopupContent = ({
  feeds,
  title,
}: Page): SetPopupContentMessage => ({
  type: 'setPopupContent',
  payload: {
    feeds,
    title,
  },
});
