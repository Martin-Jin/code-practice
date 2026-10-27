// The backup file: every saved record (the IndexedDB stores in src/lib/db.js) and the
// settings (localStorage) as one JSON file. Pure functions, so the browser app and the unit
// tests share them. Adding a store to the app means adding it to STORES; older backup files
// then still load, with that store empty.
export const FORMAT = 'code-practice-backup';
export const VERSION = 1;

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

export function buildBackup({ stores, settings, now = new Date() }) {
  const out = {};
  for (const name of Object.keys(STORES)) out[name] = stores[name] || [];
  return { format: FORMAT, version: VERSION, createdAt: now.toISOString(), stores: out, settings };
}

// Reads a backup file's text. Throws an Error whose message can be shown to the user.
export function parseBackup(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { throw new Error('That file is not valid JSON, so it is not a backup.'); }
  if (!isObject(raw) || raw.format !== FORMAT) throw new Error('That file is not a Practice Questions backup.');
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
  if (isObject(raw.settings)) for (const [k, v] of Object.entries(raw.settings)) if (typeof v === 'string') settings[k] = v;
  return { createdAt: raw.createdAt, stores, settings };
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
