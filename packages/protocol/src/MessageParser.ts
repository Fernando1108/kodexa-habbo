export class MessageParser {
  private readonly view: DataView;
  private readonly body: Uint8Array;
  private offset: number = 0;
  private readonly packetId: number;

  constructor(buffer: ArrayBufferLike) {
    this.view = new DataView(buffer);
    this.packetId = this.view.getUint16(0);
    const bodyLength = this.view.getUint32(2);
    this.body = new Uint8Array(buffer, 6, bodyLength);
  }

  getPacketId(): number {
    return this.packetId;
  }

  getRemainingBytes(): number {
    return this.body.length - this.offset;
  }

  readShort(): number {
    const value = (this.body[this.offset]! << 8) | this.body[this.offset + 1]!;
    this.offset += 2;
    return value;
  }

  readInt(): number {
    const value =
      ((this.body[this.offset]! << 24) |
        (this.body[this.offset + 1]! << 16) |
        (this.body[this.offset + 2]! << 8) |
        this.body[this.offset + 3]!) >>> 0;
    this.offset += 4;
    return value;
  }

  readString(): string {
    const length = this.readShort();
    const bytes = this.body.slice(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder().decode(bytes);
  }

  readBoolean(): boolean {
    return this.body[this.offset++] === 1;
  }
}
