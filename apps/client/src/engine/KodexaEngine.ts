import * as PIXI from 'pixi.js';
import { MAX_FPS } from '../config/renderer.config';

export class KodexaEngine {
  private app: PIXI.Application | null = null;
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async init(): Promise<void> {
    this.app = new PIXI.Application({
      view: this.canvas,
      resizeTo: this.canvas.parentElement ?? window,
      backgroundColor: 0x0f172a,
      antialias: false, // pixel art
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      powerPreference: 'high-performance',
    });

    PIXI.settings.TARGET_FPMS = MAX_FPS / 1000;
  }

  destroy(): void {
    this.app?.destroy(false, { children: true });
    this.app = null;
  }

  getApp(): PIXI.Application {
    if (!this.app) throw new Error('KodexaEngine not initialized');
    return this.app;
  }
}
