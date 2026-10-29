// Progress on questions of imported sets (see library.js): the answers typed, the result of the
// last check, how often each was right or wrong, and the "difficult" flag; plus the user's own
// corrections to a question (answer keys). Components call these and re-render through
// store.notify(). Data is saved to IndexedDB (see db.js) and is part of a backup.
import { checkQuestion, uncheckedQuestions } from '../../shared/answers.js';
import { applyEdit } from '../../shared/questionset.js';
import { pickLibraryQuestions, LIB_MODE_LABELS } from '../../shared/librarymodes.js';
import { weightOf, libraryTrouble } from '../../shared/weights.js';
import * as db from './db.js';
import { state, notify } from './store.js';
import { syncMine } from './library.js';

export const keyOf = (setId, uid) => `${setId}/${uid}`;
const now = () => new Date().toISOString();

export async function loadPractice() {
  const [progress, edits, runs, mine, folders] = await Promise.all(['libProgress', 'libEdits', 'libRuns', 'libMine', 'libFolders'].map((s) => db.getAll(s)));
  for (const r of progress) state.libProgress[r.key] = r;
  for (const r of edits) state.libEdits[r.key] = r;
  for (const r of runs) state.libRuns[r.id] = r;
  for (const r of mine) state.libMine[r.id] = r;
  for (const r of folders) state.libFolders[r.id] = r;
  syncMine();
}

// ---- questions with the user's edits ----

export const effectiveQuestion = (setId, q) => applyEdit(q, state.libEdits[keyOf(setId, q.uid)]);
export const effectiveQuestions = (set) => set.manifest.questions.map((q) => effectiveQuestion(set.id, q)).filter((q) => !q.hidden);

// ---- saving ----
const timers = new Map();
function persist(store, record, delay = 300) {
  const id = `${store}:${record.key || record.id}`;
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => { timers.delete(id); db.put(store, record); }, delay));
}

export function flushPracticeSaves() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  for (const r of Object.values(state.libProgress)) db.put('libProgress', r);
  for (const r of Object.values(state.libEdits)) db.put('libEdits', r);
}

// Drops queued saves, so one cannot land after a restore and overwrite restored data.
export function discardPracticeSaves() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}

// ---- progress ----

export const getProgress = (setId, uid) => state.libProgress[keyOf(setId, uid)] || null;

function ensure(setId, uid) {
  const key = keyOf(setId, uid);
  return (state.libProgress[key] = state.libProgress[key] || {
    key, setId, uid, difficult: false, answers: {}, checked: null, attempts: 0, right: 0, wrong: 0, views: 0, firstAt: null, lastAt: null, updatedAt: now(),
  });
}

// Typing an answer is saved a moment later; a result or a flag is saved at once, because the
// page may be left right after.
function touch(rec, delay = 300) {
  rec.updatedAt = now();
  persist('libProgress', rec, delay);
  notify();
}

// Called when a question is opened.
export function visit(setId, uid) {
  const rec = ensure(setId, uid);
  rec.views++;
  rec.firstAt = rec.firstAt || now();
  touch(rec);
}

export function setAnswer(setId, uid, label, value) {
  const rec = ensure(setId, uid);
  rec.answers = { ...rec.answers, [label]: value };
  rec.checked = null;   // the feedback was for the old answer
  touch(rec);
}

// Checks every part of the (edited) question against the saved answers and records the attempt.
// An incomplete check (a box left empty, no key yet) shows its feedback but is not counted.
export function check(setId, uid, question) {
  const rec = ensure(setId, uid);
  const result = checkQuestion(question, rec.answers);
  rec.checked = result.parts;
  if (result.overall === 'right' || result.overall === 'wrong') {
    rec.attempts++;
    if (result.overall === 'right') rec.right++; else rec.wrong++;
    rec.lastAt = now();
  }
  rec.lastOverall = result.overall;
  touch(rec, 0);
  return result;
}

// Marks questions as done without checking them, for work finished before the app was used. Ones whose last check was
// already right are left alone so their counters stay true. Returns how many were marked.
export function markCorrect(setId, uids) {
  let n = 0;
  for (const uid of uids) {
    const rec = ensure(setId, uid);
    if (rec.lastOverall === 'right') continue;
    rec.attempts++; rec.right++;
    rec.lastOverall = 'right';
    rec.lastAt = now();
    rec.firstAt = rec.firstAt || rec.lastAt;
    rec.updatedAt = rec.lastAt;
    persist('libProgress', rec, 0);
    n++;
  }
  notify();
  return n;
}

// Clears the counters and last results of every question in a set (the Stats page's Reset). Answers, difficult
// flags and answer keys are kept, since they are the user's own work rather than statistics.
export function resetLibStats(setId) {
  for (const rec of Object.values(state.libProgress)) {
    if (rec.setId !== setId) continue;
    rec.attempts = 0; rec.right = 0; rec.wrong = 0; rec.views = 0; rec.firstAt = null; rec.lastAt = null;
    delete rec.lastOverall;
    rec.updatedAt = now();
    persist('libProgress', rec, 0);
  }
  notify();
}

// Forgets how often a question was checked and how it went (the "Checked 4 times" line), for when its answer key goes
// back to the imported one: those checks were against the key the user had changed. Typed answers and the difficult
// flag stay.
export function resetChecks(setId, uid) {
  const rec = getProgress(setId, uid);
  if (!rec) return;
  rec.attempts = 0; rec.right = 0; rec.wrong = 0; rec.lastAt = null; rec.checked = null;
  delete rec.lastOverall;
  touch(rec, 0);
}

export function resetAnswers(setId, uid) {
  const rec = ensure(setId, uid);
  rec.answers = {};
  rec.checked = null;
  touch(rec, 0);
}

export function setDifficult(setId, uid, value) {
  const rec = ensure(setId, uid);
  rec.difficult = !!value;
  touch(rec, 0);
}

// ---- the user's corrections (answer keys) ----

export function saveEdit(setId, uid, edit) {
  const key = keyOf(setId, uid);
  const record = { ...(state.libEdits[key] || {}), ...edit, key, setId, uid, updatedAt: now() };
  state.libEdits[key] = record;
  db.put('libEdits', record);
  notify();
}

// Puts the imported version back. The user's notes are theirs rather than a correction, so they stay.
export function clearEdit(setId, uid) {
  const key = keyOf(setId, uid);
  const old = state.libEdits[key];
  if (old && old.notes) {
    const record = { key, setId, uid, notes: old.notes, updatedAt: now() };
    state.libEdits[key] = record;
    db.put('libEdits', record);
  } else {
    delete state.libEdits[key];
    db.remove('libEdits', key);
  }
  notify();
}

// Drops one correction the user made (say a section they chose) without touching the others.
export function clearEditField(setId, uid, field) {
  const key = keyOf(setId, uid);
  const old = state.libEdits[key];
  if (!old || !(field in old)) return;
  const { [field]: _, ...rest } = old;
  const left = Object.keys(rest).filter((k) => !['key', 'setId', 'uid', 'updatedAt'].includes(k));
  if (left.length) { state.libEdits[key] = { ...rest, updatedAt: now() }; db.put('libEdits', state.libEdits[key]); } else { delete state.libEdits[key]; db.remove('libEdits', key); }
  notify();
}

// Notes on a question (what went wrong last time, a reminder). Saved as the user types.
export function saveNotes(setId, uid, notes) {
  const key = keyOf(setId, uid);
  const record = { ...(state.libEdits[key] || {}), key, setId, uid, notes, updatedAt: now() };
  state.libEdits[key] = record;
  persist('libEdits', record, 400);
  notify();
}

// True when the user has changed anything but notes, so "edited" and "Revert" mean corrections only.
export const hasCorrections = (setId, uid) => {
  const e = state.libEdits[keyOf(setId, uid)];
  return !!e && Object.keys(e).some((k) => !['key', 'setId', 'uid', 'updatedAt', 'notes'].includes(k));
};

// ---- practice sessions over an imported set ----

const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(16).padStart(2, '0')).join('');

function autoName(mode) {
  const when = new Date().toLocaleString('en-NZ', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  return `${LIB_MODE_LABELS[mode]} · ${when}`;
}

// Starts a session: the uids it covers are fixed now. With "draw questions I struggle with more often"
// on, Random leans towards questions marked difficult or often not right.
export function createLibRun({ setId, mode, options = {}, name }) {
  const set = state.library.sets[setId];
  const weight = state.prioritise ? (q) => weightOf(libraryTrouble(getProgress(setId, q.uid))) : undefined;
  const questions = pickLibraryQuestions(effectiveQuestions(set), (uid) => getProgress(setId, uid), mode, options, Math.random, weight);
  const stamp = now();
  const run = {
    id: newId(), setId, name: (name && name.trim().slice(0, 80)) || autoName(mode), mode, options,
    questions, current: questions[0], createdAt: stamp, updatedAt: stamp, completedAt: null,
  };
  state.libRuns[run.id] = run;
  db.put('libRuns', run);
  notify();
  return run;
}

export function deleteLibRun(id) {
  delete state.libRuns[id];
  db.remove('libRuns', id);
  notify();
}

export function setLibCurrent(id, uid) {
  const run = state.libRuns[id];
  if (!run || run.current === uid) return;
  run.current = uid;
  run.updatedAt = now();
  persist('libRuns', run, 300);
}

// The uids of a session's questions that still need a counted check (right or wrong) before it can finish.
export function pendingChecks(run) {
  const set = state.library.sets[run.setId];
  if (!set) return [];
  const all = effectiveQuestions(set);
  const questions = run.questions.map((uid) => all.find((q) => q.uid === uid)).filter(Boolean);
  return uncheckedQuestions(questions, (uid) => runStatus(run, uid));
}

// Marks a session finished, but only once every checkable question has been checked, whether right or wrong.
// Returns whether it is finished.
export function finishLibRun(id) {
  const run = state.libRuns[id];
  if (!run) return false;
  if (!run.completedAt && pendingChecks(run).length) return false;
  run.completedAt = run.completedAt || now();
  run.updatedAt = now();
  db.put('libRuns', run);
  notify();
  return true;
}

// How a question went in this session: 'right' or 'wrong' from its latest counted check since the
// session began, or null if it has not been checked in this session.
export function runStatus(run, uid) {
  const p = getProgress(run.setId, uid);
  return p && p.lastAt && p.lastAt >= run.createdAt ? p.lastOverall : null;
}
