// Runner-independent half of "run a question": turn the student's answer into one
// self-contained C++ file, and turn what any runner reports back into a result.
// Pure JavaScript (no DOM, no Node APIs) so the browser, the local server and the
// verify tool all use the same code.

const FRAMEWORK_INCLUDE = /^#include\s+"[^"]*test_framework\.h"\s*$/;
const EVENT = /\x1e([^\x1f]*)\x1f/g;  // one test event written by the framework on stderr

const CRASH_NAMES = {
  0xC0000005: 'access violation (segmentation fault)',
  0xC00000FD: 'stack overflow (probably infinite recursion)',
  0xC0000094: 'integer division by zero',
  0xC0000409: 'stack buffer overrun / fast-fail',
  0xC0000374: 'heap corruption',
  0xC000001D: 'illegal instruction',
};
const SIGNAL_NAMES = {
  SIGSEGV: 'segmentation fault', SIGABRT: 'aborted (abort() or an uncaught exception)',
  SIGFPE: 'arithmetic exception (division by zero?)', SIGKILL: 'killed', SIGBUS: 'bus error',
};

const normaliseNewlines = (s) => String(s).replace(/\r\n/g, '\n');
export const answerLines = (code) => normaliseNewlines(code).replace(/\n+$/, '').split('\n');

// The question file with `code` pasted over the stub, the test framework inlined, and a
// main(). `#line` directives keep compiler messages pointing at the original file names
// and line numbers, so errors read exactly as they would when building the repo.
export function buildProgram(q, code, support) {
  const body = normaliseNewlines(code).replace(/\n+$/, '');
  const lines = q.before.split('\n');
  const at = lines.findIndex((l) => FRAMEWORK_INCLUDE.test(l));
  if (at < 0) throw new Error(`${q.file}: no #include of test_framework.h before the answer region`);
  const header = support.header.replace(/^#pragma once\s*$/m, '');
  const source = support.source.replace(/^#include\s+"test_framework\.h"\s*$/m, '');
  return [
    '#define TF_EVENTS_STDERR',
    `#line 1 "${q.file}"`,
    ...lines.slice(0, at),
    '#line 1 "test_framework.h"',
    header,
    `#line ${at + 2} "${q.file}"`,
    ...lines.slice(at + 1),
    ...(body ? [body] : []),
    q.after,
    '#line 1 "test_framework.cpp"',
    source,
    '#line 1 "main.cpp"',
    `int main() { return tf::RunQuestion(${Number(q.number)}); }`,
    '',
  ].join('\n');
}

// Lines like  q24_bst_remove.cpp:112:5: error: ...
export function parseDiagnostics(output, q, codeLineCount) {
  const re = /^(.+?):(\d+):(\d+): (fatal error|error|warning|note): (.*)$/;
  const diags = [];
  for (const line of output.split('\n')) {
    const m = re.exec(line.replace(/\r$/, ''));
    if (!m || m[1].split(/[\\/]/).pop() !== q.file) continue;
    const answerLine = Number(m[2]) - q.answerFirstLine + 1;
    diags.push({
      line: Number(m[2]), col: Number(m[3]), severity: m[4] === 'fatal error' ? 'error' : m[4], message: m[5],
      answerLine: answerLine >= 1 && answerLine <= codeLineCount ? answerLine : null,
    });
  }
  return diags;
}

// Splits framework events out of stderr. Whatever is left is the student's own stderr output.
function extractEvents(stderr) {
  const events = [];
  const rest = String(stderr).replace(EVENT, (_, json) => {
    try { events.push(JSON.parse(json)); } catch { /* a crash can cut the last event short */ }
    return '';
  });
  return { events, rest };
}

function buildTests(events, interruption) {
  const tests = [];
  let open = null;
  for (const e of events) {
    if (e.e === 'test_start') {
      open = { name: e.name, hidden: e.hidden, status: 'crash', failures: [] };
      tests.push(open);
    } else if (e.e === 'test_end' && open) {
      open.status = e.passed ? 'pass' : 'fail';
      open.failures = e.failures;
      open = null;
    }
  }
  const last = tests[tests.length - 1];
  const interrupted = last && last.status === 'crash' ? last : null;
  if (interrupted) interrupted.interruption = interruption;
  return { tests, interrupted };
}

// raw = what a runner reports (see runners.js):
//   { compile: { ok, output, ms }, run: { exitCode, signal, timedOut, ms, stdout, stderr, truncated } | null }
export function analyse(q, code, raw) {
  const expected = q.visibleTests + q.hiddenTests;
  const compile = { ...raw.compile, output: normaliseNewlines(raw.compile.output) };
  compile.diagnostics = parseDiagnostics(compile.output, q, answerLines(code).length);
  compile.errorCount = compile.diagnostics.filter((d) => d.severity === 'error').length;
  compile.warningCount = compile.diagnostics.filter((d) => d.severity === 'warning').length;

  if (!compile.ok) {
    return { status: 'compile_error', compile, run: null, tests: [], notRun: 0, summary: { passed: 0, total: expected } };
  }

  const run = raw.run;
  const { events, rest } = extractEvents(run.stderr);
  const exitCode = run.exitCode;
  // Windows reports crashes as codes above 255; POSIX shells as 128 + signal number.
  const crashed = exitCode < 0 || exitCode > 255 || !!run.signal || (exitCode >= 129 && exitCode <= 159);
  const interruption = run.timedOut ? 'timeout' : crashed ? 'crash' : 'exit';
  const { tests, interrupted } = buildTests(events, interruption);
  const total = Math.max(tests.length, expected);
  const passed = tests.filter((t) => t.status === 'pass').length;

  let status = 'failed';
  if (run.timedOut) status = 'timeout';
  else if (interrupted || crashed || tests.length === 0) status = 'crashed';
  else if (passed === tests.length && exitCode === 0) status = 'passed';

  const POSIX = { 134: 'SIGABRT', 135: 'SIGBUS', 136: 'SIGFPE', 137: 'SIGKILL', 139: 'SIGSEGV' };
  const crashName = crashed
    ? (CRASH_NAMES[exitCode >>> 0] || SIGNAL_NAMES[run.signal] || SIGNAL_NAMES[POSIX[exitCode]] || run.signal || 'abnormal termination')
    : null;
  return {
    status,
    compile,
    run: { ...run, stderr: rest, crashName },
    tests,
    interruptedTest: interrupted ? interrupted.name : null,
    notRun: Math.max(0, total - tests.length),
    summary: { passed, total },
  };
}
