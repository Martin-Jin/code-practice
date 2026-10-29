// Runs and stats: everything that changes saved progress. Components call these and
// re-render through store.notify(). Data is saved to IndexedDB (see db.js).
import { buildProgram, analyse, isUntouched } from '../../shared/program.js';
import { pickQuestions, MODE_LABELS } from '../../shared/modes.js';
import { weightOf, codingTrouble } from '../../shared/weights.js';
import * as db from './db.js';
import { state, notify } from './store.js';
import { ACTIONS } from './shortcuts.js';
import { fetchCatalog, getSet, getQuestion, getSupport } from './catalog.js';
import { execute, detectLocal } from './runners.js';
import { loadLibrary } from './library.js';
import { loadPractice } from './practice.js';
import { loadFormulas } from './formulas.js';
import { seedSample } from './sample.js';

const MAX_STORED_OUTPUT = 100 * 1024;
const RUNNER_KEY = 'runner';
const SUGGEST_KEY = 'autoSuggest';
const PRIORITISE_KEY = 'prioritise';
const SHORTCUTS_KEY = 'shortcuts';

const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(16).padStart(2, '0')).join('');

// ---- boot ----
export async function boot() {
  try {
    state.catalog = await fetchCatalog();
    await db.ensureOpen();
    const [runs, stats] = await Promise.all([db.getAll('runs'), db.getAll('stats')]);
    for (const r of runs) state.runs[r.id] = r;
    for (const s of stats) state.stats[s.setId] = s;
    await loadLibrary();
    await loadPractice();
    await loadFormulas();
    await seedSample();
    state.local = await detectLocal();
    let saved = null;
    try { saved = localStorage.getItem(RUNNER_KEY); } catch { /* storage blocked */ }
    state.runner = saved === 'online' || (saved === 'local' && state.local) ? saved : state.local ? 'local' : 'online';
    try { state.autoSuggest = localStorage.getItem(SUGGEST_KEY) === 'true'; } catch { /* storage blocked */ }
    try { state.prioritise = localStorage.getItem(PRIORITISE_KEY) === 'true'; } catch { /* storage blocked */ }
    try {
      const saved = JSON.parse(localStorage.getItem(SHORTCUTS_KEY) || '{}');
      for (const a of ACTIONS) if (typeof saved[a.id] === 'string') state.shortcuts[a.id] = saved[a.id];
    } catch { /* storage blocked or not JSON */ }
  } catch (e) {
    state.error = e.message;
  }
  state.ready = true;
  notify();
}

export function setRunner(runner) {
  state.runner = runner;
  try { localStorage.setItem(RUNNER_KEY, runner); } catch { /* storage blocked */ }
  notify();
}

export function setPrioritise(on) {
  state.prioritise = on;
  try { localStorage.setItem(PRIORITISE_KEY, String(on)); } catch { /* storage blocked */ }
  notify();
}

export function setAutoSuggest(on) {
  state.autoSuggest = on;
  try { localStorage.setItem(SUGGEST_KEY, String(on)); } catch { /* storage blocked */ }
  notify();
}

// combo null puts the default back; the last argument of resetShortcuts clears every choice.
function saveShortcuts() {
  try { localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(state.shortcuts)); } catch { /* storage blocked */ }
  notify();
}
export function setShortcut(id, combo) {
  if (combo) state.shortcuts[id] = combo; else delete state.shortcuts[id];
  saveShortcuts();
}
export function resetShortcuts() {
  state.shortcuts = {};
  saveShortcuts();
}

// ---- saving ----
const timers = new Map();
function saveRun(run, delay = 400) {
  clearTimeout(timers.get(run.id));
  timers.set(run.id, setTimeout(() => { timers.delete(run.id); db.put('runs', run); }, delay));
}
const saveStats = (setId) => db.put('stats', state.stats[setId]);

export function flushSaves() {
  for (const [id, t] of timers) { clearTimeout(t); db.put('runs', state.runs[id]); }
  timers.clear();
}

// Drops queued draft saves, so one cannot land after a restore and overwrite restored data.
export function discardPendingSaves() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
}

// ---- helpers ----
function freshQuestionState(q) {
  return {
    code: q.starter, status: 'untouched', attempts: 0, compileErrors: 0, wrong: 0, correct: 0,
    lastResult: null, lastRunAt: null, passedAt: null,
  };
}

const freshQuestionStats = () => ({
  attempts: 0, compileErrors: 0, correct: 0, wrong: 0, crashes: 0, lastAt: null, firstSolvedAt: null, lastStatus: null,
});

export function statsFor(setId) {
  return (state.stats[setId] = state.stats[setId] || {
    setId, questions: {}, runsStarted: 0, runsCompleted: 0, since: new Date().toISOString(),
  });
}

function autoName(mode) {
  const when = new Date().toLocaleString('en-NZ', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  return `${MODE_LABELS[mode]} · ${when}`;
}

function fillRun(run, mode, options) {
  const set = getSet(run.setId);
  // With "draw questions I struggle with more often" on, random picks lean towards questions failed often.
  const counters = state.prioritise ? statsFor(run.setId).questions : null;
  const weight = counters ? (n) => weightOf(codingTrouble(counters[n])) : undefined;
  const questions = pickQuestions(set, mode, { ...options, weight });
  if (!questions.length) throw new Error('No questions match those options');
  run.mode = mode;
  run.options = options || {};
  run.questions = questions;
  run.state = {};
  for (const n of questions) run.state[n] = freshQuestionState(getQuestion(run.setId, n));
  run.current = questions[0];
  run.completedAt = null;
}

export function runSummary(run) {
  const states = run.questions.map((n) => run.state[n]);
  return {
    total: states.length,
    passed: states.filter((s) => s.status === 'passed').length,
    attempted: states.filter((s) => s.attempts > 0).length,
    totalAttempts: states.reduce((a, s) => a + s.attempts, 0),
  };
}

// ---- runs ----
export function createRun({ setId, mode, options, name }) {
  const now = new Date().toISOString();
  const run = { id: newId(), setId, createdAt: now, updatedAt: now, customName: !!(name && name.trim()) };
  fillRun(run, mode, options);
  run.name = run.customName ? name.trim().slice(0, 80) : autoName(mode);
  state.runs[run.id] = run;
  statsFor(setId).runsStarted++;
  saveRun(run, 0);
  saveStats(setId);
  notify();
  return run;
}

export function deleteRun(id) {
  delete state.runs[id];
  clearTimeout(timers.get(id));
  timers.delete(id);
  db.remove('runs', id);
  notify();
}

export function renameRun(id, name) {
  const run = state.runs[id];
  const clean = String(name || '').trim().slice(0, 80);
  run.customName = !!clean;
  run.name = clean || autoName(run.mode);
  saveRun(run);
  notify();
}

// New selection (re-draw, or a different mode). Progress for this run restarts.
export function reselect(id, mode, options) {
  const run = state.runs[id];
  fillRun(run, mode || run.mode, mode ? options : run.options);
  if (!run.customName) run.name = autoName(run.mode);
  run.updatedAt = new Date().toISOString();
  statsFor(run.setId).runsStarted++;
  saveRun(run, 0);
  saveStats(run.setId);
  notify();
}

export function resetRun(id) {
  const run = state.runs[id];
  for (const n of run.questions) run.state[n] = freshQuestionState(getQuestion(run.setId, n));
  run.completedAt = null;
  run.current = run.questions[0];
  run.updatedAt = new Date().toISOString();
  saveRun(run, 0);
  notify();
}

export function resetCode(id, n) {
  const run = state.runs[id];
  run.state[n].code = getQuestion(run.setId, n).starter;
  saveRun(run);
  notify();
  return run.state[n].code;
}

// Called as the student types. Mutates in place and only re-renders when the sidebar's
// "edited" marker would change.
export function saveCode(id, n, code) {
  const run = state.runs[id];
  const st = run && run.state[n];
  if (!st) return;
  const starter = getQuestion(run.setId, n).starter;
  const flips = st.attempts === 0 && (st.code !== starter) !== (code !== starter);
  st.code = code.slice(0, 200000);
  saveRun(run);
  if (flips) notify();
}

export function setCurrent(id, n) {
  const run = state.runs[id];
  if (run && run.current !== n) { run.current = n; saveRun(run); }
}

// Builds, runs and analyses the answer, then records the attempt. Runner failures (no
// network, server down) throw and are not counted as an attempt.
export async function runQuestion(id, n, code) {
  const run = state.runs[id];
  const set = getSet(run.setId);
  const q = getQuestion(run.setId, n);
  const st = run.state[n];

  const raw = await execute(state.runner, buildProgram(q, code, getSupport(set)));
  const result = analyse(q, code, raw);
  result.runner = state.runner;
  if (result.run) {
    for (const k of ['stdout', 'stderr']) {
      if (result.run[k].length > MAX_STORED_OUTPUT) result.run[k] = result.run[k].slice(0, MAX_STORED_OUTPUT);
    }
  }

  // Running the untouched starter code still shows its result (the tests are worth a look), but it is not an
  // attempt: nothing is counted and the question keeps its status.
  if (isUntouched(q, code)) {
    st.lastResult = result;
    saveRun(run, 0);
    notify();
    return { result, justCompleted: false, counted: false };
  }

  const now = new Date().toISOString();
  const stats = statsFor(run.setId);
  const qs = (stats.questions[n] = stats.questions[n] || freshQuestionStats());
  st.code = code;
  st.attempts++; qs.attempts++;
  st.lastRunAt = qs.lastAt = now;
  if (result.status === 'compile_error') {
    st.status = 'compile_error'; st.compileErrors++; qs.compileErrors++;
  } else if (result.status === 'passed') {
    st.status = 'passed'; st.correct++; qs.correct++; st.passedAt = now;
    qs.firstSolvedAt = qs.firstSolvedAt || now;
  } else {
    st.status = 'failed'; st.wrong++; qs.wrong++;
    if (result.status === 'crashed' || result.status === 'timeout') qs.crashes++;
  }
  qs.lastStatus = st.status;
  st.lastResult = result;

  let justCompleted = false;
  if (!run.completedAt && run.questions.every((m) => run.state[m].status === 'passed')) {
    run.completedAt = now;
    justCompleted = true;
    stats.runsCompleted++;
  }
  run.current = n;
  run.updatedAt = now;
  saveRun(run, 0);
  saveStats(run.setId);
  notify();
  return { result, justCompleted, counted: true };
}

export function resetStats(setId) {
  delete state.stats[setId];
  db.remove('stats', setId);
  notify();
}
