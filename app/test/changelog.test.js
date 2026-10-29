import test from 'node:test';
import assert from 'node:assert/strict';
import { VERSION, CHANGELOG, startTab } from '../shared/changelog.js';

const num = (v) => { const [major, minor] = v.split('.').map(Number); return major * 100 + minor; };

test('the version has the form 1.64 and is the latest change log entry', () => {
  assert.match(VERSION, /^\d+\.\d{2}$/);
  assert.equal(CHANGELOG[0].version, VERSION);
});

test('the change log keeps at most the five latest entries, newest first, each complete', () => {
  assert.ok(CHANGELOG.length >= 1 && CHANGELOG.length <= 5);
  for (let i = 1; i < CHANGELOG.length; i++) assert.ok(num(CHANGELOG[i - 1].version) > num(CHANGELOG[i].version), 'versions must fall');
  for (const c of CHANGELOG) {
    assert.match(c.version, /^\d+\.\d{2}$/);
    assert.match(c.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(c.title && c.items.length > 0 && c.items.every((x) => typeof x === 'string' && x));
  }
});

test('new visitors get the tutorial, returning ones the change log after an update, and nobody sees it twice', () => {
  assert.equal(startTab(null), 'tutorial');
  assert.equal(startTab(undefined), 'tutorial');
  assert.equal(startTab('1.00'), 'changelog');
  assert.equal(startTab(VERSION), null);
});
