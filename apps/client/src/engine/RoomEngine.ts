import * as PIXI from 'pixi.js';

export class RoomEngine {
  private app!:            PIXI.Application;
  private worldContainer!: PIXI.Container;

  private isDragging = false;
  private dragStart  = { x: 0, y: 0 };
  private worldStart = { x: 0, y: 0 };

  private canvas: HTMLCanvasElement;
  private _ready: Promise<void>;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this._ready = this.init();
  }

  private async init(): Promise<void> {
    await this.waitForSize();

    this.app = new PIXI.Application({
      view:            this.canvas,
      resizeTo:        this.canvas.parentElement ?? window,
      backgroundColor: 0x0f172a,
      antialias:       false,
      resolution:      window.devicePixelRatio || 1,
      autoDensity:     true,
    });

    this.worldContainer = new PIXI.Container();
    this.worldContainer.sortableChildren = true;
    this.app.stage.addChild(this.worldContainer);

    this.setupCamera();

    this.worldContainer.position.set(
      this.app.screen.width  / 2,
      this.app.screen.height / 4,
    );
  }

  private waitForSize(): Promise<void> {
    return new Promise((resolve) => {
      const parent = this.canvas.parentElement;
      let attempts = 0;
      const check = () => {
        attempts++;
        if ((parent && parent.clientWidth > 0 && parent.clientHeight > 0) || attempts > 40) {
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  }

  private setupCamera(): void {
    const stage = this.app.stage;
    stage.eventMode = 'static';
    stage.hitArea = new PIXI.Rectangle(0, 0, 99_999, 99_999);

    stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      this.isDragging = true;
      this.dragStart  = { x: e.global.x, y: e.global.y };
      this.worldStart = { x: this.worldContainer.x, y: this.worldContainer.y };
    });

    stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      if (!this.isDragging) return;
      const dx = e.global.x - this.dragStart.x;
      const dy = e.global.y - this.dragStart.y;
      this.worldContainer.position.set(
        this.worldStart.x + dx,
        this.worldStart.y + dy,
      );
    });

    stage.on('pointerup',        () => { this.isDragging = false; });
    stage.on('pointerupoutside', () => { this.isDragging = false; });

    this.canvas.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        const factor   = e.deltaY < 0 ? 1.1 : 0.9;
        const oldScale = this.worldContainer.scale.x;
        const newScale = Math.max(0.3, Math.min(3, oldScale * factor));

        const mouseWorldX = (e.offsetX - this.worldContainer.x) / oldScale;
        const mouseWorldY = (e.offsetY - this.worldContainer.y) / oldScale;

        this.worldContainer.scale.set(newScale);

        this.worldContainer.x = e.offsetX - mouseWorldX * newScale;
        this.worldContainer.y = e.offsetY - mouseWorldY * newScale;
      },
      { passive: false },
    );
  }

  ready(): Promise<void>       { return this._ready; }
  getWorld(): PIXI.Container   { return this.worldContainer; }
  getApp():   PIXI.Application { return this.app; }

  destroy(): void {
    this.app?.destroy(false, { children: true });
  }
}