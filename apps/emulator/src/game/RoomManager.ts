import type { WebSocket } from 'ws';
import type { GameSession } from '../server/SessionManager';
import { findPath } from './pathfinding';

type Grid = (number | null)[][];

export interface RoomUser {
  session: GameSession;
  x:       number;
  y:       number;
  z:       number;
  dir:     number;
}

interface RoomInstance {
  id:      number;
  heightmapRaw: string;
  grid:    Grid;
  users:   Map<number, RoomUser>; // userId → RoomUser
}

function parseGrid(raw: string): Grid {
  return raw
    .split(/\r\n|\r|\n/)
    .filter(l => l.length > 0)
    .map(line =>
      line.split('').map(ch => (ch === 'x' ? null : parseInt(ch, 10))),
    );
}

function getHeight(grid: Grid, x: number, y: number): number {
  if (y < 0 || y >= grid.length)    return 0;
  if (x < 0 || x >= grid[y].length) return 0;
  return grid[y][x] ?? 0;
}

class RoomManager {
  private rooms = new Map<number, RoomInstance>();

  getOrCreate(roomId: number, heightmapRaw: string): RoomInstance {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id:   roomId,
        heightmapRaw,
        grid: parseGrid(heightmapRaw),
        users: new Map(),
      });
    }
    return this.rooms.get(roomId)!;
  }

  addUser(
    session:  GameSession,
    roomId:   number,
    heightmapRaw: string,
    spawnX:   number,
    spawnY:   number,
    spawnDir: number = 2,
  ): void {
    if (!session.userId) return;
    const room = this.getOrCreate(roomId, heightmapRaw);
    const z    = getHeight(room.grid, spawnX, spawnY);
    room.users.set(session.userId, { session, x: spawnX, y: spawnY, z, dir: spawnDir });

    // Update session position
    session.x   = spawnX;
    session.y   = spawnY;
    session.z   = z;
    session.dir = spawnDir;
  }

  removeUser(session: GameSession): void {
    if (!session.userId || !session.roomId) return;
    const room = this.rooms.get(session.roomId);
    if (!room) return;
    room.users.delete(session.userId);
    if (room.users.size === 0) this.rooms.delete(session.roomId);
  }

  getRoomUsers(roomId: number): RoomUser[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return [...room.users.values()];
  }

  getUsersExcept(roomId: number, userId: number): RoomUser[] {
    return this.getRoomUsers(roomId).filter(u => u.session.userId !== userId);
  }

  moveUser(
    session: GameSession,
    tx: number,
    ty: number,
  ): { x: number; y: number }[] {
    if (!session.userId || !session.roomId) return [];
    const room = this.rooms.get(session.roomId);
    if (!room) return [];

    const user = room.users.get(session.userId);
    if (!user) return [];

    const path = findPath(room.grid, user.x, user.y, tx, ty);
    if (path.length === 0) return [];

    const last = path[path.length - 1];
    const z    = getHeight(room.grid, last.x, last.y);

    user.x = last.x;
    user.y = last.y;
    user.z = z;
    session.x = last.x;
    session.y = last.y;
    session.z = z;

    return path;
  }

  // Send binary data to all sockets in a room (optionally excluding one)
  broadcast(roomId: number, data: ArrayBuffer | Uint8Array, exclude?: WebSocket): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    for (const { session: s } of room.users.values()) {
      if (s.socket !== exclude && s.socket.readyState === 1 /* OPEN */) {
        s.socket.send(data);
      }
    }
  }
}

export const roomManager = new RoomManager();
