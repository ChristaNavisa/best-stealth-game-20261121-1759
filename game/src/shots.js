// shots.js — staged states for the screenshots, and the debug handle the
// playtests use. Every staged state is a state the real game can reach:
// positions, suspicion and objectives are set, then the simulation freezes
// so the frame stays still for the camera.

import { TILE, tileCenter } from './level.js';

export function applyShot(game, name) {
  const p = game.player;
  const [marlow, pell, odo] = game.guards;
  if (name === 'cover') {
    // The whole game at once: Wren behind a crate by the bell, two cones
    // sweeping the central gallery, the exit glowing in the east wing.
    p.x = tileCenter(12, 10).x; p.y = tileCenter(12, 10).y;
    p.stance = 'sneak';
    pell.x = tileCenter(16, 8).x; pell.y = tileCenter(16, 8).y;
    pell.angle = Math.PI; pell.state = 'patrol'; pell.suspicion = 0;
    marlow.x = tileCenter(12, 4).x; marlow.y = tileCenter(12, 4).y;
    marlow.angle = 0.3; marlow.state = 'patrol'; marlow.suspicion = 0;
    odo.x = tileCenter(26, 6).x; odo.y = tileCenter(26, 6).y;
    odo.angle = Math.PI / 2; odo.state = 'patrol'; odo.suspicion = 0;
  } else if (name === 'chase') {
    // A near-miss: Wren inches from Pell's cone, suspicion climbing, alarm
    // about to break — the moment the detection system is built for.
    p.x = tileCenter(14, 9).x; p.y = tileCenter(14, 9).y;
    p.stance = 'walk';
    pell.x = tileCenter(16, 9).x; pell.y = tileCenter(16, 9).y;
    pell.angle = Math.PI; pell.state = 'suspicious'; pell.suspicion = 58;
    pell.lastSeen = { x: p.x, y: p.y };
    marlow.x = tileCenter(10, 5).x; marlow.y = tileCenter(10, 5).y;
    marlow.angle = 0.9; marlow.state = 'patrol'; marlow.suspicion = 0;
    odo.x = tileCenter(25, 14).x; odo.y = tileCenter(25, 14).y;
    odo.angle = -Math.PI / 2; odo.state = 'patrol'; odo.suspicion = 0;
  } else if (name === 'exit') {
    // Bell in hand, Wren slipping down the east wing while Odo patrols the
    // corridor ahead — the final stretch of a run.
    p.hasBell = true;
    p.coins = 2;
    p.x = tileCenter(25, 10).x; p.y = tileCenter(25, 10).y;
    p.stance = 'sneak';
    odo.x = tileCenter(26, 13).x; odo.y = tileCenter(26, 13).y;
    odo.angle = -Math.PI / 2; odo.state = 'patrol'; odo.suspicion = 0;
    pell.x = tileCenter(12, 11).x; pell.y = tileCenter(12, 11).y;
    pell.angle = Math.PI / 2; pell.state = 'patrol'; pell.suspicion = 0;
    marlow.x = tileCenter(18, 5).x; marlow.y = tileCenter(18, 5).y;
    marlow.angle = Math.PI; marlow.state = 'patrol'; marlow.suspicion = 0;
  } else if (name === 'win') {
    // The win screen itself, after a clean escape.
    p.hasBell = true;
    p.coins = 3;
    game.elapsed = 187;
    game.everAlerted = false;
    game.win();
  }
  game.frozen = true;
}

// Debug handle for playtests: state reads and scripted actions.
export function installDebugHandle(game) {
  window.__merrow = {
    game,
    state: () => ({
      phase: game.state,
      player: { x: game.player.x, y: game.player.y, bell: game.player.hasBell, coins: game.player.coins },
      guards: game.guards.map((g) => ({ name: g.name, state: g.state, suspicion: Math.round(g.suspicion) })),
    }),
    teleport: (x, y) => { game.player.x = x; game.player.y = y; },
    setSuspicion: (i, v) => { game.guards[i].suspicion = v; },
    start: () => game.start(),
  };
}
