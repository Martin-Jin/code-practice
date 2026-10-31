import test from 'node:test';
import assert from 'node:assert/strict';
import { libraryStats, questionRows, keepRow, sortRows, filterContext } from '../shared/libstats.js';

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

test('an untouched set is all zeros with no rate or time', () => {
  const none = libraryStats(qs, () => null);
  assert.equal(none.total.attempts, 0);
  assert.equal(none.total.untried, 4);
  assert.equal(none.total.rate, null);
  assert.equal(none.total.avgMs, null);
  assert.equal(none.total.timed, 0);
});

test('question rows can be filtered and ranked by trouble', () => {
  const rows = questionRows(qs, (uid) => progress[uid] || null);
  const ids = (filter) => rows.filter((r) => keepRow(filter, r)).map((r) => r.uid);
  assert.deepEqual(ids('all'), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids('attempted'), ['a', 'b']);
  assert.deepEqual(ids('struggling'), ['b']);
  assert.deepEqual(ids('new'), ['c', 'd']);
  assert.deepEqual(ids('difficult'), ['b', 'c']);
  assert.deepEqual(sortRows(rows, 'trouble', 'desc').map((r) => r.uid), ['b', 'c', 'a', 'd']);
  assert.equal(rows[0].rate, 0.75);
  assert.equal(rows[3].rate, null);
});

const point = (ms, result = 'right') => ({ id: String(ms), at: '2026-10-01T00:00:00Z', ms, result, runId: null });
const timed = {
  a: { right: 2, wrong: 0, times: [point(60000), point(120000)] },   // average 90 s
  b: { right: 1, wrong: 0, times: [point(300000)] },                  // 300 s
  c: { right: 1, wrong: 0, times: [point(30000)] },                   // 30 s
  // d: no times
};

test('times: totals and per-question averages', () => {
  const s = libraryStats(qs, (uid) => timed[uid] || null);
  assert.equal(s.total.timed, 4);
  assert.equal(s.total.totalMs, 510000);
  assert.equal(s.total.avgMs, 127500);
  assert.equal(s.sections[0].avgMs, 160000);   // section One: 60 + 120 + 300 s over three attempts
  const rows = questionRows(qs, (uid) => timed[uid] || null);
  assert.deepEqual(rows.map((r) => r.avgMs), [90000, 300000, 30000, null]);
  assert.equal(rows[0].bestMs, 60000);
  assert.equal(rows[0].worstMs, 120000);
});

test('time consuming means slower than the average question; ranking puts questions without a time last either way', () => {
  const rows = questionRows(qs, (uid) => timed[uid] || null);
  const context = filterContext(rows);
  assert.equal(context.avgMs, 140000);   // (90 + 300 + 30) s over three questions
  assert.deepEqual(rows.filter((r) => keepRow('slow', r, context)).map((r) => r.uid), ['b']);
  assert.equal(keepRow('slow', rows[3], context), false);
  assert.equal(keepRow('slow', rows[0], { avgMs: null }), false);
  assert.deepEqual(sortRows(rows, 'time', 'desc').map((r) => r.uid), ['b', 'a', 'c', 'd']);
  assert.deepEqual(sortRows(rows, 'time', 'asc').map((r) => r.uid), ['c', 'a', 'b', 'd']);
  assert.deepEqual(sortRows(rows, 'section', 'asc').map((r) => r.uid), ['a', 'b', 'c', 'd']);
});

test('struggling means wrong at least once and not right the last time, even with more rights than wrongs', () => {
  const row = (right, wrong, lastOverall) => ({ right, wrong, lastOverall });
  assert.equal(keepRow('struggling', row(3, 1, 'wrong')), true);
  assert.equal(keepRow('struggling', row(1, 1, 'wrong')), true);
  assert.equal(keepRow('struggling', row(0, 2, 'right')), false);
  assert.equal(keepRow('struggling', row(2, 0, 'right')), false);
  assert.equal(keepRow('struggling', row(0, 0, null)), false);
});
