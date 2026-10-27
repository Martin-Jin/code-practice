// Folders: the user's own collections of questions, taken from any imported set, for organising by hand (drag a
// question onto a folder, drag within a folder to reorder). A folder only lists questions ({ setId, uid }); the
// questions stay in their sets, with their stats. Saved to IndexedDB (store libFolders) and part of a backup.
import * as db from './db.js';
import { state, notify } from './store.js';

const now = () => new Date().toISOString();
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(16).padStart(2, '0')).join('');

export const foldersSorted = () => Object.values(state.libFolders).sort((a, b) => a.name.localeCompare(b.name));
export const sameItem = (a, b) => a.setId === b.setId && a.uid === b.uid;
export const folderHas = (folder, setId, uid) => folder.items.some((i) => i.setId === setId && i.uid === uid);

async function save(folder) {
  folder.updatedAt = now();
  await db.transact(['libFolders'], (t) => t.objectStore('libFolders').put(folder));   // throws if the browser will not save
  state.libFolders[folder.id] = folder;
  notify();
}

export async function createFolder(name) {
  const clean = String(name || '').trim().slice(0, 60);
  if (!clean) throw new Error('Give the folder a name.');
  if (foldersSorted().some((f) => f.name.toLowerCase() === clean.toLowerCase())) throw new Error(`There is already a folder called "${clean}".`);
  const folder = { id: newId(), name: clean, items: [], updatedAt: now() };
  await save(folder);
  return folder;
}

export async function renameFolder(id, name) {
  const clean = String(name || '').trim().slice(0, 60);
  if (!clean) throw new Error('Give the folder a name.');
  if (foldersSorted().some((f) => f.id !== id && f.name.toLowerCase() === clean.toLowerCase())) throw new Error(`There is already a folder called "${clean}".`);
  await save({ ...state.libFolders[id], name: clean });
}

export async function deleteFolder(id) {
  await db.transact(['libFolders'], (t) => t.objectStore('libFolders').delete(id));
  delete state.libFolders[id];
  notify();
}

// Adds a question to the end of a folder. Returns false if it was already there.
export async function addToFolder(id, setId, uid) {
  const folder = state.libFolders[id];
  if (!folder || folderHas(folder, setId, uid)) return false;
  await save({ ...folder, items: [...folder.items, { setId, uid }] });
  return true;
}

export async function removeFromFolder(id, setId, uid) {
  const folder = state.libFolders[id];
  if (folder) await save({ ...folder, items: folder.items.filter((i) => !(i.setId === setId && i.uid === uid)) });
}

// Moves a question to another folder (or puts it first into one), before the item `beforeUid` of `beforeSetId`, or at the end.
export async function moveItem(fromId, toId, item, before = null) {
  const to = state.libFolders[toId];
  if (!to) return;
  const without = (list) => list.filter((i) => !sameItem(i, item));
  const target = fromId === toId ? without(to.items) : to.items.filter((i) => !sameItem(i, item));
  const at = before ? target.findIndex((i) => sameItem(i, before)) : -1;
  target.splice(at < 0 ? target.length : at, 0, { setId: item.setId, uid: item.uid });
  if (fromId && fromId !== toId && state.libFolders[fromId]) await save({ ...state.libFolders[fromId], items: without(state.libFolders[fromId].items) });
  await save({ ...to, items: target });
}

// ---- drag and drop: what travels with a dragged question ----
export const DRAG_TYPE = 'application/x-practice-question';
export function startDrag(e, item, fromId = null) {
  e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ setId: item.setId, uid: item.uid, from: fromId }));
  e.dataTransfer.effectAllowed = 'copyMove';
}
export const hasDrag = (e) => [...e.dataTransfer.types].includes(DRAG_TYPE);
export function readDrag(e) {
  try { return JSON.parse(e.dataTransfer.getData(DRAG_TYPE)); } catch { return null; }
}
