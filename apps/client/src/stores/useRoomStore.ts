import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AvatarData } from '../engine/AvatarEntity';

interface RoomState {
  roomId:    number | null;
  roomName:  string;
  heightmap: string;
  avatars:   Map<number, AvatarData>;

  setRoom:         (id: number, name: string, heightmap: string) => void;
  clearRoom:       () => void;
  setAvatars:      (list: AvatarData[]) => void;
  addAvatar:       (data: AvatarData) => void;
  removeAvatar:    (userId: number) => void;
  updateAvatarPos: (userId: number, x: number, y: number, dir?: number) => void;
}

export const useRoomStore = create<RoomState>()(subscribeWithSelector((set) => ({
  roomId:    null,
  roomName:  '',
  heightmap: '',
  avatars:   new Map(),

  setRoom: (id, name, heightmap) =>
    set({ roomId: id, roomName: name, heightmap }),

  clearRoom: () =>
    set({ roomId: null, roomName: '', heightmap: '', avatars: new Map() }),

  setAvatars: (list) =>
    set({ avatars: new Map(list.map(a => [a.userId, a])) }),

  addAvatar: (data) =>
    set(state => ({ avatars: new Map(state.avatars).set(data.userId, data) })),

  removeAvatar: (userId) =>
    set(state => {
      const next = new Map(state.avatars);
      next.delete(userId);
      return { avatars: next };
    }),

  updateAvatarPos: (userId, x, y, dir) =>
    set(state => {
      const avatar = state.avatars.get(userId);
      if (!avatar) return {};
      return {
        avatars: new Map(state.avatars).set(userId, {
          ...avatar,
          x,
          y,
          ...(dir !== undefined ? { dir } : {}),
        }),
      };
    }),
})));
