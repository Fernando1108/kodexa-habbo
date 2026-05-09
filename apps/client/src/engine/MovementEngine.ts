import type { AvatarEntity } from './AvatarEntity';

// Habbo direction: 0=N 1=NE 2=E 3=SE 4=S 5=SW 6=W 7=NW
function movementDir(fromX: number, fromY: number, toX: number, toY: number): number {
  const dx = Math.sign(toX - fromX);
  const dy = Math.sign(toY - fromY);
  if (dx ===  1 && dy ===  0) return 2;
  if (dx ===  1 && dy ===  1) return 3;
  if (dx ===  0 && dy ===  1) return 4;
  if (dx === -1 && dy ===  1) return 5;
  if (dx === -1 && dy ===  0) return 6;
  if (dx === -1 && dy === -1) return 7;
  if (dx ===  0 && dy === -1) return 0;
  if (dx ===  1 && dy === -1) return 1;
  return 2;
}

function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
}

export class MovementEngine {
  private readonly msPerTile: number;

  constructor(msPerTile = 280) {
    this.msPerTile = msPerTile;
  }

  async animateMove(entity: AvatarEntity, path: { x: number; y: number }[]): Promise<void> {
    if (!path.length) return;

    // Increment THIS ENTITY's generation — cancels any previous animation
    // on THIS entity only. Other entities are unaffected.
    entity.movementGen++;
    const myGen = entity.movementGen;
    entity.isMoving = true;
    console.log(`[MoveIsMoving] userId_entity gen=${myGen} isMoving=true`);

    // Snap to nearest integer tile — clean start from tile center,
    // not from fractional mid-lerp position of cancelled animation.
    entity.tileX = Math.round(entity.tileX);
    entity.tileY = Math.round(entity.tileY);

    // Skip path[0] if server included current tile (avoid 0-length stutter).
    // findPath already does slice(1) so this is a safety check.
    let startIdx = 0;
    if (path[0].x === entity.tileX && path[0].y === entity.tileY) {
      console.log(`[MoveAnimStart] userId skip first node (current tile ${entity.tileX},${entity.tileY})`);
      startIdx = 1;
    }

    const steps = path.slice(startIdx);
    if (!steps.length) { entity.isMoving = false; return; }

    console.log(`[MoveAnimStart] gen=${myGen} steps=${steps.length} from=(${entity.tileX},${entity.tileY}) to=(${steps[steps.length - 1].x},${steps[steps.length - 1].y})`);

    for (let i = 0; i < steps.length; i++) {
      // Check entity's generation — if incremented by a newer animateMove, stop.
      if (entity.movementGen !== myGen) {
        console.log(`[MoveAnimCancel] oldGen=${myGen} newGen=${entity.movementGen}`);
        return;
      }
      const step = steps[i];
      console.log(`[MoveStep] i=${i} from=(${entity.tileX.toFixed(2)},${entity.tileY.toFixed(2)}) to=(${step.x},${step.y})`);
      await this.lerpStep(entity, step.x, step.y, myGen);
    }

    if (entity.movementGen === myGen) {
      entity.isMoving = false;
      console.log(`[MoveIsMoving] gen=${myGen} isMoving=false`);
      console.log(`[MoveAnimEnd] gen=${myGen} final=(${entity.tileX},${entity.tileY}) zIndex=${entity.container.zIndex}`);
    }
  }

  private lerpStep(
    entity: AvatarEntity,
    tx:     number,
    ty:     number,
    myGen:  number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const startX = entity.tileX;
      const startY = entity.tileY;
      const start  = performance.now();

      entity.dir = movementDir(startX, startY, tx, ty);
      console.log(`[MoveStep_start] gen=${myGen} from=(${startX.toFixed(3)},${startY.toFixed(3)}) to=(${tx},${ty}) dir=${entity.dir} zIndex=${entity.container.zIndex}`);

      const tick = (now: number) => {
        // Entity generation changed → stop WITHOUT touching entity position.
        // This prevents the 1-frame race where old + new lerp write entity.tileX simultaneously.
        if (entity.movementGen !== myGen) {
          resolve();
          return;
        }

        const t     = Math.min((now - start) / this.msPerTile, 1);
        const eased = easeInOut(t);

        entity.tileX = startX + (tx - startX) * eased;
        entity.tileY = startY + (ty - startY) * eased;
        entity.updatePosition();

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          entity.tileX = tx;
          entity.tileY = ty;
          entity.updatePosition();
          console.log(`[MoveStep_end] gen=${myGen} landed=(${tx},${ty}) zIndex=${entity.container.zIndex}`);
          resolve();
        }
      };

      requestAnimationFrame(tick);
    });
  }
}
