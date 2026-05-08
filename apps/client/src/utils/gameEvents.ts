// Lightweight event bus for game-engine ↔ React communication

type MoveEvent = { userId: number; path: { x: number; y: number }[] };

class GameEventBus {
  private moveListeners: ((e: MoveEvent) => void)[] = [];

  onAvatarMove(fn: (e: MoveEvent) => void): () => void {
    this.moveListeners.push(fn);
    return () => {
      this.moveListeners = this.moveListeners.filter(l => l !== fn);
    };
  }

  emitAvatarMove(e: MoveEvent): void {
    this.moveListeners.forEach(fn => fn(e));
  }
}

export const gameEvents = new GameEventBus();
