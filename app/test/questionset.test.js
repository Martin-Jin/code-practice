import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveRef, dirOf, joinPath, fileKind, isManifestPath, questionProblems, validateQuestionSet, parseQuestionSet, neededFiles, importStatus, applyEdit,
} from '../shared/questionset.js';

const question = (uid, extra = {}) => ({
  uid, title: `Title ${uid}`, section: 'Rigid body kinetics', source: 'Quiz 1, Q3', marks: 3, tags: ['moi'],
  stem: { text: 'The assembly is pivoted at $O$.', image: 'images/a.png' },
  parts: [{ label: 'a', type: 'numeric', prompt: 'Find the mass.', unit: 'kg', answer: 0.297, dp: 3 }],
  solution: null, flags: [], ...extra,
});
const manifest = (extra = {}) => ({ format: 'practice-question-set', version: 1, id: 'me222-quiz', title: 'ME222 quiz', course: 'COURSE101', pdf: null, questions: [question('q-00000001')], ...extra });

test('resolveRef accepts plain relative paths and rejects anything that escapes the folder', () => {
  assert.equal(resolveRef('images/q1.png'), 'images/q1.png');
  assert.equal(resolveRef('.\\images\\q1.png'), 'images/q1.png');
  assert.equal(resolveRef('a//b/./c.png'), 'a/b/c.png');
  for (const bad of ['../x.png', 'images/../../x.png', '/etc/x', '\\x', 'C:/x.png', 'C:\\x.png', '', '   ', null, 5]) assert.equal(resolveRef(bad), null, String(bad));
});

test('path helpers', () => {
  assert.equal(dirOf('a/b/c.json'), 'a/b');
  assert.equal(dirOf('c.json'), '');
  assert.equal(joinPath('', 'x.png'), 'x.png');
  assert.equal(joinPath('a/b', 'x.png'), 'a/b/x.png');
  assert.ok(isManifestPath('Quiz.Questions.JSON'));
  assert.ok(!isManifestPath('questions.json'));
  assert.equal(fileKind('a/b.QUESTIONS.json'), 'manifest');
  assert.equal(fileKind('x.PDF'), 'pdf');
  assert.equal(fileKind('x.webp'), 'image');
  assert.equal(fileKind('notes.docx'), null);
});

test('a well-formed set validates and gets defaults filled in', () => {
  const m = manifest({ questions: [question('q-1', { source: undefined, marks: undefined, tags: undefined, flags: undefined, solution: undefined }), question('q-2', { parts: [{ label: '', type: 'mcq', options: ['a', 'b', 'c'], correct: [2] }] })] });
  const { set, errors, skipped } = validateQuestionSet(m);
  assert.deepEqual(errors, []);
  assert.deepEqual(skipped, []);
  assert.equal(set.questions.length, 2);
  assert.deepEqual([set.questions[0].source, set.questions[0].marks, set.questions[0].tags, set.questions[0].flags, set.questions[0].solution], ['', null, [], [], null]);
  assert.equal(set.questions[1].parts[0].multi, false);
});

test('a set with a bad header is refused with reasons', () => {
  assert.match(validateQuestionSet([]).errors[0], /not a practice question set/);
  assert.match(validateQuestionSet(manifest({ format: 'x' })).errors[0], /not a practice question set/);
  assert.match(validateQuestionSet(manifest({ version: 2 })).errors[0], /newer version/);
  assert.match(validateQuestionSet(manifest({ version: 'one' })).errors[0], /version/);
  assert.match(validateQuestionSet(manifest({ id: 'has space' })).errors[0], /id must be/);
  assert.match(validateQuestionSet(manifest({ id: '../x' })).errors[0], /id must be/);
  assert.match(validateQuestionSet(manifest({ title: ' ' })).errors[0], /title/);
  assert.match(validateQuestionSet(manifest({ questions: 'no' })).errors[0], /questions list/);
  assert.match(validateQuestionSet(manifest({ pdf: '../x.pdf' })).errors[0], /pdf must be/);
  assert.match(parseQuestionSet('{oops').errors[0], /not valid JSON/);
  assert.equal(validateQuestionSet(manifest({ id: 'bad id' })).set, null);
});

test('bad questions are skipped and reported, the rest still load', () => {
  const m = manifest({ questions: [
    question('q-1'),
    question('q-2', { title: '' }),
    question('q-1', { title: 'Duplicate uid' }),
    question('q-4', { parts: 'none' }),
    question('q-5', { stem: {} }),
    question('q-6', { stem: { pdf: { page: 1, box: [0, 0, 10, 10] } } }),
    question('q-7'),
  ] });
  const { set, skipped } = validateQuestionSet(m);
  assert.deepEqual(set.questions.map((q) => q.uid), ['q-1', 'q-7']);
  assert.deepEqual(skipped.map((s) => s.number), [2, 3, 4, 5, 6]);
  assert.match(skipped[1].problems[0], /already used/);
  assert.match(skipped[4].problems[0], /names no pdf/);
});

test('a question with no parts is allowed: it is only read', () => {
  const { set, skipped } = validateQuestionSet(manifest({ questions: [question('q-1', { parts: [] })] }));
  assert.equal(skipped.length, 0);
  assert.deepEqual(set.questions[0].parts, []);
});

test('part checks: numeric, mcq and self', () => {
  const p = (part) => questionProblems(question('q', { parts: [part] }));
  assert.deepEqual(p({ label: 'a', type: 'numeric', unit: 'kg', answer: null }), []);
  assert.deepEqual(p({ label: 'a', type: 'numeric', unit: '', answer: 1, relTol: 0.05, dp: 2 }), []);
  assert.match(p({ label: 'a', type: 'numeric', answer: 1 })[0], /unit/);
  assert.match(p({ label: 'a', type: 'numeric', unit: 'kg', answer: '1' })[0], /answer must be a number/);
  assert.match(p({ label: 'a', type: 'numeric', unit: 'kg', answer: 1, dp: -1 })[0], /dp/);
  assert.deepEqual(p({ label: 'a', type: 'mcq', multi: true, options: ['x', 'y', 'z'], correct: [0, 2] }), []);
  assert.deepEqual(p({ label: 'a', type: 'mcq', options: ['x', 'y'], correct: [] }), []);
  assert.match(p({ label: 'a', type: 'mcq', options: ['x'], correct: [0] })[0], /two text options/);
  assert.match(p({ label: 'a', type: 'mcq', options: ['x', 'y'], correct: [2] })[0], /correct/);
  assert.match(p({ label: 'a', type: 'mcq', options: ['x', 'y'], correct: [0, 1] })[0], /multi is not true/);
  assert.deepEqual(p({ label: 'a', type: 'self', prompt: 'Why?' }), []);
  assert.match(p({ label: 'a', type: 'essay' })[0], /type must be/);
  assert.match(questionProblems(question('q', { parts: [{ label: 'a', type: 'self' }, { label: 'a', type: 'self' }] }))[0], /share a label/);
});

test('image, solution and pdf references are checked', () => {
  assert.match(questionProblems(question('q', { stem: { image: '../x.png' } }))[0], /stem image/);
  assert.match(questionProblems(question('q', { solution: { images: ['ok.png', '/abs.png'] } }))[0], /solution image 2/);
  assert.deepEqual(questionProblems(question('q', { stem: { pdf: { page: 3, box: [10, 20, 500, 400] } }, solution: { pdf: [{ page: 4, box: [0, 0, 5, 5] }] } })), []);
  assert.match(questionProblems(question('q', { stem: { pdf: { page: 0, box: [10, 20, 500, 400] } } }))[0], /stem pdf/);
  assert.match(questionProblems(question('q', { stem: { pdf: { page: 1, box: [10, 20, 5, 400] } } }))[0], /stem pdf/);
});

test('neededFiles lists the pdf and every image once, sorted', () => {
  const set = validateQuestionSet(manifest({
    pdf: 'Book.pdf',
    questions: [
      question('q-1', { stem: { image: './images/b.png' } }),
      question('q-2', { stem: { image: 'images/a.png' }, solution: { images: ['images/b.png', 'images/c.png'] } }),
      question('q-3', { stem: { text: 'No files' } }),
    ],
  })).set;
  assert.deepEqual(neededFiles(set), ['Book.pdf', 'images/a.png', 'images/b.png', 'images/c.png']);
});

test('importStatus tells new, update and current apart', () => {
  const set = validateQuestionSet(manifest()).set;
  const found = { 'images/a.png': { size: 10, modified: 5 } };
  assert.equal(importStatus(undefined, set, found), 'new');
  const existing = { manifest: set, files: { 'images/a.png': { size: 10, modified: 5 } } };
  assert.equal(importStatus(existing, set, found), 'current');
  assert.equal(importStatus(existing, set, { 'images/a.png': { size: 11, modified: 5 } }), 'update');
  assert.equal(importStatus(existing, set, { 'images/a.png': { size: 10, modified: 6 } }), 'update');
  assert.equal(importStatus(existing, { ...set, title: 'Renamed' }, found), 'update');
  assert.equal(importStatus({ manifest: set, files: {} }, set, found), 'update');
  assert.equal(importStatus({ manifest: set, files: {} }, set, {}), 'current', 'a file missing from the folder does not keep a set "updating"');
});

test('applyEdit lays notes, hiding and replaced content over a question without touching the original', () => {
  const q = { uid: 'a', title: 'Old', stem: { text: 'Old text', pdf: { page: 2, box: [0, 0, 1, 1] } }, solution: { pdf: [{ page: 3, box: [0, 0, 1, 1] }] }, notes: '' };
  const out = applyEdit(q, { notes: 'mind the units', title: 'New', stemImage: 'data:image/png;base64,AA', solutionText: 'Because.' });
  assert.equal(out.notes, 'mind the units');
  assert.equal(out.title, 'New');
  assert.deepEqual(out.stem, { text: 'Old text', imageData: 'data:image/png;base64,AA' });
  assert.deepEqual(out.solution, { text: 'Because.', images: undefined, pdf: [{ page: 3, box: [0, 0, 1, 1] }] });
  assert.equal(applyEdit(q, { hidden: true }).hidden, true);
  assert.equal(q.title, 'Old');
  assert.equal(applyEdit(q, { notes: '' }).notes, '');
});
