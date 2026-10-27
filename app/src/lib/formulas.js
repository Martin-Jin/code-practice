// Formula sheets: PDFs or images kept with a question set and shown in a sidebar beside its questions. The files are
// copies kept in this browser (libFiles, under "<set id>/formulas/"), listed per set in libFormulas. Like the imported
// sets themselves they are not part of a backup, because the user still has the originals.
import * as db from './db.js';
import { state, notify } from './store.js';

export const sheetsOf = (setId) => (state.libFormulas[setId] ? state.libFormulas[setId].sheets : []);

export async function loadFormulas() {
  for (const r of await db.getAll('libFormulas')) state.libFormulas[r.setId] = r;
  for (const r of await db.getAll('libHandles')) state.libHandles[r.setId] = r;   // the linked PDFs load with the sheets
}

const isSheet = (f) => f.type === 'application/pdf' || f.type.startsWith('image/') || /\.(pdf|png|jpe?g|webp|gif)$/i.test(f.name);

// Adds files to a set's formula sheets. Returns how many were added.
export async function addFormulaSheets(setId, files) {
  const list = [...files].filter(isSheet);
  if (!list.length) return 0;
  const sheets = [...sheetsOf(setId)];
  const stored = [];
  for (const file of list) {
    let name = file.name;
    for (let n = 2; sheets.some((s) => s.name === name); n++) name = file.name.replace(/(\.[^.]*)?$/, ` (${n})$1`);
    const path = `formulas/${Date.now().toString(36)}-${sheets.length}-${name}`;
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    sheets.push({ path, name, type: isPdf ? 'pdf' : 'image' });
    stored.push({ key: `${setId}/${path}`, setId, path, size: file.size, modified: file.lastModified, file });
  }
  const record = { setId, sheets };
  await db.transact(['libFormulas', 'libFiles'], (t) => {
    t.objectStore('libFormulas').put(record);
    for (const f of stored) t.objectStore('libFiles').put(f);
  });
  state.libFormulas[setId] = record;
  notify();
  return list.length;
}

export async function removeFormulaSheet(setId, path) {
  const record = { setId, sheets: sheetsOf(setId).filter((s) => s.path !== path) };
  await db.transact(['libFormulas', 'libFiles'], (t) => {
    t.objectStore('libFormulas').put(record);
    t.objectStore('libFiles').delete(`${setId}/${path}`);
  });
  state.libFormulas[setId] = record;
  notify();
}

export async function formulaBlob(setId, path) {
  const record = await db.get('libFiles', `${setId}/${path}`);
  return record ? record.file : null;
}
