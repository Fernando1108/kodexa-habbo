import { describe, it, expect } from 'vitest';
import { MessageComposer } from '../MessageComposer';
import { MessageParser } from '../MessageParser';
import { IncomingPacketIds, OutgoingPacketIds } from '../PacketIds';

describe('MessageComposer + MessageParser round-trip', () => {
  it('composes and parses short, int, string, boolean', () => {
    const composed = new MessageComposer(IncomingPacketIds.ROOM_CHAT)
      .writeShort(42)
      .writeInt(999999)
      .writeString('Hola Kodexa!')
      .writeBoolean(true)
      .compose();

    const parser = new MessageParser(composed.buffer);

    expect(parser.getPacketId()).toBe(IncomingPacketIds.ROOM_CHAT);
    expect(parser.readShort()).toBe(42);
    expect(parser.readInt()).toBe(999999);
    expect(parser.readString()).toBe('Hola Kodexa!');
    expect(parser.readBoolean()).toBe(true);
    expect(parser.getRemainingBytes()).toBe(0);
  });

  it('handles empty string', () => {
    const composed = new MessageComposer(OutgoingPacketIds.AUTH_OK)
      .writeString('')
      .compose();

    const parser = new MessageParser(composed.buffer);
    expect(parser.getPacketId()).toBe(OutgoingPacketIds.AUTH_OK);
    expect(parser.readString()).toBe('');
  });

  it('handles unicode strings', () => {
    const msg = 'Kodexa 🏨 Hotel';
    const composed = new MessageComposer(IncomingPacketIds.ROOM_CHAT)
      .writeString(msg)
      .compose();

    const parser = new MessageParser(composed.buffer);
    expect(parser.readString()).toBe(msg);
  });

  it('handles false boolean', () => {
    const composed = new MessageComposer(OutgoingPacketIds.AUTH_FAILED)
      .writeBoolean(false)
      .compose();

    const parser = new MessageParser(composed.buffer);
    expect(parser.readBoolean()).toBe(false);
  });

  it('packet format: 2 bytes id + 4 bytes length + body', () => {
    const composed = new MessageComposer(IncomingPacketIds.SSO_TICKET)
      .writeShort(7)
      .compose();

    // 2 (packetId) + 4 (bodyLength) + 2 (short) = 8 bytes total
    expect(composed.byteLength).toBe(8);
  });
});
