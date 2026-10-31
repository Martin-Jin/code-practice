import { test } from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../src/lib/store.js';
import { check, setSelfMark, openClock, addTime, resetClock, getClock, clockDone, runTotal } from '../src/lib/practice.js';
import { undoLast } from '../src/lib/undo.js';
import { connect } from '../src/lib/toast.js';

connect(() => {});
const question = { uid: 'q', parts: [{ label: 'a', type: 'self' }] };
const run = { id: 'r1', clocks: {} };

test('time counts until the question is marked, then the mark writes one point and freezes the clock', () => {
  state.libRuns.r1 = run;
  openClock('s', 'q', 'r1', 'q');
  assert.equal(addTime('s', 'q', 'r1', 'q', 4000), true);
  assert.equal(setSelfMark('s', 'q', question, 'a', 'right', 'r1', 'q'), 'right');
  assert.equal(clockDone('s', 'q', 'r1', 'q'), true);
  assert.equal(addTime('s', 'q', 'r1', 'q', 1000), false);
  const times = state.libProgress['s/q'].times;
  assert.deepEqual(times.map((t) => [t.ms, t.result, t.runId]), [[4000, 'right', 'r1']]);
  assert.equal(runTotal(run), 4000);
});

test('marking the other way changes the result of the same point; pressing the same mark again removes it and the clock runs again', () => {
  setSelfMark('s', 'q', question, 'a', 'wrong', 'r1', 'q');
  assert.deepEqual(state.libProgress['s/q'].times.map((t) => [t.ms, t.result]), [[4000, 'wrong']]);
  setSelfMark('s', 'q', question, 'a', 'wrong', 'r1', 'q');   // pressing the same button again takes the mark back
  assert.equal(state.libProgress['s/q'].times.length, 0);
  assert.equal(addTime('s', 'q', 'r1', 'q', 1000), true);
  assert.equal(getClock('s', 'q', 'r1', 'q').ms, 5000);
});

test('reset zeroes the question and takes it off the total; undo brings the time back', async () => {
  resetClock('s', 'q', 'r1', 'q');
  assert.equal(getClock('s', 'q', 'r1', 'q').ms, 0);
  assert.equal(runTotal(run), 0);
  await undoLast();
  assert.equal(getClock('s', 'q', 'r1', 'q').ms, 5000);
});

test('a new session gives the same question a fresh clock and a second data point', () => {
  state.libRuns.r2 = { id: 'r2', clocks: {} };
  openClock('s', 'q', 'r2', 'q');
  addTime('s', 'q', 'r2', 'q', 7000);
  setSelfMark('s', 'q', question, 'a', 'right', 'r2', 'q');
  assert.equal(setSelfMark('s', 'q', question, 'a', 'right', 'r1', 'q'), 'right');   // earlier session's mark is its own
  const times = state.libProgress['s/q'].times;
  assert.deepEqual(times.map((t) => [t.ms, t.runId]), [[7000, 'r2'], [5000, 'r1']]);
});

test('outside a session the question keeps one clock on its record', () => {
  const q = { uid: 'n', title: 'n', parts: [{ label: 'a', type: 'numeric', answer: 2 }] };
  openClock('s', 'n');
  addTime('s', 'n', null, 'n', 3000);
  state.libProgress['s/n'].answers = { a: '2' };
  check('s', 'n', q, { run: null, ref: 'n' });
  assert.deepEqual(state.libProgress['s/n'].times.map((t) => [t.ms, t.result, t.runId]), [[3000, 'right', null]]);
});
