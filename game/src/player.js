// player.js — Wren, the burglar: walk, sneak, run, throw pebbles, and grab
// the Sunken Bell. Running is fast but loud; sneaking is slow and quiet.

import { TILE, circleHitsSolid, bellSpot, exitSpot, coins } from './level.js';

const WALK_SPEED = 2.6 * TILE;
const SNEAK_SPEED = 1.5 * TILE;
const RUN_SPEED = 4.1 * TILE;

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.radius = 11;
    this.angle = 0; // facing, for the cloak's direction
    this.stance = 'walk'; // walk | sneak | run
    this.hasBell = false;
    this.coins = 0;
    this.pebbles = 5;
    this.stepTimer = 0;
    this.moving = false;
    this._coinsLeft = coins.map((c) => ({ ...c, taken: false }));
  }

  update(dt, input, events) {
    const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    this.moving = ix !== 0 || iy !== 0;
    this.stance = input.sneak ? 'sneak' : input.run ? 'run' : 'walk';
    if (this.moving) {
      const len = Math.hypot(ix, iy);
      const speed = this.stance === 'sneak' ? SNEAK_SPEED : this.stance === 'run' ? RUN_SPEED : WALK_SPEED;
      this.angle = Math.atan2(iy, ix);
      const nx = this.x + (ix / len) * speed * dt;
      const ny = this.y + (iy / len) * speed * dt;
      // Slide along walls: try each axis separately.
      if (!circleHitsSolid(nx, this.y, this.radius)) this.x = nx;
      if (!circleHitsSolid(this.x, ny, this.radius)) this.y = ny;
      this.step(dt, events);
    }
    this.pickups(events);
  }

  // Footstep noise: a pulse the guards can hear. Run loud, walk soft, sneak silent.
  step(dt, events) {
    this.stepTimer -= dt;
    if (this.stepTimer > 0) return;
    if (this.stance === 'run') {
      this.stepTimer = 0.42;
      events.push({ type: 'noise', x: this.x, y: this.y, radius: 130, loud: true });
      events.push({ type: 'playerStep', x: this.x, y: this.y });
    } else if (this.stance === 'walk') {
      this.stepTimer = 0.55;
      events.push({ type: 'noise', x: this.x, y: this.y, radius: 45, loud: false });
      events.push({ type: 'playerStep', x: this.x, y: this.y });
    } else {
      this.stepTimer = 0.6;
      events.push({ type: 'playerStep', x: this.x, y: this.y, quiet: true });
    }
  }

  // Throw a pebble toward a point: it lands with a loud noise that pulls
  // guards over to investigate. Returns false with no pebbles left.
  throwPebble(tx, ty, events) {
    if (this.pebbles <= 0) return false;
    this.pebbles -= 1;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const range = Math.min(dist, 230);
    const lx = this.x + (dx / (dist || 1)) * range;
    const ly = this.y + (dy / (dist || 1)) * range;
    events.push({ type: 'pebble', x: lx, y: ly });
    events.push({ type: 'noise', x: lx, y: ly, radius: 150, loud: true });
    return true;
  }

  pickups(events) {
    if (!this.hasBell && Math.hypot(this.x - bellSpot.x, this.y - bellSpot.y) < 26) {
      this.hasBell = true;
      events.push({ type: 'bell' });
    }
    for (const coin of this._coinsLeft) {
      if (!coin.taken && Math.hypot(this.x - coin.x, this.y - coin.y) < 22) {
        coin.taken = true;
        this.coins += 1;
        events.push({ type: 'coin' });
      }
    }
  }

  get coinsLeft() {
    return this._coinsLeft;
  }

  atExit() {
    return this.hasBell && Math.hypot(this.x - exitSpot.x, this.y - exitSpot.y) < 26;
  }
}
