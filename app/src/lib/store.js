// One mutable app state object. Anything that changes it calls notify(); components call
// useStore() to re-render on every change. Views are small, so re-rendering them whole is
// cheaper than tracking fine-grained subscriptions.
import { useSyncExternalStore } from 'react';

export const state = {
  ready: false,
  error: null,
  catalog: null,
  runs: {},            // id -> run (see service.js)
  stats: {},           // setId -> stats
  // Each IndexedDB store is kept here under its own name; backups rely on that (lib/backup.js).
  runner: 'online',    // 'local' | 'online'
  local: null,         // { compiler } when the local g++ server answered, else null
  shortcuts: {},       // action id -> combo the user chose (defaults are in shortcuts.js)
  autoSuggest: false,  // editor shows name suggestions as you type (Settings, or Ctrl+Space)
};

let version = 0;
const listeners = new Set();

export function notify() {
  version++;
  listeners.forEach((l) => l());
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

export function useStore() {
  useSyncExternalStore(subscribe, () => version);
  return state;
}
