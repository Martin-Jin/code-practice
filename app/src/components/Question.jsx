import { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import { renderMarkup } from '../../shared/markup.js';
import { getFile } from '../lib/library.js';
import { openPdf, drawCrop, trimmedBox } from '../lib/pdf.js';
import { Enlargeable } from './Lightbox.jsx';

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
  if (!url) return <div className="pdf-wait"><span className="spinner" /></div>;
  return (
    <Enlargeable title={alt || path} render={(width) => <img className="lib-image" src={url} alt={alt} style={{ width, maxWidth: 'none' }} />}>
      <img className="lib-image" src={url} alt={alt} />
    </Enlargeable>
  );
}

// A rectangle of a PDF page, drawn at the width of its container (up to 1.7x its natural size), or at `fixedWidth`
// CSS pixels when given (the enlarged view). trim: cut the blank space below the last ink, for solution pages.
function PdfCanvas({ setId, pdf, crop, trim = false, label, fixedWidth = 0 }) {
  const box = useRef(null);
  const canvas = useRef(null);
  const [width, setWidth] = useState(0);
  const [state, setState] = useState({ phase: 'loading', error: '' });

  useEffect(() => {
    if (fixedWidth) { setWidth(fixedWidth); return undefined; }
    const el = box.current;
    const observer = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth)));
    observer.observe(el);
    setWidth(Math.floor(el.clientWidth));
    return () => observer.disconnect();
  }, [fixedWidth]);

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
        // a canvas has a size limit, so the enlarged view stops short of it
        const cap = fixedWidth ? Math.floor(8000 / (window.devicePixelRatio || 1)) : Math.round(natural * 1.7);
        await drawCrop(doc, shown, canvas.current, Math.min(width, cap), (t) => { task = t; });
        if (live) setState({ phase: 'done', error: '' });
      } catch (e) {
        if (live && !(e && e.name === 'RenderingCancelledException')) setState({ phase: 'failed', error: e.message || String(e) });
      }
    }, 60);   // wait out a window resize before redrawing
    return () => { live = false; clearTimeout(timer); if (task) task.cancel(); };
  }, [setId, pdf, crop, trim, width]);

  return (
    <div ref={box} className={`pdf-crop${fixedWidth ? ' fixed' : ''}`} role="img" aria-label={label}>
      {state.phase === 'loading' && <div className="pdf-wait"><span className="spinner" /></div>}
      {state.phase === 'failed' && <div className="notice" role="alert">Could not draw this part of the PDF: {state.error}</div>}
      <canvas ref={canvas} hidden={state.phase !== 'done'} />
    </div>
  );
}

export function PdfCrop(props) {
  return (
    <Enlargeable title={props.label} render={(width) => <PdfCanvas {...props} fixedWidth={width} />}>
      <PdfCanvas {...props} />
    </Enlargeable>
  );
}

// What a question shows above its answer boxes: typed text, an image, or a PDF crop.
function DataImage({ url, alt }) {
  return <Enlargeable title={alt} render={(width) => <img className="lib-image" src={url} alt={alt} style={{ width, maxWidth: 'none' }} />}><img className="lib-image" src={url} alt={alt} /></Enlargeable>;
}

export function Stem({ set, question }) {
  const { text, image, pdf, imageData } = question.stem;
  return (
    <div className="stem">
      {text && <Markup text={text} />}
      {imageData && <DataImage url={imageData} alt="Figure for the question" />}
      {image && <LibImage setId={set.id} path={image} alt="Figure for the question" />}
      {pdf && <PdfCrop setId={set.id} pdf={set.manifest.pdf} crop={pdf} label={`Question: ${question.title}`} />}
    </div>
  );
}

// A worked solution: PDF pages, images and text, in that order.
export function Solution({ set, question }) {
  const s = question.solution;
  if (!s) return <p className="muted">This set has no worked solution for this question.</p>;
  const pages = (s.pdf || []).map((crop) => {
    const title = `Worked solution, page ${crop.page}`;
    return {
      title,
      crop,
      render: (width) => <PdfCanvas setId={set.id} pdf={set.manifest.pdf} crop={crop} trim label={title} fixedWidth={width} />,
    };
  });
  return (
    <div className="stem">
      {s.imageData && <DataImage url={s.imageData} alt="Worked solution" />}
      {pages.length > 0 && (
        <div className="solution-pages" aria-label="Worked solution pages">
          {pages.map((page, index) => (
            <Enlargeable key={page.crop.page} title={page.title} render={page.render} pages={pages} initialPage={index}>
              <PdfCanvas setId={set.id} pdf={set.manifest.pdf} crop={page.crop} trim label={page.title} />
            </Enlargeable>
          ))}
        </div>
      )}
      {(s.images || []).map((path) => <LibImage key={path} setId={set.id} path={path} alt="Worked solution" />)}
      {s.text && <Markup text={s.text} />}
    </div>
  );
}
