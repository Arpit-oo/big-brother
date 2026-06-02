let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const WS_URL = 'ws://127.0.0.1:58732';

function connect() {
  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[Big Brother] Connected to desktop app');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.action === 'close_tab' && message.tabId) {
          chrome.tabs.remove(message.tabId).catch(() => {});
        }
        if (message.action === 'redirect' && message.tabId && message.url) {
          chrome.tabs.update(message.tabId, { url: message.url }).catch(() => {});
        }
      } catch {}
    };

    ws.onclose = () => {
      ws = null;
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  } catch {
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 3000);
}

connect();

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  send({
    type: 'navigation',
    url: details.url,
    tabId: details.tabId,
  });
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return;
  chrome.tabs
    .get(details.tabId)
    .then((tab) => {
      if (tab.title) {
        send({
          type: 'page_load',
          url: details.url,
          title: tab.title,
          tabId: details.tabId,
        });
      }
    })
    .catch(() => {});
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'search_query') {
    send({
      type: 'search',
      query: message.query,
      url: sender.tab?.url,
      tabId: sender.tab?.id,
    });
  }
});

function send(message: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
