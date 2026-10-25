// Progress on questions of imported sets (see library.js): the answers typed, the result of the
// last check, how often each was right or wrong, and the "difficult" flag; plus the user's own
// corrections to a question (answer keys). Components call these and re-render through
// store.notify(). Data is saved to IndexedDB (see db.js) and is part of a backup.
import { checkQuestion } from '../../shared/answers.js';
import { applyEdit } from '../../shared/questionset.js';
import * as db from './db.js';
import { state, notify } from './store.js';

export const keyOf = (setId, uid) => `${setId}/${uid}`;
const now = () => new Date().toISOString();

export async function loadPractice() {
  const [progress, edits, runs, mine] = await Promise.all(['libProgress', 'libEdits', 'libRuns', 'libMine'].map((s) => db.getAll(s)));
  for (const r of progress) state.libProgress[r.key] = r;
  for (const r of edits) state.libEdits[r.key] = r;
  for (const r of runs) state.libRuns[r.id] = r;
  for (const r of mine) state.libMine[r.id] = r;
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
