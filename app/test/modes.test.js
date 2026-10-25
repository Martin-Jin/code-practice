import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog } from '../server/catalog.js';
import { pickQuestions, practiceSize } from '../shared/modes.js';

const catalog = buildCatalog();
const set = catalog.sets[0];
const category = (n) => set.categories.find((c) => c.questions.includes(n));

// Deterministic generator so failures are reproducible.
const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

test('every question in the manifest exists in the catalog', () => {
  for (const c of set.categories) for (const n of c.questions) assert.ok(catalog.questions[set.id][n], `Q${n}`);
});

test('practice test: right size, 2 Fourier questions, one per topic otherwise', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const picked = pickQuestions(set, 'practice', {}, seeded(seed));
    assert.equal(picked.length, practiceSize(set));
    assert.equal(new Set(picked).size, picked.length);
    const cats = picked.map((n) => category(n).id);
    assert.equal(cats.filter((c) => c === 'fourier').length, 2);
    const others = cats.filter((c) => c !== 'fourier');
    assert.equal(new Set(others).size, others.length, 'one question per other topic');
    for (const c of others) assert.ok(set.practice.pick.from.includes(c));
  }
});

test('random: respects the count and excludes optional groups by default', () => {
  const picked = pickQuestions(set, 'random', { count: 10 }, seeded(3));
  assert.equal(picked.length, 10);
  for (const n of picked) assert.equal(category(n).group, 'core');
  const withExtra = pickQuestions(set, 'random', { count: 500, includeExtra: true, includeRevision: true });
  assert.equal(withExtra.length, set.categories.reduce((a, c) => a + c.questions.length, 0));
});

test('random: asking for more than exist is capped', () => {
  const core = set.categories.filter((c) => c.group === 'core').reduce((a, c) => a + c.questions.length, 0);
  assert.equal(pickQuestions(set, 'random', { count: 9999 }).length, core);
});

test('topic and all modes', () => {
  assert.deepEqual(pickQuestions(set, 'topic', { categories: ['timing'] }), [52, 53]);
  assert.throws(() => pickQuestions(set, 'topic', { categories: [] }), /topic/i);
  const all = pickQuestions(set, 'all', {});
  assert.ok(all.includes(1) && !all.includes(100) && !all.includes(54));
  assert.ok(pickQuestions(set, 'all', { includeRevision: true }).includes(100));
});

test('picked questions are ordered by category then position', () => {
  const picked = pickQuestions(set, 'all', { includeExtra: true, includeRevision: true });
  const order = set.categories.flatMap((c) => c.questions);
  assert.deepEqual(picked, order);
});

test('unknown mode is rejected', () => {
  assert.throws(() => pickQuestions(set, 'nope'), /mode/);
});
