// player.js — Wren, the burglar: walk, sneak, run, throw pebbles, and grab
// the Sunken Bell. Running is fast but loud; sneaking is slow and quiet.

import { TILE, circleHitsSolid, bellSpot, vaultSpot, exitSpot, coins, isCreakyAt } from './level.js';

const WALK_SPEED = 2.6 * TILE;
const SNEAK_SPEED = 1.5 * TILE;
const RUN_SPEED = 4.1 * TILE;
const DASH_SPEED = 8.6 * TILE; // shadow dash: more than twice a run, silent
const DASH_TIME = 0.45; // seconds of burst per dash
const DASH_COOLDOWN = 6; // seconds before the next dash

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.radius = 11;
    this.angle = 0; // facing, for the cloak's direction
    this.stance = 'walk'; // walk | sneak | run
    this.hasBell = false;
    this.hasVault = false; // the Tide Vault's golden idol, optional loot
    this.hasTarget = false; // this heist's treasure (Bell, Idol, Manuscript, Astrolabe)
    this.targetSpot = bellSpot; // set by setMission
    this.targetKey = 'bell';
    this.requiresVault = false; // the Grand Haul needs the Idol too
    this.coins = 0;
    this.pebbles = 5;
    this.smokes = 2; // smoke veils: thrown with Q, they blind guards and cameras
    this.lures = 3; // brass coins to throw: they clatter and pull guards over
    this.dashes = 2; // shadow dashes: silent bursts forward, E, 2 per heist
    this.dashT = 0; // seconds left of the current burst
    this.dashCd = 0; // seconds until the next dash is ready
    this.stepTimer = 0;
    this.moving = false;
    this._coinsLeft = coins.map((c) => ({ ...c, taken: false }));
  }

  update(dt, input, events) {
    const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    this.moving = ix !== 0 || iy !== 0;
    if (this.dashT > 0) this.dashT = Math.max(0, this.dashT - dt);
    if (this.dashCd > 0) this.dashCd = Math.max(0, this.dashCd - dt);
    this.stance = input.sneak ? 'sneak' : input.run ? 'run' : 'walk';
    if (this.moving) {
      const len = Math.hypot(ix, iy);
      // A dash bursts forward at more than twice running speed — and
      // makes no noise at all: the one way to cross a lit gallery fast.
      const speed = this.dashT > 0 ? DASH_SPEED : this.stance === 'sneak' ? SNEAK_SPEED : this.stance === 'run' ? RUN_SPEED : WALK_SPEED;
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

  // The shadow dash: a silent burst forward. Two per heist, six seconds
  // between bursts. Returns false with none left or still cooling down.
  startDash() {
    if (this.dashes <= 0 || this.dashCd > 0 || this.dashT > 0) return false;
    this.dashes -= 1;
    this.dashT = DASH_TIME;
    this.dashCd = DASH_COOLDOWN;
    return true;
  }

  // Footstep noise: a pulse the guards can hear. Run loud, walk soft, sneak silent.
  // A dash is silent. Creaky cedar boards groan: running across them is
  // heard much farther, and even walking creaks — the board's groan is
  // its own event, so the sound and the ring both read.
  step(dt, events) {
    this.stepTimer -= dt;
    if (this.stepTimer > 0) return;
    if (this.dashT > 0) {
      this.stepTimer = 0.1;
      events.push({ type: 'playerStep', x: this.x, y: this.y, quiet: true });
      return;
    }
    const creak = isCreakyAt(this.x, this.y);
    if (this.stance === 'run') {
      this.stepTimer = 0.42;
      events.push({ type: 'noise', x: this.x, y: this.y, radius: creak ? 190 : 130, loud: true });
      events.push({ type: 'playerStep', x: this.x, y: this.y });
      if (creak) events.push({ type: 'creak', x: this.x, y: this.y });
    } else if (this.stance === 'walk') {
      this.stepTimer = 0.55;
      events.push({ type: 'noise', x: this.x, y: this.y, radius: creak ? 90 : 45, loud: false });
      events.push({ type: 'playerStep', x: this.x, y: this.y });
      if (creak) events.push({ type: 'creak', x: this.x, y: this.y });
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

  // Throw a brass coin toward a point: it lands with a bright clatter
  // that pulls guards over to investigate — a lure you can spend, where
  // a pebble only distracts. Returns false with no lures left.
  throwCoin(tx, ty, events) {
    if (this.lures <= 0) return false;
    this.lures -= 1;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const range = Math.min(dist, 260);
    const lx = this.x + (dx / (dist || 1)) * range;
    const ly = this.y + (dy / (dist || 1)) * range;
    events.push({ type: 'coinToss', x: lx, y: ly });
    events.push({ type: 'noise', x: lx, y: ly, radius: 170, loud: true });
    return true;
  }

  // A heist sets the job: which treasure to steal, and whether the Idol
  // is also required before the exit opens.
  setMission(mission) {
    this.targetSpot = mission.targetSpot;
    this.targetKey = mission.targetKey;
    this.requiresVault = mission.requiresVault;
  }

  // Throw a smoke veil toward a point: it blooms into a cloud that blinds
  // guards and cameras for six seconds. Returns false with none left.
  throwSmoke(tx, ty, events) {
    if (this.smokes <= 0) return false;
    this.smokes -= 1;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const range = Math.min(dist, 260);
    const lx = this.x + (dx / (dist || 1)) * range;
    const ly = this.y + (dy / (dist || 1)) * range;
    events.push({ type: 'smoke', x: lx, y: ly });
    return true;
  }

  pickups(events) {
    // This heist's treasure: the Bell, the Idol, the Manuscript or the Astrolabe.
    if (!this.hasTarget && Math.hypot(this.x - this.targetSpot.x, this.y - this.targetSpot.y) < 26) {
      this.hasTarget = true;
      if (this.targetKey === 'bell') {
        this.hasBell = true;
        events.push({ type: 'bell' });
      } else if (this.targetKey === 'vault') {
        this.hasVault = true;
        events.push({ type: 'vault' });
      } else {
        events.push({ type: 'target' });
      }
    }
    if (!this.hasVault && Math.hypot(this.x - vaultSpot.x, this.y - vaultSpot.y) < 26) {
      this.hasVault = true;
      events.push({ type: 'vault' });
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
    // The exit opens once this heist's treasure is stolen — and, for the
    // Grand Haul, once the Tide Idol is stolen too.
    return (
      this.hasTarget &&
      (!this.requiresVault || this.hasVault) &&
      Math.hypot(this.x - exitSpot.x, this.y - exitSpot.y) < 26
    );
  }
}
