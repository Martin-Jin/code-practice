// The "local" runner: compiles one self-contained C++ file with g++ and runs it.
// Same flags as the CMake build, so results match `run.ps1`.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const WORK_DIR = process.env.WORK_DIR || path.join(HERE, '..', '.work');
export const MINGW_BIN = process.env.MINGW_BIN || 'C:\\msys64\\mingw64\\bin';
const FLAGS = ['-std=gnu++17', '-Wall', '-Wextra', '-Wno-unused-parameter', '-fdiagnostics-color=never'];
const RUN_TIMEOUT_MS = Number(process.env.RUN_TIMEOUT_MS) || 10000;
const COMPILE_TIMEOUT_MS = 120000;
const MAX_OUTPUT = 400 * 1024;
export const MAX_SOURCE = 2 * 1024 * 1024;

function toolEnv() {
  const env = { ...process.env, LC_ALL: 'C.UTF-8' };
  const key = Object.keys(env).find((k) => k.toLowerCase() === 'path') || 'PATH';
  if (fs.existsSync(MINGW_BIN)) env[key] = MINGW_BIN + path.delimiter + (env[key] || '');
  return env;
}

function exec(cmd, args, { cwd, env, timeoutMs }) {
  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = '', stderr = '', timedOut = false, truncated = false;
    const child = spawn(cmd, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    const take = (cur, chunk) => {
      if (cur.length >= MAX_OUTPUT) { truncated = true; return cur; }
      return cur + chunk.toString('utf8');
    };
    child.stdout.on('data', (d) => { stdout = take(stdout, d); });
    child.stderr.on('data', (d) => { stderr = take(stderr, d); });
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: stderr + String(e.message), timedOut, truncated, ms: Date.now() - started, spawnError: e });
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code: code === null ? -1 : code, signal, stdout, stderr, timedOut, truncated, ms: Date.now() - started });
    });
  });
}

// Limit concurrent compiles so a burst of runs does not freeze the machine.
const MAX_JOBS = Math.max(1, Math.min(4, os.cpus().length - 1));
let active = 0;
const waiting = [];
async function slot(fn) {
  if (active >= MAX_JOBS) await new Promise((r) => waiting.push(r));
  active++;
  try { return await fn(); } finally { active--; const next = waiting.shift(); if (next) next(); }
}

export async function gppVersion() {
  const r = await exec('g++', ['--version'], { cwd: HERE, env: toolEnv(), timeoutMs: 10000 });
  return r.spawnError ? null : r.stdout.split('\n')[0].trim();
}

// source: one complete C++ file. Returns what program.js `analyse` expects.
export async function runLocal(source, file = 'prog.cpp') {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const dir = path.join(WORK_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  try {
    fs.writeFileSync(path.join(dir, 'prog.cpp'), source);
    const env = toolEnv();
    const build = await slot(() => exec('g++', [...FLAGS, 'prog.cpp', '-o', 'run.exe'], { cwd: dir, env, timeoutMs: COMPILE_TIMEOUT_MS }));
    let output = build.stdout + build.stderr;
    if (build.spawnError) {
      output = `Could not start g++ (${build.spawnError.message}).\nIs MinGW installed at ${MINGW_BIN}? Set MINGW_BIN to its bin folder.\n`;
    }
    const compile = { ok: build.code === 0 && !build.spawnError, output, ms: build.ms };
    if (!compile.ok) return { compile, run: null };

    const ran = await exec(path.join(dir, 'run.exe'), [], { cwd: dir, env, timeoutMs: RUN_TIMEOUT_MS });
    return {
      compile,
      run: {
        exitCode: ran.code, signal: ran.signal || null, timedOut: ran.timedOut, timeoutMs: RUN_TIMEOUT_MS,
        ms: ran.ms, stdout: ran.stdout, stderr: ran.stderr, truncated: ran.truncated,
      },
    };
  } finally {
    fs.rm(dir, { recursive: true, force: true }, () => {});
  }
}
