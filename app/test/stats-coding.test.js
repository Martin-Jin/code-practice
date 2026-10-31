import { test } from 'node:test';
import assert from 'node:assert/strict';
import { libraryStats, questionRows, codingAsProgress, codingTroubleOf, keepRow } from '../shared/libstats.js';

test('coding counters feed the same stats: compile errors are not passed, times carry over', () => {
  const stats = {
    1: { attempts: 3, correct: 1, wrong: 1, compileErrors: 1, lastStatus: 'passed', lastAt: 'T', times: [{ id: 'a', ms: 60000, result: 'right' }] },
    2: { attempts: 1, correct: 0, wrong: 0, compileErrors: 1, lastStatus: 'compile_error', lastAt: 'T' },
  };
  const qs = [{ uid: 1, title: 'One', section: 'S' }, { uid: 2, title: 'Two', section: 'S' }, { uid: 3, title: 'Three', section: 'S' }];
  const progressOf = (n) => codingAsProgress(stats[n]);
  const { total } = libraryStats(qs, progressOf);
  assert.deepEqual([total.right, total.wrong, total.attempts, total.solved, total.notYetRight, total.untried], [1, 3, 4, 1, 1, 1]);
  assert.equal(total.avgMs, 60000);
  const rows = questionRows(qs, progressOf, codingTroubleOf);
  assert.deepEqual(rows.filter((r) => keepRow('struggling', r)).map((r) => r.uid), [2]);
  assert.ok(rows[1].trouble > rows[0].trouble && rows[2].trouble === 0);
});
