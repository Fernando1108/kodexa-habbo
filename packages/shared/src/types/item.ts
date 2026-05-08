export interface ItemData {
  id: number;
  baseId: number;
  roomId?: number;
  userId: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
  state: string;
}

export interface ItemDefinition {
  id: number;
  spriteId: string;
  publicName: string;
  type: 'floor' | 'wall';
  width: number;
  height: number;
  stackHeight: number;
  allowStack: boolean;
  allowSit: boolean;
  allowWalk: boolean;
  interactionType: string;
  interactionCount: number;
}
