import * as PIXI from 'pixi.js';
import { tileToScreen, TILE_W, TILE_H, getDepth } from './IsometricMapper';
import { IMAGER_URL } from '../config/renderer.config';

// ── Palette for placeholder avatars ─────────────────────────────────────────
const AVATAR_COLORS = [0x00D4AA, 0x7C3AED, 0xF59E0B, 0x3B82F6, 0xEF4444, 0x10B981];

const NAME_STYLE = new PIXI.TextStyle({
  fontFamily:      'Sora, Arial',
  fontSize:        11,
  fill:            0xffffff,
  stroke:          0x000000,
  strokeThickness: 3,
});

// ── Bubble visual config ─────────────────────────────────────────────────────
const BUBBLE_PAD_X  = 9;
const BUBBLE_PAD_Y  = 5;
const BUBBLE_RADIUS = 8;
const BUBBLE_TAIL   = 6;   // px — downward triangle height
const BUBBLE_GAP    = 4;   // px between stacked bubbles
const BUBBLE_BASE_Y = -112; // bottom of first bubble (well above name tag at -78)

interface BubbleColors { bg: number; border: number; text: number; }
const BUBBLE_THEME: Record<number, BubbleColors> = {
  0: { bg: 0xffffff, border: 0xcccccc, text: 0x1a1a2e }, // normal — white
  1: { bg: 0xffe566, border: 0xd4a017, text: 0x1a1a2e }, // shout  — yellow
  2: { bg: 0x2d3748, border: 0x4a5568, text: 0xdddddd }, // whisper — dark
};

const bubbleTextStyle = (theme: BubbleColors) =>
  new PIXI.TextStyle({
    fontFamily:   'Sora, Arial',
    fontSize:     11,
    fill:         theme.text,
    wordWrap:     true,
    wordWrapWidth: 150,
    align:        'center',
  });

// ── Helpers ──────────────────────────────────────────────────────────────────
function avatarColor(userId: number): number {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}

function buildPlaceholder(userId: number): PIXI.Graphics {
  const g = new PIXI.Graphics();
  const c = avatarColor(userId);
  g.beginFill(c, 0.9);
  g.drawRoundedRect(-12, -54, 24, 50, 5);
  g.endFill();
  g.beginFill(c);
  g.drawCircle(0, -66, 14);
  g.endFill();
  return g;
}

/**
 * Build a visual bubble container.
 *
 * Container origin is at the bottom tip of the tail so that
 * `container.y = Y` places the bubble's visual bottom at Y.
 *
 * Returns { container, totalH } where totalH = bgH + BUBBLE_TAIL.
 */
function buildBubble(message: string, type: number): { container: PIXI.Container; totalH: number } {
  const theme   = BUBBLE_THEME[type] ?? BUBBLE_THEME[0];
  const label   = new PIXI.Text(message, bubbleTextStyle(theme));
  label.anchor.set(0.5, 0);

  const bgW    = Math.max(label.width + BUBBLE_PAD_X * 2, 40);
  const bgH    = label.height + BUBBLE_PAD_Y * 2;
  const totalH = bgH + BUBBLE_TAIL;

  // Draw with container origin at bottom tip of tail (y=0).
  // Rounded rect occupies [ -(totalH), -(BUBBLE_TAIL) ] on the y axis.
  const bg = new PIXI.Graphics();

  // Fill + rounded rect
  bg.beginFill(theme.bg, 0.95);
  bg.lineStyle(1, theme.border, 0.8);
  bg.drawRoundedRect(-bgW / 2, -totalH, bgW, bgH, BUBBLE_RADIUS);
  bg.endFill();

  // Tail triangle pointing downward (tip at y=0)
  bg.beginFill(theme.bg, 0.95);
  bg.lineStyle(0);
  bg.moveTo(-5, -BUBBLE_TAIL);
  bg.lineTo(5,  -BUBBLE_TAIL);
  bg.lineTo(0,  0);
  bg.closePath();
  bg.endFill();

  // Position text inside the rect
  label.x = 0;
  label.y = -totalH + BUBBLE_PAD_Y;

  const container = new PIXI.Container();
  container.addChild(bg);
  container.addChild(label);

  return { container, totalH };
}

// ── AvatarData ────────────────────────────────────────────────────────────────
export interface AvatarData {
  userId:   number;
  username: string;
  look:     string;
  x:        number;
  y:        number;
  z:        number;
  dir:      number;
}

// ── AvatarEntity ──────────────────────────────────────────────────────────────
export class AvatarEntity {
  readonly container: PIXI.Container;

  private placeholder: PIXI.Graphics;
  private sprite:      PIXI.Sprite;
  private nameTag:     PIXI.Text;
  private look:        string;
  private bubbles:     { container: PIXI.Container; totalH: number }[] = [];

  tileX: number;
  tileY: number;
  tileZ: number;
  dir:   number;
  /** Incremented on every new movement sequence. Used by MovementEngine to detect cancellation. */
  movementGen: number = 0;
  /** True while MovementEngine is animating this entity. */
  isMoving: boolean = false;

  constructor(data: AvatarData, parent: PIXI.Container) {
    this.tileX = data.x;
    this.tileY = data.y;
    this.tileZ = data.z;
    this.dir   = data.dir;
    this.look  = data.look;

    this.container = new PIXI.Container();

    this.placeholder = buildPlaceholder(data.userId);
    this.container.addChild(this.placeholder);

    this.sprite = new PIXI.Sprite();
    this.sprite.anchor.set(0.5, 1);
    this.sprite.visible = false;
    this.container.addChild(this.sprite);

    // Name tag — anchored at bottom-center, stays at y=-78
    this.nameTag = new PIXI.Text(data.username, NAME_STYLE);
    this.nameTag.anchor.set(0.5, 1);
    this.nameTag.y = -78;
    this.container.addChild(this.nameTag);

    parent.addChild(this.container);
    this.updatePosition();
    this.loadSprite(data.look, data.dir);
  }

  // ── Sprite loading ─────────────────────────────────────────────────────────
  private loadSprite(look: string, dir: number): void {
    if (!look) return;
    const url = `${IMAGER_URL}/?figure=${encodeURIComponent(look)}&size=m&direction=${dir}&head_direction=${dir}&gesture=std&action=std`;
    console.log('[AvatarEntity] loadSprite url=', url);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tex = PIXI.Texture.from(img);
      if (tex && tex.width > 1 && tex.height > 1) {
        this.sprite.texture = tex;
        this.sprite.visible = true;
        this.placeholder.visible = false;
      } else {
        console.warn('[AvatarEntity] texture too small, keeping placeholder. URL:', url);
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

  // ── Chat bubbles ───────────────────────────────────────────────────────────
  showBubble(message: string, type: number): void {
    console.log(`[AvatarEntity] showBubble message="${message}"`);

    const entry = buildBubble(message, type);
    this.container.addChild(entry.container);
    this.bubbles.push(entry);

    this.repositionBubbles();
    console.log(`[AvatarEntity] bubble added count=${this.bubbles.length}`);

    const FADE_START_MS    = 8_000;
    const FADE_DURATION_MS = 500;

    setTimeout(() => {
      const start = performance.now();
      const fade = () => {
        const elapsed  = performance.now() - start;
        const progress = Math.min(elapsed / FADE_DURATION_MS, 1);
        entry.container.alpha = 1 - progress;
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          entry.container.destroy({ children: true });
          this.bubbles = this.bubbles.filter(b => b !== entry);
          this.repositionBubbles();
          console.log(`[AvatarEntity] bubble removed count=${this.bubbles.length}`);
        }
      };
      requestAnimationFrame(fade);
    }, FADE_START_MS);
  }

  /**
   * Re-stack all bubbles from BUBBLE_BASE_Y upward.
   * Index 0 = oldest (lowest), last = newest (highest).
   */
  private repositionBubbles(): void {
    let currentY = BUBBLE_BASE_Y;
    for (const entry of this.bubbles) {
      entry.container.y = currentY;
      currentY -= (entry.totalH + BUBBLE_GAP);
    }
  }

  // ── Position & lifecycle ───────────────────────────────────────────────────
  updatePosition(): void {
    const { px, py } = tileToScreen(this.tileX, this.tileY, this.tileZ);
    this.container.x = px;
    this.container.y = py + TILE_H / 2;
    // Use continuous tileX/tileY for depth — Math.floor caused discrete 10000-unit zIndex
    // jumps mid-lerp, making the avatar appear to clip through walls at tile boundaries.
    this.container.zIndex = (this.tileX + this.tileY) * 10_000 + this.tileZ * 100 + 50;
  }

  destroy(): void {
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}
