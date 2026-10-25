import { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { renderMarkup } from '../../shared/markup.js';
import { getFile } from '../lib/library.js';
import { openPdf, drawCrop, trimmedBox } from '../lib/pdf.js';

export function Markup({ text, className = '' }) {
  return <div className={`markup ${className}`} dangerouslySetInnerHTML={{ __html: renderMarkup(text) }} />;
}

// An image stored with the set.
export function LibImage({ setId, path, alt = '' }) {
  const [url, setUrl] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let live = true;
    let made = null;
    setUrl(null);
    setMissing(false);
    getFile(setId, path).then((blob) => {
      if (!live) return;
      if (!blob) { setMissing(true); return; }
      made = URL.createObjectURL(blob);
      setUrl(made);
    });
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [setId, path]);
  if (missing) return <div className="notice">The image <code>{path}</code> is not in the folder this set was imported from.</div>;
  return url ? <img className="lib-image" src={url} alt={alt} /> : <div className="pdf-wait"><span className="spinner" /></div>;
}

// A rectangle of a PDF page, drawn at the width of its container (up to 1.7x its natural size).
// trim: cut the blank space below the last ink, for solution pages.
export function PdfCrop({ setId, pdf, crop, trim = false, label }) {
  const box = useRef(null);
  const canvas = useRef(null);
  const [width, setWidth] = useState(0);
  const [state, setState] = useState({ phase: 'loading', error: '' });

  useEffect(() => {
    const el = box.current;
    const observer = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth)));
    observer.observe(el);
    setWidth(Math.floor(el.clientWidth));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return undefined;
    let live = true;
    let task = null;
    const timer = setTimeout(async () => {
      try {
        const doc = await openPdf(setId, pdf);
        const shown = trim ? { ...crop, box: await trimmedBox(doc, setId, pdf, crop) } : crop;
        if (!live) return;
        const natural = shown.box[2] - shown.box[0];
        await drawCrop(doc, shown, canvas.current, Math.min(width, Math.round(natural * 1.7)), (t) => { task = t; });
        if (live) setState({ phase: 'done', error: '' });
      } catch (e) {
        if (live && !(e && e.name === 'RenderingCancelledException')) setState({ phase: 'failed', error: e.message || String(e) });
      }
    }, 60);   // wait out a window resize before redrawing
    return () => { live = false; clearTimeout(timer); if (task) task.cancel(); };
  }, [setId, pdf, crop, trim, width]);

  return (
    <div ref={box} className="pdf-crop" role="img" aria-label={label}>
      {state.phase === 'loading' && <div className="pdf-wait"><span className="spinner" /></div>}
      {state.phase === 'failed' && <div className="notice" role="alert">Could not draw this part of the PDF: {state.error}</div>}
      <canvas ref={canvas} hidden={state.phase !== 'done'} />
    </div>
  );
}

// What a question shows above its answer boxes: typed text, an image, or a PDF crop.
export function Stem({ set, question }) {
  const { text, image, pdf } = question.stem;
  return (
    <div className="stem">
      {text && <Markup text={text} />}
      {image && <LibImage setId={set.id} path={image} alt="Figure for the question" />}
      {pdf && <PdfCrop setId={set.id} pdf={set.manifest.pdf} crop={pdf} label={`Question: ${question.title}`} />}
    </div>
  );
}

// A worked solution: PDF pages, images and text, in that order.
export function Solution({ set, question }) {
  const s = question.solution;
  if (!s) return <p className="muted">This set has no worked solution for this question.</p>;
  return (
    <div className="stem">
      {(s.pdf || []).map((crop) => <PdfCrop key={crop.page} setId={set.id} pdf={set.manifest.pdf} crop={crop} trim label={`Worked solution, page ${crop.page}`} />)}
      {(s.images || []).map((path) => <LibImage key={path} setId={set.id} path={path} alt="Worked solution" />)}
      {s.text && <Markup text={s.text} />}
    </div>
  );
}
