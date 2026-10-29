import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseQuestionSet, neededFiles, resolveRef } from '../shared/questionset.js';

const dir = fileURLToPath(new URL('../public/sample/', import.meta.url));
const { set, errors, skipped } = parseQuestionSet(readFileSync(`${dir}sample-practice-quiz.questions.json`, 'utf8'));

test('the sample practice quiz is a valid set with nothing skipped', () => {
  assert.deepEqual(errors, []);
  assert.deepEqual(skipped, []);
  assert.equal(set.id, 'sample-practice-quiz');
});

test('every file the sample names is shipped, and the formula sheet too', () => {
  for (const rel of neededFiles(set)) assert.ok(existsSync(dir + resolveRef(rel)), rel);
  assert.ok(existsSync(`${dir}formulas.svg`));
});

test('the sample shows every kind of part with its answer key filled in', () => {
  const parts = set.questions.flatMap((q) => q.parts);
  for (const type of ['numeric', 'mcq', 'self']) assert.ok(parts.some((p) => p.type === type), type);
  assert.ok(parts.some((p) => p.type === 'mcq' && p.multi), 'a multiple-answer choice');
  for (const p of parts) {
    if (p.type === 'numeric') assert.ok(typeof p.answer === 'number' && p.unit, `numeric part ${p.label} needs an answer and unit`);
    if (p.type === 'mcq') assert.ok(p.correct.length > 0, 'mcq needs its correct options');
  }
  assert.ok(set.questions.some((q) => q.parts.length === 0), 'a read-only question');
  assert.ok(set.questions.some((q) => q.stem.image) && set.questions.some((q) => q.solution && q.solution.images), 'diagrams');
  assert.ok(set.questions.some((q) => q.notes) && set.questions.every((q) => q.marks !== undefined && q.tags.length), 'notes, marks and tags');
  assert.ok(new Set(set.questions.map((q) => q.section)).size >= 4, 'several sections');
});
