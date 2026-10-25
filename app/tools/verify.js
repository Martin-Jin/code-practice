// Pushes every question's reference solution and pristine stub through the same
// build-and-analyse path the web app uses, with the local g++ runner. Solutions must
// pass; stubs must compile and fail without hanging or crashing.
//   node tools/verify.js              all questions in all sets
//   node tools/verify.js 24 25 38     only these question numbers
import { loadSets, readSolution, buildCatalog } from '../server/catalog.js';
import { runLocal } from '../server/local-run.js';
import { buildProgram, analyse } from '../shared/program.js';

const wanted = process.argv.slice(2).map(Number).filter(Boolean);
const support = buildCatalog().support.cpp;
const jobs = [];
for (const set of loadSets()) {
  for (const q of [...set.questions.values()].sort((a, b) => a.number - b.number)) {
    if (!wanted.length || wanted.includes(q.number)) jobs.push({ set: set.manifest.id, q });
  }
}

const problems = [];
let done = 0;

async function attempt(q, code) {
  return analyse(q, code, await runLocal(buildProgram(q, code, support)));
}

async function check({ set, q }) {
  const tag = `${set} Q${q.number}`;
  const sol = await attempt(q, readSolution(q));
  if (sol.status !== 'passed') {
    problems.push(`${tag} solution: ${sol.status} (${sol.summary.passed}/${sol.summary.total})\n${sol.compile.ok ? '' : sol.compile.output.slice(0, 1500)}`);
  }
  const stub = await attempt(q, q.starter);
  if (!stub.compile.ok) problems.push(`${tag} stub does not compile:\n${stub.compile.output.slice(0, 1500)}`);
  else if (stub.status === 'passed') problems.push(`${tag} stub already passes every test`);
  else if (stub.status === 'timeout' || stub.status === 'crashed') {
    problems.push(`${tag} stub ${stub.status}${stub.interruptedTest ? ` in "${stub.interruptedTest}"` : ''}`);
  }
  process.stdout.write(`\r${++done}/${jobs.length} questions checked`);
}

const queue = jobs.slice();
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) await check(queue.shift());
}));
process.stdout.write('\n');
if (problems.length) {
  console.log(`\n${problems.length} problem(s):\n\n${problems.join('\n\n')}`);
  process.exit(1);
}
console.log(`OK: ${jobs.length} solutions pass, ${jobs.length} stubs compile and fail cleanly.`);
