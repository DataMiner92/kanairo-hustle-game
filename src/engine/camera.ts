import { WORLD_WIDTH, WORLD_HEIGHT } from '../data/zones';

export class Camera {
  public x: number = 420;
  public y: number = 1420;
  public targetX: number = 420;
  public targetY: number = 1420;
  public zoom: number = 1.0;
  public shakeDuration: number = 0;
  public shakeIntensity: number = 0;

  constructor(public viewportWidth: number, public viewportHeight: number) {}

  public resize(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public follow(x: number, y: number, immediate: boolean = false) {
    this.targetX = x;
    this.targetY = y;
    if (immediate) {
      this.x = x;
      this.y = y;
    }
  }

  public addShake(duration: number, intensity: number) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  public update(dt: number) {
    // Smooth camera lerp
    const lerpFactor = Math.min(1.0, dt * 6.5);
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;

    // Shake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
      }
    }

    // World clamp
    const halfW = (this.viewportWidth / 2) / this.zoom;
    const halfH = (this.viewportHeight / 2) / this.zoom;

    this.x = Math.max(halfW, Math.min(WORLD_WIDTH - halfW, this.x));
    this.y = Math.max(halfH, Math.min(WORLD_HEIGHT - halfH, this.y));
  }

  public getScreenOffset() {
    let offsetX = 0;
    let offsetY = 0;
    if (this.shakeDuration > 0) {
      offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      offsetY = (Math.random() - 0.5) * this.shakeIntensity;
    }

    return {
      x: Math.round(-this.x * this.zoom + this.viewportWidth / 2 + offsetX),
      y: Math.round(-this.y * this.zoom + this.viewportHeight / 2 + offsetY),
    };
  }

  public screenToWorld(screenX: number, screenY: number) {
    const offset = this.getScreenOffset();
    return {
      x: (screenX - offset.x) / this.zoom,
      y: (screenY - offset.y) / this.zoom,
    };
  }

  public worldToScreen(worldX: number, worldY: number) {
    const offset = this.getScreenOffset();
    return {
      x: worldX * this.zoom + offset.x,
      y: worldY * this.zoom + offset.y,
    };
  }
}
