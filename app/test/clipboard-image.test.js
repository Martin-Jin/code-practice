import test from 'node:test';
import assert from 'node:assert/strict';
import { copyPromptAndImage } from '../src/lib/solve-agent.js';

function replaceGlobal(name, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, value });
  return () => {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  };
}

test('clipboard image write starts before the image is ready', async () => {
  let writeStarted = false;
  let clipboardItem;
  let resolveImage;
  const image = new Promise((resolve) => { resolveImage = resolve; });
  const restoreNavigator = replaceGlobal('navigator', {
    clipboard: {
      write: async ([item]) => {
        writeStarted = true;
        assert.equal(item.items['text/plain'].type, 'text/plain');
        await item.items['image/png'];
      },
    },
  });
  const restoreClipboardItem = replaceGlobal('ClipboardItem', class {
    constructor(items) { this.items = items; clipboardItem = this; }
  });
  try {
    const copied = copyPromptAndImage('Tutor prompt', image);
    assert.equal(writeStarted, true);
    assert.equal(clipboardItem.items['text/plain'].size, 'Tutor prompt'.length);
    resolveImage(new Blob(['png bytes'], { type: 'image/png' }));
    assert.equal(await clipboardItem.items['image/png'].then((blob) => blob.type), 'image/png');
    assert.equal(await copied, true);
  } finally {
    restoreNavigator();
    restoreClipboardItem();
  }
});

test('SVG questions fall back to image-element rendering when bitmap decoding fails', async () => {
  const drawn = [];
  const replaced = [];
  const canvas = {
    getContext: () => ({ drawImage: (image) => drawn.push(image) }),
    toBlob: (callback, type) => callback(new Blob(['converted'], { type })),
  };
  class TestImage {
    naturalWidth = 640;
    naturalHeight = 480;
    set src(value) { this.url = value; queueMicrotask(() => this.onload()); }
  }
  const restore = [
    replaceGlobal('navigator', { clipboard: { write: async ([item]) => { replaced.push(await item.items['image/png']); } } }),
    replaceGlobal('ClipboardItem', class { constructor(items) { this.items = items; } }),
    replaceGlobal('createImageBitmap', async () => { throw new DOMException('Cannot decode SVG', 'InvalidStateError'); }),
    replaceGlobal('Image', TestImage),
    replaceGlobal('document', { createElement: () => canvas }),
  ];
  const createObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const revokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:question-svg' });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: (url) => assert.equal(url, 'blob:question-svg') });
  try {
    assert.equal(await copyPromptAndImage('Prompt', Promise.resolve(new Blob(['svg'], { type: 'image/svg+xml' }))), true);
    assert.equal(drawn.length, 1);
    assert.equal(drawn[0] instanceof TestImage, true);
    assert.equal(replaced[0].type, 'image/png');
  } finally {
    restore.reverse().forEach((restoreGlobal) => restoreGlobal());
    if (createObjectURL) Object.defineProperty(URL, 'createObjectURL', createObjectURL);
    else delete URL.createObjectURL;
    if (revokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', revokeObjectURL);
    else delete URL.revokeObjectURL;
  }
});
