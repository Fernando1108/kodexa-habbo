export class MessageComposer {
  private buffer: number[] = [];
  private readonly packetId: number;

  constructor(packetId: number) {
    this.packetId = packetId;
  }

  writeShort(value: number): this {
    this.buffer.push((value >> 8) & 0xff, value & 0xff);
    return this;
  }

  writeInt(value: number): this {
    this.buffer.push(
      (value >> 24) & 0xff,
      (value >> 16) & 0xff,
      (value >> 8) & 0xff,
      value & 0xff,
    );
    return this;
  }

  writeString(value: string): this {
    const encoded = new TextEncoder().encode(value);
    this.writeShort(encoded.length);
    for (const byte of encoded) {
      this.buffer.push(byte);
    }
    return this;
  }

  writeBoolean(value: boolean): this {
    this.buffer.push(value ? 1 : 0);
    return this;
  }

  compose(): Uint8Array {
    // Format: [2 bytes packetId][4 bytes bodyLength][body]
    const body = new Uint8Array(this.buffer);
    const result = new Uint8Array(6 + body.length);
    const view = new DataView(result.buffer);
    view.setUint16(0, this.packetId);
    view.setUint32(2, body.length);
    result.set(body, 6);
    return result;
  }
}
