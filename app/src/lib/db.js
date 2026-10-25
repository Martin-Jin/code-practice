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

export const getAll = (store) => safe(() => tx(store, 'readonly', (s) => s.getAll()), []);
export const put = (store, value) => safe(() => tx(store, 'readwrite', (s) => s.put(value)));
export const remove = (store, key) => safe(() => tx(store, 'readwrite', (s) => s.delete(key)));
