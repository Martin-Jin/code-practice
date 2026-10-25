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
  const [progress, edits, runs, mine] = await Promise.all(['libProgress', 'libEdits', 'libRuns', 'libMine'].map((s) => db.getAll(s)));
  for (const r of progress) state.libProgress[r.key] = r;
  for (const r of edits) state.libEdits[r.key] = r;
  for (const r of runs) state.libRuns[r.id] = r;
  for (const r of mine) state.libMine[r.id] = r;
  syncMine();
}

// ---- questions with the user's edits ----

export const effectiveQuestion = (setId, q) => applyEdit(q, state.libEdits[keyOf(setId, q.uid)]);
export const effectiveQuestions = (set) => set.manifest.questions.map((q) => effectiveQuestion(set.id, q));

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

export function clearEdit(setId, uid) {
  const key = keyOf(setId, uid);
  delete state.libEdits[key];
  db.remove('libEdits', key);
  notify();
}

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
