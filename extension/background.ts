let nativePort: chrome.runtime.Port | null = null;

function connectNative() {
  try {
    nativePort = chrome.runtime.connectNative('com.bigbrother.monitor');

    nativePort.onMessage.addListener((message) => {
      if (message.action === 'close_tab' && message.tabId) {
        chrome.tabs.remove(message.tabId).catch(() => {});
      }
      if (message.action === 'redirect' && message.tabId && message.url) {
        chrome.tabs.update(message.tabId, { url: message.url }).catch(() => {});
      }
    });

    nativePort.onDisconnect.addListener(() => {
      nativePort = null;
      setTimeout(connectNative, 5000);
    });
  } catch {
    setTimeout(connectNative, 5000);
  }
}

connectNative();

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  sendToNative({
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
        sendToNative({
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
    sendToNative({
      type: 'search',
      query: message.query,
      url: sender.tab?.url,
      tabId: sender.tab?.id,
    });
  }
});

function sendToNative(message: unknown) {
  if (nativePort) {
    nativePort.postMessage(message);
  }
}
