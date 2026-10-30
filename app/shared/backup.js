// The backup file: every saved record (the IndexedDB stores in src/lib/db.js) and the
// settings (localStorage) as one JSON file. Pure functions, so the browser app and the unit
// tests share them. Adding a store to the app means adding it to STORES; older backup files
// then still load, with that store empty.
import { APP_NAME } from './brand.js';

export const FORMAT = 'code-practice-backup';
// Version 1 files hold the saved records and settings. Version 2 files also carry the user's imported sets (their manifests,
// listed under `library`, and the formula sheet lists under `formulas`); the PDFs and images themselves sit beside the
// JSON in a zip (see shared/zip.js). A plain backup is still written as version 1.
export const VERSION = 2;
export const PLAIN_VERSION = 1;

// A backup is "due" after this many attempts since the last one, once it is this old.
export const DUE_AFTER_ATTEMPTS = 20;
export const DUE_AFTER_DAYS = 7;

const time = (iso) => (iso ? Date.parse(iso) || 0 : 0);
const earliest = (a, b) => (!a ? b : !b ? a : time(a) <= time(b) ? a : b);

// Merging keeps the newer side of each record, so it is safe to restore the same file twice
// or an old file over newer work. Counters are never added together for that reason.
function newerQuestionStats(a, b) {
  if (time(a.lastAt) !== time(b.lastAt)) return time(a.lastAt) > time(b.lastAt) ? a : b;
  return (b.attempts || 0) > (a.attempts || 0) ? b : a;
}

function mergeStats(a, b) {
  const questions = { ...a.questions };
  for (const [n, qb] of Object.entries(b.questions)) questions[n] = n in questions ? newerQuestionStats(questions[n], qb) : qb;
  return {
    ...a, questions,
    runsStarted: Math.max(a.runsStarted || 0, b.runsStarted || 0),
    runsCompleted: Math.max(a.runsCompleted || 0, b.runsCompleted || 0),
    since: earliest(a.since, b.since),
  };
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const newer = (a, b) => (time(b.updatedAt) > time(a.updatedAt) ? b : a);
const hasIds = (r) => typeof r.setId === 'string' && typeof r.uid === 'string';

// key: the record's id field. valid: the least the app needs to render the record without
// crashing. merge(current, incoming) returns the record to keep.
export const STORES = {
  runs: {
    key: 'id',
    valid: (r) => typeof r.updatedAt === 'string' && typeof r.setId === 'string' && Array.isArray(r.questions) && isObject(r.state),
    merge: (a, b) => (time(b.updatedAt) > time(a.updatedAt) ? b : a),
  },
  stats: {
    key: 'setId',
    valid: (r) => isObject(r.questions),
    merge: mergeStats,
  },
  // Imported question sets (docs/question-set-format.md): progress, the user's answer keys, practice sessions, own questions.
  libProgress: { key: 'key', valid: (r) => hasIds(r) && isObject(r.answers), merge: newer },
  libEdits: { key: 'key', valid: hasIds, merge: newer },
  libRuns: { key: 'id', valid: (r) => typeof r.setId === 'string' && Array.isArray(r.questions) && typeof r.updatedAt === 'string', merge: newer },
  libFolders: { key: 'id', valid: (r) => typeof r.name === 'string' && Array.isArray(r.items), merge: newer },
  libMine: { key: 'id', valid: (r) => isObject(r.manifest) && isObject(r.images), merge: newer },
};

// The settings this app keeps in localStorage. The page may share its address with other apps (a GitHub Pages site serves
// all of a user's projects from one origin), so only these are backed up, restored or cleared: nothing else in
// localStorage is this app's to touch, and a backup never carries another app's data or credentials.
export const OWN_SETTINGS = [
  'runner', 'autoSuggest', 'prioritise', 'shortcuts', 'theme', 'wandbox-compiler', 'online-ack', 'taskTab', 'taskOpen', 'sideOpen',
  'outputOpen', 'sizes', 'editMode', 'formulaOpen', 'formulaWidth', 'solveAgentUrl',
];
export const isOwnSetting = (key) => OWN_SETTINGS.includes(key) || key.startsWith('collapsed:');

export function buildBackup({ stores, settings, now = new Date(), library = null }) {
  const out = {};
  for (const name of Object.keys(STORES)) out[name] = stores[name] || [];
  const own = Object.fromEntries(Object.entries(settings || {}).filter(([k]) => isOwnSetting(k)));
  const file = { format: FORMAT, version: library ? VERSION : PLAIN_VERSION, createdAt: now.toISOString(), stores: out, settings: own };
  if (library) Object.assign(file, { includesFiles: true, library: library.sets, formulas: library.formulas });
  return file;
}

// A file to hand to someone else: only the questions made in the app (libMine) and the answer keys and notes on them. No
// progress, runs, stats, folders or settings. It is an ordinary backup file with kind "share", which a restore only
// merges (never replaces), so it cannot wipe the other person's data.
export function buildShare({ stores, now = new Date(), library = null }) {
  const mine = stores.libMine || [];
  const ids = new Set(mine.map((r) => r.id));
  const file = buildBackup({ stores: { libMine: mine, libEdits: (stores.libEdits || []).filter((r) => ids.has(r.setId)) }, settings: {}, now, library });
  return { ...file, kind: 'share' };
}

export const shareFileName = (date = new Date()) => backupFileName(date).replace('backup', 'questions');

// Reads a backup file's text. Throws an Error whose message can be shown to the user.
export function parseBackup(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { throw new Error('That file is not valid JSON, so it is not a backup.'); }
  if (!isObject(raw) || raw.format !== FORMAT) throw new Error(`That file is not a ${APP_NAME} backup.`);
  if (!Number.isInteger(raw.version) || raw.version < 1) throw new Error('That backup has no usable version number.');
  if (raw.version > VERSION) throw new Error('That backup was made by a newer version of the app. Open the newest version of the page to restore it.');
  if (!time(raw.createdAt)) throw new Error('That backup has no creation date.');
  if (!isObject(raw.stores)) throw new Error('That backup holds no data.');

  const stores = {};
  for (const [name, def] of Object.entries(STORES)) {
    const list = raw.stores[name] === undefined ? [] : raw.stores[name];
    if (!Array.isArray(list)) throw new Error(`The "${name}" part of that backup is damaged.`);
    const seen = new Set();
    list.forEach((r, i) => {
      if (!isObject(r) || typeof r[def.key] !== 'string' || !r[def.key] || !def.valid(r)) throw new Error(`Record ${i + 1} of "${name}" in that backup is damaged.`);
      if (seen.has(r[def.key])) throw new Error(`"${name}" in that backup lists "${r[def.key]}" twice.`);
      seen.add(r[def.key]);
    });
    stores[name] = list;
  }

  const settings = {};
  if (isObject(raw.settings)) for (const [k, v] of Object.entries(raw.settings)) if (typeof v === 'string' && isOwnSetting(k)) settings[k] = v;
  // Imported sets, when the file carries them (a zip). A damaged entry is an error, like a damaged record.
  const library = raw.library === undefined ? [] : raw.library;
  const formulas = raw.formulas === undefined ? [] : raw.formulas;
  if (!Array.isArray(library) || !library.every((r) => isObject(r) && typeof r.id === 'string' && isObject(r.manifest) && Array.isArray(r.manifest.questions) && isObject(r.files))) throw new Error('The imported sets in that file are damaged.');
  if (!Array.isArray(formulas) || !formulas.every((r) => isObject(r) && typeof r.setId === 'string' && Array.isArray(r.sheets))) throw new Error('The formula sheets in that file are damaged.');
  return { createdAt: raw.createdAt, stores, settings, library, formulas, kind: raw.kind === 'share' ? 'share' : 'backup' };
}

export const totalAttempts = (statsList) =>
  statsList.reduce((n, s) => n + Object.values(s.questions).reduce((m, q) => m + (q.attempts || 0), 0), 0);

// What a restore would bring in, for the confirmation dialog.
export function summarise(backup) {
  const { runs, stats } = backup.stores;
  return {
    createdAt: backup.createdAt,
    runs: runs.length,
    finishedRuns: runs.filter((r) => r.completedAt).length,
    sets: [...new Set([...runs.map((r) => r.setId), ...stats.map((s) => s.setId)])].sort(),
    attempts: totalAttempts(stats),
    libraryQuestions: backup.stores.libProgress.length,
    libraryRuns: backup.stores.libRuns.length,
    librarySets: (backup.library || []).length,
    settings: Object.keys(backup.settings).length,
  };
}

// Records to store after a merge restore: everything current, plus what the file adds or
// has newer. Both arguments are { storeName: [records] }.
export function mergeStores(current, incoming) {
  const out = {};
  for (const [name, def] of Object.entries(STORES)) {
    const byKey = new Map((current[name] || []).map((r) => [r[def.key], r]));
    for (const r of incoming[name] || []) {
      const have = byKey.get(r[def.key]);
      byKey.set(r[def.key], have ? def.merge(have, r) : r);
    }
    out[name] = [...byKey.values()];
  }
  return out;
}

// Settings the current browser already has win; the file only fills the gaps.
export const mergeSettings = (current, incoming) => ({ ...incoming, ...current });

export function backupDue({ lastAt, attemptsNow, attemptsAtBackup, now = new Date() }) {
  if (attemptsNow - attemptsAtBackup < DUE_AFTER_ATTEMPTS) return false;
  return !lastAt || now - Date.parse(lastAt) >= DUE_AFTER_DAYS * 86400000;
}

export function backupFileName(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `code-practice-backup-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.json`;
}
