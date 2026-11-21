# The Merrow Museum — Night of the Sunken Bell: 6 guards, 3 security cameras, 8 treasures, coin lures & lockdown alarm

[![Make the best stealth game](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/ChristaNavisa/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/ChristaNavisa/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A top-down stealth game made for the make.fun bounty **Make the best stealth game**
(`best-stealth-game-20261121-1759`). Midnight at the Merrow Museum: Wren the burglar
slips in to steal the Sunken Bell — gold, older than the city — from the central
gallery, then escapes through the east wing without ever being caught. Six guards
walk the galleries, three security cameras sweep red cones over them, and a second
vault in the south gallery hides the Tide Vault's golden idol for burglars who dare.

## The game

- **A level to learn:** three galleries and an east wing, seen from above. Six guards walk
  fixed patrol loops you can memorize — Marlow and Ivo in the north gallery, Pell and
  Sable circling the Bell, Bram in the south gallery, Odo guarding the exit corridor —
  each pausing at waypoints.
- **Security cameras:** three wall-mounted cameras sweep red cones across the central
  gallery, the east wing and the south gallery. Linger in a cone and the camera trips
  a **lockdown**: every guard is alerted to your position at once. A tripped camera
  goes dark for 8 seconds before it resumes sweeping.
- **Visible vision cones:** every guard's cone is drawn on the floor. Step inside one
  and suspicion climbs; lamplight makes it climb faster, sneaking and the potted
  plants slow it down.
- **A detection system that forgives:** suspicious guards walk over to look; alerted
  guards chase. Break their sight, hide, and the alarm decays — a near-miss is a
  story, not a game over.
- **Noise is a tool and a risk:** running is fast but loud enough for guards to hear;
  walking is quiet; sneaking is silent. Click to throw a pebble and lure a guard away.
- **Coin lures:** toss a brass coin (X or right-click, 3 per run) — it lands with a
  bright clatter and a gold ring that pulls guards over from farther away than a pebble.
- **Two vaults, eight treasures:** the Sunken Bell in the central gallery and the Tide
  Vault's golden idol in the south gallery, plus 8 coins scattered through the museum.
- **Footsteps you can follow:** every guard step pings a small red pulse on the floor
  (and a soft tap in the audio), so you always know roughly where they are.
- **Lighting that shows what is safe:** warm lamp pools are dangerous ground; the
  cool shadows between them are where Wren belongs.
- **HUD and minimap:** detection meter with UNSEEN / SUSPICIOUS / ALERTED stages and a
  LOCKDOWN countdown, objective line, timer, pebble, lure and coin counts, and a live
  minimap of guards, cameras, the Bell, the Tide Vault and the exit. Pause, win and
  lose screens, instant restart.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Run — fast, but loud |
| C | Sneak — slow, silent |
| Click | Throw a pebble (5 per run) to lure a guard |
| X / right-click | Toss a brass coin lure (3 per run) — louder, pulls guards farther |
| P / Esc | Pause |
| R | Restart after win / loss / pause |
| Enter / click | Start |

## Layout

- `game/index.html` — page, HUD and canvas
- `game/src/main.js` — bootstrap, game loop, state machine
- `game/src/level.js` — the museum floor plan (walls, cover, lamps, objectives)
- `game/src/guards.js` — guard brains: patrol, suspicion, investigation, chase
- `game/src/cameras.js` — security cameras: sweeping cones, suspicion, lockdown
- `game/src/patrol.js` — waypoint walking with pauses
- `game/src/vision.js` — vision cones, line of sight, detection rates
- `game/src/player.js` — Wren: movement, stances, noise, pebbles, pickups
- `game/src/input.js` — keyboard and mouse state
- `game/src/audio.js` — synthesized WebAudio sounds (no audio files)
- `game/src/hud.js` — HUD text, detection meter, minimap
- `game/src/render.js` — canvas drawing: floor, light and shadow, cones, figures
- `game/src/shots.js` — staged states for the screenshots
- `main.ts` — copies `game/` + `screenshots/` to the output and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Play it

Serve `game/` with any static server and open `index.html` in desktop Chrome.
No network requests: every script, sound and image is local or synthesized.
