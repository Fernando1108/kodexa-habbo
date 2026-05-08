export const TILE_W  = 64;
export const TILE_H  = 32;
export const WALL_H  = 115;

export function tileToScreen(x: number, y: number, z = 0): { px: number; py: number } {
  return {
    px: (x - y) * (TILE_W / 2),
    py: (x + y) * (TILE_H / 2) - z * TILE_H,
  };
}

export function screenToTile(
  screenX: number, screenY: number,
  scale = 1, worldOffsetX = 0, worldOffsetY = 0,
): { x: number; y: number } {
  const lx = (screenX - worldOffsetX) / scale;
  const ly = (screenY - worldOffsetY) / scale;
  return {
    x: Math.floor(lx / (TILE_W / 2) / 2 + ly / (TILE_H / 2) / 2),
    y: Math.floor(ly / (TILE_H / 2) / 2 - lx / (TILE_W / 2) / 2),
  };
}

export function getDepth(x: number, y: number, z = 0): number {
  return (x + y) * 10_000 + z * 100;
}
