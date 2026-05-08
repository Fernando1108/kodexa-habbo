import type { WebSocket } from 'ws';

export interface GameSession {
  socket:        WebSocket;
  userId?:       number;
  username?:     string;
  look?:         string;
  credits?:      number;
  pixels?:       number;
  rank?:         number;
  roomId?:       number;
  // In-room position
  x?:            number;
  y?:            number;
  z?:            number;
  dir?:          number;
  authenticated: boolean;
  lastPing:      number;
}

export class SessionManager {
  private sessions = new Map<WebSocket, GameSession>();

  createSession(socket: WebSocket): GameSession {
    const session: GameSession = {
      socket,
      authenticated: false,
      lastPing: Date.now(),
    };
    this.sessions.set(socket, session);
    return session;
  }

  removeSession(socket: WebSocket): void {
    this.sessions.delete(socket);
  }

  getSession(socket: WebSocket): GameSession | undefined {
    return this.sessions.get(socket);
  }

  getSessionByUserId(userId: number): GameSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) return session;
    }
    return undefined;
  }

  getOnlineCount(): number {
    return this.sessions.size;
  }

  getAuthenticatedSessions(): GameSession[] {
    return [...this.sessions.values()].filter((s) => s.authenticated);
  }
}
