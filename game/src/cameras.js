// cameras.js — the museum's security cameras: wall-mounted, sweeping a
// red cone back and forth. A camera that watches you long enough trips the
// lockdown: every guard is alerted to your position at once. Cameras are
// slow to notice (lamplight and closeness speed them up), so a quick dash
// through a sweeping cone is survivable — standing in one is not.

import { TILE, tileCenter, losClear } from './level.js';

export const CAM_RANGE = 170;
export const CAM_HALF_ANGLE = 0.5; // ~29 degrees each side
const TRIP_AT = 100;
const TRIP_COOLDOWN = 8; // seconds a tripped camera stays dark before resuming

export class Camera {
  constructor(def) {
    const at = tileCenter(def.tx, def.ty);
    this.name = def.name;
    this.x = at.x;
    this.y = at.y;
    this.baseAngle = def.angle; // radians: the middle of the sweep
    this.sweep = def.sweep; // radians each side of the middle
    this.phase = def.phase;
    this.speed = def.speed; // sweep cycles per second, in radians of phase
    this.angle = this.baseAngle;
    this.suspicion = 0;
    this.cooldown = 0; // > 0 while tripped and dark
  }

  // The sweep is a pure function of elapsed time, so two runs of the game
  // at the same fixed step show the same cone — the screenshots stay
  // reproducible.
  update(dt, elapsed, player, events) {
    this.angle = this.baseAngle + Math.sin(elapsed * this.speed + this.phase) * this.sweep;
    if (this.cooldown > 0) {
      this.cooldown -= dt;
      this.suspicion = 0;
      return;
    }
    if (this.sees(player.x, player.y)) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      const closeness = 1 - dist / (CAM_RANGE + 30);
      this.suspicion += (26 + 44 * Math.max(0, closeness)) * dt;
      if (this.suspicion >= TRIP_AT) {
        this.suspicion = 0;
        this.cooldown = TRIP_COOLDOWN;
        events.push({ type: 'lockdown', camera: this });
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - 30 * dt);
    }
  }

  // Same geometry as a guard's cone, from a fixed mount. The sight ray
  // starts a step out from the wall the camera is mounted on, so the
  // mount's own tile never blocks its view.
  sees(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CAM_RANGE || dist < 1) return dist < 1;
    const ang = Math.atan2(dy, dx);
    let diff = ang - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > CAM_HALF_ANGLE) return false;
    const ox = this.x + Math.cos(this.angle) * 20;
    const oy = this.y + Math.sin(this.angle) * 20;
    return losClear(ox, oy, px, py);
  }
}

// Three cameras, one per wing, each sweeping the gallery it watches:
// the central gallery from the north wall, the east wing from the divider,
// the south gallery from its north wall.
export function makeCameras() {
  return [
    new Camera({
      name: 'Cam A', tx: 13, ty: 7, angle: Math.PI / 2,
      sweep: 0.7, phase: 0, speed: 0.55,
    }),
    new Camera({
      name: 'Cam B', tx: 23, ty: 9, angle: 0,
      sweep: 0.6, phase: 1.4, speed: 0.7,
    }),
    new Camera({
      name: 'Cam C', tx: 10, ty: 14, angle: Math.PI / 2,
      sweep: 0.7, phase: 2.6, speed: 0.55,
    }),
  ];
}
