import { Camera } from './camera';
import { ParticleSystem } from './particleSystem';
import { Building, NPC, Vehicle, PlayerPosition, PlayerStats, Mission, WeatherType } from '../types';
import { BUILDINGS, ROADS, WORLD_WIDTH, WORLD_HEIGHT } from '../data/zones';

export class GameRenderer {
  private streetLightRadius: number = 180;
  private rainDrops: { x: number; y: number; length: number; speed: number; alpha: number }[] = [];
  private ripples: { x: number; y: number; r: number; maxR: number; alpha: number }[] = [];
  private clouds: { x: number; y: number; rx: number; ry: number; speed: number }[] = [];

  constructor() {
    // Initialize procedural raindrops
    for (let i = 0; i < 280; i++) {
      this.rainDrops.push({
        x: Math.random() * 2500,
        y: Math.random() * 1500,
        length: 12 + Math.random() * 16,
        speed: 550 + Math.random() * 250,
        alpha: 0.35 + Math.random() * 0.45,
      });
    }

    // Initialize procedural drifting clouds
    for (let i = 0; i < 9; i++) {
      this.clouds.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        rx: 220 + Math.random() * 260,
        ry: 140 + Math.random() * 160,
        speed: 20 + Math.random() * 30,
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    playerPos: PlayerPosition,
    playerStats: PlayerStats,
    npcs: NPC[],
    vehicles: Vehicle[],
    activeMission: Mission | null,
    interactableTarget: { label: string; x: number; y: number } | null,
    gameTime: { day: number; hour: number; minute: number },
    particles: ParticleSystem,
    weather: WeatherType = 'SUNNY',
    dt: number = 0.016
  ) {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    const offset = camera.getScreenOffset();
    ctx.translate(offset.x, offset.y);
    ctx.scale(camera.zoom, camera.zoom);

    // 1. Terrain & Base Grounds
    this.renderTerrain(ctx);

    // 2. Cloud shadows on terrain (if cloudy or rainy)
    this.renderClouds(ctx, weather, dt);

    // 3. Roads & Crossings (with wet road sheen if rainy)
    this.renderRoads(ctx, weather);

    // 4. Ground Water Puddle Ripples (if rainy)
    if (weather === 'RAINY') {
      this.renderPuddleRipples(ctx, camera, dt);
    }

    // 5. Buildings & Architecture
    this.renderBuildings(ctx, interactableTarget);

    // 6. Vehicles
    this.renderVehicles(ctx, vehicles);

    // 7. NPCs (with umbrellas if rainy)
    this.renderNPCs(ctx, npcs, playerPos, weather);

    // 8. Player (if not in vehicle)
    if (!playerPos.isInVehicle) {
      this.renderPlayer(ctx, playerPos, playerStats, weather);
    }

    // 9. Particles
    particles.render(ctx);

    // 10. Interaction Indicator Ring
    if (interactableTarget) {
      this.renderInteractionRing(ctx, interactableTarget);
    }

    // 11. Day / Night & Weather Atmospheric Lighting
    this.renderAtmosphereAndLights(ctx, gameTime, playerPos, vehicles, weather);

    // 12. Falling Rain Streaks & Splashes (if rainy)
    if (weather === 'RAINY') {
      this.renderRainStreaks(ctx, camera, dt);
    }

    // 13. GPS Compass Arrow (In-world directional navigation to active mission)
    if (activeMission && activeMission.targetLocation) {
      this.renderGpsCompass(ctx, playerPos, activeMission.targetLocation);
    }

    ctx.restore();
  }

  private renderTerrain(ctx: CanvasRenderingContext2D) {
    // Kayole base: dusty earth & urban texture
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, 0, 1800, WORLD_HEIGHT);

    // Highway corridor: green verge & gravel
    ctx.fillStyle = '#33691e';
    ctx.fillRect(1800, 0, 1400, WORLD_HEIGHT);

    // CBD: modern urban concrete / pavers
    ctx.fillStyle = '#37474f';
    ctx.fillRect(3200, 0, WORLD_WIDTH - 3200, WORLD_HEIGHT);

    // Grid details & sidewalk curbs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const step = 80;
    for (let x = 0; x < WORLD_WIDTH; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < WORLD_HEIGHT; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }
  }

  private renderClouds(ctx: CanvasRenderingContext2D, weather: WeatherType, dt: number) {
    if (weather === 'SUNNY') return;

    const baseAlpha = weather === 'CLOUDY' ? 0.16 : 0.28;
    ctx.save();
    ctx.fillStyle = `rgba(15, 23, 42, ${baseAlpha})`;

    for (const c of this.clouds) {
      c.x += c.speed * dt;
      c.y += (c.speed * 0.3) * dt;

      if (c.x - c.rx > WORLD_WIDTH) c.x = -c.rx;
      if (c.y - c.ry > WORLD_HEIGHT) c.y = -c.ry;

      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rx, c.ry, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderPuddleRipples(ctx: CanvasRenderingContext2D, camera: Camera, dt: number) {
    if (Math.random() < 0.35 && this.ripples.length < 35) {
      const halfW = (camera.viewportWidth / 2) / camera.zoom;
      const halfH = (camera.viewportHeight / 2) / camera.zoom;
      const rx = camera.x - halfW + Math.random() * (halfW * 2);
      const ry = camera.y - halfH + Math.random() * (halfH * 2);

      this.ripples.push({
        x: rx,
        y: ry,
        r: 2,
        maxR: 12 + Math.random() * 14,
        alpha: 0.6,
      });
    }

    ctx.save();
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.r += dt * 26;
      rip.alpha = Math.max(0, 0.6 * (1 - rip.r / rip.maxR));

      ctx.strokeStyle = `rgba(186, 230, 253, ${rip.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.r, rip.r * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (rip.r >= rip.maxR) {
        this.ripples.splice(i, 1);
      }
    }
    ctx.restore();
  }

  private renderRoads(ctx: CanvasRenderingContext2D, weather: WeatherType = 'SUNNY') {
    for (const r of ROADS) {
      // Asphalt body
      ctx.fillStyle = r.isHighway ? '#1e293b' : '#27272a';
      ctx.fillRect(r.x, r.y, r.width, r.height);

      // Wet road gloss reflection if rainy
      if (weather === 'RAINY') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(r.x + 3, r.y + 3, r.width - 6, r.height - 6);
      }

      // Road curbs / sidewalks
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.strokeRect(r.x, r.y, r.width, r.height);

      // Road markings
      if (r.width > r.height) {
        // Horizontal road
        const centerY = r.y + r.height / 2;
        if (r.isHighway) {
          // Double yellow center lines
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(r.x, centerY - 4);
          ctx.lineTo(r.x + r.width, centerY - 4);
          ctx.moveTo(r.x, centerY + 4);
          ctx.lineTo(r.x + r.width, centerY + 4);
          ctx.stroke();

          // White dashed lane markers
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.setLineDash([20, 20]);
          ctx.beginPath();
          ctx.moveTo(r.x, r.y + r.height * 0.25);
          ctx.lineTo(r.x + r.width, r.y + r.height * 0.25);
          ctx.moveTo(r.x, r.y + r.height * 0.75);
          ctx.lineTo(r.x + r.width, r.y + r.height * 0.75);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Standard street dashed centerline
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.setLineDash([15, 15]);
          ctx.beginPath();
          ctx.moveTo(r.x, centerY);
          ctx.lineTo(r.x + r.width, centerY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        // Vertical road
        const centerX = r.x + r.width / 2;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 15]);
        ctx.beginPath();
        ctx.moveTo(centerX, r.y);
        ctx.lineTo(centerX, r.y + r.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  private renderBuildings(ctx: CanvasRenderingContext2D, interactableTarget: { label: string; x: number; y: number } | null) {
    for (const b of BUILDINGS) {
      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(b.x + 8, b.y + 10, b.width, b.height);

      // Building main body
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Roof bevel / inner styling
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(b.x + 6, b.y + 6, b.width - 12, b.height - 12);

      // Kayole iron roof lines or CBD glass tiles
      if (b.zone === 'kayole') {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 1;
        for (let py = b.y + 10; py < b.y + b.height - 10; py += 12) {
          ctx.beginPath();
          ctx.moveTo(b.x + 8, py);
          ctx.lineTo(b.x + b.width - 8, py);
          ctx.stroke();
        }
        // Black Roto water tank on roof corner
        ctx.beginPath();
        ctx.arc(b.x + 22, b.y + 22, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#18181b';
        ctx.fill();
        ctx.strokeStyle = '#3f3f46';
        ctx.stroke();
      } else if (b.zone === 'cbd') {
        // Glass grid panels
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        for (let px = b.x + 15; px < b.x + b.width - 10; px += 25) {
          ctx.beginPath();
          ctx.moveTo(px, b.y + 8);
          ctx.lineTo(px, b.y + b.height - 8);
          ctx.stroke();
        }
      }

      // Border outline
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      // Entrance Door
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(b.doorX - 14, b.doorY - 6, 28, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.doorX - 10, b.doorY - 4, 20, 6);

      // Signboard Text
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(b.x + 10, b.y + b.height - 24, b.width - 20, 20);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, b.x + b.width / 2, b.y + b.height - 10);
    }
  }

  private renderVehicles(ctx: CanvasRenderingContext2D, vehicles: Vehicle[]) {
    for (const v of vehicles) {
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.rotation);

      if (v.type === 'MATATU') {
        // --- 14-SEATER NGANYA MATATU ---
        const length = 76;
        const width = 34;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-length / 2 + 5, -width / 2 + 6, length, width);

        // Body
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(-length / 2, -width / 2, length, width, 6);
        ctx.fill();

        // Graffiti Stripes / Racing Decals
        ctx.fillStyle = v.accentColor;
        ctx.beginPath();
        ctx.moveTo(-length / 2 + 10, -width / 2);
        ctx.lineTo(-length / 2 + 40, -width / 2);
        ctx.lineTo(-length / 2 + 25, width / 2);
        ctx.lineTo(-length / 2 - 5, width / 2);
        ctx.closePath();
        ctx.fill();

        // Windshield & Windows
        ctx.fillStyle = '#1e293b';
        // Front windshield
        ctx.fillRect(length / 2 - 18, -width / 2 + 4, 10, width - 8);
        // Side windows
        ctx.fillRect(-length / 2 + 12, -width / 2 + 2, 38, 4);
        ctx.fillRect(-length / 2 + 12, width / 2 - 6, 38, 4);

        // Roof rack
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(-length / 2 + 8, -width / 2 + 6, 36, width - 12);

        // Bold Route Decal on Roof
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RT 19 KANAIRO', -4, 3);

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(length / 2 - 2, -width / 2 + 4, 4, 6);
        ctx.fillRect(length / 2 - 2, width / 2 - 10, 4, 6);

        // Tail lights
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-length / 2 - 2, -width / 2 + 4, 3, 6);
        ctx.fillRect(-length / 2 - 2, width / 2 - 10, 3, 6);

        // Wheels
        ctx.fillStyle = '#111827';
        ctx.fillRect(length / 2 - 22, -width / 2 - 3, 12, 4);
        ctx.fillRect(length / 2 - 22, width / 2 - 1, 12, 4);
        ctx.fillRect(-length / 2 + 10, -width / 2 - 3, 12, 4);
        ctx.fillRect(-length / 2 + 10, width / 2 - 1, 12, 4);

        // Passenger count badge
        if (v.passengers > 0) {
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(v.passengers.toString(), 0, 3);
        }
      } else if (v.type === 'BODA') {
        // --- BODA BODA MOTORCYCLE ---
        const length = 38;
        const width = 14;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-length / 2 + 2, -width / 2 + 2, length, width);

        // Tires
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(length / 2 - 8, -3, 9, 6);
        ctx.fillRect(-length / 2, -3, 9, 6);

        // Frame
        ctx.fillStyle = v.color;
        ctx.fillRect(-length / 2 + 8, -3, 20, 6);

        // Handlebars
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(length / 2 - 12, -7, 3, 14);

        // Rider helmet
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(-2, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (v.type === 'POLICE_CAR') {
        // --- POLICE LANDCRUISER ---
        const length = 68;
        const width = 32;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-length / 2 + 4, -width / 2 + 4, length, width);

        // Blue / white police paint
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(-length / 2, -width / 2, length, width, 5);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-length / 2 + 15, -width / 2, 28, width);

        // Police text
        ctx.fillStyle = '#0d47a1';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('POLISI', 0, 3);

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(length / 2 - 16, -width / 2 + 4, 8, width - 8);

        // Flashing siren lightbar on roof
        const timeSec = Date.now() / 150;
        const flash = Math.floor(timeSec) % 2 === 0;
        ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
        ctx.fillRect(-4, -8, 8, 16);
      } else {
        // --- CIVILIAN SEDAN / PROBOX ---
        const length = 60;
        const width = 28;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(-length / 2 + 3, -width / 2 + 3, length, width);

        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(-length / 2, -width / 2, length, width, 4);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(length / 2 - 15, -width / 2 + 3, 8, width - 6);
        ctx.fillRect(-length / 2 + 8, -width / 2 + 3, 6, width - 6);
      }

      ctx.restore();
    }
  }

  private renderNPCs(
    ctx: CanvasRenderingContext2D,
    npcs: NPC[],
    playerPos: PlayerPosition,
    weather: WeatherType = 'SUNNY'
  ) {
    for (const n of npcs) {
      // NPC Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(n.x, n.y + 12, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // NPC Body / Torso
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // NPC Head / Hair
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(n.x, n.y - 2, 7, 0, Math.PI * 2);
      ctx.fill();

      // Render Umbrella if rainy (for vendors, important NPCs, or NPCs with umbrellas)
      if (weather === 'RAINY' && (n.hasUmbrella || n.role === 'VENDOR' || n.isImportant)) {
        this.renderUmbrella(ctx, n.x, n.y - 2, n.color);
      }

      // Important NPC name banner
      if (n.isImportant) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(n.x - 35, n.y - 32, 70, 16, 4);
        ctx.fill();
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.name, n.x, n.y - 20);
      }

      // Overhead speech bubble if player is nearby (< 140px)
      const dx = playerPos.x - n.x;
      const dy = playerPos.y - n.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 140 && n.currentSpeech) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        const textWidth = Math.min(220, ctx.measureText(n.currentSpeech).width + 20);
        const bx = n.x - textWidth / 2;
        const by = n.y - 58;

        ctx.beginPath();
        ctx.roundRect(bx, by, textWidth, 24, 6);
        ctx.fill();
        ctx.stroke();

        // Speech pointer triangle
        ctx.beginPath();
        ctx.moveTo(n.x - 5, by + 24);
        ctx.lineTo(n.x, by + 30);
        ctx.lineTo(n.x + 5, by + 24);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.currentSpeech.length > 32 ? n.currentSpeech.slice(0, 32) + '...' : n.currentSpeech, n.x, by + 16);
        ctx.restore();
      }
    }
  }

  private renderUmbrella(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.save();
    // Umbrella shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x + 5, y + 12, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Canopy dome
    ctx.fillStyle = color || '#0284c7';
    ctx.beginPath();
    ctx.arc(x, y - 6, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Umbrella ribs pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 6);
    ctx.lineTo(x + 18, y - 6);
    ctx.moveTo(x, y - 24);
    ctx.lineTo(x, y + 12);
    ctx.stroke();

    // Center cap
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(x, y - 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderPlayer(
    ctx: CanvasRenderingContext2D,
    pos: PlayerPosition,
    stats: PlayerStats,
    weather: WeatherType = 'SUNNY'
  ) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.rotation);

    // Player Identification Ring
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Water foot splash when moving on foot in rain
    if (weather === 'RAINY' && (Math.abs(pos.vx) > 10 || Math.abs(pos.vy) > 10)) {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-8, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body / Jacket
    ctx.fillStyle = '#10b981'; // Fresh emerald jacket
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Backpack
    ctx.fillStyle = '#374151';
    ctx.fillRect(-8, -4, 6, 8);

    // Head with urban snapback cap
    ctx.fillStyle = '#1e1b4b'; // Dark blue cap
    ctx.beginPath();
    ctx.arc(2, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    // Cap visor pointing forward
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(8, 0, 5, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.restore();

    // Player name floating overhead
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', pos.x, pos.y - 24);
  }

  private renderInteractionRing(ctx: CanvasRenderingContext2D, target: { label: string; x: number; y: number }) {
    const pulse = (Math.sin(Date.now() / 200) + 1) * 0.5;
    const r = 24 + pulse * 6;

    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Prompt badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(target.x - 70, target.y - 48, 140, 22, 6);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`[E] ${target.label}`, target.x, target.y - 33);
    ctx.restore();
  }

  private renderAtmosphereAndLights(
    ctx: CanvasRenderingContext2D,
    gameTime: { day: number; hour: number; minute: number },
    playerPos: PlayerPosition,
    vehicles: Vehicle[],
    weather: WeatherType = 'SUNNY'
  ) {
    const hour = gameTime.hour + gameTime.minute / 60;
    let darknessAlpha = 0;

    if (hour >= 18 && hour < 20) {
      // Sunset transition
      darknessAlpha = ((hour - 18) / 2) * 0.72;
    } else if (hour >= 20 || hour < 5.5) {
      // Full night
      darknessAlpha = 0.72;
    } else if (hour >= 5.5 && hour < 7) {
      // Sunrise transition
      darknessAlpha = (1 - (hour - 5.5) / 1.5) * 0.72;
    }

    // Weather overcast tinting
    let weatherTintAlpha = 0;
    let r = 10;
    let g = 16;
    let b = 32;

    if (weather === 'CLOUDY') {
      weatherTintAlpha = 0.20;
      r = 45; g = 52; b = 64;
    } else if (weather === 'RAINY') {
      weatherTintAlpha = 0.35;
      r = 18; g = 28; b = 48;
    }

    const totalDarkness = Math.min(0.85, darknessAlpha + weatherTintAlpha);

    if (totalDarkness <= 0.05) return;

    // Apply darkness/weather overlay with soft light cutouts
    ctx.save();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${totalDarkness})`;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Warm streetlights along streets
    ctx.globalCompositeOperation = 'destination-out';

    // Player personal glow
    const playerGlow = ctx.createRadialGradient(playerPos.x, playerPos.y, 10, playerPos.x, playerPos.y, 130);
    playerGlow.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    playerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = playerGlow;
    ctx.beginPath();
    ctx.arc(playerPos.x, playerPos.y, 130, 0, Math.PI * 2);
    ctx.fill();

    // Streetlight nodes along Jogoo Road & CBD
    const lightPosts = [
      { x: 500, y: 1520 },
      { x: 900, y: 1520 },
      { x: 1300, y: 1520 },
      { x: 2000, y: 1180 },
      { x: 2400, y: 1180 },
      { x: 2800, y: 1180 },
      { x: 3500, y: 1200 },
      { x: 3900, y: 1200 },
      { x: 4300, y: 1200 },
      { x: 4700, y: 1200 },
      { x: 3750, y: 900 },
      { x: 4250, y: 900 },
    ];

    for (const lp of lightPosts) {
      const grad = ctx.createRadialGradient(lp.x, lp.y, 15, lp.x, lp.y, this.streetLightRadius);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, this.streetLightRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vehicle headlight beams
    for (const v of vehicles) {
      const hx = v.x + Math.cos(v.rotation) * 40;
      const hy = v.y + Math.sin(v.rotation) * 40;
      const headGrad = ctx.createRadialGradient(hx, hy, 10, hx, hy, 160);
      headGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
      headGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, 160, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderRainStreaks(ctx: CanvasRenderingContext2D, camera: Camera, dt: number) {
    const halfW = (camera.viewportWidth / 2) / camera.zoom;
    const halfH = (camera.viewportHeight / 2) / camera.zoom;
    const viewLeft = camera.x - halfW;
    const viewTop = camera.y - halfH;
    const viewRight = camera.x + halfW;
    const viewBottom = camera.y + halfH;

    const windAngle = 0.22; // Nairobi tropical squall wind angle
    const windX = Math.sin(windAngle);
    const windY = Math.cos(windAngle);

    ctx.save();
    ctx.lineWidth = 1.3;

    for (const drop of this.rainDrops) {
      drop.x += (windX * drop.speed) * dt;
      drop.y += (windY * drop.speed) * dt;

      // Wrap around visible viewport
      if (drop.y > viewBottom + 40 || drop.x > viewRight + 40) {
        drop.x = viewLeft - 80 + Math.random() * (halfW * 2 + 160);
        drop.y = viewTop - 50 - Math.random() * 80;
      }

      ctx.strokeStyle = `rgba(186, 230, 253, ${drop.alpha})`;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - windX * drop.length, drop.y - windY * drop.length);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderGpsCompass(ctx: CanvasRenderingContext2D, playerPos: PlayerPosition, target: { x: number; y: number; label: string }) {
    const angle = Math.atan2(target.y - playerPos.y, target.x - playerPos.x);
    const dist = Math.hypot(target.x - playerPos.x, target.y - playerPos.y);

    if (dist < 100) return; // Arrived

    const arrowRadius = 45;
    const ax = playerPos.x + Math.cos(angle) * arrowRadius;
    const ay = playerPos.y + Math.sin(angle) * arrowRadius;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}
