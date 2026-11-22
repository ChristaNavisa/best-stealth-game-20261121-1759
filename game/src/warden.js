// warden.js — the Night Warden: the museum's seventh guard, and the one
// the whole game is named after in round 7. He is not another patrol
// guard: he carries a LANTERN, a moving pool of warm light, and a
// WHISTLE. Inside his lantern light you are spotted far faster than in
// the dark; his vision cone is longer and wider than any other guard's;
// and the first time he truly spots you he blows his whistle, which
// summons every guard in the museum to your position at once. The
// counterplay is the smoke veil: a veil blinds his lantern and his cone
// alike, and breaking his sight after the whistle lets the hunt decay
// back to a patrol — a near-miss, not a game over.

import { Patrol, patrolPoints } from './patrol.js';
import { inVisionCone, detectionRate, hearsNoise } from './vision.js';
import { TILE } from './level.js';
import { SUSPICIOUS_AT, ALERTED_AT } from './guards.js';

// The Warden's cone reaches across a whole gallery; his lantern lights
// the floor around him. Both are drawn on the floor, so the player can
// read the danger before stepping into it.
export const WARDEN_RANGE = 235;
export const WARDEN_HALF_ANGLE = 0.72; // ~41 degrees each side
export const LANTERN_RADIUS = 110;
export const LANTERN_SPOT_RATE = 1.6; // suspicion multiplier inside the lantern light

// His loop circles the Sunken Bell itself: the treasure is never unwatched.
export const WARDEN_ROUTE = [[12, 9], [18, 9], [18, 12], [12, 12]];

const WARDEN_CHASE_SPEED = 2.9 * TILE;
const WARDEN_INVESTIGATE_SPEED = 2.0 * TILE;

export class Warden {
  constructor() {
    this.name = 'Warden';
    this.patrol = new Patrol(patrolPoints(WARDEN_ROUTE), 1.4 * TILE, 2.5);
    this.x = this.patrol.x;
    this.y = this.patrol.y;
    this.angle = this.patrol.angle;
    this.state = 'patrol';
    this.suspicion = 0;
    this.lastSeen = null; // {x, y} of the last thing that drew attention
    this.lostTimer = 0; // seconds without sight while alerted
    this.scanTimer = 0; // seconds spent looking around at an investigate point
    this.scanBase = null; // facing when a search sweep starts (sweeps around it)
    this.stepTimer = 0; // footstep pacing
    this.whistleBlown = false; // one whistle per hunt: it resets when he calms down
    this.radius = 14;
  }

  // Is the player standing inside the Warden's lantern light?
  inLantern(px, py) {
    return Math.hypot(px - this.x, py - this.y) < LANTERN_RADIUS;
  }

  update(dt, player, noises, events, smoke) {
    const sees = inVisionCone(this, player.x, player.y, smoke, WARDEN_RANGE, WARDEN_HALF_ANGLE);
    if (sees) {
      // Lantern light is the trap: standing in it, suspicion climbs
      // 60% faster than in the dark at the same distance.
      let rate = detectionRate(this, player);
      if (this.inLantern(player.x, player.y)) rate *= LANTERN_SPOT_RATE;
      this.suspicion += rate * dt;
      this.lastSeen = { x: player.x, y: player.y };
      this.lostTimer = 0;
    } else {
      const decay = this.state === 'alerted' ? 12 : 22;
      this.suspicion = Math.max(0, this.suspicion - decay * dt);
      if (this.state === 'alerted') this.lostTimer += dt;
    }
    if (this.suspicion >= ALERTED_AT && this.state !== 'alerted') {
      this.state = 'alerted';
      this.lostTimer = 0;
      // First full spot of a hunt: the whistle. Every guard in the
      // museum turns toward the burglar at once.
      if (!this.whistleBlown) {
        this.whistleBlown = true;
        events.push({ type: 'whistle', guard: this });
      } else {
        events.push({ type: 'alarm', guard: this });
      }
    } else if (this.suspicion >= SUSPICIOUS_AT && this.state === 'patrol') {
      this.state = 'suspicious';
      events.push({ type: 'noticed', guard: this });
    }

    // Noises (running feet, thrown pebbles, coin lures) draw him over,
    // like any guard — but he investigates faster than the rest.
    for (const noise of noises) {
      if (this.state === 'alerted') continue;
      if (hearsNoise(this, noise.x, noise.y, noise.radius)) {
        this.lastSeen = { x: noise.x, y: noise.y };
        if (this.state === 'patrol') {
          this.state = 'suspicious';
          this.suspicion = Math.max(this.suspicion, SUSPICIOUS_AT);
        }
      }
    }

    this.move(dt, player, events);
    this.step(dt, events);
  }

  move(dt, player, events) {
    if (this.state === 'alerted') {
      // Chase the player's live position while seen; the last seen spot after.
      const target = this.lastSeen;
      if (target) {
        this.patrol.faceToward(target.x, target.y);
        this.angle = this.patrol.angle;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          const step = Math.min(WARDEN_CHASE_SPEED * dt, dist);
          this.x += (dx / dist) * step;
          this.y += (dy / dist) * step;
        }
      }
      if (this.lostTimer > 3.5) {
        this.state = 'suspicious';
        this.scanTimer = 0;
        this.scanBase = null;
        events.push({ type: 'lost', guard: this });
      }
      return;
    }
    if (this.state === 'suspicious') {
      if (this.lastSeen) {
        const dx = this.lastSeen.x - this.x;
        const dy = this.lastSeen.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
          this.patrol.faceToward(this.lastSeen.x, this.lastSeen.y);
          this.angle = this.patrol.angle;
          const step = Math.min(WARDEN_INVESTIGATE_SPEED * dt, dist);
          this.x += (dx / dist) * step;
          this.y += (dy / dist) * step;
        } else {
          // Arrived: sweep the gaze back and forth across the spot where
          // the burglar was last seen, then give up and go back. A full
          // spin would turn his back on a burglar standing right beside
          // him; a sweep keeps the spot under watch while he looks.
          if (this.scanBase === null) this.scanBase = this.angle;
          this.scanTimer += dt;
          this.angle = this.scanBase + Math.sin(this.scanTimer * 1.6) * 0.9;
          if (this.scanTimer > 2.2) {
            this.state = 'patrol';
            this.suspicion = 0;
            this.lastSeen = null;
            this.scanTimer = 0;
            this.scanBase = null;
            this.whistleBlown = false; // the next hunt gets a fresh whistle
          }
        }
      } else {
        this.state = 'patrol';
        this.suspicion = 0;
        this.scanBase = null;
      }
      return;
    }
    // Patrol: resume the route from wherever the Warden stands.
    this.patrol.x = this.x;
    this.patrol.y = this.y;
    const { moving } = this.patrol.update(dt);
    this.x = this.patrol.x;
    this.y = this.patrol.y;
    this.angle = this.patrol.angle;
    void moving;
  }

  // Footstep pacing: a step every ~0.45 s while moving, louder when alerted.
  step(dt, events) {
    const moving = this.state !== 'patrol' || this.patrol.wait <= 0;
    if (!moving) return;
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.stepTimer = 0.45;
      events.push({ type: 'step', guard: this });
    }
  }

  // Caught: an alerted Warden close enough to grab the player.
  catches(player) {
    return this.state === 'alerted' && Math.hypot(this.x - player.x, this.y - player.y) < 26;
  }
}

// A heist fields the Warden only when its mission says so: the Bell,
// the Manuscript and the Grand Haul — the jobs where the treasure is
// watched by the museum's best guard. Other heists have six guards.
export function makeWarden(enabled) {
  return enabled ? new Warden() : null;
}
