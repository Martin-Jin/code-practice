// Checks a backup file (Settings > Back up now) against the rules the app applies when it restores one, and checks the
// questions inside it the way the app checks a .questions.json file. Use it after an agent has edited a backup.
//   node tools/check-backup.js "<code-practice-backup-....json>"
// Exit code 0 when the file would restore cleanly with every question usable, 1 otherwise.
import fs from 'node:fs';
import { parseBackup } from '../shared/backup.js';
import { isZip, readZip } from '../shared/zip.js';
import { validateQuestionSet, questionProblems, neededFiles } from '../shared/questionset.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node tools/check-backup.js "<backup file>"');
  process.exit(1);
}

const problems = [];
let backup;
try {
  const bytes = new Uint8Array(fs.readFileSync(file));
  // a backup made with the PDFs included is a zip with backup.json in it
  const text = isZip(bytes) ? new TextDecoder().decode(await readZip(bytes).get('backup.json')()) : new TextDecoder().decode(bytes);
  backup = parseBackup(text);
} catch (e) {
  console.error(`NOT A VALID BACKUP: ${e.message}`);
  process.exit(1);
}

// Own questions (libMine): the manifest must validate, every image it names must be stored as a data URL, and a
// record only wins a restore over the copy in the browser when its updatedAt is newer.
for (const record of backup.stores.libMine) {
  const where = `libMine "${record.id}"`;
  if (!Date.parse(record.updatedAt)) problems.push(`${where}: updatedAt must be an ISO date (a restore keeps the record with the newer updatedAt).`);
  const { set, errors, skipped } = validateQuestionSet(record.manifest);
  for (const e of errors) problems.push(`${where}: ${e}`);
  for (const s of skipped) problems.push(`${where}: question ${s.number}${s.title ? ` (${s.title})` : ''} would be left out: ${s.problems.join('; ')}.`);
  if (set) {
    for (const path of neededFiles(set)) {
      if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(record.images[path] || '')) problems.push(`${where}: "${path}" is named by a question but is not stored as an image data URL in "images".`);
    }
  }
}

// Answer keys and corrections (libEdits): the parts must be valid ones.
for (const record of backup.stores.libEdits) {
  if (!record.parts) continue;
  const stub = { uid: 'x', title: 'x', section: 'x', stem: { text: 'x' }, parts: record.parts };
  for (const p of questionProblems(stub)) problems.push(`libEdits "${record.key}": ${p}.`);
}

// The settings are the browser's localStorage; this file should hold only the app's own.
for (const key of Object.keys(backup.settings)) {
  if (/key|token|auth|secret|password/i.test(key)) problems.push(`settings: "${key.slice(0, 22)}..." looks like a credential. Do not share this file.`);
}

const count = (name) => backup.stores[name].length;
console.log(`${file}: made ${backup.createdAt}; ${count('libMine')} own-question set(s), ${count('libEdits')} answer key(s), ${count('libProgress')} question progress record(s).`);
if (problems.length) {
  console.log(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
  for (const p of problems) console.log(`- ${p}`);
  process.exit(1);
}
console.log('OK: it would restore cleanly and every question is usable.');
