import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = join(root, 'generated');
const items = [
  ['index', 'web/index.html', false],
  ['gsc-manifest', 'assets/manifest.webmanifest', false],
  ['gsc-icon-48', 'assets/icon-48.png', true],
  ['gsc-icon-180', 'assets/apple-touch-icon.png', true],
  ['gsc-icon-192', 'assets/icon-192.png', true],
  ['gsc-icon-512', 'assets/icon-512.png', true],
];
const quoted = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const statements = [
  '-- Generated from public assets only. Contains no user or financial records.',
  '-- Load this after applying database/schema.sql to a NEW EMPTY D1 database.',
  ...items.map(([name, filename, isBinary]) => {
    const bytes = readFileSync(join(root, filename));
    const data = isBinary ? bytes.toString('base64') : bytes.toString('utf8');
    return 'INSERT INTO app_assets(name,content) VALUES('
      + quoted(name) + ',' + quoted(data)
      + ') ON CONFLICT(name) DO UPDATE SET content=excluded.content;';
  }),
];
mkdirSync(destination, { recursive: true });
writeFileSync(join(destination, 'seed-assets.sql'), statements.join('\n\n') + '\n', { mode: 0o600 });
console.log('Created generated/seed-assets.sql (public UI and icons only).');
