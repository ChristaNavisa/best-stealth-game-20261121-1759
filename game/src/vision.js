// vision.js — what a guard can see: vision cones, line of sight, and how
// fast suspicion grows when the player is caught in the open.

import { lightAt, losClear, isPlantAt } from './level.js';
import { darknessAt } from './raycast.js';

export const CONE_RANGE = 175;
export const CONE_HALF_ANGLE = 0.62; // ~35 degrees each side

// Is the point (px, py) inside the guard's vision cone with a clear sight line?
// Smoke blinds: a guard cannot see a burglar standing in a veil, nor
// through a veil lying between them. The Night Warden calls this with his
// own longer range and wider half-angle; every other guard uses the defaults.
// Raycast shadow: a burglar in hard shadow is seen from much closer —
// the cone's effective range shrinks by up to 45% in full darkness.
export function inVisionCone(guard, px, py, smoke, range = CONE_RANGE, halfAngle = CONE_HALF_ANGLE) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  const effRange = range * (1 - 0.45 * darknessAt(px, py));
  if (dist > effRange || dist < 1) return dist < 1;
  if (smoke && (smoke.covers(px, py) || smoke.blocks(guard.x, guard.y, px, py))) return false;
  const ang = Math.atan2(dy, dx);
  let diff = ang - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return false;
  return losClear(guard.x, guard.y, px, py);
}

// Suspicion points per second while the player is visible.
// Closer is worse; lamplight is worse; sneaking and plants help a lot.
// Raycast shadow is the strongest cover of all: suspicion climbs up to
// 40% slower in darkness, on top of the shorter cone.
export function detectionRate(guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const closeness = 1 - dist / (CONE_RANGE + 30);
  let rate = 16 + 52 * Math.max(0, closeness);
  const light = lightAt(player.x, player.y);
  rate *= 1 + 0.7 * light;
  rate *= 1 - 0.4 * darknessAt(player.x, player.y);
  if (player.stance === 'sneak') rate *= 0.55;
  if (player.stance === 'run') rate *= 1.35;
  if (isPlantAt(player.x, player.y)) rate *= 0.22;
  return rate;
}

// How clearly the guard can hear a noise pulse of the given radius.
export function hearsNoise(guard, nx, ny, radius) {
  return Math.hypot(guard.x - nx, guard.y - ny) <= radius;
}
