import test from 'node:test';
import assert from 'node:assert/strict';
import { acknowledgeSolution, hasAcknowledgedSolution } from '../shared/solution-gate.js';

test('solution acknowledgement is scoped to a question in its practice run', () => {
  const firstRun = { id: 'run-1' };
  const acknowledged = acknowledgeSolution(firstRun, null, 'q1');
  assert.equal(hasAcknowledgedSolution(acknowledged, null, 'q1'), true);
  assert.equal(hasAcknowledgedSolution(acknowledged, null, 'q2'), false);
  assert.equal(hasAcknowledgedSolution({ id: 'run-2' }, null, 'q1'), false);
});

test('standalone question acknowledgement is kept in its progress record', () => {
  const acknowledged = acknowledgeSolution(null, { answers: { a: '2' } }, 'q1');
  assert.equal(hasAcknowledgedSolution(null, acknowledged, 'q1'), true);
  assert.deepEqual(acknowledged.answers, { a: '2' });
});
