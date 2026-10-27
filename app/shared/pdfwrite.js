// Edits a practice-questions PDF (docs/practice-pdf-prompt.md) in place: appends a question page
// and its solution pages in exactly the layout shared/pdfindex.js reads, paints new content over
// a crop box, and removes pages. Pure functions over bytes (pdf-lib), so the browser and the
// Node tests both use them. Positions are in points from the top-left of the page, like the
// indexer's, and are converted to PDF's bottom-left origin only at the point of drawing.
import {
  PDFDocument, StandardFonts, rgb, pushGraphicsState, popGraphicsState, setLineWidth, setStrokingColor,
  setDashPattern, moveTo, lineTo, stroke,
} from 'pdf-lib';

// New pages are A4 like the generator's, and use its margins: the indexer's header, title and
// footer tests are written around these numbers.
const W = 595.28;
const H = 841.89;
const LEFT = 36;
const RIGHT = W - 36;
const HEADER_Y = 26;        // header baseline
const HEADER_SIZE = 8.5;
const RULE_Y = 32;          // thin rule under a solution page's header
const TITLE_Y = 55;         // question title baseline
const TITLE_SIZE = 12.5;
const FOOTER_Y = H - 20;    // "Source:" baseline
const FOOTER_SIZE = 7.5;
const NUMBER_Y = H - 16;    // page number baseline
const TEXT_SIZE = 10;
const LINE = 13;            // line height for body text
const GAP = 8;              // gap between a block of content and what follows
const QUESTION_TOP = 66;    // content starts here on a question page (the crop starts at TITLE_Y + 8)
const WORKING_SPACE = 150;  // blank space kept above the footer, rule included
const SOLUTION_TOP = 44;    // content starts here on a solution page (below the rule at 32, crop starts at 36)
const SOLUTION_BOTTOM = H - 44;
const MIN_IMAGE_SPACE = 120;  // an image is moved to its own page if less than this is left under the text

// ---- text ----

// WinAnsi is all the standard Helvetica can encode. Anything else becomes "?" so one stray
// Greek letter does not make the whole page fail to draw. Runs of whitespace other than
// newlines collapse to a space; control characters are dropped.
function clean(font, text) {
  const supported = new Set(font.getCharacterSet());
  let out = '';
  for (const ch of String(text === undefined || text === null ? '' : text).replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/ /g, ' ')) {
    if (ch === '\n') out += ch;
    else if (supported.has(ch.codePointAt(0))) out += ch;
    else if (ch.codePointAt(0) >= 32) out += '?';
  }
  return out;
}

const widthOf = (font, size, text) => font.widthOfTextAtSize(text, size);

// Cuts text to fit `max` points on one line. No ellipsis: the indexer prefers the cover's full
// title when the page's title is a prefix of it, which "..." would break.
function fit(font, size, text, max) {
  let line = clean(font, text).replace(/\s+/g, ' ').trim();
  while (line && widthOf(font, size, line) > max) line = line.slice(0, -1);
  return line.trimEnd();
}

// Wraps text to `max` points, breaking on spaces (and inside a word wider than a line).
function wrap(font, size, text, max) {
  const lines = [];
  for (const paragraph of clean(font, text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const trial = line ? `${line} ${word}` : word;
      if (widthOf(font, size, trial) <= max) { line = trial; continue; }
      if (line) lines.push(line);
      line = word;
      while (line && widthOf(font, size, line) > max) {
        let n = line.length - 1;
        while (n > 1 && widthOf(font, size, line.slice(0, n)) > max) n--;
        lines.push(line.slice(0, n));
        line = line.slice(n);
      }
    }
    lines.push(line);
  }
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

// ---- images ----

// "data:image/png;base64,..." or "data:image/jpeg;base64,..." to { bytes, type } for the functions
// below. Other types (webp, svg) are refused rather than guessed at: pdf-lib embeds only PNG and
// JPEG, so the caller converts first.
export function dataUrlToImage(dataUrl) {
  const m = typeof dataUrl === 'string' ? dataUrl.match(/^data:([^;,]*)(;base64)?,([\s\S]*)$/i) : null;
  if (!m) throw new Error('Not a data URL.');
  const mime = m[1].toLowerCase();
  const type = mime === 'image/png' ? 'png' : mime === 'image/jpeg' || mime === 'image/jpg' ? 'jpg' : null;
  if (!type) throw new Error(`Unsupported image type "${m[1] || 'unknown'}": convert it to PNG or JPEG first.`);
  if (!m[2]) throw new Error('The image data URL is not base64.');
  const binary = atob(m[3]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, type };
}

const embed = (doc, image) => (image.type === 'png' ? doc.embedPng(image.bytes) : doc.embedJpg(image.bytes));

// The size an image is drawn at: as wide as the space allows, or shorter if it would be too tall.
function fitSize(image, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / image.width, Math.max(maxHeight, 1) / image.height);
  return { width: image.width * scale, height: image.height * scale };
}

// ---- drawing ----

// A page-bound drawing helper that takes top-left positions.
function surface(page, font) {
  const box = page.getMediaBox();
  const x = (v) => box.x + v;
  const y = (top) => box.y + box.height - top;
  return {
    text(str, left, baseline, { size = TEXT_SIZE, face = font, color = rgb(0, 0, 0) } = {}) {
      if (str) page.drawText(str, { x: x(left), y: y(baseline), size, font: face, color });
    },
    right(str, edge, baseline, size) {
      if (str) page.drawText(str, { x: x(edge - widthOf(font, size, str)), y: y(baseline), size, font, color: rgb(0, 0, 0) });
    },
    // Raw operators rather than drawLine: the indexer's dashed-rule test wants a plain m, l, S
    // path, and drawLine's output has a second move in it.
    line(x0, x1, top, { dash = [], thickness = 0.5 } = {}) {
      page.pushOperators(
        pushGraphicsState(), setLineWidth(thickness), setStrokingColor(rgb(0.2, 0.2, 0.2)), setDashPattern(dash, 0),
        moveTo(x(x0), y(top)), lineTo(x(x1), y(top)), stroke(), popGraphicsState(),
      );
    },
    rect(x0, top0, x1, top1, color) {
      page.drawRectangle({ x: x(x0), y: y(top1), width: x1 - x0, height: top1 - top0, color, borderWidth: 0 });
    },
    image(img, left, top, width, height) {
      page.drawImage(img, { x: x(left), y: y(top + height), width, height });
    },
  };
}

function drawFooter(s, font, source, number) {
  s.text(fit(font, FOOTER_SIZE, `Source: ${source || ''}`, RIGHT - LEFT - 40), LEFT, FOOTER_Y, { size: FOOTER_SIZE });
  s.right(String(number), RIGHT, NUMBER_Y, 8);
}

// Lines of text from `top` (the top of the first line), as many as `maxLines`; returns the top
// below the last line drawn.
function drawLines(s, lines, left, top, maxLines) {
  const shown = lines.slice(0, Math.max(maxLines, 0));
  shown.forEach((line, i) => s.text(line, left, top + TEXT_SIZE + i * LINE));
  return top + shown.length * LINE;
}

// ---- the API ----

// Appends a question page, then its solution pages if it has a solution, to the PDF.
// q: { number, section, title, source, stem: { image?, text? }, solution?: { images?, text? } }
// with images as { bytes, type: 'png' | 'jpg' }. Returns { bytes, firstPage, pageCount }, the page
// numbers (1-based) being those of the pages added. The title is cut to one line without an
// ellipsis. The layout is the one pdfindex.js reads, so the result needs no further changes
// to be found by it (the cover's table of contents is the caller's).
export async function appendQuestion(pdfBytes, q) {
  const doc = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const firstPage = doc.getPageCount() + 1;
  const stem = q.stem || {};
  const solution = q.solution || {};
  const number = q.number;
  const width = RIGHT - LEFT;

  // Question page.
  {
    const s = surface(doc.addPage([W, H]), font);
    const rightText = `Question ${number}`;
    s.right(rightText, RIGHT, HEADER_Y, HEADER_SIZE);
    s.text(fit(font, HEADER_SIZE, q.section || '', width - widthOf(font, HEADER_SIZE, rightText) - 12), LEFT, HEADER_Y, { size: HEADER_SIZE });
    s.text(fit(bold, TITLE_SIZE, `Q${number}. ${q.title || 'Question'}`, width), LEFT, TITLE_Y, { size: TITLE_SIZE, face: bold });

    const maxBottom = H - WORKING_SPACE;
    let top = QUESTION_TOP;
    if (stem.text) {
      const lines = wrap(font, TEXT_SIZE, stem.text, width);
      const share = stem.image ? 0.5 : 1;
      top = drawLines(s, lines, LEFT, top, Math.floor(((maxBottom - top) * share) / LINE));
      top += GAP;
    }
    if (stem.image) {
      const img = await embed(doc, stem.image);
      const size = fitSize(img, width, maxBottom - top);
      s.image(img, LEFT, top, size.width, size.height);
      top += size.height + GAP;
    }
    s.line(LEFT, RIGHT, Math.max(top, QUESTION_TOP + 20), { dash: [3, 3] });
    drawFooter(s, font, q.source, firstPage);
  }

  // Solution pages: text first (flowing over as many pages as it needs), then one page per
  // image. The first image sits under the text when there is room for it, else on its own page.
  const pages = [];
  const textLines = solution.text ? wrap(font, TEXT_SIZE, solution.text, width) : [];
  const perPage = Math.floor((SOLUTION_BOTTOM - SOLUTION_TOP) / LINE);
  for (let i = 0; i < textLines.length; i += perPage) pages.push({ lines: textLines.slice(i, i + perPage) });
  const images = [...(solution.images || [])];
  const last = pages[pages.length - 1];
  if (last && images.length) {
    const used = SOLUTION_TOP + last.lines.length * LINE + GAP;
    if (SOLUTION_BOTTOM - used >= MIN_IMAGE_SPACE) last.image = images.shift();
  }
  for (const image of images) pages.push({ lines: [], image });

  for (let i = 0; i < pages.length; i++) {
    const s = surface(doc.addPage([W, H]), font);
    const rightText = `Worked solution (${i + 1}/${pages.length})`;
    s.right(rightText, RIGHT, HEADER_Y, HEADER_SIZE);
    const room = width - widthOf(font, HEADER_SIZE, rightText) - 12;
    const section = fit(font, HEADER_SIZE, q.section || '', room * 0.4);
    const lead = `${section ? `${section}  ` : ''}|  Q${number}: `;
    s.text(lead + fit(font, HEADER_SIZE, q.title || '', room - widthOf(font, HEADER_SIZE, lead)), LEFT, HEADER_Y, { size: HEADER_SIZE });
    s.line(LEFT, RIGHT, RULE_Y);
    let top = SOLUTION_TOP;
    if (pages[i].lines.length) top = drawLines(s, pages[i].lines, LEFT, top, perPage) + GAP;
    if (pages[i].image) {
      const img = await embed(doc, pages[i].image);
      const size = fitSize(img, width, SOLUTION_BOTTOM - top);
      s.image(img, LEFT, top, size.width, size.height);
    }
    drawFooter(s, font, q.source, firstPage + 1 + i);
  }

  return { bytes: await doc.save(), firstPage, pageCount: doc.getPageCount() - firstPage + 1 };
}

// Replaces what is in box = [x0, yTop0, x1, yTop1] (points from the top-left) on page (1-based):
// a white rectangle over it, then content = { image } scaled to fit the box and centred along
// its top, or { text } wrapped from its top-left corner. Text that does not fit the box is cut.
export async function paintBox(pdfBytes, page, box, content) {
  const doc = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  if (!Number.isInteger(page) || page < 1 || page > doc.getPageCount()) throw new Error(`No page ${page} in this PDF.`);
  const [x0, top0, x1, top1] = box;
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const s = surface(doc.getPage(page - 1), font);
  s.rect(x0, top0, x1, top1, rgb(1, 1, 1));
  if (content && content.image) {
    const img = await embed(doc, content.image);
    const size = fitSize(img, x1 - x0, top1 - top0);
    s.image(img, x0 + (x1 - x0 - size.width) / 2, top0, size.width, size.height);
  } else if (content && content.text) {
    drawLines(s, wrap(font, TEXT_SIZE, content.text, x1 - x0), x0, top0, Math.floor((top1 - top0) / LINE));
  }
  return doc.save();
}

// Removes the given pages (1-based). Pages outside the document and repeats are ignored.
export async function removePages(pdfBytes, pages) {
  const doc = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  const count = doc.getPageCount();
  const doomed = [...new Set(pages)].filter((p) => Number.isInteger(p) && p >= 1 && p <= count).sort((a, b) => b - a);
  for (const p of doomed) doc.removePage(p - 1);
  return doc.save();
}
