import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenDiff, lineDiff } from '../src/lib/diff.js';

const changed = (segs) => segs.filter((s) => s.changed).map((s) => s.text);

test('tokenDiff highlights only the differing token', () => {
  const d = tokenDiff('List: 42', 'List: empty');
  assert.deepEqual(changed(d.left), ['42']);
  assert.deepEqual(changed(d.right), ['empty']);
});

test('tokenDiff marks a trailing space difference', () => {
  const d = tokenDiff('20 30 ', '20 30');
  assert.deepEqual(changed(d.left), [' ']);
  assert.deepEqual(changed(d.right), []);
});

test('tokenDiff on identical text marks nothing', () => {
  const d = tokenDiff('a b c', 'a b c');
  assert.deepEqual(changed(d.left), []);
  assert.deepEqual(changed(d.right), []);
});

test('lineDiff pairs changed lines and reports missing and extra lines', () => {
  const rows = lineDiff('a\nb\nc\nd', 'a\nB\nc\nd\ne');
  assert.deepEqual(rows.map((r) => r.kind), ['same', 'chg', 'same', 'same', 'add']);
  assert.equal(rows[1].exp, 'b');
  assert.equal(rows[1].got, 'B');
  assert.equal(rows[4].gotNo, 5);
});

test('lineDiff: a line only in the expected text is a deletion', () => {
  const rows = lineDiff('x\ny\nz', 'x\nz');
  assert.deepEqual(rows.map((r) => r.kind), ['same', 'del', 'same']);
});

test('lineDiff ignores trailing whitespace', () => {
  const rows = lineDiff('a  \nb', 'a\nb');
  assert.deepEqual(rows.map((r) => r.kind), ['same', 'same']);
});
