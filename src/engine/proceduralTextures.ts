import * as THREE from 'three';

/**
 * Procedural Canvas Textures for Kanairo: Mtaa Hustle 3D
 * Generates all textures procedurally without any external image dependencies.
 */

export class TextureFactory {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();
  private static maxAnisotropy: number = 4;

  public static init(renderer: THREE.WebGLRenderer) {
    this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  private static configureTexture(tex: THREE.CanvasTexture, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = this.maxAnisotropy;
    tex.needsUpdate = true;
    return tex;
  }

  /**
   * Asphalt Road with yellow center dashed line and white side curbs
   */
  public static getRoadTexture(): THREE.CanvasTexture {
    const key = 'road_asphalt';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base asphalt
    ctx.fillStyle = '#24272c';
    ctx.fillRect(0, 0, 512, 512);

    // Asphalt noise grain
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(25 + Math.random() * 30);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }

    // Yellow dashed center stripe
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 12;
    ctx.setLineDash([48, 36]);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();

    // Solid white shoulder lines
    ctx.setLineDash([]);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(24, 512);
    ctx.moveTo(488, 0);
    ctx.lineTo(488, 512);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.configureTexture(tex, 1, 4);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Corrugated Iron Mabati Roof
   */
  public static getMabatiRoofTexture(color: string = '#78909c'): THREE.CanvasTexture {
    const key = `mabati_${color}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);

    // Corrugation ridges
    const ridgeWidth = 16;
    for (let x = 0; x < 256; x += ridgeWidth) {
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(x, 0, ridgeWidth / 2, 256);
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fillRect(x + ridgeWidth / 2, 0, ridgeWidth / 2, 256);
    }

    // Rust spots
    for (let i = 0; i < 20; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      const rad = Math.random() * 12 + 4;
      ctx.fillStyle = 'rgba(160, 60, 30, 0.45)';
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.configureTexture(tex, 2, 2);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Pavement / Sidewalk Concrete Pavers
   */
  public static getPavementTexture(): THREE.CanvasTexture {
    const key = 'pavement_slabs';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 256, 256);

    // Paver grid
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    const step = 64;
    for (let i = 0; i <= 256; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    // Pavement curb edge
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 256, 12);

    const tex = new THREE.CanvasTexture(canvas);
    this.configureTexture(tex, 4, 4);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Dirt / Earth ground for Kayole estates
   */
  public static getKayoleDirtTexture(): THREE.CanvasTexture {
    const key = 'kayole_dirt';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Rich Kenyan reddish-brown soil
    ctx.fillStyle = '#7c4a2d';
    ctx.fillRect(0, 0, 256, 256);

    // Dirt noise & pebbles
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const tone = Math.random() > 0.5 ? 'rgba(100, 50, 20, 0.4)' : 'rgba(160, 110, 70, 0.35)';
      ctx.fillStyle = tone;
      ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.configureTexture(tex, 8, 8);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Shop Signboard
   */
  public static getSignTexture(text: string, bgColor: string, textColor: string = '#ffffff'): THREE.CanvasTexture {
    const key = `sign_${text}_${bgColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 128);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 120);

    // Text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    this.configureTexture(tex, 1, 1);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Nganya Matatu Graffiti Side Decal
   */
  public static getMatatuGraffitiTexture(): THREE.CanvasTexture {
    const key = 'matatu_graffiti';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Vibrant background gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#f43f5e');
    grad.addColorStop(0.5, '#8b5cf6');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Dynamic racing stripes
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(512, 110);
    ctx.lineTo(512, 140);
    ctx.lineTo(0, 210);
    ctx.fill();

    // Bold Matatu Typography
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 48px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.fillText('KIBOKO YA BARABARA', 256, 75);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Arial Black", sans-serif';
    ctx.fillText('★ ROUTE 19 • NAIROBI VIBES ★', 256, 140);

    // Bass / Subwoofer icon art
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('⚡ 10,000 WATTS PURE STEREO ⚡', 256, 210);

    const tex = new THREE.CanvasTexture(canvas);
    this.configureTexture(tex, 1, 1);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Skyscraper Glass Grid Texture
   */
  public static getSkyscraperWindowsTexture(tint: string = '#0284c7'): THREE.CanvasTexture {
    const key = `windows_${tint}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 512);

    const cols = 8;
    const rows = 16;
    const cellW = 256 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Some windows lit up, some reflecting sky
        const isLit = Math.random() > 0.45;
        ctx.fillStyle = isLit ? '#fef08a' : tint;
        ctx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.configureTexture(tex, 2, 4);
    this.cache.set(key, tex);
    return tex;
  }
}
