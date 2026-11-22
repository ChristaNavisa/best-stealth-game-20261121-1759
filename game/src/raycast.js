// raycast.js — raycast lantern shadows: real darkness cast by walls.
// For each lamp, light reaches a point only along an unblocked ray, so
// pillars, crates and display cases throw hard shadows across the floor.
// A burglar standing in hard shadow is much harder to spot: a guard's
// vision cone shrinks toward her and suspicion climbs slower. The
// renderer draws the same visibility polygons as holes in the night
// overlay, so the light you see is the light the guards' eyes obey.

import { TILE, lamps, tileAt, T_FLOOR, losClear } from './level.js';

// How much of the lamps' light reaches (px, py): 1 fully lit, 0 in dark.
// A lamp only counts when its ray to the point is not blocked by a wall.
export function litAt(px, py) {
  let best = 0;
  for (const lamp of lamps) {
    const dx = px - lamp.x;
    const dy = py - lamp.y;
    const d = Math.hypot(dx, dy);
    if (d >= lamp.r) continue;
    if (!losClear(lamp.x, lamp.y, px, py)) continue;
    best = Math.max(best, 1 - d / lamp.r);
  }
  return best;
}

// Darkness 0..1 at a point: 1 means no lamp light reaches it at all.
export function darknessAt(px, py) {
  return 1 - litAt(px, py);
}

// The visibility polygon of a lamp: rays cast in every direction until
// they hit a solid tile or the lamp's range. Walls throw hard shadows;
// the polygon's straight edges are the shadow lines on the floor.
export function castLampPolygon(lamp, rays = 96) {
  const pts = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let d = 8;
    while (d < lamp.r) {
      const x = lamp.x + dx * d;
      const y = lamp.y + dy * d;
      if (tileAt(x, y) !== T_FLOOR) break;
      d += 6;
    }
    const r = Math.min(d, lamp.r);
    pts.push([lamp.x + dx * r, lamp.y + dy * r]);
  }
  return pts;
}

// Trace a polygon path on a context (does not fill or stroke it).
export function tracePolygon(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}
