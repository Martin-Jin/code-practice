// Runners turn "one complete C++ file" into { compile, run }, the raw shape that
// shared/program.js `analyse` understands.
//   local  - POST to the local server (npm run serve), which compiles with g++
//   online - Wandbox (https://wandbox.org), a free public compile service
export const RUNNERS = {
  local: { label: 'Local g++', detail: 'Compiles on this computer with the local server' },
  online: { label: 'Online (wandbox.org)', detail: 'Sends your answer and the tests to wandbox.org' },
};

export class RunnerError extends Error {}

export async function detectLocal() {
  try {
    const res = await fetch('api/info', { cache: 'no-store' });
    if (!res.ok) return null;
    const info = await res.json();
    return info.runner === 'local' ? { compiler: info.compiler || 'g++' } : null;
  } catch {
    return null;
  }
}

async function runLocal(source) {
  let res;
  try {
    res = await fetch('api/execute', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source }),
    });
  } catch {
    throw new RunnerError('Could not reach the local server. Is "npm run serve" still running?');
  }
  if (!res.ok) {
    const msg = await res.json().then((j) => j.error).catch(() => null);
    throw new RunnerError(`Local server error: ${msg || `HTTP ${res.status}`}`);
  }
  return res.json();
}

// ---- Wandbox ----
const WANDBOX = 'https://wandbox.org/api';
const COMPILER_KEY = 'wandbox-compiler';
const FLAGS = '-std=gnu++17\n-Wall\n-Wextra\n-Wno-unused-parameter';

// Newest released g++ that Wandbox offers (cached; "gcc-head" if the list is unavailable).
async function wandboxCompiler() {
  try {
    const cached = localStorage.getItem(COMPILER_KEY);
    if (cached) return cached;
  } catch { /* storage blocked */ }
  let name = 'gcc-head';
  try {
    const list = await (await fetch(`${WANDBOX}/list.json`)).json();
    const version = (n) => n.split('-')[1].split('.').map(Number);
    const gcc = list.filter((c) => c.language === 'C++' && /^gcc-\d+\.\d+\.\d+$/.test(c.name))
      .sort((a, b) => { const x = version(a.name), y = version(b.name); return (y[0] - x[0]) || (y[1] - x[1]) || (y[2] - x[2]); });
    if (gcc.length) name = gcc[0].name;
    localStorage.setItem(COMPILER_KEY, name);
  } catch { /* use the default */ }
  return name;
}

async function runOnline(source) {
  const started = performance.now();
  const compiler = await wandboxCompiler();
  let res;
  try {
    res = await fetch(`${WANDBOX}/compile.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compiler, code: source, options: '', 'compiler-option-raw': FLAGS, 'runtime-option-raw': '', stdin: '', save: false }),
    });
  } catch {
    throw new RunnerError('Could not reach wandbox.org. Check your connection, or switch to the local runner in Settings.');
  }
  if (!res.ok) throw new RunnerError(`wandbox.org answered HTTP ${res.status}. Try again, or switch runner in Settings.`);
  const j = await res.json();

  const compilerText = [j.compiler_error, j.compiler_output].filter(Boolean).join('');
  const programErr = j.program_error || '';
  const programOut = j.program_output || '';
  // The test program prints its first line before anything else, so no program output at all
  // plus an error in the compiler text means the build failed.
  const started_ = programOut.length > 0 || programErr.includes('\x1e');
  if (!started_ && /\berror\b/i.test(compilerText)) {
    return { compile: { ok: false, output: compilerText, ms: Math.round(performance.now() - started) }, run: null };
  }
  const signal = j.signal || null;
  return {
    compile: { ok: true, output: compilerText, ms: Math.round(performance.now() - started) },
    run: {
      exitCode: Number.parseInt(j.status ?? '0', 10) || 0,
      signal,
      timedOut: !!signal && /time|kill/i.test(signal),
      timeoutMs: null,
      ms: null,
      stdout: programOut,
      stderr: programErr,
      truncated: false,
    },
  };
}

export function execute(runner, source) {
  return runner === 'local' ? runLocal(source) : runOnline(source);
}
