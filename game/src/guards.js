// guards.js — the museum guards: patrol, suspicion, investigation, chase.
// States: "patrol" -> "suspicious" (walks to the last thing it noticed) ->
// "alerted" (chases the player). Losing the player lets the alarm decay,
// so a near-miss is recoverable instead of instant failure.

import { Patrol, patrolPoints } from './patrol.js';
import { inVisionCone, detectionRate, hearsNoise } from './vision.js';
import { TILE } from './level.js';

export const SUSPICIOUS_AT = 30;
export const ALERTED_AT = 70;

const CHASE_SPEED = 2.6 * TILE;
const INVESTIGATE_SPEED = 1.9 * TILE;

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.patrol = new Patrol(patrolPoints(def.route), def.speed * TILE, def.pause);
    this.x = this.patrol.x;
    this.y = this.patrol.y;
    this.angle = this.patrol.angle;
    this.state = 'patrol';
    this.suspicion = 0;
    this.lastSeen = null; // {x, y} of the last thing that drew attention
    this.lostTimer = 0; // seconds without sight while alerted
    this.scanTimer = 0; // seconds spent looking around at an investigate point
    this.stepTimer = 0; // footstep pacing
    this.radius = 12;
  }

  update(dt, player, noises, events, smoke) {
    const sees = inVisionCone(this, player.x, player.y, smoke);
    if (sees) {
      this.suspicion += detectionRate(this, player) * dt;
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
      events.push({ type: 'alarm', guard: this });
    } else if (this.suspicion >= SUSPICIOUS_AT && this.state === 'patrol') {
      this.state = 'suspicious';
      events.push({ type: 'noticed', guard: this });
    }

    // Noises (running feet, thrown pebbles) draw a suspicious guard over.
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
          const step = Math.min(CHASE_SPEED * dt, dist);
          this.x += (dx / dist) * step;
          this.y += (dy / dist) * step;
        }
      }
      if (this.lostTimer > 3.5) {
        this.state = 'suspicious';
        this.scanTimer = 0;
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
          const step = Math.min(INVESTIGATE_SPEED * dt, dist);
          this.x += (dx / dist) * step;
          this.y += (dy / dist) * step;
        } else {
          // Arrived: look around for a while, then give up and go back.
          this.scanTimer += dt;
          this.angle += dt * 1.4;
          if (this.scanTimer > 2.2) {
            this.state = 'patrol';
            this.suspicion = 0;
            this.lastSeen = null;
            this.scanTimer = 0;
          }
        }
      } else {
        this.state = 'patrol';
        this.suspicion = 0;
      }
      return;
    }
    // Patrol: resume the route from wherever the guard stands. The patrol
    // keeps its own position, so sync it to the guard before stepping.
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

  // Caught: an alerted guard close enough to grab the player.
  catches(player) {
    return this.state === 'alerted' && Math.hypot(this.x - player.x, this.y - player.y) < 24;
  }
}

// The six guards of the Merrow Museum, each with its own loop and temper.
// A heist may field a subset, or move a guard to a new route for its job:
// makeGuards takes [{name, route?, speed?, pause?}] and fills the rest
// from these defaults.
export const DEFAULT_GUARD_DEFS = [
  {
    name: 'Marlow',
    route: [[9, 4], [20, 4], [20, 6], [9, 6]],
    speed: 1.6, pause: 2.0,
  },
  {
    name: 'Ivo',
    route: [[9, 1], [21, 1]],
    speed: 1.3, pause: 2.5,
  },
  {
    name: 'Pell',
    route: [[10, 8], [20, 8], [20, 12], [10, 12]],
    speed: 1.1, pause: 3.0,
  },
  {
    name: 'Sable',
    route: [[11, 10], [19, 10]],
    speed: 1.5, pause: 1.5,
  },
  {
    name: 'Bram',
    route: [[9, 16], [21, 16], [21, 18], [9, 18]],
    speed: 1.4, pause: 2.0,
  },
  {
    name: 'Odo',
    route: [[24, 3], [27, 3], [27, 17], [24, 17]],
    speed: 2.0, pause: 1.0,
  },
];

export function makeGuards(defs) {
  const list = defs ?? DEFAULT_GUARD_DEFS.map((d) => ({ name: d.name }));
  return list.map((d) => {
    const base = DEFAULT_GUARD_DEFS.find((b) => b.name === d.name);
    return new Guard({
      name: d.name,
      route: d.route ?? base.route,
      speed: d.speed ?? base.speed,
      pause: d.pause ?? base.pause,
    });
  });
}
