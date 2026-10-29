import test from 'node:test';
import assert from 'node:assert/strict';
import { STRENGTH, weightOf, codingTrouble, libraryTrouble, weightedSample } from '../shared/weights.js';
import { pickLibraryQuestions, LIB_MODES } from '../shared/librarymodes.js';
import { buildCatalog } from '../server/catalog.js';
import { pickQuestions } from '../shared/modes.js';

// mulberry32: the simple linear generator used in modes.test.js is too correlated between nearby seeds for statistics.
const seeded = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

test('no history means no trouble and a weight of 1', () => {
  assert.equal(codingTrouble(undefined), 0);
  assert.equal(codingTrouble({ attempts: 0 }), 0);
  assert.equal(libraryTrouble(null), 0);
  assert.equal(weightOf(0), 1);
  assert.equal(weightOf(1), STRENGTH + 1);
});

test('coding trouble grows with failed runs and halves once solved', () => {
  const failing = codingTrouble({ attempts: 4, wrong: 4, compileErrors: 0, lastStatus: 'failed' });
  const solved = codingTrouble({ attempts: 4, wrong: 3, compileErrors: 0, lastStatus: 'passed' });
  const oneSlip = codingTrouble({ attempts: 1, wrong: 1, compileErrors: 0, lastStatus: 'failed' });
  assert.ok(failing > oneSlip, 'repeated failures matter more than one');
  assert.ok(failing > solved, 'a question you went on to solve matters less');
  assert.ok(codingTrouble({ attempts: 2, wrong: 0, compileErrors: 2, lastStatus: 'compile_error' }) < codingTrouble({ attempts: 2, wrong: 2, compileErrors: 0, lastStatus: 'failed' }), 'a compile error counts half');
  for (const s of [{ attempts: 50, wrong: 50, lastStatus: 'failed' }, { attempts: 1, wrong: 1, lastStatus: 'failed' }]) {
    assert.ok(codingTrouble(s) >= 0 && codingTrouble(s) <= 1);
  }
});

test('library trouble combines the difficult flag and the share of wrong checks', () => {
  const flagged = libraryTrouble({ difficult: true, right: 0, wrong: 0 });
  assert.ok(Math.abs(flagged - 0.7) < 1e-9);
  assert.ok(libraryTrouble({ difficult: false, right: 0, wrong: 3 }) > libraryTrouble({ difficult: false, right: 3, wrong: 1 }));
  assert.ok(libraryTrouble({ difficult: true, right: 0, wrong: 3 }) > flagged);
  assert.ok(libraryTrouble({ difficult: true, right: 0, wrong: 100 }) <= 1);
  assert.equal(libraryTrouble({ difficult: false, right: 5, wrong: 0 }), 0);
});

test('weightedSample takes distinct items and favours the heavy ones', () => {
  const items = Array.from({ length: 10 }, (_, i) => i);
  const picks = weightedSample(items, () => 1, 4, seeded(1));
  assert.equal(new Set(picks).size, 4);
  const heavy = (i) => (i === 0 ? 20 : 1);
  let withZero = 0;
  for (let seed = 1; seed <= 400; seed++) if (weightedSample(items, heavy, 2, seeded(seed)).includes(0)) withZero++;
  assert.ok(withZero > 300, `the heavy item was in ${withZero} of 400 draws of 2 from 10`);
  let uniform = 0;
  for (let seed = 1; seed <= 400; seed++) if (weightedSample(items, () => 1, 2, seeded(seed)).includes(0)) uniform++;
  assert.ok(uniform < 140, `with equal weights it was in ${uniform} of 400`);
  assert.equal(weightedSample(items, () => 1, 20).length, 10, 'asking for more returns them all');
});

test('C++ random mode leans towards the weighted questions but can still pick others', () => {
  const set = buildCatalog().sets.find((s) => s.id === 'sample');
  const pool = set.categories.filter((c) => c.group === 'core').flatMap((c) => c.questions);
  const weight = (n) => (n === pool[0] ? weightOf(1) : 1);
  let hits = 0;
  let others = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const picked = pickQuestions(set, 'random', { count: 2, weight }, seeded(seed));
    assert.equal(picked.length, 2);
    if (picked.includes(pool[0])) hits++;
    others += picked.filter((n) => n !== pool[0]).length;
  }
  const baseline = (300 * 2) / pool.length;
  assert.ok(hits > baseline * 2, `weighted question picked ${hits} times, a uniform draw gives about ${Math.round(baseline)}`);
  assert.ok(others > 200, 'other questions still come up');
});

test('without a weight the C++ modes pick exactly as before', () => {
  const set = buildCatalog().sets.find((s) => s.id === 'sample');
  assert.deepEqual(pickQuestions(set, 'random', { count: 5 }, seeded(9)), pickQuestions(set, 'random', { count: 5, weight: undefined }, seeded(9)));
});

const qs = ['a', 'b', 'c', 'd', 'e'].map((uid, i) => ({ uid, section: i < 3 ? 'S1' : 'S2' }));
const progress = { a: { difficult: true, views: 2 }, b: { lastOverall: 'wrong', views: 1, attempts: 1 }, c: { lastOverall: 'right', views: 1, attempts: 1 }, d: { views: 0, attempts: 0 } };
const of = (uid) => progress[uid] || null;

test('library modes pick the right questions', () => {
  assert.deepEqual(pickLibraryQuestions(qs, of, 'all'), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(pickLibraryQuestions(qs, of, 'all', { sections: ['S2'] }), ['d', 'e']);
  assert.deepEqual(pickLibraryQuestions(qs, of, 'sections', { sections: ['S1'] }), ['a', 'b', 'c']);
  assert.throws(() => pickLibraryQuestions(qs, of, 'sections', { sections: [] }), /section/);
  assert.deepEqual(pickLibraryQuestions(qs, of, 'difficult'), ['a']);
  assert.deepEqual(pickLibraryQuestions(qs, of, 'unseen'), ['d', 'e']);
  assert.deepEqual(pickLibraryQuestions(qs, of, 'wrong'), ['b']);
  assert.throws(() => pickLibraryQuestions(qs, () => null, 'difficult'), /No questions match/);
  assert.throws(() => pickLibraryQuestions(qs, of, 'nope'), /Unknown mode/);
  assert.deepEqual(pickLibraryQuestions(qs, of, 'custom', { uids: ['e', 'a', 'zzz'] }), ['a', 'e']);
  assert.throws(() => pickLibraryQuestions(qs, of, 'custom', { uids: [] }), /No questions match/);
  assert.equal(LIB_MODES.length, 7);
});

test('library random: count, sections and weights', () => {
  const picked = pickLibraryQuestions(qs, of, 'random', { count: 3 }, seeded(2));
  assert.equal(new Set(picked).size, 3);
  assert.ok(pickLibraryQuestions(qs, of, 'random', { count: 50 }).length === 5, 'capped at what exists');
  assert.ok(pickLibraryQuestions(qs, of, 'random', { count: 2, sections: ['S2'] }, seeded(4)).every((u) => ['d', 'e'].includes(u)));
  assert.throws(() => pickLibraryQuestions(qs, of, 'random', { count: 0 }), /how many/);
  let withA = 0;
  for (let seed = 1; seed <= 300; seed++) if (pickLibraryQuestions(qs, of, 'random', { count: 1 }, seeded(seed), (q) => (q.uid === 'a' ? 30 : 1)).includes('a')) withA++;
  assert.ok(withA > 200, `the weighted question came up ${withA} of 300 times`);
});
