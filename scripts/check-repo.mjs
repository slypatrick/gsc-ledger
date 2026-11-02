import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { Script } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'web/index.html'), 'utf8');
const worker = readFileSync(join(root, 'src/worker.mjs'), 'utf8');
const sql = readFileSync(join(root, 'database/schema.sql'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!source) throw new Error('Cannot find frontend inline JavaScript');
new Script(source, { filename: 'web/index.html <script>' });
if (!worker.includes('export default')) throw new Error('Missing Worker export');
if (!sql.includes('CREATE TABLE')) throw new Error('Missing D1 schema');
if (!html.includes('</html>')) throw new Error('Truncated frontend');
for (const [path, pattern] of [
  ['web/index.html', /gh[pousr]_[A-Za-z0-9]{12,}|-----BEGIN PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}/],
  ['src/worker.mjs', /gh[pousr]_[A-Za-z0-9]{12,}|-----BEGIN PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}/],
]) {
  const content = path.startsWith('web/') ? html : worker;
  if (pattern.test(content)) throw new Error('Potential credential in ' + path);
}
for (const filename of ['assets/icon-48.png', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png', 'assets/manifest.webmanifest']) {
  if (!existsSync(join(root, filename))) throw new Error('Missing asset: ' + filename);
}
console.log('GSC Ledger source, frontend JS, schema and public assets checked.');
