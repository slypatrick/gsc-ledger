import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = join(root, 'generated');
const key = randomBytes(24).toString('hex').toUpperCase();
mkdirSync(directory, { recursive: true });
const sql = "INSERT INTO app_settings(key,value) VALUES('setup_token','"
  + key + "') ON CONFLICT(key) DO UPDATE SET value=excluded.value;\n";
const output = join(directory, 'setup.sql');
writeFileSync(output, sql, { mode: 0o600 });
console.log('One-time INITIAL ADMIN setup key (keep private):');
console.log(key);
console.log('Created generated/setup.sql. Apply it to a new empty D1 database.');
console.log('Never commit this key or generated/setup.sql.');
