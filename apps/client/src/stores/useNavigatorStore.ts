import { create } from 'zustand';

export interface NavigatorRoom {
  id:          number;
  name:        string;
  description: string;
  ownerName:   string;
  users:       number;
  capacity:    number;
}

interface NavigatorState {
  isOpen:  boolean;
  query:   string;
  rooms:   NavigatorRoom[];
  loading: boolean;

  openNavigator:  () => void;
  closeNavigator: () => void;
  setQuery:       (q: string) => void;
  setRooms:       (rooms: NavigatorRoom[]) => void;
  setLoading:     (v: boolean) => void;
}

export const useNavigatorStore = create<NavigatorState>((set) => ({
  isOpen:  false,
  query:   '',
  rooms:   [],
  loading: false,

  openNavigator:  () => set({ isOpen: true }),
  closeNavigator: () => set({ isOpen: false }),
  setQuery:       (query) => set({ query }),
  setRooms:       (rooms) => set({ rooms, loading: false }),
  setLoading:     (loading) => set({ loading }),
}));
