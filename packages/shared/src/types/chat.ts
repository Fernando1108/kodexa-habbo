export interface ChatMessage {
  userId: number;
  username: string;
  message: string;
  type: 'normal' | 'whisper' | 'shout';
  roomId: number;
  timestamp: Date;
}
