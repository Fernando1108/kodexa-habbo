import { MessageComposer, MessageParser } from '@kodexa/protocol';

type MessageCallback = (packetId: number, parser: MessageParser) => void;
type VoidCallback = () => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private onMessageCb: MessageCallback | null = null;
  private onConnectCb: VoidCallback | null = null;
  private onDisconnectCb: VoidCallback | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.onConnectCb?.();
        resolve();
      };

      this.ws.onerror = (err) => {
        reject(err);
      };

      this.ws.onclose = () => {
        this.onDisconnectCb?.();
      };

      this.ws.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        const parser = new MessageParser(event.data);
        this.onMessageCb?.(parser.getPacketId(), parser);
      };
    });
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  send(packetId: number, composer: MessageComposer): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(composer.compose());
  }

  onMessage(callback: MessageCallback): void {
    this.onMessageCb = callback;
  }

  onConnect(callback: VoidCallback): void {
    this.onConnectCb = callback;
  }

  onDisconnect(callback: VoidCallback): void {
    this.onDisconnectCb = callback;
  }
}
