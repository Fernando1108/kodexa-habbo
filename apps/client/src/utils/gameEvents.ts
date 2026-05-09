// apps/client/src/utils/gameEvents.ts
// Lightweight event bus for game-engine ↔ React communication
import type { ChatType } from '../stores/useChatStore';

type MoveEvent = { userId: number; path: { x: number; y: number }[] };
type ChatEvent = { userId: number; username: string; message: string; type: ChatType };

class GameEventBus {
  private moveListeners: ((e: MoveEvent) => void)[] = [];
  private chatListeners: ((e: ChatEvent) => void)[] = [];

  onAvatarMove(fn: (e: MoveEvent) => void): () => void {
    this.moveListeners.push(fn);
    return () => {
      this.moveListeners = this.moveListeners.filter(l => l !== fn);
    };
  }

  emitAvatarMove(e: MoveEvent): void {
    this.moveListeners.forEach(fn => fn(e));
  }

  onChat(fn: (e: ChatEvent) => void): () => void {
    this.chatListeners.push(fn);
    return () => {
      this.chatListeners = this.chatListeners.filter(l => l !== fn);
    };
  }

  emitChat(e: ChatEvent): void {
    this.chatListeners.forEach(fn => fn(e));
  }
}

export const gameEvents = new GameEventBus();
