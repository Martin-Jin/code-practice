// Folders: the user's own way of sorting question sets (both the coding sets and the sets in their library) on the
// Question sets page. A set is in at most one folder; sets in none are listed under "Not in a folder". A folder only
// lists set ids, so removing a set or deleting a folder never touches the questions or their stats. Saved to
// IndexedDB (store libFolders) and part of a backup.
import * as db from './db.js';
import { state, notify } from './store.js';

const now = () => new Date().toISOString();
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(16).padStart(2, '0')).join('');

export const foldersSorted = () => Object.values(state.libFolders).sort((a, b) => a.name.localeCompare(b.name));
export const folderOf = (setId) => foldersSorted().find((f) => f.items.some((i) => i.setId === setId)) || null;

async function save(folder) {
  folder.updatedAt = now();
  await db.transact(['libFolders'], (t) => t.objectStore('libFolders').put(folder));   // throws if the browser will not save
  state.libFolders[folder.id] = folder;
  notify();
}

const cleanName = (name, except = null) => {
  const clean = String(name || '').trim().slice(0, 60);
  if (!clean) throw new Error('Give the folder a name.');
  if (foldersSorted().some((f) => f.id !== except && f.name.toLowerCase() === clean.toLowerCase())) throw new Error(`There is already a folder called "${clean}".`);
  return clean;
};

export async function createFolder(name) {
  const folder = { id: newId(), name: cleanName(name), items: [], updatedAt: now() };
  await save(folder);
  return folder;
}

export const renameFolder = (id, name) => save({ ...state.libFolders[id], name: cleanName(name, id) });

export async function deleteFolder(id) {
  await db.transact(['libFolders'], (t) => t.objectStore('libFolders').delete(id));
  delete state.libFolders[id];
  notify();
}

// Puts a set in a folder (taking it out of any other), or in none when folderId is null.
export async function moveSet(setId, folderId) {
  for (const f of foldersSorted()) {
    const has = f.items.some((i) => i.setId === setId);
    if (f.id === folderId && !has) await save({ ...f, items: [...f.items, { setId }] });
    else if (f.id !== folderId && has) await save({ ...f, items: f.items.filter((i) => i.setId !== setId) });
  }
}

// ---- drag and drop: what travels with a dragged set card ----
export const DRAG_TYPE = 'application/x-practice-set';
export function startDrag(e, setId) {
  e.dataTransfer.setData(DRAG_TYPE, setId);
  e.dataTransfer.effectAllowed = 'move';
}
export const hasDrag = (e) => [...e.dataTransfer.types].includes(DRAG_TYPE);
export const readDrag = (e) => e.dataTransfer.getData(DRAG_TYPE) || null;
