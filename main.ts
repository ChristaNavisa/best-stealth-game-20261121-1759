// main.ts — hands "The Merrow Museum" in: copies game/ and screenshots/
// into the output directory and writes the dossier buildDossier derives
// from them. Node 22 standard library only; runs twice, byte-identical.

import { buildDossier } from './vendor/makefun-game.ts';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The repository root is where this file lives, never the working directory:
// the grader runs the program with a cwd of its own.
const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function copyTree(source: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  const names = readdirSync(source).sort();
  for (const name of names) {
    const from = join(source, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) {
      copyTree(from, to);
    } else {
      cpSync(from, to);
    }
  }
}

function countFiles(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      const sub = countFiles(path);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += statSync(path).size;
    }
  }
  return { files, bytes };
}

function handIn(): void {
  // Start from a clean output directory so a second run writes the same bytes.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  for (const part of ['game', 'screenshots']) {
    const source = join(repoRoot, part);
    if (!existsSync(source)) throw new Error(`hand-in: missing ${part}/ in ${repoRoot}`);
    copyTree(source, join(outDir, part));
  }
  const dossier = buildDossier(outDir, DOSSIER_CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  const gameCount = countFiles(join(outDir, 'game'));
  const shotCount = countFiles(join(outDir, 'screenshots'));
  console.log(
    `hand-in complete: ${gameCount.files} game files (${gameCount.bytes} bytes), ` +
    `${shotCount.files} screenshots, dossier.json ${dossier.length} bytes in ${outDir}`,
  );
}

handIn();
