// Question sets from the user's own folders. The browser cannot keep a folder open between
// visits, so a chosen folder is scanned once and the sets in it are copied into IndexedDB
// (stores libSets and libFiles, see db.js). Sets are found by their `*.questions.json`
// manifest wherever it sits; the PDF and images it names live beside it. Format and rules:
// shared/questionset.js and docs/question-set-format.md.
import {
  fileKind, isManifestPath, parseQuestionSet, neededFiles, resolveRef, dirOf, joinPath, importStatus,
} from '../../shared/questionset.js';
import { buildIndex, mergeIndex, readPages } from '../../shared/pdfindex.js';
import { validateQuestionSet } from '../../shared/questionset.js';
import * as db from './db.js';
import { state, notify } from './store.js';
import { loadPdfjs } from './pdfjs.js';

const lower = (path) => path.toLowerCase();
const mb = (bytes) => `${(bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0)} MB`;
export { mb };

// A file's path inside the chosen folder, without the folder's own name. A file with no
// folder path (a browser that ignored the folder) is treated as sitting at the top.
function pathInFolder(file) {
  const full = (file.webkitRelativePath || '').replace(/\\/g, '/');
  const slash = full.indexOf('/');
  return slash >= 0 ? full.slice(slash + 1) : file.name;
}

// Reads the chosen folder's files (a FileList as an array) and reports what could be imported.
// Nothing is stored. Each set in the result has: path (its manifest), set (null if unusable),
// errors, skipped (questions left out), files (found: path -> { size, modified, file }), missing,
// bytes, status ('new' | 'update' | 'current').
export async function scanFolder(files) {
  const entries = new Map();   // lower-case path -> { path, file }, only files the app can use
  for (const file of files) {
    const path = pathInFolder(file);
    if (fileKind(path)) entries.set(lower(path), { path, file });
  }

  const manifests = [...entries.values()].filter((e) => isManifestPath(e.path)).sort((a, b) => a.path.localeCompare(b.path));
  const usedPdfs = new Set();
  const ids = new Map();   // set id -> manifest path, to catch two manifests claiming one id
  const sets = [];
  for (const m of manifests) {
    const dir = dirOf(m.path);
    const parsed = parseQuestionSet(await m.file.text());
    const item = { path: m.path, set: parsed.set, errors: parsed.errors, skipped: parsed.skipped, files: {}, missing: [], bytes: 0, status: null };
    if (item.set && item.set.id === MINE_ID) {
      item.errors = [`The id "${MINE_ID}" is kept for questions made in the app. Choose another id in the manifest.`];
      item.set = null;
    }
    if (item.set && ids.has(item.set.id)) {
      item.errors = [`It has the same id ("${item.set.id}") as ${ids.get(item.set.id)}, which is imported instead.`];
      item.set = null;
    }
    if (item.set) {
      ids.set(item.set.id, m.path);
      for (const rel of neededFiles(item.set)) {
        const found = entries.get(lower(joinPath(dir, rel)));
        if (found) {
          item.files[rel] = { size: found.file.size, modified: found.file.lastModified, file: found.file };
          item.bytes += found.file.size;
        } else item.missing.push(rel);
      }
      if (item.set.pdf) usedPdfs.add(lower(joinPath(dir, resolveRef(item.set.pdf))));
      item.status = importStatus(state.library.sets[item.set.id], item.set, item.files);
    }
    sets.push(item);
  }

  // PDFs no manifest names. One already indexed in this browser is shown as such, and as changed if the file is not the one indexed.
  const indexedHere = Object.values(state.library.sets).filter((s) => s.generated);
  const pdfs = [...entries.values()].filter((e) => fileKind(e.path) === 'pdf' && !usedPdfs.has(lower(e.path)))
    .map((e) => {
      const done = indexedHere.find((s) => s.indexedFrom === e.path);
      const stored = done && done.files[done.manifest.pdf];
      return { path: e.path, size: e.file.size, file: e.file, indexed: done ? done.title : null, changed: !!done && !(stored && stored.size === e.file.size && stored.modified === e.file.lastModified) };
    }).sort((a, b) => a.path.localeCompare(b.path));
  return { scanned: files.length, usable: entries.size, sets, pdfs };
}

// Reads a practice-questions PDF in this browser and returns a scan item for it, as if a
// manifest had been found beside it (see shared/pdfindex.js). `onProgress(page, pages)`.
// Indexing again keeps the answers already in an imported set of the same id.
export async function indexPdf(entry, onProgress) {
  const pdfjs = await loadPdfjs();
  const name = entry.path.split('/').pop();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await entry.file.arrayBuffer()) }).promise;
  try {
    const pages = await readPages(pdfjs, doc, onProgress);
    const index = await buildIndex(pages, name);
    const existing = state.library.sets[index.manifest.id];
    const manifest = existing ? mergeIndex(existing.manifest, index.manifest).manifest : index.manifest;
    const checked = validateQuestionSet(manifest);
    if (!checked.set) throw new Error(`The index was not valid: ${checked.errors.join(' ')}`);
    const files = { [name]: { size: entry.file.size, modified: entry.file.lastModified, file: entry.file } };
    return {
      path: entry.path, generated: true, set: checked.set, errors: [], skipped: checked.skipped, files, missing: [], bytes: entry.file.size,
      warnings: index.report.warnings, status: importStatus(existing, checked.set, files),
    };
  } finally {
    doc.destroy();
  }
}

async function ensureRoom(bytes) {
  if (!navigator.storage || !navigator.storage.estimate) return;
  const { usage = 0, quota = Infinity } = await navigator.storage.estimate();
  if (bytes > quota - usage) throw new Error(`Not enough browser storage: ${mb(bytes)} needed, ${mb(Math.max(0, quota - usage))} free.`);
}

// Copies one scanned set into the browser, replacing an earlier import of the same id. Files
// that have not changed are left alone, and files the set no longer names are deleted. All of
// it is one transaction, so a failure leaves the earlier copy as it was.
export async function importSet(item) {
  const { set } = item;
  const existing = state.library.sets[set.id];
  const kept = (rel) => existing && existing.files[rel] && existing.files[rel].size === item.files[rel].size && existing.files[rel].modified === item.files[rel].modified;
  const changed = Object.keys(item.files).filter((rel) => !kept(rel));
  const stale = existing ? Object.keys(existing.files).filter((rel) => !(rel in item.files)) : [];
  await ensureRoom(changed.reduce((n, rel) => n + item.files[rel].size, 0));

  const record = {
    id: set.id, title: set.title, course: set.course, manifest: set, folder: dirOf(item.path), importedAt: new Date().toISOString(),
    bytes: item.bytes, missing: item.missing, generated: !!item.generated, indexedFrom: item.generated ? item.path : null,
    files: Object.fromEntries(Object.entries(item.files).map(([rel, f]) => [rel, { size: f.size, modified: f.modified }])),
  };
  await db.transact(['libSets', 'libFiles'], (t) => {
    t.objectStore('libSets').put(record);
    const files = t.objectStore('libFiles');
    for (const rel of changed) {
      const f = item.files[rel];
      files.put({ key: `${set.id}/${rel}`, setId: set.id, path: rel, size: f.size, modified: f.modified, file: f.file });
    }
    for (const rel of stale) files.delete(`${set.id}/${rel}`);
  });
  state.library.sets[set.id] = record;
  notify();
}

export async function removeSet(id) {
  await db.transact(['libSets', 'libFiles'], (t) => {
    t.objectStore('libSets').delete(id);
    t.objectStore('libFiles').delete(db.prefixRange(`${id}/`));
  });
  delete state.library.sets[id];
  notify();
}

// The set id of the user's own questions (see mine.js). No folder may use it.
export const MINE_ID = 'mine';

// Shows the user's own questions as a set beside the imported ones, or hides it when it is empty.
export function syncMine() {
  const record = state.libMine[MINE_ID];
  if (!record || !record.manifest.questions.length) { delete state.library.sets[MINE_ID]; return; }
  state.library.sets[MINE_ID] = {
    id: MINE_ID, title: record.manifest.title, course: '', manifest: record.manifest, folder: '', importedAt: record.updatedAt,
    bytes: Object.values(record.images).reduce((n, url) => n + url.length, 0), missing: [], files: {}, userOwned: true,
  };
}

// A stored file (a PDF or image of an imported set, or an image of the user's own questions) as a Blob, or null.
export async function getFile(setId, rel) {
  if (setId === MINE_ID) {
    const url = state.libMine[MINE_ID] && state.libMine[MINE_ID].images[rel];
    return url ? (await fetch(url)).blob() : null;
  }
  const record = await db.get('libFiles', `${setId}/${rel}`);
  return record ? record.file : null;
}

export async function loadLibrary() {
  for (const record of await db.getAll('libSets')) state.library.sets[record.id] = record;
}

// Asks the browser not to evict the copies when the disk runs low. Must run from a click
// (Firefox shows a prompt). Returns whether storage is now protected.
export async function requestPersistence() {
  try { return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; } catch { return false; }
}

export async function storageStatus() {
  try {
    const { usage = 0, quota = 0 } = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : {};
    const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false;
    return { usage, quota, persisted };
  } catch { return { usage: 0, quota: 0, persisted: false }; }
}
