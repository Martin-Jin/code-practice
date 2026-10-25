// Saved runs and stats live in this browser's IndexedDB. If it is unavailable (some
// private windows), everything still works but is lost on reload; `persistent` says which.
const NAME = 'code-practice';
let dbPromise = null;
export let persistent = true;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB is not available'));
      const req = indexedDB.open(NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('runs', { keyPath: 'id' });
        req.result.createObjectStore('stats', { keyPath: 'setId' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch((e) => { persistent = false; throw e; });
  }
  return dbPromise;
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

// Writes { storeName: [records] } in one transaction, so a failure leaves every store as it
// was. Unlike put(), errors are thrown: a restore must not report success if nothing saved.
// `clear` empties each named store first.
export async function writeAll(stores, { clear = false } = {}) {
  const db = await open();
  const names = Object.keys(stores);
  return new Promise((resolve, reject) => {
    const t = db.transaction(names, 'readwrite');
    for (const name of names) {
      const s = t.objectStore(name);
      if (clear) s.clear();
      for (const record of stores[name]) s.put(record);
    }
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const getAll = (store) => safe(() => tx(store, 'readonly', (s) => s.getAll()), []);
export const put = (store, value) => safe(() => tx(store, 'readwrite', (s) => s.put(value)));
export const remove = (store, key) => safe(() => tx(store, 'readwrite', (s) => s.delete(key)));
