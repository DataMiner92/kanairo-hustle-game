import { PlayerPosition, PlayerStats, WeatherType, Mission, NPC, DialogueNode, Building, RestrictedZone } from '../types';
import { BUILDINGS, RESTRICTED_HUSTLE_ZONES } from '../data/zones';
import { soundEngine } from '../audio/soundEngine';
import { particleSystem } from '../engine/particleSystem';

export type KanjoAIState = 'PATROL' | 'SUSPICIOUS' | 'PURSUIT' | 'CONFRONT' | 'COOLDOWN';

export interface KanjoOfficer {
  id: string;
  name: string;
  title: string;
  x: number;
  y: number;
  rotation: number;
  speed: number;
  state: KanjoAIState;
  suspicion: number;          // 0 to 100
  targetX: number;
  targetY: number;
  wanderTimer: number;
  currentSpeech: string;
  speechTimer: number;
  whistleTimer: number;
  lostSightTimer: number;
  chaseDuration: number;
  activeZone: RestrictedZone | null;
  isActive: boolean;
  spawnTimer: number;
}

function lineIntersectsSegment(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 0.0001) return false;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

function lineIntersectsBuilding(x1: number, y1: number, x2: number, y2: number, b: Building): boolean {
  const minX = b.x;
  const maxX = b.x + b.width;
  const minY = b.y;
  const maxY = b.y + b.height;

  // Check if either point is inside building
  if (x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY) return true;
  if (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY) return true;

  // Test 4 edges
  return (
    lineIntersectsSegment(x1, y1, x2, y2, minX, minY, maxX, minY) ||
    lineIntersectsSegment(x1, y1, x2, y2, maxX, minY, maxX, maxY) ||
    lineIntersectsSegment(x1, y1, x2, y2, maxX, maxY, minX, maxY) ||
    lineIntersectsSegment(x1, y1, x2, y2, minX, maxY, minX, minY)
  );
}

export class KanjoSystem {
  public officer: KanjoOfficer = {
    id: 'npc_kanjo_mutua',
    name: 'Officer Mutua',
    title: 'Nairobi County City Inspector',
    x: 3600,
    y: 880,
    rotation: 0,
    speed: 0.9,
    state: 'PATROL',
    suspicion: 0,
    targetX: 3600,
    targetY: 880,
    wanderTimer: 2,
    currentSpeech: 'Nairobi County Enforcement. Hakuna biashara bila permit!',
    speechTimer: 5,
    whistleTimer: 0,
    lostSightTimer: 0,
    chaseDuration: 0,
    activeZone: null,
    isActive: true,
    spawnTimer: 0,
  };

  private ambientPatrolPoints: { x: number; y: number }[] = [
    { x: 3550, y: 820 },  // Luthuli Avenue
    { x: 3750, y: 920 },  // Luthuli Corner
    { x: 3450, y: 1300 }, // Tom Mboya loading
    { x: 3700, y: 1400 }, // Commercial stage
    { x: 4050, y: 1350 }, // Marikiti Curbside
    { x: 4400, y: 1320 }, // Kanjo Depot Gate
    { x: 4800, y: 950 },  // Bank Plaza
  ];

  /**
   * Determine if an (x, y) location is within a designated restricted hustle zone
   */
  public getRestrictedZoneAt(x: number, y: number): RestrictedZone | null {
    for (const z of RESTRICTED_HUSTLE_ZONES) {
      if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) {
        return z;
      }
    }
    return null;
  }

  /**
   * Check if player is actively engaged in street hustles (selling, deliveries, fares, sprinting)
   */
  public isPlayerHustling(
    pos: PlayerPosition,
    stats: PlayerStats,
    activeMission: Mission | null,
    zone: RestrictedZone | null
  ): boolean {
    if (!zone) return false;

    // Carrying commercial missions in restricted zone
    if (activeMission && activeMission.status === 'ACTIVE') {
      return true;
    }

    // Commercial touting/driving in restricted zone without license
    if (pos.isInVehicle) {
      return true;
    }

    // Sprinting or moving suspiciously in restricted zone
    if (pos.isSprinting && stats.policeHeat >= 10) {
      return true;
    }

    // Any street presence in high-risk zones without license counts as illegal vending
    if (zone.riskFactor >= 4) {
      return true;
    }

    return stats.policeHeat > 0;
  }

  /**
   * Line of sight raycast with building occlusion
   */
  public hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    for (const b of BUILDINGS) {
      if (lineIntersectsBuilding(x1, y1, x2, y2, b)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Spawns or relocates Kanjo Officer to a patrol spot near player
   */
  public spawnNearPlayer(pos: PlayerPosition) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 320 + Math.random() * 120;
    const spawnX = Math.max(100, Math.min(5300, pos.x + Math.cos(angle) * dist));
    const spawnY = Math.max(200, Math.min(2200, pos.y + Math.sin(angle) * dist));

    this.officer.x = spawnX;
    this.officer.y = spawnY;
    this.officer.targetX = pos.x + (Math.random() - 0.5) * 150;
    this.officer.targetY = pos.y + (Math.random() - 0.5) * 150;
    this.officer.state = 'PATROL';
    this.officer.suspicion = 0;
    this.officer.isActive = true;
    this.officer.currentSpeech = 'County Askaris on street inspection patrol. Tuko rada!';
    this.officer.speechTimer = 5;

    particleSystem.addFloatingText('⚠️ County Enforcement (Kanjo) spotted on patrol!', spawnX, spawnY - 30, '#eab308');
  }

  /**
   * Main 60FPS AI Update Loop for Kanjo Officer
   */
  public update(
    dt: number,
    playerPos: PlayerPosition,
    stats: PlayerStats,
    weather: WeatherType,
    activeMission: Mission | null,
    onTriggerDialogue: (node: DialogueNode) => void,
    onConfrontation: () => void
  ) {
    const o = this.officer;
    const playerZone = this.getRestrictedZoneAt(playerPos.x, playerPos.y);
    o.activeZone = playerZone;

    // Periodic Spawning near player if player enters commercial zones and officer is far
    o.spawnTimer += dt;
    const distToPlayer = Math.hypot(playerPos.x - o.x, playerPos.y - o.y);

    if (playerZone && distToPlayer > 800 && o.spawnTimer > 45) {
      o.spawnTimer = 0;
      this.spawnNearPlayer(playerPos);
    }

    // Vision calculation
    const visionRange = weather === 'RAINY' ? 170 : 250;
    const dx = playerPos.x - o.x;
    const dy = playerPos.y - o.y;
    const dist = Math.hypot(dx, dy);

    // Angle of player relative to officer's heading
    const angleToPlayer = Math.atan2(dy, dx);
    let angleDiff = angleToPlayer - o.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const inFov = Math.abs(angleDiff) <= (Math.PI / 3.6); // ~50 degrees cone
    const hasSight = dist <= visionRange && inFov && this.hasLineOfSight(o.x, o.y, playerPos.x, playerPos.y);

    const isHustlingInZone = Boolean(playerZone && this.isPlayerHustling(playerPos, stats, activeMission, playerZone));
    const hasValidPermit = Boolean(stats.hasCountyPermit);

    // AI State Machine
    if (o.state === 'PATROL') {
      o.speed = 1.0;

      // Wander navigation
      o.wanderTimer -= dt;
      if (o.wanderTimer <= 0) {
        o.wanderTimer = 4 + Math.random() * 4;
        // Pick new patrol point
        if (playerZone && Math.random() < 0.6) {
          // Patrol inside the restricted zone
          o.targetX = playerZone.x + Math.random() * playerZone.width;
          o.targetY = playerZone.y + Math.random() * playerZone.height;
        } else {
          const pt = this.ambientPatrolPoints[Math.floor(Math.random() * this.ambientPatrolPoints.length)];
          o.targetX = pt.x + (Math.random() - 0.5) * 80;
          o.targetY = pt.y + (Math.random() - 0.5) * 80;
        }
      }

      // Move towards target
      const tdx = o.targetX - o.x;
      const tdy = o.targetY - o.y;
      const tDist = Math.hypot(tdx, tdy);
      if (tDist > 16) {
        o.rotation = Math.atan2(tdy, tdx);
        o.x += Math.cos(o.rotation) * o.speed * 60 * dt;
        o.y += Math.sin(o.rotation) * o.speed * 60 * dt;
      }

      // Check detection
      if (hasSight && isHustlingInZone) {
        if (hasValidPermit) {
          // Acknowledge legitimate permit
          o.currentSpeech = 'Nimeona permit yako kiongozi, endelea na kazi safi.';
          o.speechTimer = 4;
        } else {
          // Suspicion rises!
          o.state = 'SUSPICIOUS';
          o.currentSpeech = 'Ehe! Nani huyo anapiga biashara hapo bila permit?!';
          particleSystem.addFloatingText('⚠️ Kanjo Suspicious Eye! 👁️', o.x, o.y - 30, '#f59e0b');
        }
      } else {
        o.suspicion = Math.max(0, o.suspicion - dt * 15);
      }
    } else if (o.state === 'SUSPICIOUS') {
      // Turn and face player
      o.rotation = angleToPlayer;
      o.speed = 1.3;

      if (hasSight && isHustlingInZone && !hasValidPermit) {
        // Suspicion meter rises rapidly
        o.suspicion += dt * 55;
        o.x += Math.cos(o.rotation) * o.speed * 60 * dt;
        o.y += Math.sin(o.rotation) * o.speed * 60 * dt;

        if (o.suspicion >= 100) {
          o.state = 'PURSUIT';
          o.chaseDuration = 0;
          o.lostSightTimer = 0;
          soundEngine.playKanjoWhistle();
          o.currentSpeech = 'SIMAMA HAPO! Weka hiyo mzigo chini sasa hivi!';
          particleSystem.addFloatingText('🚨 KANJO AMBUSH! "SIMAMA HAPO!" 📢', o.x, o.y - 35, '#ef4444');

          // Increase police heat
          stats.policeHeat = Math.min(100, Math.max(stats.policeHeat + 25, 45));
        }
      } else {
        // Player broke sight or stopped hustling
        o.suspicion -= dt * 25;
        if (o.suspicion <= 0) {
          o.state = 'PATROL';
          o.currentSpeech = 'Acha nione kama kuna wengine...';
        }
      }
    } else if (o.state === 'PURSUIT') {
      o.speed = 2.1; // Sprint speed
      o.chaseDuration += dt;

      // Whistle periodic blast
      o.whistleTimer += dt;
      if (o.whistleTimer >= 4.0) {
        o.whistleTimer = 0;
        soundEngine.playKanjoWhistle();
        particleSystem.addFloatingText('FIIIIIIIIT! 📢', o.x, o.y - 25, '#fbbf24');
      }

      // Chase directly towards player
      o.rotation = Math.atan2(dy, dx);
      o.x += Math.cos(o.rotation) * o.speed * 60 * dt;
      o.y += Math.sin(o.rotation) * o.speed * 60 * dt;

      // Catch player condition: within 44px
      if (dist < 46) {
        o.state = 'CONFRONT';
        soundEngine.playCollision();
        onConfrontation();
        return;
      }

      // Evasion detection
      if (!hasSight) {
        o.lostSightTimer += dt;
        if (o.lostSightTimer >= 7.5 || dist > 450) {
          // Successfully evaded!
          o.state = 'COOLDOWN';
          o.suspicion = 0;
          o.wanderTimer = 3;
          o.currentSpeech = 'Amehepa kwa chochoro... lakini tutamweka kwa rada!';
          particleSystem.addFloatingText('💨 ESCAPED KANJO PURSUIT! (-15 Heat)', playerPos.x, playerPos.y - 30, '#22c55e');
          stats.policeHeat = Math.max(0, stats.policeHeat - 15);
        }
      } else {
        o.lostSightTimer = 0;
      }
    } else if (o.state === 'COOLDOWN') {
      o.speed = 0.7;
      o.wanderTimer -= dt;
      if (o.wanderTimer <= 0) {
        o.state = 'PATROL';
        o.wanderTimer = 4;
      }
    }

    // Ambient Speech Timer
    o.speechTimer -= dt;
    if (o.speechTimer <= 0) {
      o.speechTimer = 8 + Math.random() * 8;
      if (o.state === 'PATROL') {
        const lines = [
          'Hakuna street vending bila official county receipt!',
          'Hapa Luthuli avenue hairuhusiwi kupanga bidhaa kwa pavements.',
          'Wenye vibanda lazima wawe na leseni halali ya Nairobi City County.',
          'Ukikamatwa na bidhaa za magendo, City Hall inakungoja.',
        ];
        o.currentSpeech = lines[Math.floor(Math.random() * lines.length)];
      }
    }
  }

  /**
   * Convert officer into an NPC entity to seamlessly feed into 3D rendering and minimap
   */
  public toNPC(): NPC {
    const o = this.officer;
    return {
      id: o.id,
      name: `${o.name} (${o.state === 'PURSUIT' ? '🚨 PURSUIT' : 'Kanjo'})`,
      nickname: 'County Askari',
      occupation: 'Nairobi County Enforcement',
      personality: 'Strict, alert, vigilant, enforcement-minded',
      x: o.x,
      y: o.y,
      rotation: o.rotation,
      speed: o.speed,
      zone: o.activeZone ? o.activeZone.id : 'cbd',
      relationship: 15,
      dialogueId: 'dlg_mutua_start',
      color: o.state === 'PURSUIT' ? '#ef4444' : '#eab308',
      isImportant: true,
      role: 'KANJO',
      idleSpeechTimer: o.speechTimer,
      currentSpeech: o.currentSpeech,
      hasUmbrella: false,
    };
  }
}
