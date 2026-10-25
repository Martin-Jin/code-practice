// One mutable app state object. Anything that changes it calls notify(); components call
// useStore() to re-render on every change. Views are small, so re-rendering them whole is
// cheaper than tracking fine-grained subscriptions.
import { useSyncExternalStore } from 'react';

export const state = {
  ready: false,
  error: null,
  catalog: null,
  // The stores that hold progress (runs, stats, lib*) are kept here under their own names; backups rely on that (lib/backup.js).
  runs: {},            // id -> run (see service.js)
  stats: {},           // setId -> stats
  library: { sets: {} }, // id -> imported question set from the user's folders (see library.js); not backed up
  libProgress: {},     // "<set id>/<uid>" -> progress on one imported question (see practice.js)
  libEdits: {},        // "<set id>/<uid>" -> the user's changes to one imported question
  libRuns: {},         // id -> practice session over an imported set
  libMine: {},         // id -> the user's own questions made in the app
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
