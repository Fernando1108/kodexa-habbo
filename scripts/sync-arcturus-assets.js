#!/usr/bin/env node
/**
 * sync-arcturus-assets.js
 * Copies static assets from external/arcturus sources to assets/ serving directory.
 * Safe: never deletes, never overwrites without --force, shows summary.
 *
 * Usage:
 *   node scripts/sync-arcturus-assets.js          # dry-run stats
 *   node scripts/sync-arcturus-assets.js --run     # execute copy
 *   node scripts/sync-arcturus-assets.js --force   # overwrite existing files
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FORCE = process.argv.includes('--force');
const DRY   = !process.argv.includes('--run') && !process.argv.includes('--force');

/** Asset sync map: { src, dest, description } */
const SYNC_PAIRS = [
  {
    src:  'external/arcturus/objectretros/flash/c_images',
    dest: 'assets/swf/c_images',
    desc: 'Flash c_images (badges, catalogue, quests, camera effects, …)',
  },
  {
    src:  'external/arcturus/objectretros/nitro/nitro-assets/images',
    dest: 'assets/nitro/images',
    desc: 'Nitro images (reception, wallet, navigator, additions, furniextras)',
  },
  {
    src:  'external/arcturus/objectretros/nitro/nitro-assets/bundled/furniture',
    dest: 'assets/nitro/furniture/nitro',
    desc: 'Furniture .nitro bundles — primary bundle (room rendering)',
    filter: (f) => f.endsWith('.nitro'),
  },
  {
    // MP-010.1A.3: nested bundle — 63,965 additional .nitro (8,263 unique to this source)
    // Discovered during audit: separate bundle not included in primary sync path
    src:  'external/arcturus/objectretros/nitro/nitro-assets/nitro-assets/bundled/furniture',
    dest: 'assets/nitro/furniture/nitro',
    desc: 'Furniture .nitro bundles — nested bundle (additional 63K classname-based bundles)',
    filter: (f) => f.endsWith('.nitro'),
  },
  {
    src:  'external/arcturus/objectretros/nitro/nitro-assets/bundled/furniture',
    dest: 'assets/nitro/furniture/icons',
    desc: 'Furniture icon PNGs from bundled (catalog/inventory display)',
    filter: (f) => f.endsWith('_icon.png'),
  },
  {
    src:  'external/arcturus/objectretros/flash/c_images/catalogue',
    dest: 'assets/nitro/furniture/icons',
    desc: 'Furniture icon PNGs from flash catalogue (additional coverage)',
    filter: (f) => f.endsWith('_icon.png'),
  },
  {
    src:  'external/arcturus/objectretros/nitro/nitro-assets/sounds',
    dest: 'assets/nitro/sounds',
    desc: 'UI sounds (camera shutter, credits, messages, …)',
  },
  {
    src:  'external/arcturus/objectretros/nitro/nitro-assets/sounds',
    dest: 'assets/nitro/furniture/sounds',
    desc: 'UI sounds → furniture/sounds (sounds.url pattern serves from here)',
  },
];

// ─── helpers ────────────────────────────────────────────────────────────────

function walkDir(dir, cb) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(fullPath, cb);
    else cb(fullPath);
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function syncPair({ src, dest, desc, filter }) {
  const absSrc  = path.join(ROOT, src);
  const absDest = path.join(ROOT, dest);

  if (!fs.existsSync(absSrc)) {
    console.warn(`  SKIP (source not found): ${src}`);
    return { copied: 0, skipped: 0, missing: 1 };
  }

  let copied = 0, skipped = 0;

  walkDir(absSrc, (srcFile) => {
    const basename = path.basename(srcFile);
    if (filter && !filter(basename)) return;

    const rel      = path.relative(absSrc, srcFile);
    // For filtered syncs, flatten into dest dir (no subdirs)
    const destFile = filter
      ? path.join(absDest, basename)
      : path.join(absDest, rel);

    if (!FORCE && fs.existsSync(destFile)) {
      skipped++;
      return;
    }

    if (DRY) {
      copied++;
      return;
    }

    ensureDir(path.dirname(destFile));
    fs.copyFileSync(srcFile, destFile);
    copied++;
  });

  return { copied, skipped, missing: 0 };
}

// ─── main ────────────────────────────────────────────────────────────────────

console.log('');
console.log('=== sync-arcturus-assets' + (DRY ? ' [DRY RUN — use --run to apply]' : FORCE ? ' [FORCE]' : '') + ' ===');
console.log('');

let totalCopied = 0, totalSkipped = 0;

for (const pair of SYNC_PAIRS) {
  console.log(`► ${pair.desc}`);
  console.log(`  src : ${pair.src}`);
  console.log(`  dest: ${pair.dest}`);
  const { copied, skipped, missing } = syncPair(pair);
  if (missing) {
    console.log(`  ✗ source missing`);
  } else {
    console.log(`  ${DRY ? '(would copy)' : 'copied'} : ${copied}`);
    console.log(`  skipped: ${skipped}`);
    totalCopied  += copied;
    totalSkipped += skipped;
  }
  console.log('');
}

console.log(`Total ${DRY ? 'to copy' : 'copied'} : ${totalCopied}`);
console.log(`Total skipped  : ${totalSkipped}`);
console.log('');

if (DRY && totalCopied > 0) {
  console.log('Run with --run to apply, or --force to overwrite existing files.');
}
