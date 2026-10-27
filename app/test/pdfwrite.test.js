import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { appendQuestion, paintBox, removePages, dataUrlToImage } from '../shared/pdfwrite.js';
import { readPages, buildIndex } from '../shared/pdfindex.js';

// ---- fixtures ----

// A solid-colour PNG, encoded here so the tests need no image files.
function png(width, height, [r, g, b]) {
  const crcTable = (c) => { for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; };
  const table = Array.from({ length: 256 }, (_, n) => crcTable(n));
  const crc = (buf) => { let c = 0xffffffff; for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc(body), body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);   // 8-bit RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => [r, g, b]).flat())]);
  return new Uint8Array(Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(Array.from({ length: height }, () => row)))), chunk('IEND', Buffer.alloc(0)),
  ]));
}
const image = (w, h, color = [200, 30, 30]) => ({ bytes: png(w, h, color), type: 'png' });

// A cover page only; the questions are then appended.
async function coverOnly() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);
  page.drawText('TEST101 - Practice Questions', { x: 36, y: 780, size: 20, font });
  page.drawText('1 questions. Each question has a page to attempt it.', { x: 36, y: 750, size: 10, font });
  return doc.save();
}

async function indexOf(bytes) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise;
  const pages = await readPages(pdfjs, doc);
  const { manifest, report } = await buildIndex(pages, 'test.pdf');
  await doc.destroy();
  return { questions: manifest.questions, report, pageCount: doc.numPages };
}

const first = {
  number: 1, section: 'Ch 1 ≈ Basics', title: 'Statics - find the reaction', source: 'Coursebook p.12',
  stem: { image: image(400, 150), text: 'A beam is loaded as shown. Find the reaction at A.' },
  solution: { images: [image(300, 400, [30, 30, 200])], text: 'Take moments about B.' },
};

// ---- tests ----

test('an appended question and its solution are found by the real indexer', async () => {
  const base = await coverOnly();
  const added = await appendQuestion(base, first);
  assert.equal(added.firstPage, 2);
  assert.equal(added.pageCount, 2, 'a question page and one solution page');

  const { questions, report } = await indexOf(added.bytes);
  assert.deepEqual(report.unplaced, []);
  assert.equal(questions.length, 1);
  const q = questions[0];
  assert.equal(q.title, 'Statics - find the reaction');
  assert.equal(q.section, 'Ch 1 ? Basics', 'a character Helvetica cannot encode becomes ?');
  assert.equal(q.source, 'Coursebook p.12');
  assert.equal(q.stem.pdf.page, 2);
  assert.ok(!q.flags.includes('needs-crop'), 'the dashed rule was found');
  const [x0, top, x1, bottom] = q.stem.pdf.box;
  assert.ok(x0 < x1 && top >= 63 && bottom > top + 20 && bottom < 841.89 - 100, `box ${q.stem.pdf.box}`);
  assert.equal(q.solution.pdf.length, 1);
  assert.equal(q.solution.pdf[0].page, 3);
  const [, sTop, , sBottom] = q.solution.pdf[0].box;
  assert.ok(sTop === 36 && sBottom > 700);
});

test('later questions are numbered after the earlier pages and several solution pages are all found', async () => {
  let bytes = (await appendQuestion(await coverOnly(), first)).bytes;
  const second = await appendQuestion(bytes, {
    number: 2, section: 'Ch 2', title: 'Dynamics', source: 'Book p.3',
    stem: { text: 'Text only question.' },
    solution: { images: [image(200, 300), image(500, 100), image(100, 100)] },
  });
  assert.equal(second.firstPage, 4);
  assert.equal(second.pageCount, 4);
  const { questions, report } = await indexOf(second.bytes);
  assert.deepEqual(report.unplaced, []);
  assert.deepEqual(questions.map((q) => q.stem.pdf.page), [2, 4]);
  assert.ok(questions.every((q) => !q.flags.includes('needs-crop')), 'every question has its dashed rule');
  assert.deepEqual(questions[1].solution.pdf.map((s) => s.page), [5, 6, 7]);
  assert.equal(questions[0].solution.pdf.length, 1);
});

test('a long solution text flows onto more pages with all of them found', async () => {
  const text = Array.from({ length: 140 }, (_, i) => `Line ${i + 1} of the working.`).join('\n');
  const added = await appendQuestion(await coverOnly(), { ...first, solution: { text, images: [image(100, 100)] } });
  assert.ok(added.pageCount >= 4, `question + at least 3 solution pages, got ${added.pageCount}`);
  const { questions, report } = await indexOf(added.bytes);
  assert.deepEqual(report.unplaced, []);
  assert.equal(questions[0].solution.pdf.length, added.pageCount - 1);
});

test('a question without a solution has no solution pages, and an oversized stem image still fits above the rule', async () => {
  const added = await appendQuestion(await coverOnly(), { ...first, stem: { image: image(100, 2000) }, solution: undefined });
  assert.equal(added.pageCount, 1);
  const { questions } = await indexOf(added.bytes);
  assert.deepEqual(questions[0].solution, null);
  assert.ok(questions[0].flags.includes('no-solution'));
  const [, top, , bottom] = questions[0].stem.pdf.box;
  assert.ok(bottom > top && bottom < 841.89 - 100, `box ${questions[0].stem.pdf.box}`);
});

test('a very long stem text is cut to the page and the question is still found with its rule', async () => {
  const text = Array.from({ length: 200 }, (_, i) => `Line ${i} of a very long question.`).join('\n');
  const added = await appendQuestion(await coverOnly(), { ...first, stem: { text, image: image(300, 300) } });
  const { questions, report } = await indexOf(added.bytes);
  assert.deepEqual(report.unplaced, []);
  assert.ok(!questions[0].flags.includes('needs-crop'));
  assert.ok(questions[0].stem.pdf.box[3] < 841.89 - 100);
});

test('long titles stay on one line and unsupported characters do not throw', async () => {
  const long = 'Pump curves - ' + 'a very long description of what is asked '.repeat(8);
  const added = await appendQuestion(await coverOnly(), { ...first, title: long + 'ω ≠ 0 日本語', source: 'Notes α', stem: { text: 'Find ω given θ ≈ 3 and ∑x.' } });
  const { questions, report } = await indexOf(added.bytes);
  assert.deepEqual(report.unplaced, []);
  assert.equal(questions.length, 1);
  assert.ok(long.startsWith(questions[0].title) && questions[0].title.length > 30 && questions[0].title.length < long.length, 'a prefix of the title');
  assert.equal(questions[0].source, 'Notes ?');
});

test('paintBox keeps the question indexed and draws inside the box', async () => {
  const added = await appendQuestion(await coverOnly(), first);
  const before = (await indexOf(added.bytes)).questions[0];
  for (const content of [{ image: image(50, 500) }, { text: 'Replacement text for the question, long enough to wrap onto several lines of the box. '.repeat(3) }]) {
    const painted = await paintBox(added.bytes, 2, before.stem.pdf.box, content);
    const { questions, report } = await indexOf(painted);
    assert.deepEqual(report.unplaced, []);
    assert.equal(questions.length, 1);
    assert.deepEqual(questions[0].stem.pdf, before.stem.pdf, 'the crop box is unchanged');
    assert.equal(questions[0].title, before.title);
    assert.equal(questions[0].solution.pdf.length, 1);
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await paintBox(added.bytes, 2, [30, 100, 500, 200], { text: 'Hello painted box' })), verbosity: 0 }).promise;
  const content = await (await doc.getPage(2)).getTextContent();
  const painted = content.items.find((i) => i.str === 'Hello painted box');
  assert.ok(painted, 'the text is on the page');
  assert.ok(painted.transform[4] === 30 && 841.89 - painted.transform[5] > 100 && 841.89 - painted.transform[5] < 120, 'at the top-left of the box');
  await assert.rejects(() => paintBox(added.bytes, 9, [0, 0, 10, 10], { text: 'x' }), /No page 9/);
});

test('removePages drops the pages and the question leaves the index', async () => {
  let bytes = (await appendQuestion(await coverOnly(), first)).bytes;
  bytes = (await appendQuestion(bytes, { ...first, number: 2, title: 'Second question', stem: { text: 'Two.' }, solution: { text: 'Answer two.' } })).bytes;
  assert.equal((await indexOf(bytes)).pageCount, 5);

  const out = await removePages(bytes, [5, 99, 4, 5, 0]);
  const { questions, report, pageCount } = await indexOf(out);
  assert.equal(pageCount, 3);
  assert.deepEqual(report.unplaced, []);
  assert.deepEqual(questions.map((q) => q.title), ['Statics - find the reaction']);
  assert.equal(questions[0].solution.pdf.length, 1, 'the first question keeps its solution');
  assert.equal((await indexOf(await removePages(bytes, []))).pageCount, 5, 'nothing to remove');
});

test('dataUrlToImage reads png and jpeg data URLs and refuses other types', () => {
  const bytes = png(2, 2, [1, 2, 3]);
  const url = `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
  const out = dataUrlToImage(url);
  assert.equal(out.type, 'png');
  assert.deepEqual(Array.from(out.bytes), Array.from(bytes));
  assert.equal(dataUrlToImage('data:image/jpeg;base64,/9j/4A==').type, 'jpg');
  assert.throws(() => dataUrlToImage('data:image/webp;base64,AAAA'), /Unsupported image type "image\/webp"/);
  assert.throws(() => dataUrlToImage('hello'), /Not a data URL/);
});
