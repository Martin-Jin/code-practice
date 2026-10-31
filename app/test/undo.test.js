import { test } from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../src/lib/store.js';
import { undoable, recordUndo, undoLast, redoLast, undoBarrier } from '../src/lib/undo.js';
import { connect } from '../src/lib/toast.js';

const shown = [];
connect((message, kind, options) => shown.push({ message, kind, ...options }));

test('an undoable change can be undone and redone, with a notification that undoes it', async () => {
  state.libFolders = { a: { id: 'a', name: 'One' } };
  const keep = state.libFolders.a;
  await undoable('Renamed folder One', ['libFolders'], () => { state.libFolders.a = { id: 'a', name: 'Two' }; });
  assert.equal(shown.at(-1).message, 'Renamed folder One');
  assert.equal(shown.at(-1).action, 'Undo');
  await shown.at(-1).onClick();
  assert.equal(state.libFolders.a, keep);
  await redoLast();
  assert.equal(state.libFolders.a.name, 'Two');
  await undoLast();
  assert.equal(state.libFolders.a.name, 'One');
});

test('a change that adds or removes a record is undone too', async () => {
  state.libFolders = { a: { id: 'a', name: 'One' } };
  await undoable('Added and removed', ['libFolders'], () => { delete state.libFolders.a; state.libFolders.b = { id: 'b', name: 'Two' }; });
  await undoLast();
  assert.deepEqual(Object.keys(state.libFolders), ['a']);
});

test('a new action clears what could be redone, and the barrier forgets the history', async () => {
  let n = 0;
  recordUndo('first', () => { n -= 1; }, () => { n += 1; });
  n = 1;
  await undoLast();
  assert.equal(n, 0);
  recordUndo('second', () => {}, () => {});
  await redoLast();
  assert.equal(shown.at(-1).message, 'Nothing to redo.');
  undoBarrier();
  await undoLast();
  assert.equal(shown.at(-1).message, 'Nothing to undo.');
});

test('changes made while undoing are not recorded as new steps', async () => {
  state.libFolders = { a: { id: 'a', name: 'One' } };
  recordUndo('outer', () => undoable('inner', ['libFolders'], () => { state.libFolders.a = { id: 'a', name: 'X' }; }), () => {});
  await undoLast();
  const count = shown.filter((s) => s.message === 'inner').length;
  assert.equal(count, 0);
});
