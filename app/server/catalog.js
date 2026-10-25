// Reads every question set under sets/ and produces catalog.json: everything the web app
// needs (statements, provided code, starter code, the pieces of each question file), with
// no solutions in it. The layout it relies on is described in docs/question-format.md.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { editorOptions } from './editor-settings.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// SETS_DIR lets tools check another folder of sets (CI checks templates/ this way).
const SETS_DIR = process.env.SETS_DIR ? path.resolve(process.env.SETS_DIR) : path.join(ROOT, 'sets');
const SETS_REL = path.relative(ROOT, SETS_DIR).split(path.sep).join('/');

// Starter code must be the pristine stub, but the working tree may hold the user's own
// answers. So question files are read from git HEAD when possible (CATALOG_SOURCE=worktree
// opts out). One `git cat-file --batch` call reads them all; a spawn per file took seconds.
let head = new Map();

function primeHead() {
  head = new Map();
  if (process.env.CATALOG_SOURCE === 'worktree') return;
  const rels = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.cpp')) rels.push(path.relative(ROOT, p).split(path.sep).join('/'));
    }
  })(SETS_DIR);
  const r = spawnSync('git', ['cat-file', '--batch'], {
    cwd: ROOT, input: `${rels.map((p) => `HEAD:${p}`).join('\n')}\n`, maxBuffer: 256 << 20, windowsHide: true,
  });
  if (r.status !== 0) return;  // no git: fall back to the working tree
  const buf = r.stdout;
  let pos = 0;
  for (const rel of rels) {
    const nl = buf.indexOf(0x0a, pos);
    const m = /^[0-9a-f]+ blob (\d+)$/.exec(buf.toString('utf8', pos, nl));  // "... missing" for a new file
    pos = nl + 1;
    if (!m) continue;
    const size = Number(m[1]);
    head.set(rel, buf.toString('utf8', pos, pos + size));
    pos += size + 1;
  }
}

const readSource = (rel) => head.get(rel) ?? fs.readFileSync(path.join(ROOT, rel), 'utf8');

const stripComment = (l) => l.replace(/^\/\/ ?/, '');
const posix = (...parts) => path.posix.join(...parts);

function trimBlank(lines) {
  let a = 0, b = lines.length;
  while (a < b && !lines[a].trim()) a++;
  while (b > a && !lines[b - 1].trim()) b--;
  return lines.slice(a, b);
}

export function parseQuestion(text, rel) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const head = /^\/\/ Question (\d+)\s+\((\d+) marks?\)\s+-\s+(.+?)\s*$/.exec(lines[1] || '');
  if (!head) throw new Error(`${rel}: line 2 must be "// Question N  (M marks)  -  Title"`);

  const ruleIdx = lines.findIndex((l, i) => i > 0 && /^\/\/ =+$/.test(l));
  const topicIdx = lines.findIndex((l) => /^\/\/ Topic:/.test(l));
  if (ruleIdx < 0 || topicIdx < 0) throw new Error(`${rel}: header comment is incomplete`);
  let topicEnd = topicIdx;
  while (/^\/\/ {2,}\S/.test(lines[topicEnd + 1] || '')) topicEnd++;
  const topic = lines.slice(topicIdx, topicEnd + 1)
    .map((l, i) => stripComment(l).replace(i === 0 ? /^Topic:\s*/ : /^\s+/, '')).join(' ');

  let statement = trimBlank(lines.slice(topicEnd + 1, ruleIdx).map(stripComment));
  if (/^Requirements for /.test(statement[0] || '')) statement = trimBlank(statement.slice(1));

  const provIdx = lines.findIndex((l) => /^\/\/ -+ PROVIDED CODE/.test(l));
  const startIdx = lines.findIndex((l) => /YOUR ANSWER STARTS HERE/.test(l));
  const ifnIdx = lines.findIndex((l) => /^#ifndef USE_SOLUTIONS/.test(l));
  const elseIdx = lines.findIndex((l, i) => i > ifnIdx && /^#else\b/.test(l));
  if (provIdx < 0 || startIdx < 0 || ifnIdx < 0 || elseIdx < 0) {
    throw new Error(`${rel}: missing PROVIDED CODE / YOUR ANSWER STARTS HERE / #ifndef USE_SOLUTIONS markers`);
  }
  const systemIncludes = lines.slice(0, provIdx).filter((l) => /^#include </.test(l));

  return {
    number: Number(head[1]),
    marks: Number(head[2]),
    title: head[3],
    topic,
    statement: statement.join('\n'),
    provided: trimBlank([...systemIncludes, '', ...lines.slice(provIdx + 1, startIdx)]).join('\n'),
    starter: lines.slice(ifnIdx + 1, elseIdx).join('\n'),
    visibleTests: (text.match(/tf::Test\(/g) || []).length,
    hiddenTests: (text.match(/tf::HiddenTest\(/g) || []).length,
    file: path.posix.basename(rel),
    // The file with the answer cut out: before + <answer> + after.
    before: lines.slice(0, ifnIdx + 1).join('\n'),
    after: lines.slice(elseIdx).join('\n'),
    answerFirstLine: ifnIdx + 2,  // 1-based line where the answer starts
  };
}

// The manifest (sets/<id>/set.json) plus the questions found in its folders.
function loadSet(id) {
  const rel = posix(SETS_REL, id);
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, rel, 'set.json'), 'utf8'));
  if (manifest.id !== id) throw new Error(`${rel}/set.json: "id" must be "${id}" (the folder name)`);
  const dirs = manifest.questionDirs || [{ dir: 'questions', solutions: 'solutions' }];
  const questions = new Map();
  for (const { dir, solutions } of dirs) {
    const abs = path.join(ROOT, rel, dir);
    if (!fs.existsSync(abs)) throw new Error(`${rel}/set.json: folder "${dir}" does not exist`);
    for (const f of fs.readdirSync(abs).filter((n) => /^q\d+_.*\.cpp$/.test(n)).sort()) {
      const q = parseQuestion(readSource(posix(rel, dir, f)), posix(rel, dir, f));
      if (questions.has(q.number)) throw new Error(`${rel}: question ${q.number} is defined twice`);
      q.solutionPath = posix(rel, solutions, `q${String(q.number).padStart(2, '0')}.inc`);
      questions.set(q.number, q);
    }
  }

  const listed = new Set();
  for (const c of manifest.categories) {
    for (const n of c.questions) {
      if (!questions.has(n)) throw new Error(`${rel}/set.json: category "${c.id}" lists unknown question ${n}`);
      if (listed.has(n)) throw new Error(`${rel}/set.json: question ${n} is in two categories`);
      listed.add(n);
    }
  }
  // Questions the manifest forgot still show up, so a new file is never silently hidden.
  const loose = [...questions.keys()].filter((n) => !listed.has(n)).sort((a, b) => a - b);
  if (loose.length) {
    manifest.groups.extra = manifest.groups.extra || 'Extra practice';
    manifest.categories.push({ id: 'uncategorised', name: 'Uncategorised', group: 'extra', questions: loose });
  }
  return { manifest, questions };
}

export function listSetIds() {
  return fs.readdirSync(SETS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(SETS_DIR, e.name, 'set.json')))
    .map((e) => e.name).sort();
}

// For tools that need solutions (verify.js).
export function loadSets() {
  primeHead();
  return listSetIds().map((id) => ({ id, ...loadSet(id) }));
}

export const readSolution = (q) => fs.readFileSync(path.join(ROOT, q.solutionPath), 'utf8');

export function buildCatalog() {
  const sets = [];
  const questions = {};
  for (const { id, manifest, questions: qs } of loadSets()) {
    const { questionDirs, ...publicManifest } = manifest;
    sets.push(publicManifest);
    questions[id] = Object.fromEntries([...qs.entries()].map(([n, q]) => {
      const { solutionPath, ...pub } = q;
      return [n, pub];
    }));
  }
  return {
    generatedAt: new Date().toISOString(),
    editor: editorOptions(path.join(ROOT, '.vscode', 'settings.json')),
    support: {
      cpp: {
        header: fs.readFileSync(path.join(ROOT, 'framework', 'test_framework.h'), 'utf8').replace(/\r\n/g, '\n'),
        source: fs.readFileSync(path.join(ROOT, 'framework', 'test_framework.cpp'), 'utf8').replace(/\r\n/g, '\n'),
      },
    },
    sets,
    questions,
  };
}
