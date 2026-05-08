import * as PIXI from 'pixi.js';
import { tileToScreen, TILE_W, TILE_H, WALL_H, getDepth } from './IsometricMapper';

// ── Palette ──────────────────────────────────────────────────────────────────
const C_FLOOR_A    = 0x7a9e8a;
const C_FLOOR_B    = 0x6d9080;
const C_FLOOR_LINE = 0x4a7060;
const C_WALL_L     = 0x4a6e58;
const C_WALL_R     = 0x5a7e68;
const C_HOVER      = 0x00D4AA;

export type Grid = (number | null)[][];

function parseHeightmap(raw: string): Grid {
  return raw
    .split(/\r\n|\r|\n/)
    .filter(l => l.length > 0)
    .map(line =>
      line.split('').map(ch => (ch === 'x' ? null : parseInt(ch, 10))),
    );
}

function isFloor(grid: Grid, x: number, y: number): boolean {
  if (y < 0 || y >= grid.length)    return false;
  if (x < 0 || x >= grid[y].length) return false;
  return grid[y][x] !== null;
}

// ── Renderer ─────────────────────────────────────────────────────────────────
export class RoomRenderer {
  // Shared sortable container — avatars & tiles live here together
  private container: PIXI.Container;
  // References only to tile/wall graphics so we can remove them without touching avatars
  private tileGfx: PIXI.DisplayObject[] = [];
  private grid:    Grid = [];

  private onTileClickCb?: (x: number, y: number) => void;

  constructor(world: PIXI.Container) {
    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
    world.addChild(this.container);
  }

  setOnTileClick(cb: (x: number, y: number) => void): void {
    this.onTileClickCb = cb;
  }

  renderHeightmap(raw: string): void {
    // Remove only tile/wall graphics — avatars in container stay untouched
    this.tileGfx.forEach(g => this.container.removeChild(g));
    this.tileGfx = [];
    this.grid = parseHeightmap(raw);

    for (let y = 0; y < this.grid.length; y++) {
      const row = this.grid[y];
      for (let x = 0; x < row.length; x++) {
        const z = row[x];
        if (z === null) continue;

        const depth = getDepth(x, y, z);

        if (!isFloor(this.grid, x - 1, y)) this.drawNorthWall(x, y, z, depth - 1);
        if (!isFloor(this.grid, x, y - 1)) this.drawWestWall(x, y, z, depth - 1);
        this.drawFloorTile(x, y, z, depth);
      }
    }
  }

  getContainer(): PIXI.Container { return this.container; }
  getGrid():      Grid            { return this.grid; }

  isWalkable(x: number, y: number): boolean {
    return isFloor(this.grid, x, y);
  }

  private addTile(g: PIXI.Graphics): void {
    this.container.addChild(g);
    this.tileGfx.push(g);
  }

  private drawFloorTile(x: number, y: number, z: number, depth: number): void {
    const { px, py } = tileToScreen(x, y, z);
    const g = new PIXI.Graphics();
    g.zIndex = depth;

    const color = (x + y) % 2 === 0 ? C_FLOOR_A : C_FLOOR_B;

    g.beginFill(color);
    g.moveTo(px,              py);
    g.lineTo(px + TILE_W / 2, py + TILE_H / 2);
    g.lineTo(px,              py + TILE_H);
    g.lineTo(px - TILE_W / 2, py + TILE_H / 2);
    g.closePath();
    g.endFill();

    g.lineStyle(1, C_FLOOR_LINE, 0.4);
    g.moveTo(px,              py);
    g.lineTo(px + TILE_W / 2, py + TILE_H / 2);
    g.lineTo(px,              py + TILE_H);
    g.lineTo(px - TILE_W / 2, py + TILE_H / 2);
    g.closePath();

    // Hover highlight
    const tileX = x, tileY = y;
    g.eventMode = 'static';
    g.cursor    = 'pointer';

    g.on('pointerover', () => {
      g.tint = C_HOVER;
      g.alpha = 0.85;
    });
    g.on('pointerout', () => {
      g.tint  = 0xffffff;
      g.alpha = 1;
    });
    g.on('pointertap', () => {
      this.onTileClickCb?.(tileX, tileY);
    });

    this.addTile(g);
  }

  private drawNorthWall(x: number, y: number, z: number, depth: number): void {
    const { px, py } = tileToScreen(x, y, z);
    const g = new PIXI.Graphics();
    g.zIndex = depth;

    g.beginFill(C_WALL_L);
    g.moveTo(px - TILE_W / 2, py + TILE_H / 2);
    g.lineTo(px,              py);
    g.lineTo(px,              py - WALL_H);
    g.lineTo(px - TILE_W / 2, py + TILE_H / 2 - WALL_H);
    g.closePath();
    g.endFill();

    g.lineStyle(1, 0x000000, 0.25);
    g.moveTo(px - TILE_W / 2, py + TILE_H / 2 - WALL_H);
    g.lineTo(px,              py - WALL_H);

    this.addTile(g);
  }

  private drawWestWall(x: number, y: number, z: number, depth: number): void {
    const { px, py } = tileToScreen(x, y, z);
    const g = new PIXI.Graphics();
    g.zIndex = depth;

    g.beginFill(C_WALL_R);
    g.moveTo(px,              py);
    g.lineTo(px + TILE_W / 2, py + TILE_H / 2);
    g.lineTo(px + TILE_W / 2, py + TILE_H / 2 - WALL_H);
    g.lineTo(px,              py - WALL_H);
    g.closePath();
    g.endFill();

    g.lineStyle(1, 0x000000, 0.15);
    g.moveTo(px,              py - WALL_H);
    g.lineTo(px + TILE_W / 2, py + TILE_H / 2 - WALL_H);

    this.addTile(g);
  }

  destroy(): void {
    this.tileGfx.forEach(g => this.container.removeChild(g));
    this.tileGfx = [];
  }
}
