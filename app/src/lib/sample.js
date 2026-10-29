// The sample practice quiz every new browser starts with, so a first visit shows the library features on made-up questions
// instead of an empty page. It is a set in app/public/sample/ (a manifest, two diagrams and a formula sheet), imported the
// same way as a folder the user chooses. It is added once: not to a browser that already has sets of its own, and not again
// after the user removes it (the flag below stays).
import { parseQuestionSet, neededFiles, resolveRef } from '../../shared/questionset.js';
import { importSet } from './library.js';
import { addFormulaSheets } from './formulas.js';
import { state } from './store.js';

const SEEDED = 'sampleSeeded';
const BASE = `${import.meta.env.BASE_URL}sample/`;
const MANIFEST = 'sample-practice-quiz.questions.json';
const FORMULAS = 'formulas.svg';
const TYPES = { svg: 'image/svg+xml', png: 'image/png', pdf: 'application/pdf' };
const MODIFIED = Date.UTC(2026, 9, 29);   // a fixed time, so the files never look changed

const get = async (name) => {
  const res = await fetch(BASE + name);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  return res;
};
const fileOf = async (name) => {
  const blob = await (await get(name)).blob();
  return new File([blob], name.split('/').pop(), { type: TYPES[name.split('.').pop()] || blob.type, lastModified: MODIFIED });
};

export async function seedSample() {
  try { if (localStorage.getItem(SEEDED)) return; } catch { return; }
  const mark = () => { try { localStorage.setItem(SEEDED, '1'); } catch { /* storage blocked */ } };
  if (Object.keys(state.library.sets).length || Object.keys(state.libMine).length) { mark(); return; }
  try {
    const { set } = parseQuestionSet(await (await get(MANIFEST)).text());
    if (!set) return;
    const files = {};
    for (const rel of neededFiles(set)) {
      const file = await fileOf(resolveRef(rel));
      files[rel] = { size: file.size, modified: file.lastModified, file };
    }
    await importSet({ path: `sample/${MANIFEST}`, set, files, missing: [], bytes: Object.values(files).reduce((n, f) => n + f.size, 0) });
    await addFormulaSheets(set.id, [await fileOf(FORMULAS)]);
    mark();
  } catch { /* offline or storage full: try again next visit */ }
}
