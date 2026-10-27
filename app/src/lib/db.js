// Saved runs and stats, and the copies of the user's own question folders, live in this
// browser's IndexedDB. If it is unavailable (some private windows), everything still works
// but is lost on reload; `persistent` says which.
//   runs, stats       progress on the C++ sets (backed up, see shared/backup.js)
//   libProgress       progress on questions of imported sets: answers, results, the "difficult" flag (backed up)
//   libEdits          answer keys and corrections the user made to imported questions (backed up)
//   libRuns           practice sessions over imported sets (backed up)
//   libMine           the user's own questions made in the app, with their images (backed up)
//   libFormulas       the formula sheets added to a set (the files are in libFiles under "<set id>/formulas/"; not backed up)
//   libHandles        the file handle of a PDF the user linked to a set, so edits can be written back (not backed up)
//   libSets, libFiles question sets imported from a folder and their PDFs and images (copies
//                     of files the user still has, so they are not backed up)
const NAME = 'code-practice';
const VERSION = 4;
const STORES = [['runs', 'id'], ['stats', 'setId'], ['libSets', 'id'], ['libFiles', 'key'], ['libProgress', 'key'], ['libEdits', 'key'], ['libRuns', 'id'], ['libMine', 'id'], ['libFormulas', 'setId'], ['libHandles', 'setId']];
let dbPromise = null;
export let persistent = true;
export let blocked = false;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB is not available'));
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        for (const [name, keyPath] of STORES) {
          if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name, { keyPath });
        }
      };
      req.onsuccess = () => {
        // A newer copy of the page in another tab may need to upgrade: let it.
        req.result.onversionchange = () => { req.result.close(); dbPromise = null; };
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
      // An older copy of the page open in another tab holds up this upgrade until it is closed.
      req.onblocked = () => {
        blocked = true;
        reject(new Error('This page is open in another tab with an older version. Close the other tabs, then reload.'));
      };
    }).catch((e) => { persistent = false; throw e; });
  }
  return dbPromise;
}

// Called once at start-up. A missing IndexedDB is tolerated (see above); a blocked upgrade is not,
// because carrying on would show an empty app while the real data sits unread.
export async function ensureOpen() {
  try { await open(); } catch (e) { if (blocked) throw e; }
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const request = fn(t.objectStore(store));
    t.oncomplete = () => resolve(request && request.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const safe = async (fn, fallback) => { try { return await fn(); } catch { return fallback; } };

// Runs fn(transaction) over the named stores in one transaction, so a failure (a full disk, say)
// leaves every store as it was. Unlike put(), errors are thrown: callers must not report
// success if nothing saved.
export async function transact(names, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(names, 'readwrite');
    fn(t);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

// Writes { storeName: [records] } in one transaction. `clear` empties each named store first.
export const writeAll = (stores, { clear = false } = {}) => transact(Object.keys(stores), (t) => {
  for (const [name, records] of Object.entries(stores)) {
    const s = t.objectStore(name);
    if (clear) s.clear();
    for (const record of records) s.put(record);
  }
});

// Keys that start with `prefix`, for stores keyed by "<id>/<path>".
export const prefixRange = (prefix) => IDBKeyRange.bound(prefix, `${prefix}￿`);

export const getAll = (store) => safe(() => tx(store, 'readonly', (s) => s.getAll()), []);
export const get = (store, key) => safe(() => tx(store, 'readonly', (s) => s.get(key)));
export const put = (store, value) => safe(() => tx(store, 'readwrite', (s) => s.put(value)));
export const remove = (store, key) => safe(() => tx(store, 'readwrite', (s) => s.delete(key)));
