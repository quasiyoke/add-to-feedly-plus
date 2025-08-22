import type { Feed } from './feed';

type PageWasProcessedMessage = {
  type: 'pageWasProcessed',
  payload: {
    feeds: Feed[],
    title: ?string,
  },
};

type PopupWasOpenedMessage = {
  type: 'popupWasOpened',
  payload: null,
};

type SetPopupContentMessage = {
  type: 'setPopupContent',
  payload: {
    feeds: Feed[],
    title: ?string,
  },
};

export type Message =
  | PageWasProcessedMessage
  | PopupWasOpenedMessage
  | SetPopupContentMessage;

type MessageType = $PropertyType<Message, 'type'>;
type MessagePayload = $PropertyType<Message, 'payload'>;

export function onMessage(handlersMap: {
  [MessageType]: (MessagePayload, WebExtensions$Sender, (Message) => void) => ?boolean,
}) {
  browser.runtime.onMessage.addListener((
    message: mixed,
    sender: WebExtensions$Sender,
    sendResponse: (Message) => void,
  ) => {
    if (
      typeof message !== 'object' || !message
      || typeof message.type !== 'string' || typeof message.payload !== 'object'
    ) {
      return undefined;
    }

    const {
      type,
      payload,
    } = message;
    // $FlowFixMe
    const handler = handlersMap[type];

    if (typeof handler !== 'function') {
      return undefined;
    }

    // $FlowFixMe
    return handler(payload, sender, sendResponse);
  });
}

export const pageWasProcessed = ({
  feeds,
  title,
}: {
  feeds: Feed[],
  title: ?string,
}): PageWasProcessedMessage => ({
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
  // $FlowFixMe
  return browser.runtime.sendMessage(message);
}

export const setPopupContent = ({
  feeds,
  title,
}: {
  feeds: Feed[],
  title: ?string,
}): SetPopupContentMessage => ({
  type: 'setPopupContent',
  payload: {
    feeds,
    title,
  },
});
