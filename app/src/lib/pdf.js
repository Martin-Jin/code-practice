// Opens the PDFs of imported question sets and draws parts of their pages.
import { getFile } from './library.js';
import { loadPdfjs } from './pdfjs.js';

// The last few opened documents. A 40 MB PDF is held in memory while it is open, so only two stay.
const open = new Map();
const KEEP = 2;

export function openPdf(setId, rel) {
  const key = `${setId}/${rel}`;
  if (open.has(key)) {
    const doc = open.get(key);
    open.delete(key);
    open.set(key, doc);   // most recently used last
    return doc;
  }
  const promise = (async () => {
    const blob = await getFile(setId, rel);
    if (!blob) throw new Error('The PDF is not stored in this browser. Add its folder again from the dashboard.');
    const lib = await loadPdfjs();
    return lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  })();
  open.set(key, promise);
  promise.catch(() => open.delete(key));
  while (open.size > KEEP) {
    const [oldest] = open.keys();
    const old = open.get(oldest);
    open.delete(oldest);
    old.then((d) => d.destroy()).catch(() => {});
  }
  return promise;
}

// Draws the rectangle crop.box (PDF points from the top-left of the page) of crop.page into the
// canvas, `cssWidth` pixels wide. Resolves to the displayed height. A newer call for the same
// canvas should cancel the older one: pass the returned task's cancel via `onTask`.
export async function drawCrop(doc, crop, canvas, cssWidth, onTask) {
  const page = await doc.getPage(crop.page);
  const [x0, y0, x1, y1] = crop.box;
  const boxWidth = x1 - x0;
  const boxHeight = y1 - y0;
  const dpr = window.devicePixelRatio || 1;
  const scale = (cssWidth / boxWidth) * dpr;
  const viewport = page.getViewport({ scale });
  canvas.width = Math.max(1, Math.round(boxWidth * scale));
  canvas.height = Math.max(1, Math.round(boxHeight * scale));
  const height = (boxHeight * cssWidth) / boxWidth;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const task = page.render({ canvas, canvasContext: context, viewport, transform: [1, 0, 0, 1, -x0 * scale, -y0 * scale], background: 'rgb(255,255,255)' });
  if (onTask) onTask(task);
  await task.promise;
  return height;
}

// A solution page is mostly blank below its last line. This finds where the ink ends, so the page
// can be shown without the empty rest. Returns a box with the bottom moved up (never down).
const inkCache = new Map();
export async function trimmedBox(doc, setId, rel, crop) {
  const key = `${setId}/${rel}/${crop.page}`;
  if (inkCache.has(key)) return inkCache.get(key);
  const scale = 0.5;
  const [x0, y0, x1, y1] = crop.box;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((x1 - x0) * scale);
  canvas.height = Math.round((y1 - y0) * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const page = await doc.getPage(crop.page);
  await page.render({ canvas, canvasContext: context, viewport: page.getViewport({ scale }), transform: [1, 0, 0, 1, -x0 * scale, -y0 * scale], background: 'rgb(255,255,255)' }).promise;
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  let last = -1;
  for (let row = height - 1; row >= 0 && last < 0; row--) {
    for (let col = 0; col < width; col++) {
      const i = (row * width + col) * 4;
      if (data[i] < 235 || data[i + 1] < 235 || data[i + 2] < 235) { last = row; break; }
    }
  }
  const bottom = last < 0 ? y1 : Math.min(y1, y0 + (last + 1) / scale + 12);
  const box = [x0, y0, x1, Math.max(bottom, y0 + 40)];
  inkCache.set(key, box);
  return box;
}
