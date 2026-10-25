// Writes public/catalog.json (the static data behind the published site).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../server/catalog.js';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'catalog.json');
const catalog = buildCatalog();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(catalog));
const total = Object.values(catalog.questions).reduce((n, qs) => n + Object.keys(qs).length, 0);
console.log(`catalog.json: ${catalog.sets.length} set(s), ${total} questions, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
