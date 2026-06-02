let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const WS_URL = 'ws://127.0.0.1:58732'

function connect() {
  try {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      console.log('[Big Brother] Connected to desktop app')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.action === 'close_tab' && message.tabId) {
          chrome.tabs.remove(message.tabId).catch(() => {})
        }
        if (message.action === 'redirect' && message.tabId && message.url) {
          chrome.tabs.update(message.tabId, { url: message.url }).catch(() => {})
        }
      } catch {}
    }

    ws.onclose = () => {
      ws = null
      scheduleReconnect()
    }

    ws.onerror = () => {
      ws?.close()
    }
  } catch {
    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, 3000)
}

connect()

// Only send completed page loads (not every navigation start)
// Extract meaningful text: page title + domain
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return

  chrome.tabs.get(details.tabId).then((tab) => {
    const url = tab.url || details.url
    const title = tab.title || ''

    // Send page title for keyword checking
    if (title) {
      send({
        type: 'page_load',
        url: url,
        title: title,
        tabId: details.tabId,
      })
    }

    // Extract and send the domain/hostname for domain-level blocking
    try {
      const hostname = new URL(url).hostname.replace('www.', '')
      send({
        type: 'navigation',
        url: hostname,
        tabId: details.tabId,
      })
    } catch {}
  }).catch(() => {})
})

// Search query interception from content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'search_query' && message.query) {
    send({
      type: 'search',
      query: message.query,
      url: sender.tab?.url,
      tabId: sender.tab?.id,
    })
  }
})

// Monitor URL bar — check when tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    try {
      const urlObj = new URL(changeInfo.url)
      const hostname = urlObj.hostname.replace('www.', '')

      // Send hostname for domain blocking
      send({
        type: 'navigation',
        url: hostname,
        tabId: tabId,
      })

      // Extract search query from known search engines
      const searchParam = urlObj.searchParams.get('q') ||
        urlObj.searchParams.get('p') ||
        urlObj.searchParams.get('search_query')

      if (searchParam && searchParam.length > 2) {
        send({
          type: 'search',
          query: searchParam,
          url: changeInfo.url,
          tabId: tabId,
        })
      }
    } catch {}
  }
})

function send(message: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}
