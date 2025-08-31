import assert from 'node:assert/strict';
import * as timers from 'node:timers/promises';

import { describe, expect, it, vi } from 'vitest';

import { suppressConsoleError } from '@/testUtil.ts';
import browser from '@/webExtension.ts';
import { dispatchMessages, type BusWithSource } from './bus.ts';

describe('dispatchRuntimeMessages', () => {
  type Bus = BusWithSource<
    'contentScript',
    {
      pageLoaded: { notification: { url: string } };
      describeImage: {
        request: { url: string };
        response: { altText: string };
      };
    }
  > &
    BusWithSource<
      'popup',
      {
        popupOpened: { notification: { timestamp: number } };
        updateConfig: {
          request: { defaults: boolean };
          response: { ok: boolean };
        };
      }
    >;

  describe('on notification', () => {
    describe('from content script', () => {
      it('relays it to handler', async () => {
        expect.assertions(5);
        const { spyPageLoadedHandler, innerHandler } = internals();
        const spyRespond = vi.fn();
        expect(
          innerHandler(
            {
              tag: 'pageLoaded',
              source: 'contentScript',
              notification: { url: 'https://example.com' },
            },
            { tab: { id: 31416 } },
            spyRespond,
          ),
        ).toBeFalsy();
        expect(spyPageLoadedHandler).toHaveBeenCalledOnce();
        expect(spyPageLoadedHandler).toHaveBeenCalledWith(
          { url: 'https://example.com' },
          31416,
        );
        await timers.setTimeout(10);
        expect(spyRespond).not.toHaveBeenCalled();
      });
    });

    describe('from popup', () => {
      it('relays it to handler', async () => {
        expect.assertions(5);
        const { spyPopupOpenedHandler, innerHandler } = internals();
        const spyRespond = vi.fn();
        expect(
          innerHandler(
            {
              tag: 'popupOpened',
              source: 'popup',
              notification: { timestamp: 271828 },
            },
            {},
            spyRespond,
          ),
        ).toBeFalsy();
        expect(spyPopupOpenedHandler).toHaveBeenCalledOnce();
        expect(spyPopupOpenedHandler).toHaveBeenCalledWith(
          { timestamp: 271828 },
          undefined,
        );
        await timers.setTimeout(10);
        expect(spyRespond).not.toHaveBeenCalled();
      });
    });
  });

  describe('on request', () => {
    describe('from content script', () => {
      it('relays it to handler', async () => {
        expect.assertions(5);
        const { spyDescribeImageHandler, innerHandler } = internals();
        const spyRespond = vi.fn();
        const responsePromise = innerHandler(
          {
            tag: 'describeImage',
            source: 'contentScript',
            request: { url: 'https://example.com' },
          },
          { tab: { id: 31416 } },
          spyRespond,
        );
        await expect(responsePromise).resolves.toStrictEqual({
          altText: 'foobar',
        });
        expect(spyDescribeImageHandler).toHaveBeenCalledOnce();
        expect(spyDescribeImageHandler).toHaveBeenCalledWith(
          { url: 'https://example.com' },
          31416,
        );
        await timers.setTimeout(10);
        expect(spyRespond).not.toHaveBeenCalled();
      });
    });

    describe('from popup', () => {
      it('relays it to handler', async () => {
        expect.assertions(5);
        const { spyUpdateConfigHandler, innerHandler } = internals();
        const spyRespond = vi.fn();
        const responsePromise = innerHandler(
          {
            tag: 'updateConfig',
            source: 'popup',
            request: { defaults: false },
          },
          {},
          spyRespond,
        );
        await expect(responsePromise).resolves.toStrictEqual({ ok: true });
        expect(spyUpdateConfigHandler).toHaveBeenCalledOnce();
        expect(spyUpdateConfigHandler).toHaveBeenCalledWith(
          { defaults: false },
          undefined,
        );
        await timers.setTimeout(10);
        expect(spyRespond).not.toHaveBeenCalled();
      });
    });
  });

  describe('on unknown messages', () => {
    suppressConsoleError('Unhandled message type');

    it('does not relay them', async () => {
      expect.assertions(7);
      const {
        innerHandler,
        spyDescribeImageHandler,
        spyPageLoadedHandler,
        spyPopupOpenedHandler,
        spyUpdateConfigHandler,
      } = internals();
      const spyRespond = vi.fn();
      expect(
        innerHandler({ tag: 'foobar', payload: null }, {}, spyRespond),
      ).toBeUndefined();
      await timers.setTimeout(10);
      expect(spyDescribeImageHandler).not.toHaveBeenCalled();
      expect(spyPageLoadedHandler).not.toHaveBeenCalled();
      expect(spyPopupOpenedHandler).not.toHaveBeenCalled();
      expect(spyUpdateConfigHandler).not.toHaveBeenCalled();
      expect(spyRespond).not.toHaveBeenCalled();
    });
  });

  function internals() {
    type Handler = (
      message: unknown,
      sender: unknown,
      respond: (response: unknown) => void,
    ) => unknown;

    const spyAddMessageListener = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (browser.runtime as any).onMessage = {
      addListener: spyAddMessageListener,
    };
    const spyDescribeImageHandler = vi.fn(() =>
      Promise.resolve({ altText: 'foobar' }),
    );
    const spyPageLoadedHandler = vi.fn();
    const spyPopupOpenedHandler = vi.fn();
    const spyUpdateConfigHandler = vi.fn(() => Promise.resolve({ ok: true }));
    dispatchMessages<Bus>({
      describeImage: spyDescribeImageHandler,
      popupOpened: spyPopupOpenedHandler,
      pageLoaded: spyPageLoadedHandler,
      updateConfig: spyUpdateConfigHandler,
    });
    expect(spyAddMessageListener).toHaveBeenCalledOnce();
    assert(spyAddMessageListener.mock.lastCall);
    const [innerHandler] = spyAddMessageListener.mock.lastCall as [Handler];
    return {
      spyDescribeImageHandler,
      spyPageLoadedHandler,
      spyPopupOpenedHandler,
      spyUpdateConfigHandler,
      innerHandler,
    };
  }
});
