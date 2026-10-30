import { DEFAULT_AGENT_URL, normaliseAgentUrl } from '../../shared/solve-agent.js';
import { getFile } from './library.js';
import { drawCrop, openPdf } from './pdf.js';

const AGENT_URL_KEY = 'solveAgentUrl';
const MAX_IMAGE_SIDE = 2048;

export function readAgentUrl() {
  try {
    return normaliseAgentUrl(localStorage.getItem(AGENT_URL_KEY)) || DEFAULT_AGENT_URL;
  } catch {
    return DEFAULT_AGENT_URL;
  }
}

export function saveAgentUrl(value) {
  const url = normaliseAgentUrl(value);
  if (!url) throw new Error('Enter a complete HTTPS address without a username or password.');
  localStorage.setItem(AGENT_URL_KEY, url);
  return url;
}

export async function questionImage(set, question) {
  const { imageData, image, pdf } = question.stem;
  if (imageData) return (await fetch(imageData)).blob();
  if (image) return getFile(set.id, image);
  if (!pdf || !set.manifest.pdf) return null;

  const doc = await openPdf(set.id, set.manifest.pdf);
  const canvas = document.createElement('canvas');
  const width = Math.min(1600, Math.round(pdf.box[2] - pdf.box[0]));
  await drawCrop(doc, pdf, canvas, width);
  return canvasBlob(canvas);
}

function canvasBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The question image could not be rendered.'))), 'image/png');
  });
}

async function asPng(blob) {
  if (blob.type === 'image/png') return blob;
  if (typeof createImageBitmap !== 'function') throw new Error('This browser cannot prepare the image for the clipboard.');
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not prepare the image for the clipboard.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await canvasBlob(canvas);
  } finally {
    bitmap.close();
  }
}

// ClipboardItem keeps the prompt and image together when supported. The caller has already
// copied the text, so an unsupported image write still leaves a useful prompt on the clipboard.
export async function copyPromptAndImage(prompt, image) {
  if (!navigator.clipboard || typeof navigator.clipboard.write !== 'function' || typeof ClipboardItem === 'undefined') return false;
  const png = await asPng(image);
  await navigator.clipboard.write([new ClipboardItem({
    'text/plain': new Blob([prompt], { type: 'text/plain' }),
    'image/png': png,
  })]);
  return true;
}
