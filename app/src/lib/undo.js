// Undo and redo of what the user changes (folders, question edits, their own questions, sessions, removed sets).
// An action is recorded as a pair of functions; every recorded action also pops up a notification that undoes it
// when clicked (Toasts.jsx). Ctrl+Z / Ctrl+Shift+Z do the same (App.jsx).
// Typing answers and notes is not recorded, as the text box has its own undo, and starting a session is not either.
import * as db from './db.js';
import { state, notify } from './store.js';
import { toast } from './toast.js';

const LIMIT = 50;
const done = [];   // { label, undo, redo }, the latest last
const undone = [];
let applying = false;
let held = false;   // see undoBarrier
let depth = 0;
const restoreHooks = {};   // store -> function run after undo or redo changed that store

// Something outside the app's own state changed (the PDF was rewritten, a backup restored): older steps would no longer
// match, so forget them. The changes made straight after (in the same step) are not recorded either.
export function undoBarrier() {
  done.length = 0;
  undone.length = 0;
  held = true;
  setTimeout(() => { held = false; }, 0);
}

export const onRestore = (store, fn) => { restoreHooks[store] = fn; };

// Records an action. `undo` and `redo` may be async. Does nothing while an undo or redo is running, so the functions can
// call the ordinary change functions.
export function recordUndo(label, undo, redo) {
  if (applying || held || depth > 0) return;
  done.push({ label, undo, redo });
  if (done.length > LIMIT) done.shift();
  undone.length = 0;
  toast(label, 'info', { action: 'Undo', onClick: undoLast });
}

// Runs fn (which changes the maps of the named stores in `state`, replacing records rather than editing them in place)
// and records one undoable action from what changed. Nested calls record nothing of their own.
export async function undoable(label, stores, fn) {
  if (applying || depth > 0) return fn();
  const before = Object.fromEntries(stores.map((s) => [s, { ...state[s] }]));
  depth++;
  let result;
  try { result = await fn(); } finally { depth--; }
  const changes = [];
  for (const s of stores) {
    for (const key of new Set([...Object.keys(before[s]), ...Object.keys(state[s])])) {
      if (before[s][key] !== state[s][key]) changes.push({ store: s, key, before: before[s][key], after: state[s][key] });
    }
  }
  if (changes.length) recordUndo(label, () => restore(changes, 'before'), () => restore(changes, 'after'));
  return result;
}

async function restore(changes, side) {
  for (const { store, key, ...c } of changes) {
    const value = c[side];
    if (value === undefined) { delete state[store][key]; await db.remove(store, key); } else { state[store][key] = value; await db.put(store, value); }
  }
  for (const store of new Set(changes.map((c) => c.store))) if (restoreHooks[store]) restoreHooks[store]();
  notify();
}

async function apply(from, to, past, verb) {
  const step = from.pop();
  if (!step) { toast(`Nothing to ${verb}.`); return; }
  applying = true;
  try {
    await (verb === 'undo' ? step.undo() : step.redo());
    to.push(step);
    toast(`${past}: ${step.label}`, 'info', { action: verb === 'undo' ? 'Redo' : 'Undo', onClick: verb === 'undo' ? redoLast : undoLast });
  } catch (e) {
    toast(`Could not ${verb} that: ${e.message}`, 'bad');
  } finally { applying = false; }
}

export const undoLast = () => apply(done, undone, 'Undone', 'undo');
export const redoLast = () => apply(undone, done, 'Redone', 'redo');
