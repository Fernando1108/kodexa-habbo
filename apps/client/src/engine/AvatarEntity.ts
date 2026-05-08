import * as PIXI from 'pixi.js';
import { tileToScreen, TILE_W, TILE_H, getDepth } from './IsometricMapper';
import { IMAGER_URL } from '../config/renderer.config';

// ── Palette for placeholder avatars ─────────────────────────────────────────
const AVATAR_COLORS = [0x00D4AA, 0x7C3AED, 0xF59E0B, 0x3B82F6, 0xEF4444, 0x10B981];
const NAME_STYLE = new PIXI.TextStyle({
  fontFamily: 'Sora, Arial',
  fontSize:   11,
  fill:       0xffffff,
  stroke:     0x000000,
  strokeThickness: 3,
});

function avatarColor(userId: number): number {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}

function buildPlaceholder(userId: number): PIXI.Graphics {
  const g = new PIXI.Graphics();
  const c = avatarColor(userId);

  // body
  g.beginFill(c, 0.9);
  g.drawRoundedRect(-10, -52, 20, 44, 4);
  g.endFill();

  // head
  g.beginFill(c);
  g.drawCircle(0, -62, 12);
  g.endFill();

  return g;
}

// ── AvatarEntity ─────────────────────────────────────────────────────────────
export interface AvatarData {
  userId:   number;
  username: string;
  look:     string;
  x:        number;
  y:        number;
  z:        number;
  dir:      number;
}

export class AvatarEntity {
  readonly container: PIXI.Container;

  private placeholder: PIXI.Graphics;
  private sprite:      PIXI.Sprite;
  private nameTag:     PIXI.Text;

  tileX: number;
  tileY: number;
  tileZ: number;
  dir:   number;

  constructor(data: AvatarData, parent: PIXI.Container) {
    this.tileX = data.x;
    this.tileY = data.y;
    this.tileZ = data.z;
    this.dir   = data.dir;

    this.container = new PIXI.Container();

    // Placeholder always shown until real sprite loads
    this.placeholder = buildPlaceholder(data.userId);
    this.container.addChild(this.placeholder);

    // Real avatar sprite (async from imager)
    this.sprite = new PIXI.Sprite();
    this.sprite.anchor.set(0.5, 1);
    this.sprite.visible = false;
    this.container.addChild(this.sprite);

    // Name tag
    this.nameTag = new PIXI.Text(data.username, NAME_STYLE);
    this.nameTag.anchor.set(0.5, 1);
    this.nameTag.y = -78;
    this.container.addChild(this.nameTag);

    parent.addChild(this.container);
    this.updatePosition();
    this.loadSprite(data.look, data.dir);
  }

  private loadSprite(look: string, dir: number): void {
    const url = `${IMAGER_URL}/avatarimage?figure=${look}&size=m&direction=${dir}&action=std`;
    PIXI.Assets.load(url)
      .then((tex: PIXI.Texture) => {
        this.sprite.texture = tex;
        this.sprite.visible = true;
        this.placeholder.visible = false;
      })
      .catch(() => { /* keep placeholder */ });
  }

  setDirection(dir: number): void {
    this.dir = dir;
    this.loadSprite('', dir); // reloads with same look but new dir — look is already in URL if needed
  }

  updatePosition(): void {
    const { px, py } = tileToScreen(this.tileX, this.tileY, this.tileZ);
    this.container.x = px;
    this.container.y = py + TILE_H / 2;
    this.container.zIndex = getDepth(Math.floor(this.tileX), Math.floor(this.tileY), this.tileZ) + 50;
  }

  destroy(): void {
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
