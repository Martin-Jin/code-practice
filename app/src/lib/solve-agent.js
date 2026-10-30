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

function blobDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The question image could not be prepared for rich-text paste.'));
    reader.readAsDataURL(blob);
  });
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function loadImage(blob) {
  const url = URL.createObjectURL(blob);
  const image = new Image();
  const loaded = new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This browser could not decode the question image.'));
  });
  image.src = url;
  return loaded.then(
    (decoded) => ({ image: decoded, url }),
    (error) => { URL.revokeObjectURL(url); throw error; },
  );
}

async function asPng(blob) {
  if (blob.type === 'image/png') return blob;
  let bitmap;
  let fallback;
  try {
    if (typeof createImageBitmap === 'function') {
      try { bitmap = await createImageBitmap(blob); } catch { fallback = await loadImage(blob); }
    } else {
      fallback = await loadImage(blob);
    }
    const source = bitmap || fallback.image;
    const width = bitmap ? bitmap.width : fallback.image.naturalWidth;
    const height = bitmap ? bitmap.height : fallback.image.naturalHeight;
    if (!width || !height) throw new Error('This browser could not determine the question image size.');
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not prepare the image for the clipboard.');
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return await canvasBlob(canvas);
  } finally {
    bitmap?.close();
    if (fallback) URL.revokeObjectURL(fallback.url);
  }
}

// Pass the pending image to ClipboardItem so write() starts during the button click. Firefox
// requires that user activation for clipboard writes and image preparation may take a while.
export function copyPromptAndImage(prompt, image) {
  if (!navigator.clipboard || typeof navigator.clipboard.write !== 'function' || typeof ClipboardItem === 'undefined') return false;
  const png = Promise.resolve(image).then(asPng);
  const html = png.then(async (blob) => {
    const dataUrl = await blobDataUrl(blob);
    return new Blob([
      `<div><pre>${escapeHtml(prompt)}</pre><img src="${dataUrl}" alt="Question image" style="max-width:100%"></div>`,
    ], { type: 'text/html' });
  });
  try {
    return navigator.clipboard.write([new ClipboardItem({
      'text/plain': new Blob([prompt], { type: 'text/plain' }),
      'text/html': html,
      'image/png': png,
    })]).then(() => true);
  } catch (error) {
    return Promise.reject(error);
  }
}
