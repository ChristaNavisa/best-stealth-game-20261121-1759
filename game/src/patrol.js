// patrol.js — a guard's walk: follow waypoints, pause at each one, turn
// smoothly toward the next leg. Pure movement, no suspicion logic here.

import { TILE } from './level.js';

export class Patrol {
  // waypoints: [{x, y}] in pixels. speed: px per second. pauseSec: wait at each.
  constructor(waypoints, speed, pauseSec) {
    this.points = waypoints;
    this.speed = speed;
    this.pauseSec = pauseSec;
    this.index = 0;
    this.wait = pauseSec * 0.5;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    const next = waypoints[1 % waypoints.length];
    this.angle = Math.atan2(next.y - this.y, next.x - this.x);
  }

  // Move toward the current target waypoint. Returns { moving, arrived }.
  update(dt) {
    if (this.wait > 0) {
      this.wait -= dt;
      return { moving: false, arrived: false };
    }
    const target = this.points[(this.index + 1) % this.points.length];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step) {
      this.x = target.x;
      this.y = target.y;
      this.index = (this.index + 1) % this.points.length;
      this.wait = this.pauseSec;
      return { moving: true, arrived: true };
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.angle = Math.atan2(dy, dx);
    return { moving: true, arrived: false };
  }

  // Face a point without moving (used while investigating).
  faceToward(x, y) {
    this.angle = Math.atan2(y - this.y, x - this.x);
  }
}

// Waypoint lists for the three museum guards, in tile coordinates.
export function patrolPoints(tiles) {
  return tiles.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }));
}
