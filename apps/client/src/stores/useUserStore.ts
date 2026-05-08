import { create } from 'zustand';

interface UserState {
  userId:   number | null;
  username: string;
  look:     string;
  credits:  number;
  pixels:   number;
  rank:     number;
  isSet:    boolean;
  setUser: (data: {
    userId:   number;
    username: string;
    look:     string;
    credits:  number;
    pixels:   number;
    rank:     number;
  }) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId:   null,
  username: '',
  look:     '',
  credits:  0,
  pixels:   0,
  rank:     1,
  isSet:    false,

  setUser: (data) => set({ ...data, isSet: true }),
  reset:   ()     => set({ userId: null, username: '', look: '', credits: 0, pixels: 0, rank: 1, isSet: false }),
}));
