import { create } from 'zustand';

export type ChatType = 0 | 1 | 2; // 0=normal 1=shout 2=whisper

export interface ChatMessage {
  id:        number;
  userId:    number;
  username:  string;
  message:   string;
  type:      ChatType;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearRoom:  () => void;
}

let _nextId = 0;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages.slice(-49), // keep last 50
        { ...msg, id: _nextId++, timestamp: Date.now() },
      ],
    })),

  clearRoom: () => set({ messages: [] }),
}));
