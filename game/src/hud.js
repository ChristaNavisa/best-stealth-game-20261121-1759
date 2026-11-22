// hud.js — the heads-up display: objective line, detection meter, timer,
// pebble count, and the minimap that shows guards, the bell and the exit.

import { COLS, ROWS, TILE, grid, T_FLOOR, bellSpot, vaultSpot, exitSpot } from './level.js';
import { darknessAt } from './raycast.js';

export class Hud {
  constructor() {
    this.objective = document.getElementById('objective');
    this.meterFill = document.getElementById('meter-fill');
    this.meterLabel = document.getElementById('meter-label');
    this.timer = document.getElementById('timer');
    this.pebbles = document.getElementById('pebbles');
    this.minimap = document.getElementById('minimap');
    this.miniCtx = this.minimap.getContext('2d');
  }

  update(game) {
    const player = game.player;
    const m = game.mission;
    this.objective.textContent = player.hasTarget
      ? (m.requiresVault && !player.hasVault ? 'Steal the Idol, then escape!' : 'Stolen — escape to the EXIT!')
      : m.brief;
    const worst = Math.max(0, ...game.guards.map((g) => g.suspicion), game.warden ? game.warden.suspicion : 0);
    const pct = Math.min(100, Math.round(worst));
    this.meterFill.style.width = `${pct}%`;
    const stage = worst >= 70 ? 'ALERTED' : worst >= 30 ? 'SUSPICIOUS' : 'UNSEEN';
    this.meterFill.style.background = worst >= 70 ? '#e5484d' : worst >= 30 ? '#f5a524' : '#46a758';
    // Alarm level 0–3: calm, suspicious, hunted, lockdown — it decays
    // when you break sight, so a near-miss is recoverable.
    const level = game.alarmLevel ? game.alarmLevel() : 0;
    this.meterLabel.textContent = game.lockdownT > 0
      ? `LOCKDOWN ${Math.ceil(game.lockdownT)}s — every guard is hunting!`
      : game.whistleT > 0
        ? `WARDEN WHISTLE ${Math.ceil(game.whistleT)}s — every guard is coming!`
        : game.laserAlarmT > 0
          ? 'LASER TRIPPED — guards are searching!'
          : `Alarm ${level}/3 · ${pct}% — ${stage}`;
    // Raycast shadow: a burglar in hard shadow is seen from much closer,
    // so the meter says so at a glance.
    if (darknessAt(player.x, player.y) > 0.6) {
      this.meterLabel.textContent += ' · IN SHADOW — hard to spot';
    }
    const t = Math.floor(game.elapsed);
    this.timer.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    this.pebbles.textContent = `Pebbles ${player.pebbles} · Smoke ${player.smokes} · Lures ${player.lures} · Dash ${player.dashes}${player.dashCd > 0 ? ` (${Math.ceil(player.dashCd)}s)` : ''} · Coins ${player.coins}/8`;
    this.drawMinimap(game);
  }

  drawMinimap(game) {
    const ctx = this.miniCtx;
    const w = this.minimap.width;
    const h = this.minimap.height;
    const sx = w / (COLS * TILE);
    const sy = h / (ROWS * TILE);
    ctx.fillStyle = '#101418';
    ctx.fillRect(0, 0, w, h);
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        if (grid[ty * COLS + tx] !== T_FLOOR) {
          ctx.fillStyle = '#3a4150';
          ctx.fillRect(tx * TILE * sx, ty * TILE * sy, TILE * sx + 0.5, TILE * sy + 0.5);
        }
      }
    }
    // Exit (green), this heist's target (gold), coins (pale gold).
    ctx.fillStyle = '#46a758';
    ctx.fillRect((exitSpot.x - 8) * sx, (exitSpot.y - 8) * sy, 16 * sx, 16 * sy);
    if (!game.player.hasTarget) {
      ctx.fillStyle = '#e8b93e';
      ctx.beginPath();
      ctx.arc(game.mission.targetSpot.x * sx, game.mission.targetSpot.y * sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // The Tide Vault (gold diamond) and the cameras (red squares).
    if (!game.player.hasVault && game.mission.targetKey !== 'vault') {
      ctx.fillStyle = '#ffd700';
      ctx.save();
      ctx.translate(vaultSpot.x * sx, vaultSpot.y * sy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }
    // Laser tripwires: red dashes across their doorways, dim while dark.
    if (game.lasers) {
      for (const laser of game.lasers) {
        ctx.strokeStyle = laser.isOn(game.elapsed) ? '#ff5252' : 'rgba(255, 82, 82, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(laser.x0 * sx, laser.y0 * sy);
        ctx.lineTo(laser.x1 * sx, laser.y1 * sy);
        ctx.stroke();
      }
    }
    for (const camera of game.cameras) {
      ctx.fillStyle = camera.cooldown > 0 ? '#39415a' : '#ff5252';
      ctx.fillRect((camera.x - 4) * sx, (camera.y - 4) * sy, 8 * sx, 8 * sy);
    }
    for (const coin of game.player.coinsLeft) {
      if (coin.taken) continue;
      ctx.fillStyle = '#d9c27a';
      ctx.fillRect((coin.x - 3) * sx, (coin.y - 3) * sy, 6 * sx, 6 * sy);
    }
    // Guards: red triangles pointing where they face.
    for (const g of game.guards) {
      ctx.save();
      ctx.translate(g.x * sx, g.y * sy);
      ctx.rotate(g.angle);
      ctx.fillStyle = g.state === 'alerted' ? '#ff2e2e' : '#e5484d';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // The Night Warden: a gold diamond — the one guard you must watch most.
    if (game.warden) {
      const w = game.warden;
      ctx.fillStyle = w.state === 'alerted' ? '#ff2e2e' : '#ffd76a';
      ctx.save();
      ctx.translate(w.x * sx, w.y * sy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
    // Player: teal dot with a white rim.
    ctx.fillStyle = '#2dd4bf';
    ctx.beginPath();
    ctx.arc(game.player.x * sx, game.player.y * sy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
