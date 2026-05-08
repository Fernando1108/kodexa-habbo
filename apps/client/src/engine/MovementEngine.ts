import type { AvatarEntity } from './AvatarEntity';

// Habbo direction: 0=N 1=NE 2=E 3=SE 4=S 5=SW 6=W 7=NW
function movementDir(fromX: number, fromY: number, toX: number, toY: number): number {
  const dx = Math.sign(toX - fromX);
  const dy = Math.sign(toY - fromY);

  if (dx ===  1 && dy ===  0) return 2; // E
  if (dx ===  1 && dy ===  1) return 3; // SE
  if (dx ===  0 && dy ===  1) return 4; // S
  if (dx === -1 && dy ===  1) return 5; // SW
  if (dx === -1 && dy ===  0) return 6; // W
  if (dx === -1 && dy === -1) return 7; // NW
  if (dx ===  0 && dy === -1) return 0; // N
  if (dx ===  1 && dy === -1) return 1; // NE
  return 2;
}

function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerpToTile(
  entity: AvatarEntity,
  tx: number,
  ty: number,
  durationMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    const startX  = entity.tileX;
    const startY  = entity.tileY;
    const start   = performance.now();

    entity.dir = movementDir(startX, startY, tx, ty);

    const tick = (now: number) => {
      const t      = Math.min((now - start) / durationMs, 1);
      const eased  = easeInOut(t);

      entity.tileX = startX + (tx - startX) * eased;
      entity.tileY = startY + (ty - startY) * eased;
      entity.updatePosition();

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        entity.tileX = tx;
        entity.tileY = ty;
        entity.updatePosition();
        resolve();
      }
    };

    requestAnimationFrame(tick);
  });
}

export class MovementEngine {
  private readonly msPerTile: number;

  constructor(msPerTile = 280) {
    this.msPerTile = msPerTile;
  }

  async animateMove(entity: AvatarEntity, path: { x: number; y: number }[]): Promise<void> {
    for (const step of path) {
      await lerpToTile(entity, step.x, step.y, this.msPerTile);
    }
  }
}
