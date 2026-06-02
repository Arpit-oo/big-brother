import { EventEmitter } from 'events'
import { WebSocketServer, WebSocket } from 'ws'

export interface BrowserEvent {
  type: 'navigation' | 'search' | 'page_load'
  url?: string
  query?: string
  title?: string
  tabId?: number
  browser?: string
}

class NativeMessagingServer extends EventEmitter {
  private wss: WebSocketServer | null = null
  private clients: Set<WebSocket> = new Set()
  private port = 58732

  start() {
    this.wss = new WebSocketServer({ port: this.port, host: '127.0.0.1' })

    console.log('[Big Brother] WebSocket server listening on port', this.port)

    this.wss.on('connection', (socket) => {
      this.clients.add(socket)
      console.log('[Big Brother] Browser extension connected')

      socket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          this.emit('message', message as BrowserEvent)
        } catch {}
      })

      socket.on('close', () => {
        this.clients.delete(socket)
      })

      socket.on('error', () => {
        this.clients.delete(socket)
      })
    })

    this.wss.on('error', (err) => {
      console.error('[Big Brother] WebSocket server error:', err.message)
    })
  }

  sendToAll(message: unknown) {
    const data = JSON.stringify(message)
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    }
  }

  stop() {
    for (const client of this.clients) {
      client.close()
    }
    this.clients.clear()
    this.wss?.close()
    this.wss = null
  }
}

export const nativeMessaging = new NativeMessagingServer()
