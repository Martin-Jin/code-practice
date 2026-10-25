// Reads a practice-questions PDF and writes the question-set manifest beside it, so the app can
// import it (Add or update a folder). Re-running keeps the answers already added to the manifest.
//   node tools/index-pdf.js "<file.pdf>" [more.pdf ...]
//   node tools/index-pdf.js --dry-run "<file.pdf>"      (print the report, write nothing)
// The rules for finding questions are in shared/pdfindex.js.
import fs from 'node:fs';
import path from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { buildIndex, mergeIndex, readPages } from '../shared/pdfindex.js';
import { validateQuestionSet, MANIFEST_SUFFIX } from '../shared/questionset.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const files = args.filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.error('Usage: node tools/index-pdf.js [--dry-run] "<file.pdf>" [more.pdf ...]');
  process.exit(1);
}

let failed = false;
for (const file of files) {
  const name = path.basename(file);
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 }).promise;
  process.stdout.write(`${name}: reading ${doc.numPages} pages…`);
  const pages = await readPages(pdfjs, doc, (n, total) => { if (n % 25 === 0 || n === total) process.stdout.write(` ${n}`); });
  const { manifest, report } = await buildIndex(pages, name);
  process.stdout.write('\n');

  const out = path.join(path.dirname(file), name.replace(/\.pdf$/i, '') + MANIFEST_SUFFIX);
  let result = manifest;
  let note = '';
  if (fs.existsSync(out)) {
    const old = validateQuestionSet(JSON.parse(fs.readFileSync(out, 'utf8')));
    if (!old.set) {
      console.error(`  ${out} exists but is not a valid manifest (${old.errors.join(' ')}). Move it aside and run again.`);
      failed = true;
      continue;
    }
    const merged = mergeIndex(old.set, manifest);
    result = merged.manifest;
    note = ` Kept the answers already in it${merged.dropped ? `; ${merged.dropped} question(s) no longer in the PDF were dropped` : ''}.`;
  }
  const check = validateQuestionSet(result);
  if (!check.set || check.skipped.length) {
    console.error(`  The index is not valid: ${[...check.errors, ...check.skipped.map((s) => `question ${s.number}: ${s.problems.join('; ')}`)].join(' | ')}`);
    failed = true;
    continue;
  }
  console.log(`  ${report.questions} questions${report.expected ? ` (cover lists ${report.expected})` : ''}, ${new Set(result.questions.map((q) => q.section)).size} sections.${note}`);
  for (const w of report.warnings) console.log(`  warning: ${w}`);
  if (dryRun) continue;
  fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(`  wrote ${out}`);
}
process.exit(failed ? 1 : 0);
