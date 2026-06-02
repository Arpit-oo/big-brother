import { EventEmitter } from 'events';
import net from 'net';

export interface BrowserEvent {
  type: 'navigation' | 'search' | 'page_load';
  url?: string;
  query?: string;
  title?: string;
  tabId?: number;
  browser?: string;
}

class NativeMessagingServer extends EventEmitter {
  private server: net.Server | null = null;
  private clients: Set<net.Socket> = new Set();
  private pipeName = '\\\\.\\pipe\\big-brother-native';

  start() {
    this.server = net.createServer((socket) => {
      this.clients.add(socket);
      let buffer = Buffer.alloc(0);

      socket.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);

        while (buffer.length >= 4) {
          const msgLength = buffer.readUInt32LE(0);
          if (buffer.length < 4 + msgLength) break;

          const msgStr = buffer.subarray(4, 4 + msgLength).toString('utf8');
          buffer = buffer.subarray(4 + msgLength);

          try {
            const message = JSON.parse(msgStr);
            this.emit('message', message as BrowserEvent, socket);
          } catch {}
        }
      });

      socket.on('close', () => {
        this.clients.delete(socket);
      });

      socket.on('error', () => {
        this.clients.delete(socket);
      });
    });

    this.server.listen(this.pipeName);
  }

  sendToAll(message: any) {
    const msgStr = JSON.stringify(message);
    const msgBuf = Buffer.from(msgStr, 'utf8');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32LE(msgBuf.length, 0);
    const packet = Buffer.concat([lenBuf, msgBuf]);

    for (const client of this.clients) {
      try {
        client.write(packet);
      } catch {}
    }
  }

  sendTo(socket: net.Socket, message: any) {
    const msgStr = JSON.stringify(message);
    const msgBuf = Buffer.from(msgStr, 'utf8');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32LE(msgBuf.length, 0);
    socket.write(Buffer.concat([lenBuf, msgBuf]));
  }

  stop() {
    for (const client of this.clients) {
      client.destroy();
    }
    this.clients.clear();
    this.server?.close();
    this.server = null;
  }
}

export const nativeMessaging = new NativeMessagingServer();
