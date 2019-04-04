export function onMessage(handlersMap) {
  browser.runtime.onMessage.addListener(({
    type,
    payload,
  }, sender, sendResponse) => {
    const handler = handlersMap[type];

    if (typeof handler === 'function') {
      handler(payload, sender, sendResponse);
    }
  });
}

export const pageWasProcessed = ({
  feeds,
  title,
}) => ({
  type: 'pageWasProcessed',
  payload: {
    feeds,
    title,
  },
});

export const popupWasOpened = () => ({
  type: 'popupWasOpened',
});

export function sendMessage(message) {
  return browser.runtime.sendMessage(message);
}

export const setPopupContent = ({
  feeds,
  title,
}) => ({
  type: 'setPopupContent',
  payload: {
    feeds,
    title,
  },
});
