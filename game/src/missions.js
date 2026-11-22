// missions.js — Bellwether's five heists. One museum, five nights: each
// heist steals a different treasure from a different wing, with its own
// guards on its own patrols, its own cameras and lasers, and its own
// briefing. The map never changes — the job does. The Grand Haul, the
// last heist, demands the Bell AND the Tide Vault's idol in one night.

import { bellSpot, vaultSpot, manuscriptSpot, astrolabeSpot } from './level.js';

export const MISSIONS = [
  {
    id: 'bell',
    num: 1,
    name: 'The Sunken Bell',
    shortName: 'Heist I — Bell',
    targetKey: 'bell',
    targetSpot: bellSpot,
    targetLabel: 'THE SUNKEN BELL',
    brief: 'Steal the Sunken Bell.',
    guards: null, // the full museum: all six guards on their usual rounds
    cameras: null, // all three cameras
    lasers: null, // all three tripwires
    requiresVault: false,
    hint: 'The classic job. Learn the rounds, mind the lasers, slip out east.',
  },
  {
    id: 'idol',
    num: 2,
    name: 'The Tide Idol',
    shortName: 'Heist II — Idol',
    targetKey: 'vault',
    targetSpot: vaultSpot,
    targetLabel: 'TIDE VAULT',
    brief: 'Steal the Tide Idol.',
    guards: [
      { name: 'Bram' },
      { name: 'Pell', route: [[10, 13], [20, 13]] },
      { name: 'Sable' },
      { name: 'Odo' },
    ],
    cameras: ['Cam A', 'Cam C'],
    lasers: ['Laser S', 'Laser E'],
    requiresVault: false,
    hint: 'Bram walks the south gallery all night. Pell now patrols the middle floor.',
  },
  {
    id: 'manuscript',
    num: 3,
    name: 'The Gilded Manuscript',
    shortName: 'Heist III — Manuscript',
    targetKey: 'manuscript',
    targetSpot: manuscriptSpot,
    targetLabel: 'GILDED MANUSCRIPT',
    brief: 'Steal the Manuscript.',
    guards: [
      { name: 'Marlow' },
      { name: 'Ivo' },
      { name: 'Pell' },
      { name: 'Sable', route: [[11, 4], [19, 4]] },
    ],
    cameras: ['Cam A', 'Cam B'],
    lasers: ['Laser N', 'Laser E'],
    requiresVault: false,
    hint: 'Sable has moved north to guard the lectern. The north door laser still burns.',
  },
  {
    id: 'astrolabe',
    num: 4,
    name: 'The Brass Astrolabe',
    shortName: 'Heist IV — Astrolabe',
    targetKey: 'astrolabe',
    targetSpot: astrolabeSpot,
    targetLabel: 'BRASS ASTROLABE',
    brief: 'Steal the Astrolabe.',
    guards: [
      { name: 'Odo', route: [[24, 2], [27, 2], [27, 6], [24, 6]] },
      { name: 'Marlow' },
      { name: 'Ivo' },
    ],
    cameras: ['Cam B'],
    lasers: ['Laser E'],
    requiresVault: false,
    hint: 'Few guards, but Odo owns the east wing and Cam B sweeps the exit approach.',
  },
  {
    id: 'haul',
    num: 5,
    name: 'The Grand Haul',
    shortName: 'Heist V — Grand Haul',
    targetKey: 'bell',
    targetSpot: bellSpot,
    targetLabel: 'THE SUNKEN BELL',
    brief: 'Steal the Bell and Idol.',
    guards: null,
    cameras: null,
    lasers: null,
    requiresVault: true,
    hint: 'Everything, in one night. The Bell, the Idol, and the east-wing exit.',
  },
];

export function missionById(id) {
  return MISSIONS.find((m) => m.id === id) ?? MISSIONS[0];
}
