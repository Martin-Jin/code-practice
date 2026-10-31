// Questions the user makes in the app (from a pasted screenshot, say) live in sets of their own. The first is
// "My questions"; a set can also be made by typing a new set name when adding a question. Unlike sets imported
// from a folder these are not copies of anything, so they have their own store (libMine): one record per set,
// holding the manifest plus the images as data URLs, which keeps them in a backup. Questions added to a set
// imported from a folder are stored with that set instead (see addToImportedSet in library.js).
import { uidFor } from '../../shared/pdfindex.js';
import { FORMAT, VERSION, questionProblems } from '../../shared/questionset.js';
import * as db from './db.js';
import { state, notify } from './store.js';
import { syncMine, MINE_ID } from './library.js';
import { undoable, onRestore } from './undo.js';

onRestore('libMine', syncMine);   // undo and redo change the records, so the sets list must follow

const now = () => new Date().toISOString();

const emptyRecord = (id, title) => ({
  id, updatedAt: now(), images: {},
  manifest: { format: FORMAT, version: VERSION, id, title, course: '', pdf: null, questions: [] },
});

// "Rigid body kinetics" -> "rigid-body-kinetics", for the id of a set made by typing its name.
export const idFromTitle = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-set';

async function save(record) {
  record.updatedAt = now();
  await db.transact(['libMine'], (t) => t.objectStore('libMine').put(record));   // throws if the browser will not save
  state.libMine[record.id] = record;
  syncMine();
  notify();
}

// Gives each image its final path, now that the uid is known: "images/{uid}.png" -> "images/q-1234abcd.png".
export function nameImages(question, uid, images) {
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
  return { named, files };
}

// question: everything but the uid. images: { path: data URL } for the files it names. `set` is { id, title } of
// the user's set to add to (a new one is made if it does not exist yet). Returns the new uid.
export const addMineQuestion = (question, images, set = { id: MINE_ID, title: 'My questions' }) => undoable(`Added “${question.title}”`, ['libMine'], () => storeQuestion(question, images, set));
async function storeQuestion(question, images, set) {
  const record = state.libMine[set.id] ? structuredClone(state.libMine[set.id]) : emptyRecord(set.id, set.title);
  const taken = new Set(record.manifest.questions.map((q) => q.uid));
  let uid = await uidFor(set.id, question.source || '', question.title);
  for (let n = 2; taken.has(uid); n++) uid = await uidFor(set.id, question.source || '', question.title, `|${n}`);
  const { named, files } = nameImages({ ...question, own: true }, uid, images);
  record.manifest.questions.push(named);
  Object.assign(record.images, files);
  await save(record);
  return uid;
}

export async function deleteMineQuestion(setId, uid) {
  const title = ((state.libMine[setId] && state.libMine[setId].manifest.questions.find((q) => q.uid === uid)) || {}).title;
  return undoable(`Deleted “${title}”`, ['libMine'], () => dropQuestion(setId, uid));
}

async function dropQuestion(setId, uid) {
  const record = structuredClone(state.libMine[setId]);
  const gone = record.manifest.questions.find((q) => q.uid === uid);
  if (!gone) return;
  record.manifest.questions = record.manifest.questions.filter((q) => q.uid !== uid);
  for (const path of [gone.stem.image, ...((gone.solution && gone.solution.images) || [])]) if (path) delete record.images[path];
  if (!record.manifest.questions.length) await dropSet(setId);
  else await save(record);
}

export const deleteMine = (setId = MINE_ID) => undoable(`Removed ${state.libMine[setId] ? state.libMine[setId].manifest.title : 'a question set'}`, ['libMine'], () => dropSet(setId));

async function dropSet(setId) {
  await db.transact(['libMine'], (t) => t.objectStore('libMine').delete(setId));
  delete state.libMine[setId];
  syncMine();
  notify();
}
