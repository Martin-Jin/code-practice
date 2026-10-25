import test from 'node:test';
import assert from 'node:assert/strict';
import { eventCombo, checkCombo, comboFor, actionFor, ACTIONS } from '../src/lib/shortcuts.js';

const ev = (o) => ({ ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, code: '', key: '', ...o });

test('eventCombo names modifiers in a fixed order and treats Cmd as Ctrl', () => {
  assert.equal(eventCombo(ev({ shiftKey: true, ctrlKey: true, code: 'Enter', key: 'Enter' })), 'Ctrl+Shift+Enter');
  assert.equal(eventCombo(ev({ metaKey: true, code: 'KeyP', key: 'p' })), 'Ctrl+P');
  assert.equal(eventCombo(ev({ altKey: true, shiftKey: true, code: 'KeyF', key: 'F' })), 'Alt+Shift+F');
  assert.equal(eventCombo(ev({ ctrlKey: true, code: 'Space', key: ' ' })), 'Ctrl+Space');
});

test('eventCombo ignores a lone modifier key', () => {
  assert.equal(eventCombo(ev({ ctrlKey: true, code: 'ControlLeft', key: 'Control' })), null);
});

test('defaults are unique and found by combo', () => {
  assert.equal(new Set(ACTIONS.map((a) => a.def)).size, ACTIONS.length);
  assert.equal(actionFor('Alt+T').id, 'task');
  assert.equal(actionFor('Alt+T', { task: 'Alt+J' }), undefined);
  assert.equal(actionFor('Alt+J', { task: 'Alt+J' }).id, 'task');
  assert.equal(comboFor('run', {}), 'Ctrl+Shift+Enter');
});

test('checkCombo blocks bare keys and combos already used', () => {
  assert.match(checkCombo('T', 'task').error, /Ctrl or Alt/);
  assert.match(checkCombo('Shift+T', 'task').error, /Ctrl or Alt/);
  assert.match(checkCombo('Alt+Q', 'task').error, /already used/);
  assert.deepEqual(checkCombo('Alt+T', 'task'), {});
  assert.deepEqual(checkCombo('F8', 'task'), {});
  assert.deepEqual(checkCombo('Escape', 'exit'), {});
  assert.match(checkCombo('Escape', 'task').error, /already used/);
});

test('checkCombo warns about common browser shortcuts', () => {
  assert.match(checkCombo('Ctrl+T', 'task').warning, /new browser tab/);
  assert.match(checkCombo('Ctrl+S', 'task').warning, /saves the page/);
  assert.match(checkCombo('Ctrl+3', 'task').warning, /browser tab/);
  assert.deepEqual(checkCombo('Alt+J', 'task'), {});
});
