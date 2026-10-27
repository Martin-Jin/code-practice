// The question-set manifest (`<name>.questions.json`) that the practice app reads from the
// user's own folders, and the rules for finding a set's files. Pure functions, shared by the
// browser app and the unit tests. The format is described in docs/question-set-format.md and
// any prompt given to an agent for adding questions; keep them in step.
export const FORMAT = 'practice-question-set';
export const VERSION = 1;
export const MANIFEST_SUFFIX = '.questions.json';

const PART_TYPES = ['numeric', 'mcq', 'self'];
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

// ---- paths ----

// A file named by a manifest, relative to the manifest's own folder, normalised to
// forward slashes. null for anything that is not a plain relative path inside that folder.
export function resolveRef(ref) {
  if (!isText(ref)) return null;
  const parts = ref.replace(/\\/g, '/').split('/').filter((p) => p !== '' && p !== '.');
  if (!parts.length || parts.some((p) => p === '..' || /^[a-zA-Z]:$/.test(p)) || /^[/\\]/.test(ref)) return null;
  return parts.join('/');
}

export const dirOf = (path) => path.split('/').slice(0, -1).join('/');
export const joinPath = (dir, rel) => (dir ? `${dir}/${rel}` : rel);
export const isManifestPath = (path) => path.toLowerCase().endsWith(MANIFEST_SUFFIX);

const IMAGE = /\.(png|jpe?g|webp|gif|svg)$/i;
export function fileKind(path) {
  if (isManifestPath(path)) return 'manifest';
  if (/\.pdf$/i.test(path)) return 'pdf';
  if (IMAGE.test(path)) return 'image';
  return null;
}

// ---- validation ----

function checkCrop(crop, where, problems) {
  const ok = isObject(crop) && Number.isInteger(crop.page) && crop.page >= 1 && Array.isArray(crop.box) && crop.box.length === 4
    && crop.box.every(isNumber) && crop.box[0] < crop.box[2] && crop.box[1] < crop.box[3];
  if (!ok) problems.push(`${where} must be { page, box: [x0, y0, x1, y1] } with a page from 1 and a box with positive size`);
}

function checkRef(ref, where, problems) {
  if (resolveRef(ref) === null) problems.push(`${where} must be a relative path inside the set's folder`);
}

function checkPart(part, i, problems) {
  const at = `part ${i + 1}`;
  if (!isObject(part)) return problems.push(`${at} is not an object`);
  if (typeof part.label !== 'string') problems.push(`${at} needs a label (use "" when there is one part)`);
  if (part.prompt !== undefined && typeof part.prompt !== 'string') problems.push(`${at} prompt must be text`);
  if (!PART_TYPES.includes(part.type)) return problems.push(`${at} type must be one of ${PART_TYPES.join(', ')}`);
  if (part.type === 'numeric') {
    if (typeof part.unit !== 'string') problems.push(`${at} needs a unit (use "" for none)`);
    if (part.answer !== null && part.answer !== undefined && !isNumber(part.answer)) problems.push(`${at} answer must be a number or null`);
    if (part.dp !== undefined && !(Number.isInteger(part.dp) && part.dp >= 0 && part.dp <= 15)) problems.push(`${at} dp must be a whole number from 0 to 15`);
    if (part.relTol !== undefined && !(isNumber(part.relTol) && part.relTol >= 0)) problems.push(`${at} relTol must be a number from 0`);
  } else if (part.type === 'mcq') {
    if (!Array.isArray(part.options) || part.options.length < 2 || !part.options.every(isText)) problems.push(`${at} needs at least two text options`);
    else if (!Array.isArray(part.correct) || !part.correct.every((n) => Number.isInteger(n) && n >= 0 && n < part.options.length)
      || new Set(part.correct).size !== part.correct.length) problems.push(`${at} correct must list distinct option numbers, counting from 0`);
    else if (part.multi !== true && part.correct.length > 1) problems.push(`${at} has several correct options but multi is not true`);
    if (part.multi !== undefined && typeof part.multi !== 'boolean') problems.push(`${at} multi must be true or false`);
  }
}

// What is wrong with one question, as a list of short sentences; empty when it is usable.
export function questionProblems(q) {
  const problems = [];
  if (!isObject(q)) return ['it is not an object'];
  if (!isText(q.uid)) problems.push('uid is missing');
  if (!isText(q.title)) problems.push('title is missing');
  if (!isText(q.section)) problems.push('section is missing');
  if (q.source !== undefined && typeof q.source !== 'string') problems.push('source must be text');
  if (q.marks !== undefined && q.marks !== null && !(isNumber(q.marks) && q.marks >= 0)) problems.push('marks must be a number from 0');
  if (q.tags !== undefined && !(Array.isArray(q.tags) && q.tags.every((t) => typeof t === 'string'))) problems.push('tags must be a list of text');
  if (q.notes !== undefined && typeof q.notes !== 'string') problems.push('notes must be text');
  if (q.flags !== undefined && !(Array.isArray(q.flags) && q.flags.every((t) => typeof t === 'string'))) problems.push('flags must be a list of text');

  if (!isObject(q.stem)) problems.push('stem is missing');
  else {
    const { text, image, pdf } = q.stem;
    if (!isText(text) && !isText(image) && !isObject(pdf)) problems.push('stem needs text, an image or a pdf crop');
    if (text !== undefined && typeof text !== 'string') problems.push('stem text must be text');
    if (image !== undefined) checkRef(image, 'stem image', problems);
    if (pdf !== undefined) checkCrop(pdf, 'stem pdf', problems);
  }

  // No parts is allowed: a question with nothing to answer, which is just read (and its solution looked at).
  if (!Array.isArray(q.parts)) problems.push('parts must be a list (it may be empty)');
  else {
    q.parts.forEach((p, i) => checkPart(p, i, problems));
    const labels = q.parts.map((p) => (isObject(p) ? p.label : undefined));
    if (new Set(labels).size !== labels.length) problems.push('two parts share a label');
  }

  if (q.solution !== undefined && q.solution !== null) {
    const s = q.solution;
    if (!isObject(s)) problems.push('solution must be an object or null');
    else {
      if (s.text !== undefined && typeof s.text !== 'string') problems.push('solution text must be text');
      if (s.images !== undefined) {
        if (!Array.isArray(s.images)) problems.push('solution images must be a list');
        else s.images.forEach((im, i) => checkRef(im, `solution image ${i + 1}`, problems));
      }
      if (s.pdf !== undefined) {
        if (!Array.isArray(s.pdf)) problems.push('solution pdf must be a list of crops');
        else s.pdf.forEach((c, i) => checkCrop(c, `solution pdf ${i + 1}`, problems));
      }
    }
  }
  return problems;
}

const normaliseQuestion = (q) => ({
  ...q, notes: q.notes || '', source: q.source || '', marks: q.marks ?? null, tags: q.tags || [], flags: q.flags || [], solution: q.solution || null,
  parts: q.parts.map((p) => (p.type === 'mcq' ? { multi: false, ...p } : p)),
});

// Checks a parsed manifest. `errors` make the whole set unusable; `skipped` lists questions
// that were left out, each with the reasons. `set` holds the usable part, with defaults filled in.
export function validateQuestionSet(raw) {
  const errors = [];
  const skipped = [];
  if (!isObject(raw) || raw.format !== FORMAT) return { set: null, errors: ['This is not a practice question set (format is not "practice-question-set").'], skipped };
  if (!Number.isInteger(raw.version) || raw.version < 1) errors.push('The version number is missing.');
  else if (raw.version > VERSION) errors.push('It was made for a newer version of the app. Open the newest version of the page.');
  if (!isText(raw.id) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(raw.id)) errors.push('The id must be letters, digits, dots, dashes or underscores, like "mecheng222-rigid-body".');
  if (!isText(raw.title)) errors.push('The title is missing.');
  if (raw.course !== undefined && typeof raw.course !== 'string') errors.push('The course must be text.');
  if (raw.pdf !== undefined && raw.pdf !== null && resolveRef(raw.pdf) === null) errors.push('The pdf must be the name of a file beside the manifest, or null.');
  if (!Array.isArray(raw.questions)) errors.push('The questions list is missing.');
  if (errors.length) return { set: null, errors, skipped };

  const seen = new Set();
  const questions = [];
  raw.questions.forEach((q, i) => {
    const problems = questionProblems(q);
    if (!problems.length && seen.has(q.uid)) problems.push(`uid "${q.uid}" is already used by an earlier question`);
    if (!problems.length && !raw.pdf && isObject(q.stem) && q.stem.pdf) problems.push('it has a pdf crop but the set names no pdf');
    if (problems.length) {
      skipped.push({ number: i + 1, title: isObject(q) && isText(q.title) ? q.title : '', problems });
      return;
    }
    seen.add(q.uid);
    questions.push(normaliseQuestion(q));
  });
  return {
    set: { format: FORMAT, version: raw.version, id: raw.id, title: raw.title.trim(), course: raw.course || '', pdf: raw.pdf || null, questions },
    errors, skipped,
  };
}

export function parseQuestionSet(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { return { set: null, errors: ['The file is not valid JSON.'], skipped: [] }; }
  return validateQuestionSet(raw);
}

// ---- the user's corrections ----

// A question with the user's edits laid over it. An edit holds only what the user changed:
// parts (the answer key), marks, tags, notes, hidden, section, title, stemText/stemImage and solutionText/solutionImage (a replacement
// as text or a data URL), and stemBox (a new crop rectangle for a PDF question).
export function applyEdit(question, edit) {
  if (!edit) return question;
  const out = { ...question };
  if (edit.parts) out.parts = edit.parts;
  if (edit.marks !== undefined) out.marks = edit.marks;
  if (edit.tags) out.tags = edit.tags;
  if (edit.notes !== undefined) out.notes = edit.notes;
  if (edit.hidden) out.hidden = true;
  if (edit.section) out.section = edit.section;
  if (edit.title) out.title = edit.title;
  if (edit.stemText !== undefined || edit.stemImage) {
    out.stem = { text: edit.stemText !== undefined ? edit.stemText : question.stem.text, ...(edit.stemImage ? { imageData: edit.stemImage } : { image: question.stem.image, pdf: question.stem.pdf }) };
  }
  if (edit.solutionText !== undefined || edit.solutionImage) {
    const base = question.solution || {};
    out.solution = { text: edit.solutionText !== undefined ? edit.solutionText : base.text, ...(edit.solutionImage ? { imageData: edit.solutionImage } : { images: base.images, pdf: base.pdf }) };
  }
  if (edit.stemBox && question.stem.pdf) out.stem = { ...question.stem, pdf: { ...question.stem.pdf, box: edit.stemBox } };
  return out;
}

// ---- files a set needs ----

// Every file the set's questions refer to, as paths relative to the manifest's folder.
export function neededFiles(set) {
  const out = new Set();
  const add = (ref) => { const p = resolveRef(ref); if (p) out.add(p); };
  if (set.pdf) add(set.pdf);
  for (const q of set.questions) {
    if (q.stem.image) add(q.stem.image);
    for (const im of (q.solution && q.solution.images) || []) add(im);
  }
  return [...out].sort();
}

// How an incoming set compares with the copy already imported: 'new', 'update' or 'current'.
// `existing` is the stored record ({ manifest, files: { path: { size, modified } } }); `found`
// maps each needed path to { size, modified } for the files now in the folder.
export function importStatus(existing, set, found) {
  if (!existing) return 'new';
  const sameManifest = JSON.stringify(existing.manifest) === JSON.stringify(set);
  const needed = neededFiles(set).filter((p) => found[p]);   // a file missing from the folder is not stored either
  const sameFiles = needed.length === Object.keys(existing.files).length
    && needed.every((p) => found[p] && existing.files[p] && existing.files[p].size === found[p].size && existing.files[p].modified === found[p].modified);
  return sameManifest && sameFiles ? 'current' : 'update';
}
