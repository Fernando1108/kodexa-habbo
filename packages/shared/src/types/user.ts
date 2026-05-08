export interface UserData {
  id: number;
  username: string;
  email: string;
  look: string;
  motto: string;
  credits: number;
  pixels: number;
  points: number;
  rank: number;
  online: boolean;
  lastLogin: Date;
  createdAt: Date;
}

export interface UserBadge {
  id: number;
  code: string;
  slotNumber: number;
}

export interface UserCurrency {
  type: number;
  amount: number;
}
