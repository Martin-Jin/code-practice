// What the timers share while a question is open: whether the user paused them (one switch for a whole practice session, or
// for questions opened outside one) and whether the page is being looked at. The time itself is kept by practice.js.
let pausedKey = null;
const listeners = new Set();
const emit = () => listeners.forEach((f) => f());

export const isPaused = (key) => pausedKey === key;

export function togglePause(key) {
  pausedKey = pausedKey === key ? null : key;
  emit();
}

// A different session (or leaving a session) starts unpaused.
export function enterContext(key) {
  if (pausedKey !== null && pausedKey !== key) { pausedKey = null; emit(); }
}

export function onPauseChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Time only counts while this tab is showing and the window has focus.
export const pageActive = () => document.visibilityState === 'visible' && document.hasFocus();
