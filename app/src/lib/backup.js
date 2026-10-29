// Browser side of backups: collects the saved data, downloads it, and restores a file. The
// file format and the merge rules are in shared/backup.js.
import {
  STORES, buildBackup, mergeStores, mergeSettings, backupDue, backupFileName, totalAttempts, DUE_AFTER_DAYS, buildShare, shareFileName, isOwnSetting, parseBackup,
} from '../../shared/backup.js';
import { makeZip, readZip, isZip } from '../../shared/zip.js';
import * as db from './db.js';
import { state, notify } from './store.js';
import { getFile } from './library.js';
import { formulaBlob } from './formulas.js';
import { discardPendingSaves } from './service.js';
import { discardPracticeSaves } from './practice.js';

// When the last backup was made or restored, and how many attempts the data held then.
// Bookkeeping for the reminder, so it is not part of a backup.
const AT_KEY = 'backupAt';
const ATTEMPTS_KEY = 'backupAttempts';
const META = [AT_KEY, ATTEMPTS_KEY];

const readKey = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeKey = (key, value) => { try { localStorage.setItem(key, value); } catch { /* storage blocked */ } };

// Every setting the app keeps in localStorage (theme, runner, shortcuts, pane sizes, ...).
function readSettings() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (isOwnSetting(key)) out[key] = localStorage.getItem(key);
    }
  } catch { /* storage blocked */ }
  return out;
}

function writeSettings(settings, clearFirst) {
  try {
    if (clearFirst) for (const key of Object.keys(readSettings())) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(settings)) if (isOwnSetting(key)) localStorage.setItem(key, value);
  } catch { /* storage blocked */ }
}

// Each store's records are kept in state under the store's own name (see store.js), and
// state is always at least as new as what is on disk, because drafts reach disk after a delay.
const currentRecords = () => Object.fromEntries(Object.keys(STORES).map((name) => [name, Object.values(state[name])]));

export function backupStatus() {
  const at = readKey(AT_KEY);
  const attemptsAtBackup = Number(readKey(ATTEMPTS_KEY)) || 0;
  const attemptsNow = totalAttempts(Object.values(state.stats));
  const old = !at || Date.now() - Date.parse(at) >= DUE_AFTER_DAYS * 86400000;
  return {
    at,
    newAttempts: Math.max(0, attemptsNow - attemptsAtBackup),
    due: backupDue({ lastAt: at, attemptsNow, attemptsAtBackup }),
    stale: attemptsNow > 0 && old,
  };
}

// Added to the warning on actions that delete progress.
export const backupNote = () => (backupStatus().stale ? ' You have not backed up lately: Settings has a Back up now button.' : '');

function remember(createdAt) {
  const at = readKey(AT_KEY);
  writeKey(AT_KEY, at && Date.parse(at) > Date.parse(createdAt) ? at : createdAt);
  writeKey(ATTEMPTS_KEY, String(totalAttempts(Object.values(state.stats))));
}

function save(name, bytes, type) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([bytes], { type }));
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

const encoder = new TextEncoder();
const MIME = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
const mimeOf = (name) => MIME[name.split('.').pop().toLowerCase()] || 'application/octet-stream';

// The imported sets for a file that carries them: their records and formula sheet lists, and every stored file (PDFs,
// images, formula sheets) as zip entries named "files/<set id>/<path>". With `ids`, only those sets; their formula
// sheets come along even for a set made in the app (which has no record of its own here, see downloadSets).
async function collectLibrary(ids = null) {
  const wanted = (id) => !ids || ids.includes(id);
  const sets = Object.values(state.library.sets).filter((s) => !s.userOwned && wanted(s.id));
  const formulas = Object.values(state.libFormulas).filter((f) => f.sheets.length && wanted(f.setId) && (ids || state.library.sets[f.setId]));
  const entries = [];
  const add = async (setId, rel, blob) => { if (blob) entries.push({ name: `files/${setId}/${rel}`, data: new Uint8Array(await blob.arrayBuffer()) }); };
  for (const set of sets) for (const rel of Object.keys(set.files)) await add(set.id, rel, await getFile(set.id, rel));
  for (const f of formulas) for (const x of f.sheets) await add(f.setId, x.path, await formulaBlob(f.setId, x.path));
  return { library: { sets, formulas }, entries };
}

// Writes the file: plain JSON, or (with files) a zip holding backup.json and the stored files. Returns the file name.
async function writeFile(file, entries, name) {
  if (!entries) { save(name, JSON.stringify(file), 'application/json'); return name; }
  const zipName = name.replace(/\.json$/, '.zip');
  save(zipName, makeZip([{ name: 'backup.json', data: encoder.encode(JSON.stringify(file)) }, ...entries]), 'application/zip');
  return zipName;
}

// Downloads only the questions made in the app and their answer keys, to give to someone else (see buildShare). With
// `files`, also the imported sets with their PDFs and images (but never progress). Returns the file name, or null
// when there is nothing to share.
export async function downloadShare({ files = false } = {}) {
  const now = new Date();
  const extra = files ? await collectLibrary() : null;
  const file = buildShare({ stores: currentRecords(), now, library: extra && extra.library });
  if (!file.stores.libMine.length && !(extra && extra.library.sets.length)) return null;
  return writeFile(file, extra && extra.entries, shareFileName(now));
}

// Downloads the chosen sets as a zip to hand to someone, or to keep on its own: each set's questions, answer key, PDF,
// images and formula sheets, never progress. Sets made in the app are included whole, with their formula sheets. It is a
// "share" file, so Restore only adds to what the other browser has. Returns the file name, or null when nothing was chosen.
export async function downloadSets(ids) {
  const mine = ids.filter((id) => state.libMine[id]);
  const have = ids.filter((id) => state.library.sets[id]);
  if (!have.length) return null;
  const now = new Date();
  const extra = await collectLibrary(have);
  const file = buildShare({
    stores: { libMine: mine.map((id) => state.libMine[id]), libEdits: Object.values(state.libEdits) }, now, library: extra.library,
  });
  return writeFile(file, extra.entries, shareFileName(now));
}

export async function downloadBackup({ files = false } = {}) {
  const now = new Date();
  const extra = files ? await collectLibrary() : null;
  const backup = buildBackup({ stores: currentRecords(), settings: readSettings(), now, library: extra && extra.library });
  const name = await writeFile(backup, extra && extra.entries, backupFileName(now));
  remember(backup.createdAt);
  notify();
  return name;
}

// Reads a chosen backup or share file, JSON or zip. Returns { backup, zip } where zip is a Map of file name -> async
// bytes (null for plain JSON). Throws an Error whose message can be shown.
export async function readBackupFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isZip(bytes)) return { backup: parseBackup(new TextDecoder().decode(bytes)), zip: null };
  const zip = readZip(bytes);
  if (!zip.has('backup.json')) throw new Error('That zip has no backup.json in it, so it is not a backup from this app.');
  return { backup: parseBackup(new TextDecoder().decode(await zip.get('backup.json')())), zip };
}

// Brings back the imported sets a file carries. A set this browser does not have is recreated with its files. One it
// already has keeps its own copy (which may be newer, with its progress already filed under the same ids); only the
// questions you added to it and any files it lacks are taken from the file. 'replace' empties the library first.
async function restoreLibrary(backup, mode, zip) {
  if (!backup.library.length && !backup.formulas.length) return;
  const replace = mode === 'replace';
  const puts = [];   // library file records to write
  const records = [];
  for (const rec of backup.library) {
    if (state.libMine[rec.id]) continue;   // that id belongs to a set made in the app
    const have = replace ? null : state.library.sets[rec.id];
    const next = have ? { ...have, manifest: { ...have.manifest, questions: [...have.manifest.questions] }, files: { ...have.files } } : { ...rec, importedAt: new Date().toISOString() };
    if (have) {
      const uids = new Set(have.manifest.questions.map((q) => q.uid));
      for (const q of rec.manifest.questions) if (q.own && !uids.has(q.uid)) next.manifest.questions.push(q);
    }
    for (const rel of Object.keys(rec.files)) {
      if (have && have.files[rel]) continue;
      const read = zip && zip.get(`files/${rec.id}/${rel}`);
      if (!read) continue;
      const data = await read();
      puts.push({ key: `${rec.id}/${rel}`, setId: rec.id, path: rel, size: data.length, modified: rec.files[rel].modified, file: new File([data], rel.split('/').pop(), { type: mimeOf(rel), lastModified: rec.files[rel].modified }) });
      next.files[rel] = rec.files[rel];
    }
    records.push(next);
  }
  const sheets = new Map();   // set id -> merged formula sheet list
  for (const f of backup.formulas) {
    const have = replace ? [] : (state.libFormulas[f.setId] && state.libFormulas[f.setId].sheets) || [];
    const added = f.sheets.filter((x) => !have.some((h) => h.path === x.path));
    const kept = [];
    for (const x of added) {   // a sheet is listed only if its file came with the zip
      const read = zip && zip.get(`files/${f.setId}/${x.path}`);
      if (!read) continue;
      const data = await read();
      puts.push({ key: `${f.setId}/${x.path}`, setId: f.setId, path: x.path, size: data.length, modified: Date.now(), file: new File([data], x.name, { type: mimeOf(x.name), lastModified: Date.now() }) });
      kept.push(x);
    }
    sheets.set(f.setId, [...have, ...kept]);
  }
  await db.transact(['libSets', 'libFiles', 'libFormulas'], (t) => {
    if (replace) for (const name of ['libSets', 'libFiles', 'libFormulas']) t.objectStore(name).clear();
    for (const r of records) t.objectStore('libSets').put(r);
    for (const f of puts) t.objectStore('libFiles').put(f);
    for (const [setId, list] of sheets) t.objectStore('libFormulas').put({ setId, sheets: list });
  });
  if (replace) { for (const id of Object.keys(state.library.sets)) if (!state.libMine[id]) delete state.library.sets[id]; state.libFormulas = {}; }
  for (const r of records) state.library.sets[r.id] = r;
  for (const [setId, list] of sheets) state.libFormulas[setId] = { setId, sheets: list };
}

// mode 'merge' keeps what is here and adds what the backup has; 'replace' wipes first. Throws
// (leaving everything as it was) if the browser will not save the data.
export async function restoreBackup(backup, mode, zip = null) {
  discardPendingSaves();
  discardPracticeSaves();
  const replace = mode === 'replace';
  const next = replace ? backup.stores : mergeStores(currentRecords(), backup.stores);
  await db.writeAll(next, { clear: replace });
  await restoreLibrary(backup, mode, zip);
  for (const [name, def] of Object.entries(STORES)) state[name] = Object.fromEntries(next[name].map((r) => [r[def.key], r]));
  writeSettings(replace ? backup.settings : mergeSettings(readSettings(), backup.settings), replace);
  remember(backup.createdAt);
  notify();
}

// Settings (theme, runner, shortcuts) are read once at start-up, so a restore reloads the page.
// The run being looked at may no longer exist, so it goes back to the dashboard first.
export function reloadApp() {
  window.location.hash = '#/';
  window.location.reload();
}
