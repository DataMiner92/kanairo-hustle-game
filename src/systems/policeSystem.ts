import { PlayerPosition, PlayerStats, Vehicle, HeatLevel } from '../types';
import { soundEngine } from '../audio/soundEngine';
import { particleSystem } from '../engine/particleSystem';

export class PoliceSystem {
  public isPolicePursuitActive: boolean = false;
  private heatDecayTimer: number = 0;

  public getHeatLevel(heat: number): HeatLevel {
    if (heat >= 80) return 'PURSUIT';
    if (heat >= 60) return 'SEARCH';
    if (heat >= 40) return 'WANTED';
    if (heat >= 20) return 'SUSPICIOUS';
    return 'NORMAL';
  }

  public update(
    dt: number,
    stats: PlayerStats,
    playerPos: PlayerPosition,
    vehicles: Vehicle[],
    onArrested: (fine: number) => void
  ) {
    // Passive heat decay when laying low
    this.heatDecayTimer += dt;
    if (this.heatDecayTimer >= 15) {
      this.heatDecayTimer = 0;
      if (stats.policeHeat > 0) {
        stats.policeHeat = Math.max(0, stats.policeHeat - 1);
      }
    }

    const heatLevel = this.getHeatLevel(stats.policeHeat);
    this.isPolicePursuitActive = heatLevel === 'PURSUIT' || heatLevel === 'SEARCH';

    // Police vehicle AI patrol and pursuit
    for (const v of vehicles) {
      if (!v.isPolicePatrol) continue;

      const dist = Math.hypot(playerPos.x - v.x, playerPos.y - v.y);

      if (stats.policeHeat >= 40 && dist < 500) {
        // Pursuit behavior: steer towards player
        const targetAngle = Math.atan2(playerPos.y - v.y, playerPos.x - v.x);
        v.rotation = targetAngle;
        v.speed = Math.min(v.maxSpeed, v.speed + v.acceleration * 60 * dt);

        v.x += Math.cos(v.rotation) * v.speed * 60 * dt;
        v.y += Math.sin(v.rotation) * v.speed * 60 * dt;

        // Arrest condition: within 45px
        if (dist < 48) {
          this.executeArrest(stats, playerPos, onArrested);
          break;
        }
      }
    }
  }

  private executeArrest(
    stats: PlayerStats,
    playerPos: PlayerPosition,
    onArrested: (fine: number) => void
  ) {
    // Bail fine calculation
    const fine = Math.min(stats.money, 450);
    stats.money -= fine;
    stats.policeHeat = 10;

    // Relocate to Kayole Police Post
    playerPos.x = 535;
    playerPos.y = 1260;
    playerPos.isInVehicle = false;
    playerPos.vehicleId = null;

    soundEngine.setPoliceSiren(false);
    soundEngine.playCollision();
    particleSystem.addFloatingText('BUSTED BY POLICE! 🚨', playerPos.x, playerPos.y - 30, '#ef4444');

    onArrested(fine);
  }
}
