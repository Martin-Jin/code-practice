import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProgram, analyse, parseDiagnostics, isUntouched } from '../shared/program.js';

// A tiny stand-in for a catalog question: 3 header lines, the framework include on line 2,
// the answer starting on line 5.
const q = {
  number: 7, file: 'q07_demo.cpp', visibleTests: 1, hiddenTests: 1, answerFirstLine: 5,
  before: '// header\n#include "framework/test_framework.h"\nnamespace q07 {\n#ifndef USE_SOLUTIONS',
  after: '#else\n#endif\n}  // namespace q07',
};
const support = { header: '#pragma once\nnamespace tf { int RunQuestion(int); }', source: '#include "test_framework.h"\nint tf::RunQuestion(int n) { return n; }' };
const ev = (o) => `\x1e${JSON.stringify(o)}\x1f`;

test('buildProgram pastes the answer between the markers and inlines the framework', () => {
  const src = buildProgram(q, 'int f() { return 1; }\n', support);
  const lines = src.split('\n');
  assert.equal(lines[0], '#define TF_EVENTS_STDERR');
  assert.ok(!src.includes('#pragma once'));
  assert.ok(!src.includes('#include "test_framework.h"'));
  assert.ok(!src.includes('#include "framework/test_framework.h"'));
  assert.ok(src.indexOf('int f()') > src.indexOf('#ifndef USE_SOLUTIONS'));
  assert.ok(src.indexOf('int f()') < src.indexOf('#else'));
  assert.match(src, /int main\(\) \{ return tf::RunQuestion\(7\); \}/);
});

test('buildProgram keeps original line numbers with #line directives', () => {
  const src = buildProgram(q, 'A\nB', support).split('\n');
  const at = src.indexOf('A');
  // the closest #line before the answer maps the next line to the include line + 1 = 3 ...
  const directive = src.slice(0, at).reverse().find((l) => l.startsWith('#line'));
  assert.equal(directive, '#line 3 "q07_demo.cpp"');
  // ... and the lines after it are: namespace (3), #ifndef (4), A (5)
  const sinceDirective = at - src.lastIndexOf(directive, at);
  assert.equal(3 + sinceDirective - 1, 5);
});

test('buildProgram handles an empty answer', () => {
  const src = buildProgram(q, '', support);
  assert.match(src, /#ifndef USE_SOLUTIONS\n#else/);
});

test('buildProgram rejects a question without the framework include', () => {
  assert.throws(() => buildProgram({ ...q, before: '// nothing' }, 'x', support), /test_framework\.h/);
});

test('parseDiagnostics maps compiler lines to answer lines', () => {
  const out = [
    'q07_demo.cpp: In function:',
    'q07_demo.cpp:6:11: error: expected primary-expression before \';\' token',
    'q07_demo.cpp:20:3: warning: unused variable [-Wunused]',
    'test_framework.h:12:1: note: something',
    '    6 |   int x = ;',
  ].join('\n');
  const d = parseDiagnostics(out, q, 3);
  assert.equal(d.length, 2);
  assert.deepEqual([d[0].severity, d[0].line, d[0].col, d[0].answerLine], ['error', 6, 11, 2]);
  assert.equal(d[1].answerLine, null);  // line 20 is in the tests, not the answer
});

const okCompile = { ok: true, output: '', ms: 5 };

test('analyse: all tests pass', () => {
  const stderr = ev({ e: 'test_start', name: 'a', hidden: false }) + ev({ e: 'test_end', name: 'a', hidden: false, passed: true, failures: [] })
    + ev({ e: 'test_start', name: 'b', hidden: true }) + ev({ e: 'test_end', name: 'b', hidden: true, passed: true, failures: [] });
  const r = analyse(q, 'x', { compile: okCompile, run: { exitCode: 0, signal: null, timedOut: false, stdout: '', stderr, ms: 3 } });
  assert.equal(r.status, 'passed');
  assert.deepEqual(r.summary, { passed: 2, total: 2 });
  assert.equal(r.run.stderr, '');  // events are removed from the student's stderr
});

test('analyse: a failing test keeps its comparison data', () => {
  const failure = { message: 'in-order: expected 1 but got 2', kind: 'value', what: 'in-order', expected: '1', actual: '2' };
  const stderr = ev({ e: 'test_start', name: 'a', hidden: false }) + ev({ e: 'test_end', name: 'a', hidden: false, passed: false, failures: [failure] })
    + 'my own debug line\n';
  const r = analyse(q, 'x', { compile: okCompile, run: { exitCode: 1, signal: null, timedOut: false, stdout: '', stderr, ms: 3 } });
  assert.equal(r.status, 'failed');
  assert.equal(r.tests[0].failures[0].expected, '1');
  assert.equal(r.run.stderr, 'my own debug line\n');
  assert.equal(r.notRun, 1);  // the second test never started
});

test('analyse: a crash is attributed to the test that was running', () => {
  const stderr = ev({ e: 'test_start', name: 'boom', hidden: false });
  const r = analyse(q, 'x', { compile: okCompile, run: { exitCode: 3221225477, signal: null, timedOut: false, stdout: '', stderr, ms: 3 } });
  assert.equal(r.status, 'crashed');
  assert.equal(r.interruptedTest, 'boom');
  assert.match(r.run.crashName, /access violation/);
  assert.equal(r.tests[0].interruption, 'crash');
});

test('analyse: a timeout wins over a crash', () => {
  const stderr = ev({ e: 'test_start', name: 'loop', hidden: true });
  const r = analyse(q, 'x', { compile: okCompile, run: { exitCode: -1, signal: null, timedOut: true, stdout: '', stderr, ms: 10000 } });
  assert.equal(r.status, 'timeout');
  assert.equal(r.tests[0].interruption, 'timeout');
});

test('analyse: exit() inside a test is reported, not treated as a pass', () => {
  const stderr = ev({ e: 'test_start', name: 'quit', hidden: false });
  const r = analyse(q, 'x', { compile: okCompile, run: { exitCode: 0, signal: null, timedOut: false, stdout: '', stderr, ms: 3 } });
  assert.equal(r.status, 'crashed');
  assert.equal(r.tests[0].interruption, 'exit');
});

test('analyse: compile errors skip the run', () => {
  const output = 'q07_demo.cpp:6:11: error: boom\r\n';
  const r = analyse(q, 'a\nb\nc', { compile: { ok: false, output, ms: 9 }, run: null });
  assert.equal(r.status, 'compile_error');
  assert.equal(r.compile.errorCount, 1);
  assert.equal(r.compile.diagnostics[0].answerLine, 2);
  assert.ok(!r.compile.output.includes('\r'));
});

test('isUntouched is true for the starter code, whatever its spacing, and false once anything is typed', () => {
  const starter = { starter: 'int F() {\n  return 0;\n}' };
  assert.equal(isUntouched(starter, 'int F() {\r\n  return 0;\r\n}\r\n'), true);
  assert.equal(isUntouched(starter, 'int F() { return 0; }'), true);
  assert.equal(isUntouched(starter, ''), false);
  assert.equal(isUntouched(starter, 'int F() {\n  return 1;\n}'), false);
});

test('analyse fails a passing run that breaks a question rule, and lists the rule first', () => {
  const rq = { ...q, restrict: ['no-loops'] };
  const stderr = ev({ e: 'test_start', name: 't1', hidden: false }) + ev({ e: 'test_end', passed: true, failures: [] })
    + ev({ e: 'test_start', name: 't2', hidden: true }) + ev({ e: 'test_end', passed: true, failures: [] });
  const raw = { compile: { ok: true, output: '', ms: 1 }, run: { exitCode: 0, stdout: '', stderr, timedOut: false } };
  const clean = analyse(rq, 'int F(int n) { return n; }', raw);
  assert.equal(clean.status, 'passed');
  assert.equal(clean.summary.total, 2);
  const broken = analyse(rq, 'int F(int n) {\n  for (;;) {}\n}', raw);
  assert.equal(broken.status, 'failed');
  assert.equal(broken.tests[0].rule, 'no-loops');
  assert.equal(broken.tests[0].status, 'fail');
  assert.match(broken.tests[0].failures[0].message, /line 2/);
  assert.deepEqual(broken.summary, { passed: 2, total: 3 });
});
