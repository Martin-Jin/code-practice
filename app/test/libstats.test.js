import test from 'node:test';
import assert from 'node:assert/strict';
import { libraryStats, questionRows, keepRow, rankRows } from '../shared/libstats.js';

const qs = [
  { uid: 'a', title: 'Alpha', section: 'One' },
  { uid: 'b', title: 'Bravo', section: 'One' },
  { uid: 'c', title: 'Charlie', section: 'Two' },
  { uid: 'd', title: 'Delta', section: 'Two' },
];
const progress = {
  a: { right: 3, wrong: 1, lastOverall: 'right', lastAt: '2026-10-01T00:00:00Z' },
  b: { right: 0, wrong: 2, difficult: true, lastOverall: 'wrong', lastAt: '2026-10-03T00:00:00Z' },
  c: { right: 0, wrong: 0, difficult: true },                 // flagged but never checked
  // d: no record at all
};
const stats = libraryStats(qs, (uid) => progress[uid] || null);

test('totals count checks, solved and never-right questions', () => {
  const t = stats.total;
  assert.equal(t.questions, 4);
  assert.equal(t.tried, 2);
  assert.equal(t.solved, 1);
  assert.equal(t.notYetRight, 1);
  assert.equal(t.untried, 2);
  assert.equal(t.difficult, 2);
  assert.equal(t.attempts, 6);
  assert.equal(t.right, 3);
  assert.equal(t.wrong, 3);
  assert.equal(t.rate, 0.5);
  assert.equal(t.lastAt, '2026-10-03T00:00:00Z');
});

test('sections keep their order and have their own totals', () => {
  assert.deepEqual(stats.sections.map((s) => [s.name, s.questions, s.tried, s.right, s.wrong]), [['One', 2, 2, 3, 3], ['Two', 2, 0, 0, 0]]);
  assert.equal(stats.sections[1].rate, null);
});

test('questions worth revisiting: flagged or ever wrong, worst first, none for clean ones', () => {
  assert.deepEqual(stats.worth.map((r) => r.uid), ['b', 'c', 'a']);
  const limited = libraryStats(qs, (uid) => progress[uid] || null, 1);
  assert.deepEqual(limited.worth.map((r) => r.uid), ['b']);
  const clean = libraryStats(qs, () => ({ right: 2, wrong: 0 }));
  assert.deepEqual(clean.worth, []);
});

test('an untouched set is all zeros with no rate', () => {
  const none = libraryStats(qs, () => null);
  assert.equal(none.total.attempts, 0);
  assert.equal(none.total.untried, 4);
  assert.equal(none.total.rate, null);
  assert.deepEqual(none.worth, []);
});

test('question rows can be filtered and ranked by trouble', () => {
  const rows = questionRows(qs, (uid) => progress[uid] || null);
  const ids = (filter) => rows.filter((r) => keepRow(filter, r)).map((r) => r.uid);
  assert.deepEqual(ids('all'), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids('attempted'), ['a', 'b']);
  assert.deepEqual(ids('struggling'), ['b']);
  assert.deepEqual(ids('new'), ['c', 'd']);
  assert.deepEqual(ids('difficult'), ['b', 'c']);
  assert.deepEqual(rankRows(rows).map((r) => r.uid), ['b', 'c', 'a', 'd']);
  assert.equal(rows[0].rate, 0.75);
  assert.equal(rows[3].rate, null);
});

test('struggling means wrong at least once and not right the last time, even with more rights than wrongs', () => {
  const row = (right, wrong, lastOverall) => ({ right, wrong, lastOverall });
  assert.equal(keepRow('struggling', row(3, 1, 'wrong')), true);
  assert.equal(keepRow('struggling', row(1, 1, 'wrong')), true);
  assert.equal(keepRow('struggling', row(0, 2, 'right')), false);
  assert.equal(keepRow('struggling', row(2, 0, 'right')), false);
  assert.equal(keepRow('struggling', row(0, 0, null)), false);
});
