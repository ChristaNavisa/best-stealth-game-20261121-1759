// shots.js — staged states for the screenshots, and the debug handle the
// playtests use. Every staged state is a state the real game can reach:
// positions, suspicion and objectives are set, then the simulation freezes
// so the frame stays still for the camera.

import { TILE, tileCenter } from './level.js';

export function applyShot(game, name) {
  const p = game.player;
  const [marlow, ivo, pell, sable, bram, odo] = game.guards;
  const [camA, camB, camC] = game.cameras;
  if (name === 'cover') {
    // The whole game at once: Wren behind a crate by the bell, cones
    // sweeping the central gallery, a camera watching from the north wall,
    // the exit glowing in the east wing.
    p.x = tileCenter(12, 10).x; p.y = tileCenter(12, 10).y;
    p.stance = 'sneak';
    pell.x = tileCenter(16, 8).x; pell.y = tileCenter(16, 8).y;
    pell.angle = Math.PI; pell.state = 'patrol'; pell.suspicion = 0;
    sable.x = tileCenter(17, 10).x; sable.y = tileCenter(17, 10).y;
    sable.angle = Math.PI; sable.state = 'patrol'; sable.suspicion = 0;
    marlow.x = tileCenter(12, 4).x; marlow.y = tileCenter(12, 4).y;
    marlow.angle = 0.3; marlow.state = 'patrol'; marlow.suspicion = 0;
    ivo.x = tileCenter(18, 1).x; ivo.y = tileCenter(18, 1).y;
    ivo.angle = Math.PI; ivo.state = 'patrol'; ivo.suspicion = 0;
    bram.x = tileCenter(12, 17).x; bram.y = tileCenter(12, 17).y;
    bram.angle = 0; bram.state = 'patrol'; bram.suspicion = 0;
    odo.x = tileCenter(26, 6).x; odo.y = tileCenter(26, 6).y;
    odo.angle = Math.PI / 2; odo.state = 'patrol'; odo.suspicion = 0;
    camA.angle = Math.PI / 2 + 0.45; camA.suspicion = 0;
    camB.angle = 0.4; camB.suspicion = 0;
    camC.angle = Math.PI / 2 - 0.4; camC.suspicion = 0;
  } else if (name === 'chase') {
    // A near-miss: Wren inches from Pell's cone, suspicion climbing, a
    // camera's cone already amber — the moment the detection system is
    // built for.
    p.x = tileCenter(14, 9).x; p.y = tileCenter(14, 9).y;
    p.stance = 'walk';
    pell.x = tileCenter(16, 9).x; pell.y = tileCenter(16, 9).y;
    pell.angle = Math.PI; pell.state = 'suspicious'; pell.suspicion = 58;
    pell.lastSeen = { x: p.x, y: p.y };
    sable.x = tileCenter(16, 11).x; sable.y = tileCenter(16, 11).y;
    sable.angle = -Math.PI / 2; sable.state = 'suspicious'; sable.suspicion = 41;
    sable.lastSeen = { x: p.x, y: p.y };
    marlow.x = tileCenter(10, 5).x; marlow.y = tileCenter(10, 5).y;
    marlow.angle = 0.9; marlow.state = 'patrol'; marlow.suspicion = 0;
    ivo.x = tileCenter(20, 1).x; ivo.y = tileCenter(20, 1).y;
    ivo.angle = Math.PI; ivo.state = 'patrol'; ivo.suspicion = 0;
    bram.x = tileCenter(10, 17).x; bram.y = tileCenter(10, 17).y;
    bram.angle = 0; bram.state = 'patrol'; bram.suspicion = 0;
    odo.x = tileCenter(25, 14).x; odo.y = tileCenter(25, 14).y;
    odo.angle = -Math.PI / 2; odo.state = 'patrol'; odo.suspicion = 0;
    camA.angle = Math.PI / 2 + 0.3; camA.suspicion = 62;
    camB.angle = -0.3; camB.suspicion = 0;
    camC.angle = Math.PI / 2; camC.suspicion = 0;
  } else if (name === 'exit') {
    // Bell in hand, Wren slipping down the east wing while Odo patrols the
    // corridor ahead and Cam B sweeps the exit approach.
    p.hasBell = true;
    p.coins = 2;
    p.x = tileCenter(25, 10).x; p.y = tileCenter(25, 10).y;
    p.stance = 'sneak';
    odo.x = tileCenter(26, 13).x; odo.y = tileCenter(26, 13).y;
    odo.angle = -Math.PI / 2; odo.state = 'patrol'; odo.suspicion = 0;
    pell.x = tileCenter(12, 11).x; pell.y = tileCenter(12, 11).y;
    pell.angle = Math.PI / 2; pell.state = 'patrol'; pell.suspicion = 0;
    sable.x = tileCenter(13, 10).x; sable.y = tileCenter(13, 10).y;
    sable.angle = 0; sable.state = 'patrol'; sable.suspicion = 0;
    marlow.x = tileCenter(18, 5).x; marlow.y = tileCenter(18, 5).y;
    marlow.angle = Math.PI; marlow.state = 'patrol'; marlow.suspicion = 0;
    ivo.x = tileCenter(10, 1).x; ivo.y = tileCenter(10, 1).y;
    ivo.angle = 0; ivo.state = 'patrol'; ivo.suspicion = 0;
    bram.x = tileCenter(20, 17).x; bram.y = tileCenter(20, 17).y;
    bram.angle = Math.PI; bram.state = 'patrol'; bram.suspicion = 0;
    camA.angle = Math.PI / 2; camA.suspicion = 0;
    camB.angle = 0.35; camB.suspicion = 35;
    camC.angle = Math.PI / 2 + 0.5; camC.suspicion = 0;
  } else if (name === 'win') {
    // The win screen itself, after a clean escape.
    p.hasBell = true;
    p.hasVault = true;
    p.coins = 8;
    p.lures = 1;
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
      player: { x: game.player.x, y: game.player.y, bell: game.player.hasBell, vault: game.player.hasVault, coins: game.player.coins, lures: game.player.lures },
      guards: game.guards.map((g) => ({ name: g.name, state: g.state, suspicion: Math.round(g.suspicion) })),
      cameras: game.cameras.map((c) => ({ name: c.name, suspicion: Math.round(c.suspicion), cooldown: Math.round(c.cooldown * 10) / 10 })),
      lockdownT: Math.round(game.lockdownT * 10) / 10,
    }),
    teleport: (x, y) => { game.player.x = x; game.player.y = y; },
    setSuspicion: (i, v) => { game.guards[i].suspicion = v; },
    start: () => game.start(),
  };
}
