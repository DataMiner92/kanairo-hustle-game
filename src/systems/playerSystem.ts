import { PlayerPosition, PlayerStats, WeatherType } from '../types';
import { BUILDINGS, WORLD_WIDTH, WORLD_HEIGHT } from '../data/zones';

export class PlayerSystem {
  private hungerTickTimer: number = 0;
  private energyRegenTimer: number = 0;

  public update(
    dt: number,
    pos: PlayerPosition,
    stats: PlayerStats,
    keys: Record<string, boolean>,
    virtualInput?: { dx: number; dy: number; isSprinting: boolean },
    weather: WeatherType = 'SUNNY',
    waypoint?: { x: number; y: number; isSprinting?: boolean } | null,
    onWaypointReached?: () => void
  ) {
    if (pos.isInVehicle) {
      // In vehicle physics are handled by vehicleSystem
      return;
    }

    // Determine movement direction from keyboard, touch, or mouse click-to-move
    let moveX = 0;
    let moveY = 0;

    if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

    if (virtualInput) {
      if (Math.abs(virtualInput.dx) > 0.1) moveX += virtualInput.dx;
      if (Math.abs(virtualInput.dy) > 0.1) moveY += virtualInput.dy;
    }

    const hasManualSteering = Math.hypot(moveX, moveY) > 0.05;
    let waypointSprint = false;

    // Mouse click-to-move waypoint navigation when no manual keyboard input is pressed
    if (!hasManualSteering && waypoint) {
      const dx = waypoint.x - pos.x;
      const dy = waypoint.y - pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 18) {
        moveX = dx / dist;
        moveY = dy / dist;
        if (waypoint.isSprinting) {
          waypointSprint = true;
        }
      } else {
        if (onWaypointReached) {
          onWaypointReached();
        }
      }
    }

    const isMoving = Math.hypot(moveX, moveY) > 0.05;
    const canSprint = Boolean(
      (keys['ShiftLeft'] || keys['ShiftRight'] || virtualInput?.isSprinting || waypointSprint) &&
      stats.energy > 5
    );
    pos.isSprinting = Boolean(canSprint && isMoving);

    // Movement speed calculations
    let baseSpeed = 160; // pixels per second
    if (weather === 'RAINY') {
      baseSpeed *= 0.82; // Nairobi mud and downpour slows walking pace
    }
    if (stats.hunger <= 10) baseSpeed *= 0.65; // Starving slows movement
    if (pos.isSprinting) {
      baseSpeed *= 1.75;
      stats.energy = Math.max(0, stats.energy - dt * 12);
    } else {
      // Normal walk slowly regenerates energy
      stats.energy = Math.min(100, stats.energy + dt * 6);
    }

    if (isMoving) {
      const len = Math.hypot(moveX, moveY);
      const normX = moveX / len;
      const normY = moveY / len;

      const targetVx = normX * baseSpeed;
      const targetVy = normY * baseSpeed;

      pos.vx += (targetVx - pos.vx) * Math.min(1.0, dt * 14);
      pos.vy += (targetVy - pos.vy) * Math.min(1.0, dt * 14);

      pos.rotation = Math.atan2(pos.vy, pos.vx);
    } else {
      pos.vx *= Math.max(0, 1 - dt * 12);
      pos.vy *= Math.max(0, 1 - dt * 12);
    }

    // Attempt position update with collision checking
    const nextX = pos.x + pos.vx * dt;
    const nextY = pos.y + pos.vy * dt;

    // Check collision with buildings
    const playerRadius = 14;
    let collidedX = false;
    let collidedY = false;

    for (const b of BUILDINGS) {
      // Check X collision
      if (
        nextX + playerRadius > b.x &&
        nextX - playerRadius < b.x + b.width &&
        pos.y + playerRadius > b.y &&
        pos.y - playerRadius < b.y + b.height
      ) {
        collidedX = true;
      }

      // Check Y collision
      if (
        pos.x + playerRadius > b.x &&
        pos.x - playerRadius < b.x + b.width &&
        nextY + playerRadius > b.y &&
        nextY - playerRadius < b.y + b.height
      ) {
        collidedY = true;
      }
    }

    if (!collidedX) {
      pos.x = Math.max(playerRadius, Math.min(WORLD_WIDTH - playerRadius, nextX));
    }
    if (!collidedY) {
      pos.y = Math.max(playerRadius, Math.min(WORLD_HEIGHT - playerRadius, nextY));
    }

    // Hunger depletion over time (every 10 seconds loses 1% hunger)
    this.hungerTickTimer += dt;
    if (this.hungerTickTimer >= 10) {
      this.hungerTickTimer = 0;
      stats.hunger = Math.max(0, stats.hunger - 1);
      if (stats.hunger <= 0) {
        stats.health = Math.max(10, stats.health - 2); // Starvation damage
      }
    }
  }
}
