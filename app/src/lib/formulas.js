// Formula sheets: PDFs or images kept with a question set and shown in a sidebar beside its questions. The files are
// copies kept in this browser (libFiles, under "<set id>/formulas/"), listed per set in libFormulas. Each set holds its
// own copy, so a set exported on its own (see downloadSets in backup.js) takes its sheets with it. A backup carries them
// only in the zip that includes the imported sets' files.
import * as db from './db.js';
import { state, notify } from './store.js';

export const sheetsOf = (setId) => (state.libFormulas[setId] ? state.libFormulas[setId].sheets : []);

export async function loadFormulas() {
  for (const r of await db.getAll('libFormulas')) state.libFormulas[r.setId] = r;
  for (const r of await db.getAll('libHandles')) state.libHandles[r.setId] = r;   // the linked PDFs load with the sheets
}

const isSheet = (f) => f.type === 'application/pdf' || f.type.startsWith('image/') || /\.(pdf|png|jpe?g|webp|gif)$/i.test(f.name);

// Adds copies of the files to each set's formula sheets, in one transaction. With `skipSame`, a sheet a set already has
// (same name and size) is not added again, so applying one sheet to the same sets twice changes nothing. Returns
// { files, added }: the usable files given and how many copies were stored across the sets.
export async function addFormulaSheetsToSets(setIds, files, { skipSame = false } = {}) {
  const list = [...files].filter(isSheet);
  if (!list.length || !setIds.length) return { files: 0, added: 0 };
  const records = [];
  const stored = [];
  for (const setId of setIds) {
    const sheets = [...sheetsOf(setId)];
    for (const file of list) {
      if (skipSame && sheets.some((s) => s.name === file.name && s.size === file.size)) continue;
      let name = file.name;
      for (let n = 2; sheets.some((s) => s.name === name); n++) name = file.name.replace(/(\.[^.]*)?$/, ` (${n})$1`);
      const path = `formulas/${Date.now().toString(36)}-${sheets.length}-${name}`;
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      sheets.push({ path, name, type: isPdf ? 'pdf' : 'image', size: file.size });
      stored.push({ key: `${setId}/${path}`, setId, path, size: file.size, modified: file.lastModified, file });
    }
    records.push({ setId, sheets });
  }
  if (!stored.length) return { files: list.length, added: 0 };
  await db.transact(['libFormulas', 'libFiles'], (t) => {
    for (const r of records) t.objectStore('libFormulas').put(r);
    for (const f of stored) t.objectStore('libFiles').put(f);
  });
  for (const r of records) state.libFormulas[r.setId] = r;
  notify();
  return { files: list.length, added: stored.length };
}

// Adds files to one set's formula sheets. Returns how many usable files were given.
export const addFormulaSheets = async (setId, files) => (await addFormulaSheetsToSets([setId], files)).files;

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
