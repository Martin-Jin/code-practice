import test from 'node:test';
import assert from 'node:assert/strict';
import { groupLines, classifyPage, findDashedRule, buildIndex, uidFor, mergeIndex } from '../shared/pdfindex.js';
import { validateQuestionSet } from '../shared/questionset.js';

const W = 595.28;
const H = 841.89;
const it = (str, x, y, w, h) => ({ str, x, y, w, h });

// Items for a question page, laid out like the practice PDFs in docs/practice-pdf-prompt.md.
const questionPage = (n, section, title, source, extra = []) => [
  it(section, 36, 26, 110, 8.5), it(`Question ${n}`, 513.4, 26, 45.8, 8.5),
  it(`Q${n}. ${title}`, 36, 55.4, 300, 12.5),
  it('Body text of the question', 49.5, 90, 150, 12.4),
  it(`Source: ${source}`, 36, 821.9, 120, 7.5), it(String(n), 550, 825.9, 9, 8),
  ...extra,
];
const solutionPage = (n, section, title, i = 1, of = 1, source = 'Book p.1') => [
  it(`${section} | Q${n}: ${title}`, 36, 26, 250, 8.5), it(`Worked solution (${i}/${of})`, 470, 26, 89, 8.5),
  it(`Source: ${source}`, 36, 821.9, 120, 7.5),
];
const extraPage = (n, section) => [it(section, 36, 26, 110, 8.5), it(`Question ${n} (extra working space)`, 440, 26, 119, 8.5), it(`Q${n}. Extra working space`, 36, 55.4, 120, 12.5)];
const cover = (lines, total) => [it('MECHENG222 - Practice Questions', 36, 60, 300, 20), it(`${total} questions. Each question: a page to attempt it.`, 36, 90, 400, 10),
  ...lines.map((text, i) => it(text, 36, 130 + i * 14, 400, 10))];
const page = (number, items, dashY = null) => ({ number, width: W, height: H, items, dashY });

// Fake pdf.js operator list: a dashed horizontal rule and some other strokes.
const OPS = { setDash: 4, constructPath: 91, stroke: 20 };
const ruleOps = (...segments) => {
  const fnArray = [];
  const argsArray = [];
  for (const s of segments) {
    if (s.dash !== undefined) { fnArray.push(OPS.setDash); argsArray.push([s.dash, 0]); } else {
      fnArray.push(OPS.constructPath); argsArray.push([20, [Float32Array.from([0, s.x1, s.y, 1, s.x2, s.y2 === undefined ? s.y : s.y2])], null]);
    }
  }
  return { fnArray, argsArray };
};

test('groupLines joins items on one baseline left to right and splits lines', () => {
  const lines = groupLines([it('world', 64, 100, 30, 10), it('Hello', 36, 100.5, 24, 10), it('next', 36, 120, 20, 10), it('  ', 5, 100, 1, 10)]);
  assert.deepEqual(lines.map((l) => l.text), ['Hello world', 'next']);
  assert.equal(lines[0].x, 36);
  assert.equal(groupLines([it('a', 10, 5, 4, 8), it('b', 14, 5, 4, 8)])[0].text, 'ab', 'touching pieces join without a space');
});

test('a question page is recognised from the generator header, title and footer', () => {
  const info = classifyPage(questionPage(32, 'Ch 3 · 2D Mechanism Motion', 'Pinned mechanisms - v_A', 'Coursebook p.55'), W, H);
  assert.equal(info.kind, 'question');
  assert.equal(info.number, 32);
  assert.equal(info.section, 'Ch 3 · 2D Mechanism Motion');
  assert.equal(info.title, 'Pinned mechanisms - v_A');
  assert.equal(info.titleY, 55.4);
  assert.deepEqual(info.footer, { source: 'Coursebook p.55', y: 821.9 });
});

test('text from the copied slide content near the page edge is not read as a header', () => {
  const noise = [it('MECHENG 211: FLUID MECHANICS', 40, 26, 160, 14), it('Lihua Tang', 36, 26, 50, 10), it('stray', 564, 25, 10, 11.3), it('Source: other', 80, 822, 60, 12)];
  const info = classifyPage(questionPage(5, 'Fluid Statics', 'Hydrostatic force', 'FM p.1', noise), W, H);
  assert.equal(info.section, 'Fluid Statics');
  assert.equal(info.footer.source, 'FM p.1');
});

test('solution pages are found even when a long title runs under "Worked solution"', () => {
  const info = classifyPage(solutionPage(69, 'Ch 6 · Linear Impulse', 'A very long title that runs on and on and on and on and on'), W, H);
  assert.deepEqual([info.kind, info.number, info.section], ['solution', 69, 'Ch 6 · Linear Impulse']);
  const split = [it('Ch 6 | Q70: Title', 36, 26, 500, 8.5), it('Wo', 470, 26, 10, 8.5), it('rked solution (1/2)', 482, 26, 77, 8.5)];
  assert.equal(classifyPage(split, W, H).number, 70);
});

test('extra working pages and pages that are neither are recognised', () => {
  assert.deepEqual(classifyPage(extraPage(76, 'Ch 6'), W, H), { kind: 'extra', number: 76 });
  assert.equal(classifyPage([it('MECHENG222', 36, 60, 100, 20)], W, H), null);
});

test('findDashedRule picks the long dashed horizontal line near the margins', () => {
  const ops = ruleOps({ x1: 36, y: 809.9, x2: 559.3 }, { dash: [3, 3] }, { x1: 36, y: 445.9, x2: 559.3 });
  assert.equal(Math.round(findDashedRule(ops, OPS, W, H)), 396);
  assert.equal(findDashedRule(ruleOps({ x1: 36, y: 809.9, x2: 559.3 }), OPS, W, H), null, 'a solid line is not the rule');
  assert.equal(findDashedRule(ruleOps({ dash: [3, 3] }, { x1: 36, y: 300, x2: 200 }), OPS, W, H), null, 'a short dashed line is not the rule');
  assert.equal(findDashedRule(ruleOps({ dash: [3, 3] }, { x1: 36, y: 300, x2: 559.3, y2: 330 }), OPS, W, H), null, 'a slanted line is not the rule');
  assert.equal(findDashedRule(ruleOps({ dash: [] }, { x1: 36, y: 445.9, x2: 559.3 }), OPS, W, H), null, 'an empty dash pattern is solid');
});

test('uidFor is stable, lower-case insensitive and short', async () => {
  const a = await uidFor('MECHENG222', 'Quiz 1, Q3', 'Mass of an assembly');
  assert.match(a, /^q-[0-9a-f]{8}$/);
  assert.equal(a, await uidFor('mecheng222', 'quiz 1, q3', 'MASS of an assembly'));
  assert.notEqual(a, await uidFor('MECHENG222', 'Quiz 1, Q3', 'Mass of an assembly', '|2'));
});

const samplePages = () => [
  page(1, cover(['Ch 1', 'Q1. Vector components - resolve a velocity into i, j, k components 3', 'Q2. Polar coordinates - a long title that is cut short 5'], 2)),
  page(2, []),
  page(3, questionPage(1, 'Ch 1 · Kinematics', 'Vector components - resolve a velocity into i, j, k', 'Tutorial 1, Q1'), 300),
  page(4, solutionPage(1, 'Ch 1 · Kinematics', 'Vector components', 1, 2, 'Tutorial 1, Q1')),
  page(5, solutionPage(1, 'Ch 1 · Kinematics', 'Vector components', 2, 2, 'Tutorial 1, Q1')),
  page(6, questionPage(2, 'Ch 1 · Kinematics', 'Polar coordinates - a long title that is', 'Tutorial 1, Q2'), null),
  page(7, extraPage(2, 'Ch 1 · Kinematics')),
];

test('buildIndex turns pages into a valid manifest', async () => {
  const { manifest, report } = await buildIndex(samplePages(), 'MECHENG222 - Practice Questions.pdf');
  assert.equal(manifest.id, 'mecheng222-practice-questions');
  assert.equal(manifest.course, 'MECHENG222');
  assert.equal(manifest.pdf, 'MECHENG222 - Practice Questions.pdf');
  assert.equal(manifest.questions.length, 2);
  const [q1, q2] = manifest.questions;
  assert.equal(q1.title, 'Vector components - resolve a velocity into i, j, k components', 'the cover has the full title');
  assert.equal(q1.section, 'Ch 1 · Kinematics');
  assert.equal(q1.source, 'Tutorial 1, Q1');
  assert.deepEqual(q1.stem.pdf, { page: 3, box: [30, 63.4, 565.3, 298] });
  assert.deepEqual(q1.solution.pdf.map((s) => s.page), [4, 5]);
  assert.deepEqual(q1.solution.pdf[0].box, [30, 36, 565.3, 809.9]);
  assert.deepEqual(q1.parts, [{ label: '', type: 'self' }]);
  assert.equal(q2.title, 'Polar coordinates - a long title that is cut short', 'cover title is longer and starts the same');
  assert.deepEqual(q2.flags.sort(), ['needs-crop', 'no-solution']);
  assert.equal(q2.solution, null);
  assert.equal(report.extraPages, 1);
  assert.equal(report.expected, 2);
  assert.ok(report.warnings.some((w) => /Question 2 .*no dashed rule/.test(w)));
  const check = validateQuestionSet(manifest);
  assert.deepEqual([check.errors, check.skipped], [[], []]);
  assert.notEqual(q1.uid, q2.uid);
});

test('buildIndex lists pages it cannot place and a cover count that disagrees', async () => {
  const pages = samplePages();
  pages.push(page(8, solutionPage(9, 'Ch 1', 'Nowhere')));
  pages[0] = page(1, cover(['Q1. A 3', 'Q2. B 5'], 3));
  const { report } = await buildIndex(pages, 'x.pdf');
  assert.deepEqual(report.unplaced, [8]);
  assert.ok(report.warnings.some((w) => /cover lists 3 questions but 2 were found/.test(w)));
  assert.ok(report.warnings.some((w) => /1 page could not be placed: 8/.test(w)));
});

test('questions with the same course, source and title still get different uids', async () => {
  const pages = [page(1, cover([], 2)), page(2, questionPage(1, 'S', 'Same', 'Src'), 300), page(3, questionPage(2, 'S', 'Same', 'Src'), 300)];
  const { manifest } = await buildIndex(pages, 'x.pdf');
  assert.equal(new Set(manifest.questions.map((q) => q.uid)).size, 2);
});

test('mergeIndex keeps answers, drops vanished PDF questions and keeps screenshot questions', async () => {
  const { manifest: first } = await buildIndex(samplePages(), 'MECHENG222 - Practice Questions.pdf');
  const saved = JSON.parse(JSON.stringify(first));
  saved.title = 'My own title';
  saved.questions[0].parts = [{ label: 'a', type: 'numeric', unit: 'm/s', answer: 4.5 }];
  saved.questions[0].marks = 3;
  saved.questions[0].tags = ['vectors'];
  saved.questions[0].flags = ['no-solution', 'check-text'];
  saved.questions.push({ uid: 'q-shot0001', title: 'From a screenshot', section: 'Extra', source: '', marks: null, tags: [], flags: [], stem: { image: 'images/a.png' }, parts: [{ label: '', type: 'self' }], solution: null });
  saved.questions.push({ ...saved.questions[1], uid: 'q-gone0001', title: 'Removed from the PDF' });

  const { manifest: again } = await buildIndex(samplePages(), 'MECHENG222 - Practice Questions.pdf');
  const { manifest, dropped } = mergeIndex(saved, again);
  assert.equal(manifest.title, 'My own title');
  assert.equal(dropped, 1);
  assert.deepEqual(manifest.questions.map((q) => q.uid), [first.questions[0].uid, first.questions[1].uid, 'q-shot0001']);
  const q1 = manifest.questions[0];
  assert.deepEqual(q1.parts, saved.questions[0].parts);
  assert.equal(q1.marks, 3);
  assert.deepEqual(q1.tags, ['vectors']);
  assert.deepEqual(q1.flags, ['check-text'], 'structural flags come from the PDF again, the user\'s own stay');
  assert.equal(q1.solution.pdf.length, 2);
});

const mq = (uid, title, source) => ({ uid, title, source, section: 'S', marks: null, tags: [], flags: [], parts: [{ label: '', type: 'self' }], stem: { pdf: { page: 2, box: [30, 60, 560, 300] } }, solution: null });

test('mergeIndex keeps progress when a title is reworded but the source stays, and reports what changed', () => {
  const saved = { id: 'set', title: 'Set', course: 'C', questions: [
    { ...mq('q-1', 'Old wording', 'Tutorial 1, Q1'), tags: ['kept'] }, mq('q-2', 'Same', 'Tutorial 1, Q2'), mq('q-3', 'Gone', 'Tutorial 2, Q1'),
  ] };
  const fresh = { id: 'new', title: 'New', course: 'C', questions: [mq('q-9', 'New wording', 'Tutorial 1, Q1'), mq('q-2', 'Same', 'Tutorial 1, Q2'), mq('q-8', 'Brand new', 'Tutorial 3, Q1')] };
  const { manifest, dropped, report } = mergeIndex(saved, fresh);
  assert.deepEqual(manifest.questions.map((x) => x.uid), ['q-1', 'q-2', 'q-8']);
  assert.deepEqual(manifest.questions[0].tags, ['kept']);
  assert.equal(manifest.questions[0].title, 'New wording');
  assert.equal(dropped, 1);
  assert.deepEqual(report, { kept: 2, added: 1, renamed: 1, droppedTitles: ['Gone'] });
});

test('mergeIndex does not guess between two questions that share a source', () => {
  const saved = { id: 's', title: 'S', course: '', questions: [mq('q-1', 'A', 'Same'), mq('q-2', 'B', 'Same')] };
  const fresh = { id: 's', title: 'S', course: '', questions: [mq('q-7', 'A2', 'Same'), mq('q-8', 'B2', 'Same')] };
  const { manifest, report } = mergeIndex(saved, fresh);
  assert.deepEqual(manifest.questions.map((x) => x.uid), ['q-7', 'q-8']);
  assert.equal(report.kept, 0);
  assert.equal(report.droppedTitles.length, 2);
});
