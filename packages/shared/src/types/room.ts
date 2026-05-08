export interface RoomData {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  ownerName: string;
  maxUsers: number;
  currentUsers: number;
  category: number;
  score: number;
  heightMap: string;
  state: 'open' | 'doorbell' | 'locked' | 'invisible';
  tags: string[];
}

export interface RoomTile {
  x: number;
  y: number;
  z: number;
  state: 'open' | 'blocked' | 'door';
}

export interface RoomModel {
  id: string;
  name: string;
  heightMap: string;
  doorX: number;
  doorY: number;
  doorZ: number;
  doorDirection: number;
}
