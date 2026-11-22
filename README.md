# Bellwether — Five Heists by Lamplight: 5 heists, 6 guards, smoke veils, coin lures & ghost ratings

[![Make the best stealth game](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/ChristaNavisa/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/ChristaNavisa/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A top-down stealth game made for the make.fun bounty **Make the best stealth game**
(`best-stealth-game-20261121-1759`). Midnight at the Merrow Museum: Wren the burglar
slips in to steal — not one treasure, but one of five, on five different nights.
Each heist steals a different treasure from a different wing, with its own guards
on their own patrols, its own cameras and lasers: the Sunken Bell, the Tide Idol,
the Gilded Manuscript, the Brass Astrolabe — and the Grand Haul, which demands the
Bell **and** the Idol in a single night. Then she escapes through the east wing
without ever being caught.

## Five heists

Pick a job from the heist list (click a card, or press 1–5). One museum, five nights:

| Heist | Treasure | Guards | Cameras | Lasers |
| --- | --- | --- | --- | --- |
| I — The Sunken Bell | The Sunken Bell, central gallery | 6 | 3 | 3 |
| II — The Tide Idol | The Tide Idol, south gallery | 4 | 2 | 2 |
| III — The Gilded Manuscript | The Manuscript, north gallery | 4 | 2 | 2 |
| IV — The Brass Astrolabe | The Astrolabe, east wing | 3 | 1 | 1 |
| V — The Grand Haul | The Bell **and** the Idol | 6 | 3 | 3 |

Guards move between heists: Pell patrols the middle floor on the Idol job, Sable
moves north to guard the Manuscript's lectern, and Odo owns the east wing alone
on the Astrolabe job. Every heist carries 2 smoke veils, 5 pebbles and 3 coin lures.

## The game

- **A level to learn:** three galleries and an east wing, seen from above. Six guards walk
  fixed patrol loops you can memorize — Marlow and Ivo in the north gallery, Pell and
  Sable circling the Bell, Bram in the south gallery, Odo guarding the exit corridor —
  each pausing at waypoints.
- **Security cameras:** three wall-mounted cameras sweep red cones across the central
  gallery, the east wing and the south gallery. Linger in a cone and the camera trips
  a **lockdown**: every guard is alerted to your position at once. A tripped camera
  goes dark for 8 seconds before it resumes sweeping.
- **Laser tripwires:** three beams guard the doorways — north gallery, south gallery,
  and the east-wing exit itself. Each beam burns red, then goes dark, on a fixed
  4-second cycle you can learn. Cross a live beam and every guard grows suspicious
  and comes to look at the crossing; a tripped beam stays dark for 5 seconds.
- **Visible vision cones:** every guard's cone is drawn on the floor. Step inside one
  and suspicion climbs; lamplight makes it climb faster, sneaking and the potted
  plants slow it down.
- **A detection system that forgives:** suspicious guards walk over to look; alerted
  guards chase. Break their sight, hide, and the alarm decays — a near-miss is a
  story, not a game over. The HUD's alarm level (0–3: calm, suspicious, hunted,
  lockdown) shows how hot you are.
- **Ghost ratings:** finish a heist without ever being spotted for **GHOST**, spotted
  but never chased for **SHADOW**, chased but escaped for **ALARMED**. Your best
  rating per heist is kept on the heist list for the session.
- **Smoke veils:** throw a veil (Q, 2 per heist) where a cone cannot be dodged — guards
  and cameras cannot see through smoke, or see you standing inside it. The way to
  walk straight across a lit gallery, or to vanish mid-chase.
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
  LOCKDOWN countdown, laser-trip warning, objective line, timer, pebble, lure and coin
  counts, and a live minimap of guards, cameras, lasers, the Bell, the Tide Vault and
  the exit. Pause, win and lose screens, instant restart.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Run — fast, but loud |
| C | Sneak — slow, silent |
| Click | Throw a pebble (5 per run) to lure a guard |
| Q | Throw a smoke veil (2 per heist) — blinds guards and cameras |
| X / right-click | Toss a brass coin lure (3 per run) — louder, pulls guards farther |
| 1–5 | Pick a heist on the heist list |
| P / Esc | Pause |
| R | Restart after win / loss / pause |
| Enter / click | Start |

## Layout

- `game/index.html` — page, HUD and canvas
- `game/src/main.js` — bootstrap, game loop, state machine, heist select, ghost ratings
- `game/src/missions.js` — the five heists: target, guards, cameras, lasers, briefing
- `game/src/gadgets.js` — the smoke veil: clouds that blind guards and cameras
- `game/src/level.js` — the museum floor plan (walls, cover, lamps, objectives)
- `game/src/guards.js` — guard brains: patrol, suspicion, investigation, chase
- `game/src/cameras.js` — security cameras: sweeping cones, suspicion, lockdown
- `game/src/lasers.js` — laser tripwires: fixed blink cycle, crossing trips suspicion
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
