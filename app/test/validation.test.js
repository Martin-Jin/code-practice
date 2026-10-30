import test from 'node:test';
import assert from 'node:assert/strict';
import { inputValidationMessage } from '../shared/validation.js';

const field = (validity, props = {}) => ({
  validity: { valid: false, ...validity },
  min: '1',
  max: '10',
  step: '2',
  type: 'number',
  minLength: 3,
  maxLength: 8,
  getAttribute: () => null,
  labels: [{ textContent: 'Number of questions' }],
  ...props,
});

test('native field errors use the field label and consistent messages', () => {
  assert.equal(inputValidationMessage(field({ rangeUnderflow: true })), 'Number of questions must be at least 1.');
  assert.equal(inputValidationMessage(field({ rangeOverflow: true })), 'Number of questions must be no more than 10.');
  assert.equal(inputValidationMessage(field({ stepMismatch: true })), 'Number of questions must use increments of 2.');
  assert.equal(inputValidationMessage(field({ valueMissing: true })), 'Number of questions is required.');
});

test('native field errors handle other constraints and valid fields', () => {
  assert.equal(inputValidationMessage(field({ badInput: true })), 'Number of questions must be a valid number.');
  assert.equal(inputValidationMessage(field({ typeMismatch: true }, { type: 'email' })), 'Number of questions must be a valid email.');
  assert.equal(inputValidationMessage(field({ patternMismatch: true })), 'Number of questions does not match the required format.');
  assert.equal(inputValidationMessage(field({ valid: true })), null);
});

test('native field errors fall back to an accessible name or a generic label', () => {
  assert.equal(inputValidationMessage(field({ valueMissing: true }, { getAttribute: () => 'Email address', labels: [] })), 'Email address is required.');
  assert.equal(inputValidationMessage(field({ valueMissing: true }, { labels: [] })), 'This field is required.');
  assert.equal(inputValidationMessage(null), null);
});
