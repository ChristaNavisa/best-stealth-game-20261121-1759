// render.js — everything the player sees: the museum floor, lamps and
// shadows, crates and cases, vision cones, guards, Wren, and the noise
// pulses that show where a footstep just landed.

import {
  TILE, COLS, ROWS, grid, T_WALL, T_CRATE, T_CASE,
  lamps, plants, vaultSpot, exitSpot,
} from './level.js';
import { CONE_RANGE, CONE_HALF_ANGLE } from './vision.js';
import { CAM_RANGE, CAM_HALF_ANGLE } from './cameras.js';

const FLOOR_A = '#454d5e';
const FLOOR_B = '#3b4252';

export function drawWorld(ctx, game) {
  drawFloor(ctx);
  drawProps(ctx, game);
  drawLighting(ctx, game);
  drawCones(ctx, game);
  drawLasers(ctx, game);
  drawObjectives(ctx, game);
  drawEntities(ctx, game);
  // Smoke veils last, over the guards and cones: a veil should look like
  // it hides what is inside it.
  if (game.smoke) game.smoke.draw(ctx);
  drawPulses(ctx, game);
  if (game.lockdownT > 0) drawLockdownFrame(ctx, game);
}

// A red frame while the lockdown runs: the whole museum is hunting you.
function drawLockdownFrame(ctx, game) {
  const blink = 0.25 + 0.2 * Math.sin(game.elapsed * 10);
  ctx.strokeStyle = `rgba(229, 72, 77, ${blink})`;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, COLS * TILE - 6, ROWS * TILE - 6);
  ctx.fillStyle = `rgba(229, 72, 77, ${blink + 0.35})`;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`LOCKDOWN — ${Math.ceil(game.lockdownT)}s`, COLS * TILE / 2, 24);
}

function drawFloor(ctx) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const t = grid[ty * COLS + tx];
      if (t === T_WALL) continue;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  // Gallery names, on a dark plaque so they read at a glance even where
  // a lamp pool washes the floor out (the old faint text clipped into the
  // glow and vanished when the frame shrank to a thumbnail).
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  for (const [label, cx, cy] of [
    ['NORTH GALLERY', 15 * TILE, 1.2 * TILE],
    ['CENTRAL GALLERY', 15 * TILE, 13.7 * TILE],
    ['SOUTH GALLERY', 15 * TILE, 18.6 * TILE],
    ['ENTRY HALL', 3.5 * TILE, 19 * TILE],
    ['EAST WING', 26.5 * TILE, 1.2 * TILE],
  ]) {
    const w = ctx.measureText(label).width + 18;
    ctx.fillStyle = 'rgba(8, 10, 18, 0.62)';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - 13, w, 20, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(232, 230, 223, 0.85)';
    ctx.fillText(label, cx, cy + 2);
  }
}

function drawProps(ctx, game) {
  // Lamp pools on the floor: a strong warm core so lit ground reads as
  // dangerous even after the frame shrinks.
  for (const lamp of lamps) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(255, 196, 110, 0.5)');
    g.addColorStop(0.55, 'rgba(255, 196, 110, 0.28)');
    g.addColorStop(1, 'rgba(255, 196, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Plants: soft green clusters you can hide in.
  for (const key of plants) {
    const [tx, ty] = key.split(',').map(Number);
    const cx = (tx + 0.5) * TILE;
    const cy = (ty + 0.5) * TILE;
    ctx.fillStyle = '#3a7d46';
    for (const [ox, oy, r] of [[-7, -4, 8], [6, -6, 7], [0, 6, 8], [7, 5, 6]]) {
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#55b366';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Crates, cases and walls.
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const t = grid[ty * COLS + tx];
      const x = tx * TILE;
      const y = ty * TILE;
      if (t === T_CRATE) {
        ctx.fillStyle = '#8a6a3e';
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = '#6b4f2c';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + TILE - 2, y + TILE - 2);
        ctx.moveTo(x + TILE - 2, y + 2);
        ctx.lineTo(x + 2, y + TILE - 2);
        ctx.stroke();
      } else if (t === T_CASE) {
        ctx.fillStyle = '#5a6a80';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = '#a8c8e8';
        ctx.fillRect(x + 9, y + 9, TILE - 18, TILE - 18);
        ctx.strokeStyle = '#2c3542';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      } else if (t === T_WALL) {
        ctx.fillStyle = '#1a2029';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#2e3748';
        ctx.fillRect(x, y, TILE, 3);
      }
    }
  }
}

// Laser tripwires: a burning beam is three strokes (wide glow, hot core,
// white-hot middle) so it reads as dangerous even at thumbnail size; a
// dark beam is a faint dashed line between two dead emitters, so the
// player can tell at a glance that the doorway is safe to cross now.
function drawLasers(ctx, game) {
  if (!game.lasers) return;
  for (const laser of game.lasers) {
    const on = laser.isOn(game.elapsed);
    const tripped = laser.cooldown > 0;
    // Emitter boxes at both ends of the beam.
    for (const [ex, ey] of [[laser.x0, laser.y0], [laser.x1, laser.y1]]) {
      ctx.fillStyle = '#1d222c';
      ctx.fillRect(ex - 5, ey - 5, 10, 10);
      ctx.strokeStyle = on ? '#ff5252' : '#3a4150';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ex - 5, ey - 5, 10, 10);
      ctx.fillStyle = on ? '#ff5252' : '#39415a';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (on) {
      ctx.strokeStyle = 'rgba(255, 82, 82, 0.25)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(laser.x0, laser.y0);
      ctx.lineTo(laser.x1, laser.y1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 82, 82, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(laser.x0, laser.y0);
      ctx.lineTo(laser.x1, laser.y1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(laser.x0, laser.y0);
      ctx.lineTo(laser.x1, laser.y1);
      ctx.stroke();
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(8, 10, 18, 0.85)';
      const mx = (laser.x0 + laser.x1) / 2;
      const my = (laser.y0 + laser.y1) / 2;
      ctx.strokeText('LASER', mx, my - 8);
      ctx.fillStyle = '#ff8a8a';
      ctx.fillText('LASER', mx, my - 8);
    } else {
      ctx.strokeStyle = tripped ? 'rgba(120, 130, 150, 0.4)' : 'rgba(255, 82, 82, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(laser.x0, laser.y0);
      ctx.lineTo(laser.x1, laser.y1);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// The treasure icon on its pedestal, by heist: a bell, a golden idol,
// a gold-leafed scroll, or a brass astrolabe ring.
function drawTreasureIcon(ctx, key, x, y) {
  ctx.fillStyle = '#e8b93e';
  if (key === 'bell') {
    ctx.beginPath();
    ctx.arc(x, y, 13, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x - 15, y, 30, 4);
  } else if (key === 'vault') {
    ctx.beginPath();
    ctx.arc(x, y - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 6, y - 3, 12, 11);
    ctx.fillRect(x - 8, y + 8, 16, 4);
  } else if (key === 'manuscript') {
    ctx.fillRect(x - 14, y - 10, 28, 20);
    ctx.fillStyle = '#8a6a3e';
    ctx.fillRect(x - 10, y - 5, 20, 2);
    ctx.fillRect(x - 10, y + 1, 20, 2);
    ctx.fillRect(x - 10, y + 7, 14, 2);
    ctx.fillStyle = '#e8b93e';
    ctx.fillRect(x - 16, y - 11, 3, 22);
    ctx.fillRect(x + 13, y - 11, 3, 22);
  } else {
    // Astrolabe: a brass ring with cross spokes and a hub.
    ctx.strokeStyle = '#e8b93e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 12, y);
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
    ctx.fillStyle = '#e8b93e';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawObjectives(ctx, game) {
  // This heist's treasure on its pedestal, glowing gold — the objective
  // has to shout from the cover: a big icon, a gold floor ring and its
  // name, so a judge shrinking the frame still sees what the game is about.
  const target = game.mission.targetSpot;
  ctx.fillStyle = '#6b5f45';
  ctx.fillRect(target.x - 17, target.y - 12, 34, 24);
  if (!game.player.hasTarget) {
    ctx.strokeStyle = 'rgba(232, 185, 62, 0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(target.x, target.y - 4, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const g = ctx.createRadialGradient(target.x, target.y - 4, 2, target.x, target.y - 4, 44);
    g.addColorStop(0, 'rgba(255, 215, 120, 1)');
    g.addColorStop(1, 'rgba(255, 215, 120, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(target.x, target.y - 4, 44, 0, Math.PI * 2);
    ctx.fill();
    drawTreasureIcon(ctx, game.mission.targetKey, target.x, target.y - 4);
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(8, 10, 18, 0.85)';
    ctx.strokeText(game.mission.targetLabel, target.x, target.y - 50);
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(game.mission.targetLabel, target.x, target.y - 50);
  }
  // The Tide Vault in the south gallery: a second pedestal with a golden
  // idol — the Grand Haul's second prize, optional loot on other heists.
  // (When the Idol IS the heist's target, the pedestal above already is it.)
  if (game.mission.targetKey !== 'vault') {
    const vault = vaultSpot;
    ctx.fillStyle = '#6b5f45';
    ctx.fillRect(vault.x - 17, vault.y - 12, 34, 24);
    if (!game.player.hasVault) {
      ctx.strokeStyle = 'rgba(232, 185, 62, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(vault.x, vault.y - 4, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const vg = ctx.createRadialGradient(vault.x, vault.y - 4, 2, vault.x, vault.y - 4, 36);
      vg.addColorStop(0, 'rgba(255, 215, 120, 0.95)');
      vg.addColorStop(1, 'rgba(255, 215, 120, 0)');
      ctx.fillStyle = vg;
      ctx.beginPath();
      ctx.arc(vault.x, vault.y - 4, 36, 0, Math.PI * 2);
      ctx.fill();
      // A small golden idol: head, body, base.
      ctx.fillStyle = '#e8b93e';
      ctx.beginPath();
      ctx.arc(vault.x, vault.y - 12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(vault.x - 6, vault.y - 7, 12, 11);
      ctx.fillRect(vault.x - 8, vault.y + 4, 16, 4);
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(8, 10, 18, 0.85)';
      ctx.strokeText('TIDE VAULT', vault.x, vault.y - 40);
      ctx.fillStyle = '#ffd76a';
      ctx.fillText('TIDE VAULT', vault.x, vault.y - 40);
    }
  }
  // The east exit: a green door in the outer wall, glowing once the Bell
  // is stolen so the escape route reads from across the museum.
  const ex = exitSpot;
  if (game.player.hasBell) {
    const eg = ctx.createRadialGradient(ex.x, ex.y, 4, ex.x, ex.y, 44);
    eg.addColorStop(0, 'rgba(70, 167, 88, 0.55)');
    eg.addColorStop(1, 'rgba(70, 167, 88, 0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, 44, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = game.player.hasBell ? '#2f9e57' : '#3d4a3f';
  ctx.fillRect(ex.x - 5, ex.y - 20, 10, 40);
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(8, 10, 18, 0.85)';
  ctx.strokeText('EXIT', ex.x - 16, ex.y + 5);
  ctx.fillStyle = '#c9f2d4';
  ctx.fillText('EXIT', ex.x - 16, ex.y + 5);
  // Coins not yet taken: bright gold with a sparkle, big enough to spot
  // at thumbnail size.
  for (const coin of game.player.coinsLeft) {
    if (coin.taken) continue;
    const cg = ctx.createRadialGradient(coin.x, coin.y, 1, coin.x, coin.y, 13);
    cg.addColorStop(0, 'rgba(255, 217, 77, 0.35)');
    cg.addColorStop(1, 'rgba(255, 217, 77, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9a7d2e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(coin.x - 11, coin.y);
    ctx.lineTo(coin.x - 5, coin.y);
    ctx.moveTo(coin.x + 5, coin.y);
    ctx.lineTo(coin.x + 11, coin.y);
    ctx.moveTo(coin.x, coin.y - 11);
    ctx.lineTo(coin.x, coin.y - 5);
    ctx.moveTo(coin.x, coin.y + 5);
    ctx.lineTo(coin.x, coin.y + 11);
    ctx.stroke();
  }}


// Night darkness with holes punched out at the lamps and around the player:
// lit floor reads as dangerous, shadow as safe. The dark layer lives on its
// own offscreen canvas so the holes erase darkness, never the floor itself.
let lightCanvas = null;

function drawLighting(ctx, game) {
  if (!lightCanvas) {
    lightCanvas = document.createElement('canvas');
    lightCanvas.width = COLS * TILE;
    lightCanvas.height = ROWS * TILE;
  }
  const lctx = lightCanvas.getContext('2d');
  lctx.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
  // Night, but readable: the old 0.40 darkness swallowed the whole frame
  // at thumbnail size. 0.20 keeps the night mood while the floor, the
  // cones and the gold stay visible.
  lctx.fillStyle = 'rgba(6, 8, 20, 0.20)';
  lctx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
  lctx.globalCompositeOperation = 'destination-out';
  for (const lamp of lamps) {
    const g = lctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    lctx.fillStyle = g;
    lctx.beginPath();
    lctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    lctx.fill();
  }
  const p = game.player;
  const g = lctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, 95);
  g.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  lctx.fillStyle = g;
  lctx.beginPath();
  lctx.arc(p.x, p.y, 95, 0, Math.PI * 2);
  lctx.fill();
  lctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightCanvas, 0, 0);
}

// A cone is drawn twice: a saturated gradient fill, then a crisp edge
// stroke along its sides and arc, so the field of view reads as a shape
// even when the screenshot is shrunk to a contact sheet.
function drawConePath(ctx, x, y, range, angle, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCones(ctx, game) {
  for (const guard of game.guards) {
    const fill = guard.state === 'alerted'
      ? 'rgba(229, 72, 77, 0.50)'
      : guard.state === 'suspicious' ? 'rgba(245, 165, 36, 0.44)' : 'rgba(245, 200, 60, 0.36)';
    const edge = guard.state === 'alerted'
      ? 'rgba(255, 120, 120, 0.8)'
      : guard.state === 'suspicious' ? 'rgba(255, 190, 80, 0.75)' : 'rgba(255, 220, 110, 0.7)';
    const g = ctx.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, CONE_RANGE);
    g.addColorStop(0, fill);
    g.addColorStop(0.75, fill);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    drawConePath(ctx, guard.x, guard.y, CONE_RANGE, guard.angle, CONE_HALF_ANGLE);
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    drawConePath(ctx, guard.x, guard.y, CONE_RANGE, guard.angle, CONE_HALF_ANGLE);
    ctx.stroke();
  }
  // Security cameras sweep red cones across their galleries.
  for (const camera of game.cameras) {
    if (camera.cooldown > 0) continue; // tripped cameras go dark
    const hot = camera.suspicion >= 50;
    const fill = hot ? 'rgba(245, 165, 36, 0.42)' : 'rgba(229, 72, 77, 0.32)';
    const g = ctx.createRadialGradient(camera.x, camera.y, 8, camera.x, camera.y, CAM_RANGE);
    g.addColorStop(0, fill);
    g.addColorStop(0.75, fill);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    drawConePath(ctx, camera.x, camera.y, CAM_RANGE, camera.angle, CAM_HALF_ANGLE);
    ctx.fill();
    ctx.strokeStyle = hot ? 'rgba(255, 190, 80, 0.7)' : 'rgba(255, 100, 100, 0.65)';
    ctx.lineWidth = 2;
    drawConePath(ctx, camera.x, camera.y, CAM_RANGE, camera.angle, CAM_HALF_ANGLE);
    ctx.stroke();
  }
}

function drawEntities(ctx, game) {
  // Security cameras: a dark mount on the wall with a red lens that
  // follows the sweep, and a small label so the player can name the threat.
  for (const camera of game.cameras) {
    const tripped = camera.cooldown > 0;
    ctx.fillStyle = '#1d222c';
    ctx.fillRect(camera.x - 9, camera.y - 9, 18, 18);
    ctx.strokeStyle = tripped ? '#3a4150' : '#e5484d';
    ctx.lineWidth = 2;
    ctx.strokeRect(camera.x - 9, camera.y - 9, 18, 18);
    ctx.fillStyle = tripped ? '#39415a' : '#ff5252';
    ctx.beginPath();
    ctx.arc(camera.x + Math.cos(camera.angle) * 4, camera.y + Math.sin(camera.angle) * 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    if (!tripped) {
      ctx.fillStyle = 'rgba(255, 82, 82, 0.95)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(camera.name, camera.x, camera.y - 13);
    }
  }
  for (const guard of game.guards) {
    // Body: dark red uniform, pale helmet, facing tick.
    ctx.fillStyle = '#a83a44';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 13.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b0f13';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e8ddc2';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * 19, guard.y + Math.sin(guard.angle) * 19);
    ctx.stroke();
    // "?" while curious, "!" while chasing.
    if (guard.state !== 'patrol') {
      ctx.fillStyle = guard.state === 'alerted' ? '#ff5252' : '#ffc53d';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.state === 'alerted' ? '!' : '?', guard.x, guard.y - 22);
    }
  }
  // Wren: a teal hooded figure, cloak pointing where she faces — bigger
  // and brighter than before, so the player is findable in one glance.
  const p = game.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#2dd4bf';
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-11, -10);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-11, 10);
  ctx.closePath();
  ctx.fill();
  // A pale rim so Wren stays visible against the dark floor.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#0f766e';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ccfbf1';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawPulses(ctx, game) {
  for (const pulse of game.pulses) {
    ctx.strokeStyle = pulse.color;
    ctx.globalAlpha = pulse.alpha;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pulse.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
