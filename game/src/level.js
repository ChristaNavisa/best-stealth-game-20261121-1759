// level.js — the Merrow Museum floor plan: walls, cover, lamps, objectives.
// One tile is 32 px. The grid is built from rectangles so every coordinate
// stays consistent: 0 = floor, 1 = wall, 2 = crate, 3 = display case.
// Plants are walkable hide spots (they never block sight or movement).

export const TILE = 32;
export const COLS = 30;
export const ROWS = 20;

export const T_FLOOR = 0;
export const T_WALL = 1;
export const T_CRATE = 2;
export const T_CASE = 3;

function makeGrid() {
  const g = new Uint8Array(COLS * ROWS);
  const rect = (x0, y0, x1, y1, t) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) g[y * COLS + x] = t;
    }
  };
  const carve = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) g[y * COLS + x] = T_FLOOR;
    }
  };
  // Outer shell.
  rect(0, 0, COLS - 1, 0, T_WALL);
  rect(0, ROWS - 1, COLS - 1, ROWS - 1, T_WALL);
  rect(0, 0, 0, ROWS - 1, T_WALL);
  rect(COLS - 1, 0, COLS - 1, ROWS - 1, T_WALL);
  // West hall divider (x=7) with doors to the three galleries.
  rect(7, 1, 7, 18, T_WALL);
  carve(7, 3, 7, 3); carve(7, 10, 7, 10); carve(7, 16, 7, 16);
  // East corridor divider (x=23) with doors.
  rect(23, 1, 23, 18, T_WALL);
  carve(23, 5, 23, 5); carve(23, 10, 23, 10); carve(23, 15, 23, 15);
  // Gallery floors (y=7 north/central, y=14 central/south) with a middle gap.
  rect(8, 7, 22, 7, T_WALL);
  carve(14, 7, 14, 7);
  rect(8, 14, 22, 14, T_WALL);
  carve(14, 14, 14, 14);
  // Crates: heavy cover, blocks sight and movement.
  const crates = [
    [10, 3], [18, 3], [9, 8], [21, 8], [9, 12], [21, 12],
    [11, 15], [18, 15], [4, 9], [4, 11], [25, 4], [25, 16],
  ];
  for (const [x, y] of crates) g[y * COLS + x] = T_CRATE;
  // Display cases: glass cover, blocks sight and movement.
  const cases = [
    [13, 2], [16, 5], [11, 9], [19, 9], [11, 11], [19, 11], [14, 17], [17, 17],
  ];
  for (const [x, y] of cases) g[y * COLS + x] = T_CASE;
  return g;
}

export const grid = makeGrid();

// Potted plants: walkable hide spots. Standing in one hides you.
export const plants = new Set(
  [[3, 5], [3, 14], [9, 5], [20, 5], [12, 10], [18, 10], [10, 17], [19, 15], [26, 9], [26, 12]]
    .map(([x, y]) => `${x},${y}`),
);

// Lamps: warm pools of light. Lit floor is dangerous; shadow is safe.
export const lamps = [
  { tx: 4, ty: 10 }, { tx: 12, ty: 3 }, { tx: 18, ty: 5 },
  { tx: 15, ty: 10 }, { tx: 12, ty: 16 }, { tx: 18, ty: 16 }, { tx: 26, ty: 10 },
].map(({ tx, ty }) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, r: 3.6 * TILE }));

export const tileCenter = (tx, ty) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE });

export const playerStart = tileCenter(2, 10);
export const bellSpot = tileCenter(15, 10);
export const exitSpot = tileCenter(28, 10);
// The Gilded Manuscript (Heist III): a gold-leafed scroll in the north
// gallery, on its own lectern — no coin sits on this tile.
export const manuscriptSpot = tileCenter(12, 2);
// The Brass Astrolabe (Heist IV): a navigator's instrument in the east
// wing's north corner, far from the exit it tempts you toward.
export const astrolabeSpot = tileCenter(26, 5);
// The Tide Vault: a second, optional treasure in the south gallery —
// a golden idol on its own pedestal, worth the detour.
export const vaultSpot = tileCenter(15, 16);
export const coins = [
  tileCenter(15, 2), tileCenter(15, 17), tileCenter(26, 2),
  tileCenter(9, 2), tileCenter(21, 2), tileCenter(9, 17),
  tileCenter(21, 17), tileCenter(26, 17),
];

export function tileAt(px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return T_WALL;
  return grid[ty * COLS + tx];
}

export function isSolidTile(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return grid[ty * COLS + tx] !== T_FLOOR;
}

// A circle (x, y, r) may not overlap any solid tile.
export function circleHitsSolid(x, y, r) {
  const x0 = Math.floor((x - r) / TILE);
  const x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - r) / TILE);
  const y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolidTile(tx, ty)) continue;
      const cx = Math.max(tx * TILE, Math.min(x, (tx + 1) * TILE));
      const cy = Math.max(ty * TILE, Math.min(y, (ty + 1) * TILE));
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

export function isPlantAt(px, py) {
  return plants.has(`${Math.floor(px / TILE)},${Math.floor(py / TILE)}`);
}

// Light level 0..1 at a point: 1 deep inside a lamp pool, 0 in the dark.
export function lightAt(px, py) {
  let best = 0;
  for (const lamp of lamps) {
    const dx = px - lamp.x;
    const dy = py - lamp.y;
    const d = Math.hypot(dx, dy);
    if (d < lamp.r) best = Math.max(best, 1 - d / lamp.r);
  }
  return best;
}

// Line of sight between two points: sampled; walls, crates and cases block.
export function losClear(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 7));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tile = tileAt(x0 + dx * t, y0 + dy * t);
    if (tile !== T_FLOOR) return false;
  }
  return true;
}
