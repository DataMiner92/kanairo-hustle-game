import { Vehicle, PlayerPosition, PlayerStats, WeatherType } from '../types';
import { soundEngine } from '../audio/soundEngine';
import { particleSystem } from '../engine/particleSystem';
import { BUILDINGS, WORLD_WIDTH, WORLD_HEIGHT } from '../data/zones';

export class VehicleSystem {
  private passengerBoardingTimer: number = 0;

  public update(
    dt: number,
    vehicles: Vehicle[],
    playerPos: PlayerPosition,
    playerStats: PlayerStats,
    keys: Record<string, boolean>,
    onMoneyEarned?: (amount: number, reason: string) => void,
    weather: WeatherType = 'SUNNY',
    waypoint?: { x: number; y: number } | null,
    onWaypointReached?: () => void
  ) {
    for (const v of vehicles) {
      if (v.type === 'MATATU') {
        // In Nairobi rain, matatu fares surge to Ksh 110!
        v.farePerPassenger = weather === 'RAINY' ? 110 : 70;
      }

      if (v.isDrivenByPlayer) {
        // Player is driving this vehicle!
        let throttle = 0;
        let steer = 0;

        if (keys['KeyW'] || keys['ArrowUp']) throttle += 1;
        if (keys['KeyS'] || keys['ArrowDown']) throttle -= 0.8;
        if (keys['KeyA'] || keys['ArrowLeft']) steer -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) steer += 1;

        const hasManualKey = throttle !== 0 || steer !== 0;

        // Mouse click navigation for vehicle
        if (!hasManualKey && waypoint) {
          const dx = waypoint.x - v.x;
          const dy = waypoint.y - v.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 45) {
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - v.rotation;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (angleDiff > 0.15) steer = 1;
            else if (angleDiff < -0.15) steer = -1;

            throttle = Math.cos(angleDiff) > 0.15 ? 1 : 0.45;
          } else {
            if (onWaypointReached) onWaypointReached();
          }
        }

        // Honk horn on Space
        if (keys['Space']) {
          soundEngine.playMatatuHorn();
          keys['Space'] = false; // consume
          particleSystem.addFloatingText('PEEEP PEEEP! 📯', v.x, v.y - 20, '#fbbf24');
        }

        // Steering sensitivity scales with speed
        if (Math.abs(v.speed) > 0.2) {
          const steerSpeed = v.type === 'BODA' ? 3.0 : 2.2;
          v.rotation += steer * steerSpeed * dt * Math.sign(v.speed);
        }

        // Acceleration / Deceleration
        if (throttle !== 0) {
          const accel = throttle > 0 ? v.acceleration : v.acceleration * 1.5;
          v.speed += throttle * accel * 60 * dt;
          v.speed = Math.max(-v.maxSpeed * 0.4, Math.min(v.maxSpeed, v.speed));
          // Emit exhaust / wet spray smoke
          if (Math.random() < 0.3) {
            particleSystem.addSmoke(
              v.x - Math.cos(v.rotation) * 35,
              v.y - Math.sin(v.rotation) * 35,
              -Math.cos(v.rotation) * 20,
              -Math.sin(v.rotation) * 20,
              weather === 'RAINY' ? 'rgba(200, 230, 255, 0.5)' : undefined
            );
          }
        } else {
          // Friction / Coasting (wet asphalt is slicker)
          const frictionDecay = weather === 'RAINY' ? 1.5 : 2.2;
          v.speed *= Math.max(0, 1 - dt * frictionDecay);
        }

        // Update velocity
        v.vx = Math.cos(v.rotation) * v.speed * 60;
        v.vy = Math.sin(v.rotation) * v.speed * 60;

        // Sound engine feedback
        soundEngine.updateEngine(true, Math.abs(v.speed) / v.maxSpeed);

        // Building collision
        const nextX = v.x + v.vx * dt;
        const nextY = v.y + v.vy * dt;
        let collided = false;

        for (const b of BUILDINGS) {
          if (
            nextX + 25 > b.x &&
            nextX - 25 < b.x + b.width &&
            nextY + 25 > b.y &&
            nextY - 25 < b.y + b.height
          ) {
            collided = true;
            v.speed = -v.speed * 0.3; // Rebound
            soundEngine.playCollision();
            particleSystem.addFloatingText('CRASH! 💥', v.x, v.y - 25, '#ef4444');
            break;
          }
        }

        if (!collided) {
          v.x = Math.max(30, Math.min(WORLD_WIDTH - 30, nextX));
          v.y = Math.max(30, Math.min(WORLD_HEIGHT - 30, nextY));
        }

        // Sync player position with vehicle
        playerPos.x = v.x;
        playerPos.y = v.y;
        playerPos.rotation = v.rotation;

        // Matatu passenger route pickup / dropoff system
        if (v.type === 'MATATU') {
          this.handleMatatuStageHustle(dt, v, onMoneyEarned);
        }
      } else {
        // AI vehicle traffic cruise along roads
        this.updateAIVehicle(dt, v);
      }
    }
  }

  private handleMatatuStageHustle(
    dt: number,
    v: Vehicle,
    onMoneyEarned?: (amount: number, reason: string) => void
  ) {
    // Check if near Kayole Stage (x: 1200-1420, y: 1440-1560) or CBD Koja (x: 3450-3730, y: 1350-1500)
    const nearKayoleStage = Math.hypot(v.x - 1310, v.y - 1540) < 130;
    const nearCbdStage = Math.hypot(v.x - 3590, v.y - 1480) < 140;

    if (Math.abs(v.speed) < 1.0 && (nearKayoleStage || nearCbdStage)) {
      this.passengerBoardingTimer += dt;
      if (this.passengerBoardingTimer >= 2.0) {
        this.passengerBoardingTimer = 0;

        if (nearKayoleStage && v.passengers < v.maxPassengers) {
          const boardCount = Math.min(3, v.maxPassengers - v.passengers);
          v.passengers += boardCount;
          const fareCollected = boardCount * v.farePerPassenger;
          particleSystem.addFloatingText(`+${boardCount} Abiria! (+Ksh ${fareCollected})`, v.x, v.y - 35, '#22c55e');
          soundEngine.playCashRegister();
          if (onMoneyEarned) {
            onMoneyEarned(fareCollected, `Matatu Fare from Kayole Stage (${boardCount} passengers)`);
          }
        } else if (nearCbdStage && v.passengers > 0) {
          const dropCount = Math.min(4, v.passengers);
          v.passengers -= dropCount;
          const fareCollected = dropCount * v.farePerPassenger;
          particleSystem.addFloatingText(`Dropped ${dropCount} in CBD (+Ksh ${fareCollected})`, v.x, v.y - 35, '#22c55e');
          soundEngine.playCashRegister();
          if (onMoneyEarned) {
            onMoneyEarned(fareCollected, `Matatu Dropoff at Koja CBD (${dropCount} passengers)`);
          }
        }
      }
    }
  }

  private updateAIVehicle(dt: number, v: Vehicle) {
    // Simple autonomous traffic along the main East-West corridor
    if (v.type === 'CIVILIAN_CAR' || v.type === 'POLICE_CAR') {
      v.x += Math.cos(v.rotation) * v.speed * 60 * dt;

      // Wrap around road bounds
      if (v.x > 5000) {
        v.x = 1850;
      } else if (v.x < 1800) {
        v.x = 4950;
      }
    }
  }

  public tryEnterOrExitVehicle(playerPos: PlayerPosition, vehicles: Vehicle[]): boolean {
    if (playerPos.isInVehicle && playerPos.vehicleId) {
      // Exit vehicle
      const currentVeh = vehicles.find((v) => v.id === playerPos.vehicleId);
      if (currentVeh) {
        currentVeh.isDrivenByPlayer = false;
        currentVeh.speed = 0;
        playerPos.isInVehicle = false;
        playerPos.vehicleId = null;
        // Place player safely to the left of vehicle
        playerPos.x = currentVeh.x - Math.sin(currentVeh.rotation) * 35;
        playerPos.y = currentVeh.y + Math.cos(currentVeh.rotation) * 35;
        soundEngine.updateEngine(false, 0);
        particleSystem.addFloatingText('Exited Vehicle', playerPos.x, playerPos.y - 20, '#94a3b8');
        return true;
      }
    } else {
      // Check if near any vehicle
      for (const v of vehicles) {
        const dist = Math.hypot(playerPos.x - v.x, playerPos.y - v.y);
        if (dist < 60) {
          v.isDrivenByPlayer = true;
          playerPos.isInVehicle = true;
          playerPos.vehicleId = v.id;
          soundEngine.updateEngine(true, 0.2);
          soundEngine.playUiClick();
          particleSystem.addFloatingText(`Driving ${v.name}! 🚐`, v.x, v.y - 25, '#fbbf24');
          return true;
        }
      }
    }
    return false;
  }
}
