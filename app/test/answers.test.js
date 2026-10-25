import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNumber, tolerance, checkNumeric, checkMcq, checkPart, checkQuestion, expectedText } from '../shared/answers.js';

const num = (answer, extra = {}) => ({ label: 'a', type: 'numeric', unit: 'kg', answer, ...extra });
const mcq = (correct, extra = {}) => ({ label: 'b', type: 'mcq', options: ['w', 'x', 'y', 'z'], correct, ...extra });

test('parseNumber reads what people type', () => {
  for (const [text, value] of [['4.5', 4.5], [' -3 ', -3], ['−3.2', -3.2], ['+7', 7], ['1e3', 1000], ['2.5E-2', 0.025], ['1,234.5', 1234.5], ['0,297', 0.297], ['12,5', 12.5], ['1,234', 1234], ['1 234', 1234], ['.5', 0.5], ['5.', 5], ['1,234,567', 1234567]]) {
    assert.equal(parseNumber(text), value, text);
  }
  for (const bad of ['', '  ', 'abc', '1.2.3', '12 kg', '--1', '1e', null, undefined]) assert.ok(Number.isNaN(parseNumber(bad)), String(bad));
});

test('tolerance: 1 % by default, or half the last decimal place asked for, whichever is larger', () => {
  assert.equal(tolerance(num(200)), 2);
  assert.equal(tolerance(num(200, { relTol: 0.05 })), 10);
  assert.ok(Math.abs(tolerance(num(0.297, { dp: 3 })) - 0.00297) < 1e-12);
  assert.equal(tolerance(num(0.297, { dp: 1 })), 0.05);
  assert.ok(tolerance(num(0)) > 0, 'an answer of zero still has a tiny tolerance');
});

test('numeric answers are checked within tolerance', () => {
  const p = num(0.297, { dp: 3 });
  assert.equal(checkNumeric('0.297', p), 'right');
  assert.equal(checkNumeric('0.2985', p), 'right');
  assert.equal(checkNumeric('0.299', p), 'right');
  assert.equal(checkNumeric('0.3', p), 'wrong', '0.3 is just over 1 % away');
  assert.equal(checkNumeric('0.31', p), 'wrong');
  assert.equal(checkNumeric('-0.297', p), 'wrong', 'the sign matters');
  assert.equal(checkNumeric('', p), 'empty');
  assert.equal(checkNumeric('  ', p), 'empty');
  assert.equal(checkNumeric('kg', p), 'invalid');
  assert.equal(checkNumeric('1', num(null)), 'nokey');
  assert.equal(checkNumeric('1', num(undefined)), 'nokey');
  assert.equal(checkNumeric('0', num(0)), 'right');
  assert.equal(checkNumeric('0.001', num(0)), 'wrong');
  assert.equal(checkNumeric('1234.5', num(1234.5, { relTol: 0 })), 'right');
});

test('multiple choice needs exactly the right options', () => {
  assert.equal(checkMcq([0, 2], mcq([0, 2])), 'right');
  assert.equal(checkMcq([2, 0], mcq([0, 2])), 'right');
  assert.equal(checkMcq([0], mcq([0, 2])), 'wrong');
  assert.equal(checkMcq([0, 1, 2], mcq([0, 2])), 'wrong');
  assert.equal(checkMcq([], mcq([0])), 'empty');
  assert.equal(checkMcq(undefined, mcq([0])), 'empty');
  assert.equal(checkMcq([1], mcq([])), 'nokey');
});

test('self parts take the user’s own mark', () => {
  const p = { label: 'c', type: 'self' };
  assert.equal(checkPart(p, 'right'), 'right');
  assert.equal(checkPart(p, 'wrong'), 'wrong');
  assert.equal(checkPart(p, undefined), 'empty');
  assert.equal(checkPart(p, 'maybe'), 'empty');
});

test('a question is right only when every checkable part is', () => {
  const q = { parts: [num(2), mcq([1]), { label: 'c', type: 'self' }, num(null, { label: 'd' })] };
  assert.equal(checkQuestion(q, { a: '2', b: [1], c: 'right' }).overall, 'right');
  assert.equal(checkQuestion(q, { a: '3', b: [1], c: 'right' }).overall, 'wrong');
  assert.equal(checkQuestion(q, { a: '2' }).overall, 'incomplete');
  assert.deepEqual(checkQuestion(q, { a: '2', b: [0] }).parts, { a: 'right', b: 'wrong', c: 'empty', d: 'nokey' });
  assert.equal(checkQuestion({ parts: [num(null)] }, {}).overall, 'nokey');
  assert.equal(checkQuestion({ parts: [{ label: '', type: 'self' }] }, { '': 'wrong' }).overall, 'wrong');
});

test('expectedText shows the answer with its unit', () => {
  assert.equal(expectedText(num(0.297)), '0.297 kg');
  assert.equal(expectedText(num(5, { unit: '' })), '5');
  assert.equal(expectedText(num(null)), '');
  assert.equal(expectedText(mcq([0, 2])), 'w; y');
});
