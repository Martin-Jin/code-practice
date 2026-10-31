import test from 'node:test';
import assert from 'node:assert/strict';
import { newClock, isFinal, isDone, recordPoint, dropPoint, formatDuration, summariseTimes, runTotalMs, MAX_POINTS } from '../shared/timing.js';

test('marking an attempt writes one data point, and marking again only changes its result', () => {
  const rec = {};
  const clock = { ...newClock('c1'), ms: 30000.4 };
  assert.equal(isDone(rec, clock), false);
  recordPoint(rec, clock, 'right', 'T1', 'run1');
  assert.deepEqual(rec.times, [{ id: 'c1', at: 'T1', ms: 30000, result: 'right', runId: 'run1' }]);
  assert.equal(isDone(rec, clock), true);
  recordPoint(rec, clock, 'wrong', 'T2', 'run1');
  assert.equal(rec.times.length, 1);
  assert.equal(rec.times[0].result, 'wrong');
  assert.equal(rec.times[0].ms, 30000);
  assert.equal(rec.times[0].at, 'T1');
});

test('taking the mark back removes the point and the clock counts again', () => {
  const rec = {};
  const clock = { ...newClock('c1'), ms: 5000 };
  recordPoint(rec, clock, 'right', 'T1');
  dropPoint(rec, clock);
  assert.deepEqual(rec.times, []);
  assert.equal(isDone(rec, clock), false);
});

test('a new attempt (a fresh clock) adds a second data point and keeps the first', () => {
  const rec = {};
  recordPoint(rec, { ...newClock('c1'), ms: 1000 }, 'wrong', 'T1');
  recordPoint(rec, { ...newClock('c2'), ms: 2000 }, 'right', 'T2');
  assert.deepEqual(rec.times.map((t) => [t.ms, t.result]), [[1000, 'wrong'], [2000, 'right']]);
});

test('resetting the stats forgets the points, so an old clock is not done any more', () => {
  const rec = {};
  const clock = { ...newClock('c1'), ms: 1000 };
  recordPoint(rec, clock, 'right', 'T1');
  rec.times = [];
  assert.equal(isDone(rec, clock), false);
  recordPoint(rec, clock, 'right', 'T2');
  assert.equal(rec.times.length, 1);
});

test('the history is capped, dropping the oldest', () => {
  const rec = {};
  for (let i = 0; i < MAX_POINTS + 5; i++) recordPoint(rec, { ...newClock(`c${i}`), ms: i }, 'right', 'T');
  assert.equal(rec.times.length, MAX_POINTS);
  assert.equal(rec.times[0].ms, 5);
});

test('durations show as m:ss, or h:mm:ss from an hour', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(59999), '0:59');
  assert.equal(formatDuration(247000), '4:07');
  assert.equal(formatDuration(3729000), '1:02:09');
  assert.equal(formatDuration(null), '–');
});

test('summaries: count, total, average, best and worst', () => {
  assert.deepEqual(summariseTimes([]), { count: 0, totalMs: 0, avgMs: null, bestMs: null, worstMs: null });
  assert.deepEqual(summariseTimes([{ ms: 10 }, { ms: 30 }, { ms: 20 }]), { count: 3, totalMs: 60, avgMs: 20, bestMs: 10, worstMs: 30 });
});

test("a session's total is the sum of its clocks, so a reset clock comes off it", () => {
  const clocks = { a: { ms: 1000 }, b: { ms: 2500 } };
  assert.equal(runTotalMs(clocks), 3500);
  clocks.b = newClock('new');
  assert.equal(runTotalMs(clocks), 1000);
  assert.equal(runTotalMs(undefined), 0);
});

test('coding: a failed run updates the point and the clock keeps going; a pass makes it final', () => {
  const stats = {};
  const clock = { ...newClock('c1'), ms: 10000 };
  recordPoint(stats, clock, 'wrong', 'T1', 'r', 'right');
  assert.equal(clock.final, undefined);
  clock.ms = 25000;
  recordPoint(stats, clock, 'wrong', 'T2', 'r', 'right');
  assert.deepEqual(stats.times.map((t) => [t.ms, t.result]), [[25000, 'wrong']]);
  clock.ms = 40000;
  recordPoint(stats, clock, 'right', 'T3', 'r', 'right');
  assert.equal(isFinal(clock), true);
  assert.deepEqual(stats.times.map((t) => [t.ms, t.result]), [[40000, 'right']]);
  clock.ms = 90000;   // time no longer counts, but if it somehow did, a later failing run must not move the final time
  recordPoint(stats, clock, 'wrong', 'T4', 'r', 'right');
  assert.deepEqual(stats.times.map((t) => [t.ms, t.result]), [[40000, 'wrong']]);
});
