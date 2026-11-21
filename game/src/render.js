// render.js — everything the player sees: the museum floor, lamps and
// shadows, crates and cases, vision cones, guards, Wren, and the noise
// pulses that show where a footstep just landed.

import {
  TILE, COLS, ROWS, grid, T_WALL, T_CRATE, T_CASE,
  lamps, plants, bellSpot, vaultSpot, exitSpot,
} from './level.js';
import { CONE_RANGE, CONE_HALF_ANGLE } from './vision.js';
import { CAM_RANGE, CAM_HALF_ANGLE } from './cameras.js';

const FLOOR_A = '#2a2f3a';
const FLOOR_B = '#262b34';

export function drawWorld(ctx, game) {
  drawFloor(ctx);
  drawProps(ctx, game);
  drawLighting(ctx, game);
  drawCones(ctx, game);
  drawEntities(ctx, game);
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
  // Gallery names, faint on the floor so the level reads at a glance.
  ctx.fillStyle = 'rgba(220, 225, 235, 0.26)';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('NORTH GALLERY', 15 * TILE, 1.2 * TILE);
  ctx.fillText('CENTRAL GALLERY', 15 * TILE, 13.7 * TILE);
  ctx.fillText('SOUTH GALLERY', 15 * TILE, 18.6 * TILE);
  ctx.fillText('ENTRY HALL', 3.5 * TILE, 19 * TILE);
  ctx.fillText('EAST WING', 26.5 * TILE, 1.2 * TILE);
}

function drawProps(ctx, game) {
  // Lamp pools on the floor.
  for (const lamp of lamps) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(255, 196, 110, 0.34)');
    g.addColorStop(1, 'rgba(255, 196, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Plants: soft green clusters you can hide in.
  for (const key of plants) {
    const [tx, ty] = key.split(',').map(Number);
    const cx = (tx + 0.5) * TILE;
    const cy = (ty + 0.5) * TILE;
    ctx.fillStyle = '#2f6b3a';
    for (const [ox, oy, r] of [[-7, -4, 8], [6, -6, 7], [0, 6, 8], [7, 5, 6]]) {
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#3f8a4c';
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
        ctx.fillStyle = '#7a5a34';
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = '#5d4426';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + TILE - 2, y + TILE - 2);
        ctx.moveTo(x + TILE - 2, y + 2);
        ctx.lineTo(x + 2, y + TILE - 2);
        ctx.stroke();
      } else if (t === T_CASE) {
        ctx.fillStyle = '#4d5a6e';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = '#8fb4d9';
        ctx.fillRect(x + 9, y + 9, TILE - 18, TILE - 18);
        ctx.strokeStyle = '#2c3542';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      } else if (t === T_WALL) {
        ctx.fillStyle = '#151a22';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#232a38';
        ctx.fillRect(x, y, TILE, 3);
      }
    }
  }
  // The Sunken Bell on its pedestal, glowing gold.
  const bell = bellSpot;
  ctx.fillStyle = '#5b5344';
  ctx.fillRect(bell.x - 13, bell.y - 10, 26, 20);
  if (!game.player.hasBell) {
    const g = ctx.createRadialGradient(bell.x, bell.y - 4, 2, bell.x, bell.y - 4, 26);
    g.addColorStop(0, 'rgba(255, 215, 120, 0.9)');
    g.addColorStop(1, 'rgba(255, 215, 120, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bell.x, bell.y - 4, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b93e';
    ctx.beginPath();
    ctx.arc(bell.x, bell.y - 4, 9, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(bell.x - 11, bell.y - 4, 22, 3);
  }
  // The Tide Vault in the south gallery: a second pedestal with a golden idol.
  const vault = vaultSpot;
  ctx.fillStyle = '#5b5344';
  ctx.fillRect(vault.x - 13, vault.y - 10, 26, 20);
  if (!game.player.hasVault) {
    const vg = ctx.createRadialGradient(vault.x, vault.y - 4, 2, vault.x, vault.y - 4, 22);
    vg.addColorStop(0, 'rgba(255, 215, 120, 0.85)');
    vg.addColorStop(1, 'rgba(255, 215, 120, 0)');
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.arc(vault.x, vault.y - 4, 22, 0, Math.PI * 2);
    ctx.fill();
    // A small golden idol: head, body, base.
    ctx.fillStyle = '#e8b93e';
    ctx.beginPath();
    ctx.arc(vault.x, vault.y - 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(vault.x - 5, vault.y - 6, 10, 9);
    ctx.fillRect(vault.x - 7, vault.y + 3, 14, 3);
  }
  // The east exit: a green door in the outer wall.
  const ex = exitSpot;
  ctx.fillStyle = game.player.hasBell ? '#2f9e57' : '#3d4a3f';
  ctx.fillRect(ex.x - 4, ex.y - 16, 8, 32);
  ctx.fillStyle = '#c9f2d4';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', ex.x - 14, ex.y + 4);
  // Coins not yet taken.
  for (const coin of game.player.coinsLeft) {
    if (coin.taken) continue;
    ctx.fillStyle = '#e8c85a';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9a7d2e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

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
  lctx.fillStyle = 'rgba(6, 8, 20, 0.40)';
  lctx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
  lctx.globalCompositeOperation = 'destination-out';
  for (const lamp of lamps) {
    const g = lctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    lctx.fillStyle = g;
    lctx.beginPath();
    lctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    lctx.fill();
  }
  const p = game.player;
  const g = lctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, 95);
  g.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  lctx.fillStyle = g;
  lctx.beginPath();
  lctx.arc(p.x, p.y, 95, 0, Math.PI * 2);
  lctx.fill();
  lctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightCanvas, 0, 0);
}

function drawCones(ctx, game) {
  for (const guard of game.guards) {
    const color = guard.state === 'alerted'
      ? 'rgba(229, 72, 77, 0.34)'
      : guard.state === 'suspicious' ? 'rgba(245, 165, 36, 0.30)' : 'rgba(245, 214, 90, 0.26)';
    const g = ctx.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, CONE_RANGE);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, CONE_RANGE, guard.angle - CONE_HALF_ANGLE, guard.angle + CONE_HALF_ANGLE);
    ctx.closePath();
    ctx.fill();
  }
  // Security cameras sweep red cones across their galleries.
  for (const camera of game.cameras) {
    if (camera.cooldown > 0) continue; // tripped cameras go dark
    const hot = camera.suspicion >= 50;
    const color = hot ? 'rgba(245, 165, 36, 0.30)' : 'rgba(229, 72, 77, 0.22)';
    const g = ctx.createRadialGradient(camera.x, camera.y, 8, camera.x, camera.y, CAM_RANGE);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y);
    ctx.arc(camera.x, camera.y, CAM_RANGE, camera.angle - CAM_HALF_ANGLE, camera.angle + CAM_HALF_ANGLE);
    ctx.closePath();
    ctx.fill();
  }
}

function drawEntities(ctx, game) {
  // Security cameras: a dark mount on the wall with a red lens that
  // follows the sweep, and a small label so the player can name the threat.
  for (const camera of game.cameras) {
    const tripped = camera.cooldown > 0;
    ctx.fillStyle = '#1d222c';
    ctx.fillRect(camera.x - 8, camera.y - 8, 16, 16);
    ctx.strokeStyle = tripped ? '#3a4150' : '#e5484d';
    ctx.lineWidth = 2;
    ctx.strokeRect(camera.x - 8, camera.y - 8, 16, 16);
    ctx.fillStyle = tripped ? '#39415a' : '#ff5252';
    ctx.beginPath();
    ctx.arc(camera.x + Math.cos(camera.angle) * 4, camera.y + Math.sin(camera.angle) * 4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (!tripped) {
      ctx.fillStyle = 'rgba(255, 82, 82, 0.9)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(camera.name, camera.x, camera.y - 12);
    }
  }
  for (const guard of game.guards) {
    // Body: dark red uniform, pale helmet, facing tick.
    ctx.fillStyle = '#8c2f39';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b0f13';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#d8cdb4';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8e2d2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * 17, guard.y + Math.sin(guard.angle) * 17);
    ctx.stroke();
    // "?" while curious, "!" while chasing.
    if (guard.state !== 'patrol') {
      ctx.fillStyle = guard.state === 'alerted' ? '#ff5252' : '#ffc53d';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.state === 'alerted' ? '!' : '?', guard.x, guard.y - 20);
    }
  }
  // Wren: a teal hooded figure, cloak pointing where she faces.
  const p = game.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#14b8a6';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-9, -8);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-9, 8);
  ctx.closePath();
  ctx.fill();
  // A pale rim so Wren stays visible against the dark floor.
  ctx.strokeStyle = 'rgba(204, 251, 241, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#0f766e';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ccfbf1';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
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
