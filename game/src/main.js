// main.js — "The Merrow Museum": bootstrap, game loop and state machine.
// Wren slips into the museum at night, steals the Sunken Bell, and leaves
// through the east exit without ever being caught. States: menu, playing,
// paused, won, lost. The simulation runs at a fixed step for fair tests.

import { TILE, COLS, ROWS, playerStart } from './level.js';
import { Player } from './player.js';
import { makeGuards } from './guards.js';
import { makeCameras } from './cameras.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { Hud } from './hud.js';
import { drawWorld } from './render.js';
import { applyShot, installDebugHandle } from './shots.js';

const STEP = 1 / 60;

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.input = new Input(this.canvas);
    this.sounds = new SoundBank();
    this.hud = new Hud();
    this.overlay = document.getElementById('overlay');
    this.reset();
    this.state = 'menu';
    this.frozen = false;
    this.elapsed = 0;
    this.everAlerted = false;
    this.pulses = [];
    this._last = performance.now();
    this._acc = 0;
    const shot = new URLSearchParams(location.search).get('shot');
    if (shot) {
      this.start();
      applyShot(this, shot);
    }
    installDebugHandle(this);
    requestAnimationFrame((t) => this.frame(t));
  }

  reset() {
    this.player = new Player(playerStart);
    this.guards = makeGuards();
    this.cameras = makeCameras();
    this.elapsed = 0;
    this.everAlerted = false;
    this.lockdownT = 0; // seconds left of a camera-triggered lockdown
    this.pulses = [];
  }

  start() {
    this.reset();
    this.state = 'playing';
    this.overlay.classList.add('hidden');
    this.sounds.unlock();
  }

  showOverlay(html) {
    this.overlay.innerHTML = html;
    this.overlay.classList.remove('hidden');
  }

  win() {
    this.state = 'won';
    this.sounds.win();
    const t = Math.floor(this.elapsed);
    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    const rank = !this.everAlerted ? 'GHOST — never once spotted' : 'SHADOW — seen, but never caught';
    this.showOverlay(
      `<h1>Clean getaway!</h1><p>Wren slips into the night with the Sunken Bell.</p>` +
      `<p>Time ${mm}:${ss} · Coins ${this.player.coins}/8 · Lures left ${this.player.lures} · ` +
      `Tide Vault ${this.player.hasVault ? 'looted' : 'untouched'}</p>` +
      `<p><b>${rank}</b></p><p>Press R to play again.</p>`,
    );
  }

  lose(guard) {
    this.state = 'lost';
    this.sounds.lose();
    this.showOverlay(
      `<h1>Caught by ${guard.name}!</h1><p>The museum lights snap on. The Bell stays where it is.</p>` +
      `<p>Press R to try again — slower this time.</p>`,
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
    this.player.update(dt, this.input, events);
    for (const guard of this.guards) {
      guard.update(dt, this.player, events.filter((e) => e.type === 'noise'), events);
    }
    for (const camera of this.cameras) {
      camera.update(dt, this.elapsed, this.player, events);
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
      if (e.type === 'lockdown') {
        // A camera caught you: every guard hunts your position at once.
        this.everAlerted = true;
        this.lockdownT = 6;
        this.sounds.alarm();
        for (const guard of this.guards) {
          guard.state = 'alerted';
          guard.suspicion = 100;
          guard.lastSeen = { x: this.player.x, y: this.player.y };
          guard.lostTimer = 0;
        }
      }
      if (e.type === 'noticed') this.sounds.noticed();
      if (e.type === 'alarm') {
        this.everAlerted = true;
        this.sounds.alarm();
      }
      if (e.type === 'coin' || e.type === 'bell' || e.type === 'vault') {
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

document.getElementById('overlay').addEventListener('click', () => {
  if (game.state === 'menu' || game.state === 'won' || game.state === 'lost') game.start();
});
window.addEventListener('keydown', (e) => {
  game.sounds.unlock();
  if (e.code === 'KeyR' && (game.state === 'won' || game.state === 'lost' || game.state === 'paused')) {
    game.start();
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    // Pause and resume live here only: handling them in the step loop too
    // would eat the same keypress twice (pause, then instantly re-pause).
    if (game.state === 'playing') {
      game.state = 'paused';
      game.showOverlay('<h1>Paused</h1><p>Press P to keep sneaking, or R to restart.</p>');
    } else if (game.state === 'paused') {
      game.state = 'playing';
      game.overlay.classList.add('hidden');
    }
  } else if ((e.code === 'Enter' || e.code === 'Space') && game.state === 'menu') {
    game.start();
  }
});
