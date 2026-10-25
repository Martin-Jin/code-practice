// Questions the user makes in the app (from a pasted screenshot, say) live in one set of their own,
// "My questions". Unlike sets imported from a folder it is not a copy of anything, so it has its own
// store (libMine): the manifest plus the images as data URLs, which keeps it in a backup.
import { uidFor } from '../../shared/pdfindex.js';
import { FORMAT, VERSION, questionProblems } from '../../shared/questionset.js';
import * as db from './db.js';
import { state, notify } from './store.js';
import { syncMine, MINE_ID } from './library.js';

const now = () => new Date().toISOString();

const emptyRecord = () => ({
  id: MINE_ID, updatedAt: now(), images: {},
  manifest: { format: FORMAT, version: VERSION, id: MINE_ID, title: 'My questions', course: '', pdf: null, questions: [] },
});

async function save(record) {
  record.updatedAt = now();
  await db.transact(['libMine'], (t) => t.objectStore('libMine').put(record));   // throws if the browser will not save
  state.libMine[MINE_ID] = record;
  syncMine();
  notify();
}

// question: everything but the uid. images: { path: data URL } for the files it names. Returns the new uid.
export async function addMineQuestion(question, images) {
  const record = state.libMine[MINE_ID] ? structuredClone(state.libMine[MINE_ID]) : emptyRecord();
  const taken = new Set(record.manifest.questions.map((q) => q.uid));
  let uid = await uidFor('mine', question.source || '', question.title);
  for (let n = 2; taken.has(uid); n++) uid = await uidFor('mine', question.source || '', question.title, `|${n}`);

  // The image paths were chosen before the uid was known: name them after it.
  const named = { ...question, uid };
  const files = {};
  for (const [from, dataUrl] of Object.entries(images)) {
    const to = from.replace('{uid}', uid);
    files[to] = dataUrl;
    if (named.stem.image === from) named.stem = { ...named.stem, image: to };
    if (named.solution && named.solution.images) named.solution = { ...named.solution, images: named.solution.images.map((p) => (p === from ? to : p)) };
  }
  const problems = questionProblems(named);
  if (problems.length) throw new Error(`${problems[0][0].toUpperCase()}${problems[0].slice(1)}.`);

  record.manifest.questions.push(named);
  Object.assign(record.images, files);
  await save(record);
  return uid;
}

export async function deleteMineQuestion(uid) {
  const record = structuredClone(state.libMine[MINE_ID]);
  const gone = record.manifest.questions.find((q) => q.uid === uid);
  if (!gone) return;
  record.manifest.questions = record.manifest.questions.filter((q) => q.uid !== uid);
  for (const path of [gone.stem.image, ...((gone.solution && gone.solution.images) || [])]) if (path) delete record.images[path];
  if (!record.manifest.questions.length) await deleteMine();
  else await save(record);
}

export async function deleteMine() {
  await db.transact(['libMine'], (t) => t.objectStore('libMine').delete(MINE_ID));
  delete state.libMine[MINE_ID];
  syncMine();
  notify();
}
