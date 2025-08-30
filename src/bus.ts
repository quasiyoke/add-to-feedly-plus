import browser, { type Runtime } from 'webextension-polyfill';

import { assert, assertExhaustive } from '@/util.ts';

type Bus = Record<string, RequestSchema | NotificationSchema>;

type RequestSchema<S extends Source = Source> = {
  source: S;
  request: unknown;
  response: unknown;
};
type NotificationSchema<S extends Source = Source> = {
  source: S;
  notification: unknown;
};

type Source = 'contentScript' | 'popup';

type Handlers<B extends Bus> = {
  [T in Tags<B>]: Handler<B[T]>;
};

type Handler<S extends RequestSchema | NotificationSchema> =
  S extends RequestSchema
    ? RequestHandler<S>
    : S extends NotificationSchema
      ? NotificationHandler<S>
      : never;

type RequestHandler<R extends RequestSchema> = (
  request: R['request'],
  tabId: R['source'] extends 'contentScript' ? number : undefined,
) => Promise<R['response']>;
type NotificationHandler<N extends NotificationSchema> = (
  notification: N['notification'],
  tabId: N['source'] extends 'contentScript' ? number : undefined,
) => unknown;

export type Messages<B extends Bus> = Requests<B> | Notifications<B>;

type Requests<B extends Bus> = {
  [T in Tags<B>]: Request<B, T>;
}[Tags<B>];
type Notifications<B extends Bus> = {
  [T in Tags<B>]: Notification<B, T>;
}[Tags<B>];

type Request<B extends Bus, T extends Tags<B>> = B[T] extends RequestSchema
  ? {
      tag: T;
      source: Source;
      request: B[T]['request'];
    }
  : never;
type Notification<
  B extends Bus,
  T extends Tags<B>,
> = B[T] extends NotificationSchema
  ? {
      tag: T;
      source: Source;
      notification: B[T]['notification'];
    }
  : never;

type Tags<B extends Bus> = keyof B;

export type BusWithSource<
  S extends Source,
  B extends Record<string, object>,
> = {
  [T in keyof B]: B[T] & {
    source: S;
  };
};

export function buildBus<B extends Bus>() {
  return { withSource };

  function withSource<S extends Source>(source: S) {
    return { notify, request };

    function notify<T extends Tags<B>>(
      tag: T,
      notification: B[T] extends NotificationSchema<S>
        ? B[T]['notification']
        : never,
    ) {
      browser.runtime
        .sendMessage({
          tag,
          source,
          notification,
        })
        .catch((err: unknown) => {
          console.error('Failed notifying', err);
        });
    }

    function request<T extends Tags<B>>(
      tag: T,
      params: B[T] extends RequestSchema<S> ? B[T]['request'] : never,
    ): B[T] extends RequestSchema ? Promise<B[T]['response']> : never {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return browser.runtime.sendMessage({
        tag,
        source,
        request: params,
      }) as any;
    }
  }
}

export function dispatchMessages<B extends Bus>(handlers: Handlers<B>) {
  browser.runtime.onMessage.addListener(listener);

  function listener(message: Messages<B>, sender: Runtime.MessageSender): any {
    const { tag, source } = message;
    const handler: any = handlers[tag];
    if (handler == null) {
      console.error('Unhandled message type', tag);
      return;
    }
    const tabId = senderTabId(source, sender);

    if ('request' in message) {
      const { request } = message;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return handler(request, tabId).catch((err: unknown) => {
        console.error('Failed request handling', tag, err);
        throw err;
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    handler(message.notification, tabId);
  }
}

function senderTabId(
  source: Source,
  sender: Runtime.MessageSender,
): number | undefined {
  switch (source) {
    case 'contentScript': {
      return contentScriptTabId(sender);
    }
    case 'popup': {
      return undefined;
    }
    default:
      assertExhaustive(source);
  }
}

function contentScriptTabId(sender: Runtime.MessageSender): number {
  assert(
    sender.tab,
    'Tab must be present since the connection was opened from a content script and the receiver is an extension',
  );
  const { id: tabId } = sender.tab;
  assert(
    tabId,
    'Tab ID must be present since we are not querying foreign tab using the `sessions` API',
  );
  return tabId;
}
