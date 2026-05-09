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

const BUBBLE_COLORS: Record<number, number> = {
  0: 0xffffff, // normal  — white
  1: 0xffd700, // shout   — gold
  2: 0xb0b0b0, // whisper — gray
};

const BUBBLE_STYLE = (type: number) =>
  new PIXI.TextStyle({
    fontFamily:      'Sora, Arial',
    fontSize:        11,
    fill:            BUBBLE_COLORS[type] ?? 0xffffff,
    stroke:          0x000000,
    strokeThickness: 2,
    wordWrap:        true,
    wordWrapWidth:   160,
    align:           'center',
  });

function avatarColor(userId: number): number {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}

function buildPlaceholder(userId: number): PIXI.Graphics {
  const g = new PIXI.Graphics();
  const c = avatarColor(userId);

  // body — wider/taller for visibility over isometric floor
  g.beginFill(c, 0.9);
  g.drawRoundedRect(-12, -54, 24, 50, 5);
  g.endFill();

  // head
  g.beginFill(c);
  g.drawCircle(0, -66, 14);
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
  private look:        string;
  private bubbles:     PIXI.Text[] = [];

  tileX: number;
  tileY: number;
  tileZ: number;
  dir:   number;

  constructor(data: AvatarData, parent: PIXI.Container) {
    this.tileX = data.x;
    this.tileY = data.y;
    this.tileZ = data.z;
    this.dir   = data.dir;
    this.look  = data.look;

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
    if (!look) return; // no look string → keep placeholder
    const url = `${IMAGER_URL}/?figure=${encodeURIComponent(look)}&size=m&direction=${dir}&head_direction=${dir}&gesture=std&action=std`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tex = PIXI.Texture.from(img);
      if (tex && tex.width > 1 && tex.height > 1) {
        this.sprite.texture = tex;
        this.sprite.visible = true;
        this.placeholder.visible = false;
      } else {
        console.warn('[AvatarEntity] texture too small (white rect?), keeping placeholder. URL:', url);
      }
    };
    img.onerror = () => {
      console.warn('[AvatarEntity] sprite load failed, keeping placeholder. URL:', url);
    };
    img.src = url;
  }

  setDirection(dir: number): void {
    this.dir = dir;
    this.loadSprite(this.look, dir);
  }

  showBubble(message: string, type: number): void {
    const newBubble = new PIXI.Text(message, BUBBLE_STYLE(type));
    newBubble.anchor.set(0.5, 1);

    // Stack above existing bubbles
    const stackOffset = this.bubbles.reduce((acc, b) => acc - (b.height + 2), -85);
    newBubble.y = stackOffset;

    this.container.addChild(newBubble);
    this.bubbles.push(newBubble);

    // Fade out after 8 s over 0.5 s
    const FADE_START_MS = 8_000;
    const FADE_DURATION_MS = 500;

    setTimeout(() => {
      const start = performance.now();
      const fade = () => {
        const elapsed = performance.now() - start;
        const progress = Math.min(elapsed / FADE_DURATION_MS, 1);
        newBubble.alpha = 1 - progress;
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          newBubble.destroy();
          this.bubbles = this.bubbles.filter(b => b !== newBubble);
        }
      };
      requestAnimationFrame(fade);
    }, FADE_START_MS);
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
