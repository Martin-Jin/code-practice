// Turns the text and drawing operators of a practice-questions PDF into a question-set
// manifest (shared/questionset.js), with no AI. It relies on the fixed layout of the PDFs the
// vault's "Combined questions prompt" builds:
//   question page   header: section on the left, "Question N" on the right; title "QN. Topic - what is asked";
//                   the question; a dashed rule; blank working space; footer "Source: ..."
//   solution page   header: "Section | QN: title" and "Worked solution (i/n)"; the solution; the same footer
// Positions are in PDF points measured from the top-left of the page as drawn. Pure functions:
// the browser (src/lib/pdf.js) and the command-line tool (tools/index-pdf.js) both feed them.
import { FORMAT, VERSION } from './questionset.js';

const MARGIN = 30;          // crops start this far from the page edge, a little outside the 36 pt text margin
const HEADER_BAND = 42;     // header text sits above this
const HEADER_RULE = 36;     // solution crops start below the header rule (drawn at about 32)
const LEFT = 36;            // the generator's text margin
const TITLE_GAP = 8;        // question crops start this far below the title's baseline
const FOOTER_GAP = 12;      // solution crops end this far above the footer baseline
const RULE_GAP = 2;         // question crops end this far above the dashed rule

// ---- text ----

// items: { str, x, y, w } with y the baseline measured from the top of the page. Returns the
// page's lines, top to bottom, each { y, x, text }. Runs on one baseline are joined left to right.
export function groupLines(items, tolerance = 2) {
  const rows = [];
  for (const it of items.filter((i) => i.str.trim() !== '').sort((a, b) => a.y - b.y)) {
    const row = rows.find((r) => Math.abs(r.y - it.y) <= tolerance);
    if (row) row.items.push(it); else rows.push({ y: it.y, items: [it] });
  }
  return rows.map((r) => {
    const sorted = r.items.sort((a, b) => a.x - b.x);
    let text = '';
    let end = null;
    for (const it of sorted) {
      if (end !== null && it.x - end > 1.5 && !text.endsWith(' ') && !it.str.startsWith(' ')) text += ' ';
      text += it.str;
      end = it.x + (it.w || 0);
    }
    return { y: r.y, x: sorted[0].x, text: text.replace(/\s+/g, ' ').trim() };
  }).sort((a, b) => a.y - b.y);
}

const near = (a, b, tolerance) => Math.abs(a - b) <= tolerance;

// What kind of page this is, and what it says. null for a page that is neither (the cover).
// Only text where the generator puts its own header, title and footer counts: the slide
// content copied into the crops has text of its own near the page edges (clipped away when
// drawn, but still present in the text layer), and it must not be read as a header.
// items: { str, x, y, w, h } with h the font height.
export function classifyPage(items, width, height) {
  const text = (list) => groupLines(list).map((l) => l.text).join(' ');
  const header = text(items.filter((i) => near(i.y, 26, 1.5) && i.h >= 8 && i.h <= 9.2 && i.x >= LEFT - 1 && (near(i.x, LEFT, 1) || i.x + i.w <= width - LEFT + 2)));   // a long left title runs under the right text
  const footerLine = groupLines(items.filter((i) => i.y > height - 40 && i.h >= 6.8 && i.h <= 8.4 && i.x >= LEFT - 1 && i.x <= width - LEFT)).find((l) => /^Source:/i.test(l.text));
  const footer = footerLine ? { source: footerLine.text.replace(/^Source:\s*/i, '').replace(/\s+\d+$/, '').trim(), y: footerLine.y } : null;

  // The solution header's left text can run under "Worked solution (i/n)" on a long title, so the
  // two are compared without spaces, and only the section and number are read from the left.
  if (/Workedsolution/i.test(header.replace(/\s+/g, '')) || /\|\s*Q\d+:/.test(header)) {
    const m = header.match(/^(.*?)\s*\|\s*Q(\d+):/);
    return m ? { kind: 'solution', number: Number(m[2]), section: m[1].trim(), footer } : null;
  }
  // "Question N (extra working space)" is a blank page continuing question N.
  const q = header.match(/Question (\d+)(\s*\(([^)]*)\))?/);
  if (q && q[3]) return { kind: 'extra', number: Number(q[1]) };
  if (q) {
    const title = groupLines(items.filter((i) => i.y >= 48 && i.y <= 66 && i.h >= 11.5 && i.h <= 13.5 && near(i.x, LEFT, 1)))
      .find((l) => /^Q\d+\.\s+\S/.test(l.text));
    return {
      kind: 'question', number: Number(q[1]), section: header.slice(0, q.index).trim(),
      title: title ? title.text.replace(/^Q\d+\.\s+/, '') : null, titleY: title ? title.y : null, footer,
    };
  }
  return null;
}

// ---- drawing ----

// The dashed rule that ends the question on a question page, as its distance from the top of
// the page, or null. ops: pdf.js's operator list ({ fnArray, argsArray }); OPS: its opcode
// table. Only a long horizontal dashed line near the margins counts, so dashed lines inside the
// copied slide content (which are scaled and sit elsewhere) are ignored.
export function findDashedRule(ops, OPS, width, height) {
  let dashed = false;
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];
    if (fn === OPS.setDash) dashed = Array.isArray(args[0]) && args[0].length > 0;
    else if (fn === OPS.constructPath && dashed) {
      const path = Array.from(args[1][0] || []);
      if (path.length !== 6) continue;
      const [, x1, y1, , x2, y2] = path;
      const top = height - y1;
      if (Math.abs(y1 - y2) < 0.5 && Math.abs(x2 - x1) >= width - 2 * 36 - 40 && top > 60 && top < height - 40) return top;
    }
  }
  return null;
}

// Reads every page of an open pdf.js document into the shape buildIndex wants. `pdfjs` is the
// pdf.js module (the browser build or the Node "legacy" build), passed in so this file stays
// free of imports. Only question pages are asked for their drawing operators, which is the slow part.
export async function readPages(pdfjs, doc, onProgress) {
  const pages = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const page = await doc.getPage(number);
    const [x0, y0, x1, y1] = page.view;
    const width = x1 - x0;
    const height = y1 - y0;
    const content = await page.getTextContent();
    const items = content.items.filter((i) => typeof i.str === 'string')
      .map((i) => ({ str: i.str, x: i.transform[4] - x0, y: y1 - i.transform[5], w: i.width, h: i.height }));
    const info = classifyPage(items, width, height);
    const dashY = info && info.kind === 'question' && info.title ? findDashedRule(await page.getOperatorList(), pdfjs.OPS, width, height) : null;
    pages.push({ number, width, height, items, dashY });
    page.cleanup();
    if (onProgress) onProgress(number, doc.numPages);
  }
  return pages;
}

// ---- uids ----

// The first 8 hex digits of SHA-1 over "course|source|title" (lower case), as "q-xxxxxxxx".
// The same question always gets the same uid, so deleting a manifest and indexing again
// reattaches saved progress.
export async function uidFor(course, source, title, salt = '') {
  const bytes = new TextEncoder().encode(`${course}|${source}|${title}${salt}`.toLowerCase());
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-1', bytes));
  return `q-${Array.from(hash.slice(0, 4), (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---- the index ----

// The title from the question's page is cut short when long; the cover's copy may be longer.
// A cover title ending in "..." is itself cut, so the dots are dropped.
function fullTitle(pageTitle, coverTitle) {
  if (!coverTitle) return pageTitle;
  const clean = coverTitle.replace(/\s*(\.\.\.|…)$/, '');
  return clean.length > pageTitle.length && clean.startsWith(pageTitle) ? clean : pageTitle;
}


// pages: [{ number, width, height, items, dashY }] in page order (dashY from findDashedRule, or
// null). fileName: the PDF's name, used for the set's id and course. Returns { manifest, report }
// where report lists what could not be placed, so nothing is dropped silently.
export async function buildIndex(pages, fileName) {
  const base = fileName.replace(/\.pdf$/i, '');
  const first = pages[0] ? groupLines(pages[0].items) : [];
  const coverTitle = (first.find((l) => l.text) || { text: '' }).text;
  const title = coverTitle || base;
  const course = ((`${title} ${base}`).match(/\b([A-Z]{3,10})\s?(\d{3})\b/) || []).slice(1).join('');
  const expectedMatch = first.map((l) => l.text).join(' ').match(/(\d+)\s+questions\b/);

  // The cover's table of contents has each title in full; a long title is cut short on its own page.
  const firstQuestion = pages.findIndex((p) => { const i = classifyPage(p.items, p.width, p.height); return i && i.kind === 'question'; });
  const cover = new Map();
  for (const page of pages.slice(0, Math.max(firstQuestion, 0))) {
    for (const line of groupLines(page.items)) {
      const m = line.text.match(/^Q(\d+)\.\s+(.*?)\s+\d+$/);
      if (m) cover.set(Number(m[1]), m[2]);
    }
  }

  const questions = [];
  const unplaced = [];
  const warnings = [];
  let current = null;
  let extraPages = 0;

  for (const page of pages) {
    const info = classifyPage(page.items, page.width, page.height);
    if (!info) { if (questions.length) unplaced.push(page.number); continue; }

    if (info.kind === 'extra') {  // a blank working page continuing the question before it
      if (current && current.number === info.number) extraPages++; else unplaced.push(page.number);
      continue;
    }
    if (info.kind === 'question') {
      if (!info.title) { unplaced.push(page.number); continue; }
      current = { number: info.number, section: info.section, title: fullTitle(info.title, cover.get(info.number)), source: info.footer ? info.footer.source : '', page: page.number, flags: [], solution: [] };
      const bottom = page.dashY !== null ? page.dashY - RULE_GAP : null;
      if (bottom === null) {
        current.flags.push('needs-crop');
        warnings.push(`Question ${info.number} (page ${page.number}): no dashed rule found, so its crop runs to the footer.`);
      }
      current.box = [MARGIN, info.titleY + TITLE_GAP, page.width - MARGIN, bottom !== null ? bottom : (info.footer ? info.footer.y - FOOTER_GAP : page.height - 60)];
      questions.push(current);
    } else {
      if (!current || current.number !== info.number) { unplaced.push(page.number); continue; }
      current.solution.push({ page: page.number, box: [MARGIN, HEADER_RULE, page.width - MARGIN, info.footer ? info.footer.y - FOOTER_GAP : page.height - 40] });
    }
  }

  const used = new Set();
  const out = [];
  for (const q of questions) {
    let uid = await uidFor(course, q.source, q.title);
    for (let n = 2; used.has(uid); n++) uid = await uidFor(course, q.source, q.title, `|${n}`);
    used.add(uid);
    const flags = [...q.flags];
    if (!q.solution.length) flags.push('no-solution');
    out.push({
      uid, title: q.title, section: q.section || 'General', source: q.source, marks: null, tags: [],
      stem: { pdf: { page: q.page, box: q.box.map((n) => Math.round(n * 10) / 10) } },
      parts: [{ label: '', type: 'self' }],
      solution: q.solution.length ? { pdf: q.solution.map((s) => ({ page: s.page, box: s.box.map((n) => Math.round(n * 10) / 10) })) } : null,
      flags,
    });
  }

  if (expectedMatch && Number(expectedMatch[1]) !== out.length) {
    warnings.push(`The cover lists ${expectedMatch[1]} questions but ${out.length} were found.`);
  }
  if (unplaced.length) warnings.push(`${unplaced.length} page${unplaced.length === 1 ? '' : 's'} could not be placed: ${unplaced.slice(0, 12).join(', ')}${unplaced.length > 12 ? ', …' : ''}.`);

  return {
    manifest: { format: FORMAT, version: VERSION, id: slug(base) || 'pdf-questions', title, course, pdf: fileName, questions: out },
    report: { questions: out.length, expected: expectedMatch ? Number(expectedMatch[1]) : null, unplaced, extraPages, warnings },
  };
}

const STRUCTURAL_FLAGS = ['needs-crop', 'no-solution'];
const sameQuestion = (q) => `${(q.source || '').toLowerCase()}|${q.title.toLowerCase()}`;

// Indexing a PDF again: `existing` is the manifest already saved, `fresh` the new index. Questions
// are matched by uid (or by source and title), and keep what the user has added: answers (parts),
// marks, tags and their own flags. Crops, titles, sections and solutions come from the PDF again.
// Questions that are not from the PDF (added from screenshots) are kept at the end, and
// PDF questions that are no longer in the PDF are dropped and counted.
export function mergeIndex(existing, fresh) {
  const byUid = new Map(existing.questions.map((q) => [q.uid, q]));
  const byText = new Map(existing.questions.map((q) => [sameQuestion(q), q]));
  const matched = new Set();
  const questions = fresh.questions.map((q) => {
    const old = byUid.get(q.uid) || byText.get(sameQuestion(q));
    if (!old || matched.has(old.uid)) return q;
    matched.add(old.uid);
    return {
      ...q, uid: old.uid, parts: old.parts, marks: old.marks, tags: old.tags,
      flags: [...new Set([...q.flags, ...old.flags.filter((f) => !STRUCTURAL_FLAGS.includes(f))])],
    };
  });
  const own = existing.questions.filter((q) => !matched.has(q.uid) && !q.stem.pdf);
  const dropped = existing.questions.filter((q) => !matched.has(q.uid) && q.stem.pdf).length;
  return {
    manifest: { ...fresh, id: existing.id, title: existing.title, course: existing.course, questions: [...questions, ...own] },
    dropped,
  };
}
