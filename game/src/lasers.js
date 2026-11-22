// lasers.js — the museum's laser tripwires: three beams guarding the
// doorways between the galleries and the east wing. Each beam burns red
// for a stretch, then goes dark for a stretch, on a fixed cycle read off
// the game's elapsed time — so the pattern is learnable, the screenshots
// are reproducible, and a dash through a dark doorway is always an option.
// Crossing a live beam trips it: every guard grows suspicious and comes
// to look at where you crossed. A tripped beam stays dark for 5 seconds.

import { TILE } from './level.js';

const PERIOD = 4; // seconds per blink cycle
const ON_TIME = 2.4; // seconds the beam burns per cycle
const TRIP_COOLDOWN = 5; // seconds a tripped beam stays dark

export class Laser {
  constructor(def) {
    this.name = def.name;
    // The doorway tile the beam guards: crossing the tile while the beam
    // burns is what trips it.
    this.tx = def.tx;
    this.ty = def.ty;
    // Beam endpoints in pixels: a vertical beam across a horizontal-wall
    // doorway, a horizontal beam across a vertical-wall doorway.
    if (def.vertical) {
      this.x0 = (def.tx + 0.5) * TILE;
      this.y0 = def.ty * TILE;
      this.x1 = (def.tx + 0.5) * TILE;
      this.y1 = (def.ty + 1) * TILE;
    } else {
      this.x0 = def.tx * TILE;
      this.y0 = (def.ty + 0.5) * TILE;
      this.x1 = (def.tx + 1) * TILE;
      this.y1 = (def.ty + 0.5) * TILE;
    }
    this.phase = def.phase; // seconds of offset into the cycle
    this.cooldown = 0; // > 0 while tripped and dark
    this.armed = true; // false until the player leaves the tile again
  }

  // Pure function of elapsed time, so a staged screenshot and a live
  // game at the same clock show the same beam.
  isOn(elapsed) {
    if (this.cooldown > 0) return false;
    return ((elapsed + this.phase) % PERIOD) < ON_TIME;
  }

  update(dt, elapsed, player, events) {
    if (this.cooldown > 0) this.cooldown -= dt;
    const px = Math.floor(player.x / TILE);
    const py = Math.floor(player.y / TILE);
    const inside = px === this.tx && py === this.ty;
    if (!inside || !this.isOn(elapsed)) {
      // Off the tile, or the beam dark: re-arm for the next crossing.
      if (!inside) this.armed = true;
      return;
    }
    if (!this.armed) return;
    this.armed = false;
    this.cooldown = TRIP_COOLDOWN;
    events.push({
      type: 'laser',
      laser: this,
      x: (this.x0 + this.x1) / 2,
      y: (this.y0 + this.y1) / 2,
    });
  }
}

// Three beams: the north and south gallery doors (cross them for the
// north coins and the Tide Vault) and the east-wing door (the only direct
// way out with the Bell — the escape itself is timed). A heist may field
// a subset.
const DEFAULT_LASER_DEFS = [
  { name: 'Laser N', tx: 14, ty: 7, vertical: true, phase: 0 },
  { name: 'Laser S', tx: 14, ty: 14, vertical: true, phase: 1.3 },
  { name: 'Laser E', tx: 23, ty: 10, vertical: false, phase: 2.6 },
];

export function makeLasers(names) {
  const defs = names
    ? DEFAULT_LASER_DEFS.filter((d) => names.includes(d.name))
    : DEFAULT_LASER_DEFS;
  return defs.map((d) => new Laser(d));
}
