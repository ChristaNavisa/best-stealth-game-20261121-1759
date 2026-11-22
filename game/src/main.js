// main.js — "Bellwether — Five Heists by Lamplight": bootstrap, game loop
// and state machine. Wren slips into the museum at night and steals one
// of five treasures — the Sunken Bell, the Tide Idol, the Gilded
// Manuscript, the Brass Astrolabe, or the Grand Haul (Bell AND Idol) —
// then leaves through the east exit without ever being caught. States:
// select (pick a heist), playing, paused, won, lost. The simulation runs
// at a fixed step for fair tests.

import { TILE, COLS, ROWS, playerStart } from './level.js';
import { MISSIONS, missionById } from './missions.js';
import { SmokeField } from './gadgets.js';
import { Player } from './player.js';
import { makeGuards } from './guards.js';
import { makeCameras } from './cameras.js';
import { makeLasers } from './lasers.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { Hud } from './hud.js';
import { drawWorld } from './render.js';
import { applyShot, installDebugHandle } from './shots.js';

const STEP = 1 / 60;

// Ghost ratings, best first: GHOST beats SHADOW beats ALARMED.
const RATING_ORDER = { GHOST: 3, SHADOW: 2, ALARMED: 1 };

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.input = new Input(this.canvas);
    this.sounds = new SoundBank();
    this.hud = new Hud();
    this.overlay = document.getElementById('overlay');
    this.mission = MISSIONS[0];
    this.ratings = {}; // mission id -> best ghost rating this session
    this.reset(this.mission);
    this.state = 'select';
    this.frozen = false;
    this.elapsed = 0;
    this.everAlerted = false;
    this.spotted = 0; // times a guard grew suspicious
    this.alerts = 0; // times a guard gave chase or a lockdown tripped
    this.pulses = [];
    this._last = performance.now();
    this._acc = 0;
    this.showSelect();
    const shot = new URLSearchParams(location.search).get('shot');
    if (shot) {
      this.start();
      applyShot(this, shot);
    }
    installDebugHandle(this);
    requestAnimationFrame((t) => this.frame(t));
  }

  reset(mission) {
    this.mission = mission;
    this.player = new Player(playerStart);
    this.player.setMission(mission);
    this.guards = makeGuards(mission.guards);
    this.cameras = makeCameras(mission.cameras);
    this.lasers = makeLasers(mission.lasers);
    this.smoke = new SmokeField();
    this.elapsed = 0;
    this.everAlerted = false;
    this.spotted = 0;
    this.alerts = 0;
    this.lockdownT = 0; // seconds left of a camera-triggered lockdown
    this.laserAlarmT = 0; // seconds left of a laser-trip warning
    this.pulses = [];
  }

  // The heist-select screen: five jobs, each with its target, its guards
  // and its best ghost rating so far. Click a card, or press 1–5.
  showSelect() {
    const cards = MISSIONS.map((m) => {
      const guards = m.guards ? m.guards.length : 6;
      const cams = m.cameras ? m.cameras.length : 3;
      const lasers = m.lasers ? m.lasers.length : 3;
      const best = this.ratings[m.id];
      const badge = best ? ` · <b style="color:#ffd76a">${best}</b>` : '';
      return `<button data-mission="${m.id}" style="display:block;width:100%;text-align:left;background:#141a26;border:1px solid #39415a;color:#e8e6df;border-radius:8px;padding:10px 14px;margin:7px 0;cursor:pointer;font-family:Georgia,serif;font-size:15px">
        <b style="color:#e8b93e">Heist ${m.num} — ${m.name}</b>${badge}<br>
        <span style="font-size:13px;color:#b9c0cf">${guards} guards · ${cams} cameras · ${lasers} lasers · 2 smoke veils · ${m.hint}</span>
      </button>`;
    }).join('');
    this.showOverlay(
      `<h1>Bellwether</h1><p>Five heists by lamplight. One museum, five nights — ` +
      `steal a different treasure from a different wing each time, then reach ` +
      `the green EXIT unseen. Finish a heist without ever being spotted for a ` +
      `<b>GHOST</b> rating.</p>${cards}` +
      `<p class="keys"><b>WASD / arrows</b> move · <b>Shift</b> run (fast, loud) · ` +
      `<b>C</b> sneak (slow, silent) · <b>Click</b> throw a pebble · ` +
      `<b>Q</b> throw a smoke veil · <b>X / right-click</b> toss a brass coin lure · ` +
      `<b>P</b> pause · <b>R</b> restart</p>` +
      `<p class="keys">Click a heist, or press 1–5, to begin.</p>`,
    );
  }

  start(missionId) {
    this.reset(missionById(missionId ?? this.mission.id));
    this.state = 'playing';
    this.overlay.classList.add('hidden');
    this.sounds.unlock();
  }

  showOverlay(html) {
    this.overlay.innerHTML = html;
    this.overlay.classList.remove('hidden');
    for (const btn of this.overlay.querySelectorAll('[data-mission]')) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.start(btn.getAttribute('data-mission'));
      });
    }
  }

  // The ghost rating for a finished heist: GHOST (never even suspected),
  // SHADOW (suspected but never chased), ALARMED (chased, but escaped).
  ghostRating() {
    if (this.alerts === 0 && this.spotted === 0) return 'GHOST';
    if (this.alerts === 0) return 'SHADOW';
    return 'ALARMED';
  }

  // Alarm level 0–3 for the HUD: calm, suspicious, hunted, lockdown.
  alarmLevel() {
    if (this.lockdownT > 0) return 3;
    if (this.guards.some((g) => g.state === 'alerted')) return 2;
    if (this.guards.some((g) => g.state === 'suspicious')) return 1;
    return 0;
  }

  win() {
    this.state = 'won';
    this.sounds.win();
    const t = Math.floor(this.elapsed);
    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    const rating = this.ghostRating();
    const prev = this.ratings[this.mission.id];
    if (!prev || RATING_ORDER[rating] > RATING_ORDER[prev]) this.ratings[this.mission.id] = rating;
    const target = this.mission.targetLabel;
    const extra = ` · Tide Vault ${this.player.hasVault ? 'looted' : 'untouched'}`;
    this.showOverlay(
      `<h1>Clean getaway!</h1><p>Wren slips into the night with ${target} — ` +
      `Heist ${this.mission.num}, ${this.mission.name}.</p>` +
      `<p>Time ${mm}:${ss} · Coins ${this.player.coins}/8 · Lures left ${this.player.lures} · ` +
      `Smoke left ${this.player.smokes}${extra}</p>` +
      `<p><b>${rating}</b>${rating === 'GHOST' ? ' — never once spotted' : rating === 'SHADOW' ? ' — seen, but never chased' : ' — chased, but never caught'}</p>` +
      `<p>Spotted ${this.spotted}× · Alarms ${this.alerts}× · Best this session: ${this.ratings[this.mission.id]}</p>` +
      `<p>Press R to replay this heist, or click here for the heist list.</p>`,
    );
  }

  lose(guard) {
    this.state = 'lost';
    this.sounds.lose();
    this.showOverlay(
      `<h1>Caught by ${guard.name}!</h1><p>The museum lights snap on. ${this.mission.targetLabel} stays where it is.</p>` +
      `<p>Press R to retry Heist ${this.mission.num}, or click here for the heist list.</p>`,
    );
  }

  frame(now) {
    const dt = Math.min(0.1, (now - this._last) / 1000);
    this._last = now;
    if (this.state === 'playing' && !this.frozen) {
      this._acc += dt;
      while (this._acc >= STEP) {
        this._acc -= STEP;
        this.step(STEP);
      }
    }
    this.render();
    // Keep the HUD honest even when the simulation is frozen for a photo.
    this.hud.update(this);
    requestAnimationFrame((t) => this.frame(t));
  }

  step(dt) {
    this.elapsed += dt;
    if (this.lockdownT > 0) this.lockdownT = Math.max(0, this.lockdownT - dt);
    if (this.laserAlarmT > 0) this.laserAlarmT = Math.max(0, this.laserAlarmT - dt);
    this.smoke.update(dt);
    const events = [];
    const click = this.input.takeClick();
    if (click && this.player.pebbles > 0) {
      this.player.throwPebble(click.x, click.y, events);
    }
    const rclick = this.input.takeRightClick();
    if (rclick && this.player.lures > 0) {
      this.player.throwCoin(rclick.x, rclick.y, events);
    }
    if (this.input.takeCoinKey() && this.player.lures > 0) {
      this.player.throwCoin(this.input.mouseX, this.input.mouseY, events);
    }
    if (this.input.takeSmokeKey() && this.player.smokes > 0) {
      this.player.throwSmoke(this.input.mouseX, this.input.mouseY, events);
    }
    this.player.update(dt, this.input, events);
    for (const laser of this.lasers) {
      laser.update(dt, this.elapsed, this.player, events);
    }
    for (const guard of this.guards) {
      guard.update(dt, this.player, events.filter((e) => e.type === 'noise'), events, this.smoke);
    }
    for (const camera of this.cameras) {
      camera.update(dt, this.elapsed, this.player, events, this.smoke);
    }
    this.handleEvents(events);
    for (const pulse of this.pulses) {
      pulse.r += 90 * dt;
      pulse.alpha = Math.max(0, pulse.alpha - dt * 1.6);
    }
    this.pulses = this.pulses.filter((p) => p.alpha > 0);
    if (this.player.atExit()) this.win();
    for (const guard of this.guards) {
      if (guard.catches(this.player)) {
        this.lose(guard);
        break;
      }
    }
    this.hud.update(this);
  }

  handleEvents(events) {
    for (const e of events) {
      if (e.type === 'noise' && e.loud) {
        this.pulses.push({ x: e.x, y: e.y, r: 6, alpha: 0.7, color: 'rgba(255, 200, 90, 0.8)' });
      }
      if (e.type === 'playerStep' && !e.quiet) {
        this.sounds.step(false, false);
        this.pulses.push({ x: e.x, y: e.y, r: 4, alpha: 0.35, color: 'rgba(45, 212, 191, 0.7)' });
      }
      if (e.type === 'step') {
        const d = Math.hypot(e.guard.x - this.player.x, e.guard.y - this.player.y);
        if (d < 380) {
          this.sounds.step(true, e.guard.state === 'alerted');
          this.pulses.push({ x: e.guard.x, y: e.guard.y, r: 5, alpha: 0.4, color: 'rgba(229, 72, 77, 0.7)' });
        }
      }
      if (e.type === 'pebble') this.sounds.clatter();
      if (e.type === 'coinToss') {
        this.sounds.coin();
        this.pulses.push({ x: e.x, y: e.y, r: 8, alpha: 0.85, color: 'rgba(232, 200, 90, 0.9)' });
      }
      if (e.type === 'smoke') {
        // A veil blooms: guards and cameras looking through it go blind.
        this.sounds.smoke();
        this.smoke.throwAt(e.x, e.y);
        this.pulses.push({ x: e.x, y: e.y, r: 8, alpha: 0.85, color: 'rgba(226, 232, 240, 0.9)' });
      }
      if (e.type === 'laser') {
        // A tripwire crossed while it burned: every guard grows
        // suspicious and comes to look at the crossing — a setback, not
        // a lockdown, so a careful burglar can still recover.
        this.laserAlarmT = 3;
        this.sounds.noticed();
        this.pulses.push({ x: e.x, y: e.y, r: 8, alpha: 0.85, color: 'rgba(255, 82, 82, 0.9)' });
        for (const guard of this.guards) {
          guard.suspicion = Math.min(100, guard.suspicion + 40);
          guard.lastSeen = { x: this.player.x, y: this.player.y };
          if (guard.state === 'patrol') guard.state = 'suspicious';
        }
      }
      if (e.type === 'lockdown') {
        // A camera caught you: every guard hunts your position at once.
        this.everAlerted = true;
        this.alerts += 1;
        this.lockdownT = 6;
        this.sounds.alarm();
        for (const guard of this.guards) {
          guard.state = 'alerted';
          guard.suspicion = 100;
          guard.lastSeen = { x: this.player.x, y: this.player.y };
          guard.lostTimer = 0;
        }
      }
      if (e.type === 'noticed') {
        this.spotted += 1;
        this.sounds.noticed();
      }
      if (e.type === 'alarm') {
        this.everAlerted = true;
        this.alerts += 1;
        this.sounds.alarm();
      }
      if (e.type === 'coin' || e.type === 'bell' || e.type === 'vault' || e.type === 'target') {
        if (e.type === 'bell') this.sounds.bell();
        else this.sounds.pickup();
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);
    drawWorld(ctx, this);
  }
}

const game = new Game();
window.__merrowGame = game;

document.getElementById('overlay').addEventListener('click', (e) => {
  if (e.target.closest('[data-mission]')) return; // the card handles itself
  if (game.state === 'won' || game.state === 'lost') {
    game.state = 'select';
    game.showSelect();
  }
});
window.addEventListener('keydown', (e) => {
  game.sounds.unlock();
  if (game.state === 'select') {
    const idx = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(e.code);
    if (idx >= 0) game.start(MISSIONS[idx].id);
    else if (e.code === 'Enter' || e.code === 'Space') game.start();
    return;
  }
  if (e.code === 'KeyR' && (game.state === 'won' || game.state === 'lost' || game.state === 'paused')) {
    game.start(game.mission.id);
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    // Pause and resume live here only: handling them in the step loop too
    // would eat the same keypress twice (pause, then instantly re-pause).
    if (game.state === 'playing') {
      game.state = 'paused';
      game.showOverlay('<h1>Paused</h1><p>Press P to keep sneaking, or R to restart this heist.</p>');
    } else if (game.state === 'paused') {
      game.state = 'playing';
      game.overlay.classList.add('hidden');
    }
  } else if ((e.code === 'Enter' || e.code === 'Space') && game.state === 'menu') {
    game.start();
  }
});
