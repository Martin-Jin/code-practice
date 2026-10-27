// Browser side of backups: collects the saved data, downloads it, and restores a file. The
// file format and the merge rules are in shared/backup.js.
import {
  STORES, buildBackup, mergeStores, mergeSettings, backupDue, backupFileName, totalAttempts, DUE_AFTER_DAYS, buildShare, shareFileName, isOwnSetting,
} from '../../shared/backup.js';
import * as db from './db.js';
import { state, notify } from './store.js';
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

function download(file, name) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }));
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

// Downloads only the questions made in the app and their answer keys, to give to someone else (see buildShare).
// Returns the file name, or null when there is nothing of that kind to share.
export function downloadShare() {
  const now = new Date();
  const file = buildShare({ stores: currentRecords(), now });
  if (!file.stores.libMine.length) return null;
  const name = shareFileName(now);
  download(file, name);
  return name;
}

export function downloadBackup() {
  const now = new Date();
  const backup = buildBackup({ stores: currentRecords(), settings: readSettings(), now });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: 'application/json' }));
  link.download = backupFileName(now);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  remember(backup.createdAt);
  notify();
  return link.download;
}

// mode 'merge' keeps what is here and adds what the backup has; 'replace' wipes first. Throws
// (leaving everything as it was) if the browser will not save the data.
export async function restoreBackup(backup, mode) {
  discardPendingSaves();
  discardPracticeSaves();
  const replace = mode === 'replace';
  const next = replace ? backup.stores : mergeStores(currentRecords(), backup.stores);
  await db.writeAll(next, { clear: replace });
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
