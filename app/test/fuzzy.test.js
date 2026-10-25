import test from 'node:test';
import assert from 'node:assert/strict';
import { fuzzyMatch, fuzzyFilter } from '../src/lib/fuzzy.js';

const items = [
  { label: 'Q24 Binary search tree: Remove()', sub: 'Binary search trees', keywords: 'Trees' },
  { label: 'Q22 Binary search tree: Height()', sub: 'Binary search trees' },
  { label: 'Q42 AVL tree: InsertValue()', sub: 'AVL trees' },
  { label: 'Q02 Singly linked-list: Remove()', sub: 'Linked lists & List ADT' },
  { label: 'Q38 Fast Fourier transform: ditfft2()', sub: 'Complex numbers, DFT & FFT' },
];
const labels = (q) => fuzzyFilter(items, q).map((r) => r.item.label.split(' ')[0]);

test('letters must appear in order, not together', () => {
  assert.ok(fuzzyMatch('bstr', 'Binary search tree'));
  assert.equal(fuzzyMatch('xyz', 'Binary search tree'), null);
  assert.equal(fuzzyMatch('rts', 'tree'), null);
});

test('every word of the query has to match', () => {
  assert.ok(fuzzyMatch('bst rem', 'Binary search tree: Remove()'));
  assert.equal(fuzzyMatch('bst zzz', 'Binary search tree: Remove()'), null);
});

test('matching ignores case', () => {
  assert.ok(fuzzyMatch('AVL', 'avl tree'));
});

test('an exact word outranks scattered letters', () => {
  assert.equal(labels('avl')[0], 'Q42');
});

test('finds by question number and by a short form of the title', () => {
  assert.deepEqual(labels('q24'), ['Q24']);
  assert.equal(labels('bst rem')[0], 'Q24');
  assert.equal(labels('fft')[0], 'Q38');
});

test('also matches the subtitle and hidden keywords', () => {
  assert.equal(labels('linked lists').includes('Q02'), true);
  assert.equal(labels('trees').includes('Q24'), true);
});

test('reports which letters of the label matched', () => {
  const [hit] = fuzzyFilter(items, 'remove');
  assert.ok(hit.labelIdx.length >= 6);
  assert.ok(hit.labelIdx.every((i) => hit.item.label.toLowerCase()[i] !== undefined));
});

test('an empty query lists everything except items hidden when empty', () => {
  const withHidden = [...items, { label: 'hidden', showWhenEmpty: false }];
  assert.equal(fuzzyFilter(withHidden, '').length, items.length);
  assert.equal(fuzzyFilter(withHidden, 'hid').length, 1);
});

test('results are capped by the limit', () => {
  assert.equal(fuzzyFilter(items, 'q', 2).length, 2);
});
