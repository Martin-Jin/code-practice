// Keeps an imported practice PDF and its question set in step, both ways.
//   PDF -> app   The PDF file can be linked (Chromium browsers, File System Access API). When the linked file has
//                changed, the set is indexed again; answers, stats and notes stay (see mergeIndex in shared/pdfindex.js).
//                A PDF that can no longer be read as a practice PDF is refused and the old copy stays.
//   app -> PDF   Adding a question, replacing a question's image or text, and deleting a question can be written into
//                the PDF (shared/pdfwrite.js). Written to the linked file when there is one; otherwise the updated
//                PDF is downloaded to replace the original with. Either way the app's stored copy is updated too.
// Only sets the app indexed itself from a PDF ("generated" sets) can sync: a set with a hand-made .questions.json
// takes its questions from that file.
import { appendQuestion, paintBox, removePages, dataUrlToImage, setSections, sectionEdits } from '../../shared/pdfwrite.js';
import { groupLines, headerItems } from '../../shared/pdfindex.js';
import { loadPdfjs } from './pdfjs.js';
import * as db from './db.js';
import { state, notify } from './store.js';
import { indexPdf, importSet, getFile } from './library.js';

export const canLink = typeof window !== 'undefined' && 'showOpenFilePicker' in window;
export const canSync = (record) => !!record && !!record.generated && !!record.manifest.pdf;

export const getLink = (setId) => state.libHandles[setId] || null;

async function permitted(handle, ask) {
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return ask ? (await handle.requestPermission(opts)) === 'granted' : false;
}

// Asks for a PDF and links it to the set. Must be called from a click.
export async function linkPdf(setId) {
  const [handle] = await window.showOpenFilePicker({ types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }] });
  const link = { setId, handle, name: handle.name, linkedAt: new Date().toISOString() };
  await db.put('libHandles', link);
  state.libHandles[setId] = link;
  notify();
  return refreshFrom(setId, await handle.getFile());
}

export async function unlinkPdf(setId) {
  await db.remove('libHandles', setId);
  delete state.libHandles[setId];
  notify();
}

// Reads `file` as the set's PDF: indexes it, merges with the set and stores it. Throws, leaving the set as it was, if the
// file is not a usable practice PDF. Returns the merge report ({ kept, added, renamed, droppedTitles }).
async function refreshFrom(setId, file) {
  const record = state.library.sets[setId];
  const item = await indexPdf({ path: record.indexedFrom || record.manifest.pdf, file });
  if (item.set.id !== setId) throw new Error('That PDF would make a different set, not update this one.');
  if (!item.set.questions.some((q) => q.stem.pdf)) throw new Error('No questions were found in that PDF, so the set was left as it was.');
  await importSet(item);
  return item.merge;
}

// Looks at the linked file and re-indexes the set if it has changed since the copy the app holds. Quiet when
// nothing changed or permission has not been given yet (`ask` is true from a click, which may prompt). Returns the report, or null.
export async function checkForUpdate(setId, ask = false) {
  const link = getLink(setId);
  const record = state.library.sets[setId];
  if (!link || !canSync(record)) return null;
  if (!(await permitted(link.handle, ask))) return null;
  const file = await link.handle.getFile();
  const stored = record.files[record.manifest.pdf];
  if (stored && stored.size === file.size && stored.modified === file.lastModified) return null;
  return refreshFrom(setId, file);
}

// The PDF's current bytes: the linked file when allowed, else the app's stored copy.
async function currentBytes(setId, ask) {
  const link = getLink(setId);
  if (link && (await permitted(link.handle, ask))) return new Uint8Array(await (await link.handle.getFile()).arrayBuffer());
  const blob = await getFile(setId, state.library.sets[setId].manifest.pdf);
  if (!blob) throw new Error('The stored copy of the PDF is missing. Add the folder again.');
  return new Uint8Array(await blob.arrayBuffer());
}

// Runs `change(bytes) -> new bytes` on the set's PDF and saves the result as above. Returns { written, report }:
// `written` is true when the linked file was overwritten, false when the updated PDF was downloaded instead.
// Must be called from a click, because writing the file may need permission.
export async function applyToPdf(setId, change) {
  const record = state.library.sets[setId];
  const link = getLink(setId);
  const next = await change(await currentBytes(setId, true));
  let file;
  let written = false;
  if (link && (await permitted(link.handle, true))) {
    const w = await link.handle.createWritable();
    await w.write(next);
    await w.close();
    file = await link.handle.getFile();
    written = true;
  } else {
    file = new File([next], record.manifest.pdf, { type: 'application/pdf', lastModified: Date.now() });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = record.manifest.pdf;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  return { written, report: await refreshFrom(setId, file) };
}

// ---- the three changes ----

// Webp (what pasted screenshots are stored as) is turned into PNG, which the PDF writer takes.
async function pngImage(dataUrl) {
  if (!dataUrl.startsWith('data:image/webp')) return dataUrlToImage(dataUrl);
  const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = dataUrl; });
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  return dataUrlToImage(c.toDataURL('image/png'));
}

// question as saved by the add dialog; images: { path: data URL }. The new question goes at the end of the PDF.
export async function addQuestionToPdf(setId, question, images) {
  const record = state.library.sets[setId];
  const stem = {};
  if (question.stem.text) stem.text = question.stem.text;
  if (question.stem.image) stem.image = await pngImage(images[question.stem.image]);
  let solution = null;
  if (question.solution) {
    solution = {};
    if (question.solution.text) solution.text = question.solution.text;
    if (question.solution.images) solution.images = await Promise.all(question.solution.images.map((p) => pngImage(images[p])));
  }
  const number = record.manifest.questions.filter((q) => q.stem.pdf).length + 1;
  return applyToPdf(setId, async (bytes) => (await appendQuestion(bytes, { number, section: question.section, title: question.title, source: question.source, stem, solution })).bytes);
}

// Puts new content over a PDF question's crop (what: 'stem' | 'solution'). content: { image: data URL } or { text }; a
// solution may take { images: [data URL, ...] } instead, one per solution page of the PDF, in order. Solution pages the
// new content does not reach are removed (not left blank), and the PDF cannot take more images than it has solution
// pages. The "Worked solution (i/n)" headers of the pages that stay are not redrawn, so they may still show the old n.
export async function replaceInPdf(setId, question, what, content) {
  const crops = what === 'stem' ? [question.stem.pdf] : (question.solution && question.solution.pdf) || [];
  if (!crops.length) throw new Error(`This ${what} is not part of the PDF.`);
  const images = content.images || (content.image ? [content.image] : []);
  if (images.length > crops.length) throw new Error(`The PDF has ${crops.length} solution ${crops.length === 1 ? 'page' : 'pages'} here, so it can take at most ${crops.length} ${crops.length === 1 ? 'image' : 'images'}.`);
  const paints = await Promise.all(images.map(async (url) => ({ image: await pngImage(url) })));
  const used = Math.max(1, paints.length);
  return applyToPdf(setId, async (bytes) => {
    let out = bytes;
    for (const [i, crop] of crops.slice(0, used).entries()) out = await paintBox(out, crop.page, crop.box, paints[i] || { text: content.text });
    const spare = crops.slice(used).map((crop) => crop.page);
    return spare.length ? removePages(out, spare) : out;
  });
}

// Removes a question's own page and its solution pages from the PDF.
export async function deleteQuestionFromPdf(setId, question) {
  const pages = [question.stem.pdf && question.stem.pdf.page, ...((question.solution && question.solution.pdf) || []).map((c) => c.page)].filter(Boolean);
  return applyToPdf(setId, (bytes) => removePages(bytes, pages));
}

// The header text of one page as the indexer would read it, and its size.
async function headerOf(doc, number) {
  const page = await doc.getPage(number);
  const [x0, , x1, y1] = page.view;
  const content = await page.getTextContent();
  const items = content.items.filter((i) => typeof i.str === 'string').map((i) => ({ str: i.str, x: i.transform[4] - x0, y: y1 - i.transform[5], w: i.width, h: i.height }));
  const used = headerItems(items, x1 - x0);
  page.cleanup();
  return { text: groupLines(used).map((l) => l.text).join(' '), size: Math.round(Math.max(0, ...used.map((i) => i.h)) * 10) / 10 };
}

// Moves a question to another section: its question page and solution pages get the new section in their headers.
export async function moveQuestionInPdf(setId, question, section) {
  const pages = [question.stem.pdf && question.stem.pdf.page, ...((question.solution && question.solution.pdf) || []).map((c) => c.page)].filter(Boolean);
  return applyToPdf(setId, async (bytes) => {
    const pdfjs = await loadPdfjs();
    const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    try {
      const heads = [];
      for (const n of pages) heads.push({ page: n, ...(await headerOf(doc, n)) });
      const edits = sectionEdits(heads, section);
      return await setSections(bytes, edits);
    } finally {
      doc.destroy();
    }
  });
}
