type TabId = number;

type WindowId = number;

type Tab = {
  id: TabId,
};

type WebExtensions$Sender = {
  tab: Tab,
};

type Port = {
  // eslint-disable-next-line no-use-before-define
  onMessage: WebExtensions$Event<mixed>,
  postMessage: (mixed) => void,
  sender: WebExtensions$Sender,
};

type WebExtensions$EventHandler<Payload> = (Payload) => void;

type WebExtensions$Event<EventHandler> = {
  addListener: (EventHandler) => void,
  removeListener: (EventHandler) => void,
};

type Runtime = {
  connect: () => Port,
  onConnect: WebExtensions$Event<WebExtensions$EventHandler<Port>>,
  onMessage: WebExtensions$Event<(mixed, WebExtensions$Sender, (mixed) => void) => ?boolean>,
  sendMessage: (mixed) => Promise<mixed>,
};

type TabActiveInfo = {
  previousTabId: TabId,
  tabId: TabId,
  windowId: WindowId,
};

type Tabs = {
  create: ({
    url?: string,
  }) => void,
  onActivated: WebExtensions$Event<WebExtensions$EventHandler<TabActiveInfo>>,
  onAttached: WebExtensions$Event<WebExtensions$EventHandler<TabId>>,
  onRemoved: WebExtensions$Event<WebExtensions$EventHandler<TabId>>,
  query: ({
    active?: boolean,
    currentWindow?: boolean,
  }) => Promise<Tab[]>,
};

type PageAction = {
  hide: (TabId) => void,
  onClicked: WebExtensions$Event<WebExtensions$EventHandler<Tab>>,
  setPopup: ({
    tabId: TabId,
    popup: ?string,
  }) => void,
  setTitle: ({
    tabId: TabId,
    title: ?string,
  }) => void,
  show: (TabId) => void,
};

type Browser = {
  pageAction: PageAction,
  runtime: Runtime,
  tabs: Tabs,
};

declare var browser: Browser;
