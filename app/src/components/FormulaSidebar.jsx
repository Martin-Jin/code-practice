import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { sheetsOf, addFormulaSheets, removeFormulaSheet, formulaBlob } from '../lib/formulas.js';
import { ZoomPan } from './Lightbox.jsx';
import Icon from './Icon.jsx';
import { toast } from './Toasts.jsx';
import { useDialogs } from './Dialogs.jsx';
import { loadPdfjs } from '../lib/pdfjs.js';

function PdfViewer({ setId, sheet }) {
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState('');
  const [renderError, setRenderError] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [width, setWidth] = useState(0);
  const frame = useRef(null);
  const canvas = useRef(null);

  useEffect(() => {
    let live = true;
    let loadingTask = null;
    let loadedPdf = null;
    const load = async () => {
      try {
        const blob = await formulaBlob(setId, sheet.path);
        if (!blob) throw new Error('The saved PDF could not be found.');
        const pdfjs = await loadPdfjs();
        if (!live) return;
        loadingTask = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
        loadedPdf = await loadingTask.promise;
        if (live) setPdf(loadedPdf);
      } catch (e) {
        if (live) setError(`Could not open this PDF: ${e.message}`);
      }
    };
    void load();
    return () => {
      live = false;
      if (loadedPdf) void loadedPdf.destroy();
      else if (loadingTask) void loadingTask.destroy();
    };
  }, [setId, sheet.path]);

  useEffect(() => {
    const element = frame.current;
    if (!element) return undefined;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [pdf]);

  useEffect(() => {
    if (!pdf || !width || !canvas.current) return undefined;
    let live = true;
    let renderTask = null;
    setRenderError('');
    const draw = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (!live) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = width / baseViewport.width;
        const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: scale * pixelRatio });
        const target = canvas.current;
        const context = target.getContext('2d');
        if (!context) throw new Error('This browser could not create a canvas for the PDF.');
        target.width = Math.ceil(viewport.width);
        target.height = Math.ceil(viewport.height);
        target.style.width = `${baseViewport.width * scale}px`;
        target.style.height = `${baseViewport.height * scale}px`;
        context.fillStyle = '#fff';
        context.fillRect(0, 0, target.width, target.height);
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (e) {
        if (live && e.name !== 'RenderingCancelledException') setRenderError(`Could not render this page: ${e.message}`);
      }
    };
    void draw();
    return () => {
      live = false;
      if (renderTask) renderTask.cancel();
    };
  }, [pdf, pageNumber, width]);

  return (
    <>
      {error && <div className="notice bad" role="alert">{error}</div>}
      {!pdf && !error && <div className="pdf-wait"><span className="spinner" /></div>}
      {pdf && (
        <>
          <div className="formula-pdf-controls">
            <button type="button" className="btn ghost sm" aria-label="Previous PDF page" disabled={pageNumber <= 1} onClick={() => setPageNumber((n) => n - 1)}>‹</button>
            <span>Page {pageNumber} of {pdf.numPages}</span>
            <button type="button" className="btn ghost sm" aria-label="Next PDF page" disabled={pageNumber >= pdf.numPages} onClick={() => setPageNumber((n) => n + 1)}>›</button>
          </div>
          {renderError && <div className="notice bad" role="alert">{renderError}</div>}
          <div className="formula-pdf-frame" ref={frame}>
            <ZoomPan><canvas ref={canvas} role="img" aria-label={`${sheet.name}, page ${pageNumber}`} /></ZoomPan>
          </div>
        </>
      )}
    </>
  );
}

// One sheet: PDFs render in the app so keyboard shortcuts remain available; images can be zoomed and moved.
function ImageSheet({ setId, sheet }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let live = true;
    let made = null;
    setUrl(null);
    formulaBlob(setId, sheet.path).then((blob) => {
      if (!live || !blob) return;
      made = URL.createObjectURL(blob);
      setUrl(made);
    });
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [setId, sheet.path]);
  if (!url) return <div className="pdf-wait"><span className="spinner" /></div>;
  return <ZoomPan><img className="lib-image" src={url} alt={sheet.name} /></ZoomPan>;
}

function Sheet({ setId, sheet }) {
  return sheet.type === 'pdf' ? <PdfViewer setId={setId} sheet={sheet} /> : <ImageSheet setId={setId} sheet={sheet} />;
}

const MIN_WIDTH = 280;
const DEFAULT_WIDTH = 520;
const loadWidth = () => { try { const w = Number(localStorage.getItem('formulaWidth')); return w >= MIN_WIDTH ? w : DEFAULT_WIDTH; } catch { return DEFAULT_WIDTH; } };

// A side panel of the set's formula sheets, one tab each. With none, it offers the upload. `hidden` keeps it mounted
// but invisible, so showing it again is instant instead of reloading the sheet.
export default function FormulaSidebar({ setId, onClose, hidden = false }) {
  const st = useStore();
  const { confirm } = useDialogs();
  const sheets = sheetsOf(setId);
  const [path, setPath] = useState(null);
  const input = useRef(null);
  const [width, setWidth] = useState(loadWidth);
  const [drag, setDrag] = useState(false);
  const current = sheets.find((s) => s.path === path) || sheets[0];

  // The panel starts exactly where the top bar ends; the bar's height changes when it wraps on a narrow or zoomed window.
  const [top, setTop] = useState(52);
  useEffect(() => {
    const nav = document.querySelector('.shell-nav');
    if (!nav) return undefined;
    const measure = () => setTop(Math.round(nav.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  const onChoose = async (e) => {
    const files = e.target.files;
    try {
      const n = await addFormulaSheets(setId, files);
      if (!n) toast('Choose a PDF or an image.', 'bad');
    } catch (err) { toast(`Could not add it: ${err.message}`, 'bad'); }
    e.target.value = '';
  };
  const remove = async () => {
    if (await confirm({ title: `Remove ${current.name}?`, body: 'The copy kept in this browser is deleted. Your own file is not touched.', confirmText: 'Remove', danger: true })) await removeFormulaSheet(setId, current.path);
  };

  // Drag the left edge to resize, like the task pane in the coding questions; double-click puts it back.
  const move = (e) => setWidth(Math.round(Math.min(window.innerWidth - 120, Math.max(MIN_WIDTH, window.innerWidth - e.clientX))));
  const stop = () => {
    if (!drag) return;
    setDrag(false);
    document.body.classList.remove('resizing', 'resizing-x');
    try { localStorage.setItem('formulaWidth', String(width)); } catch { /* storage blocked */ }
  };

  return (
    <aside className="formula-side" aria-label="Formula sheets" aria-hidden={hidden || undefined} inert={hidden ? '' : undefined}
      style={{ width, top, ...(hidden ? { visibility: 'hidden', pointerEvents: 'none' } : {}) }}>
      <div className={`splitter v formula-handle${drag ? ' drag' : ''}`} role="separator" aria-orientation="vertical" title="Drag to resize. Double-click to reset."
        onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); document.body.classList.add('resizing', 'resizing-x'); setDrag(true); }}
        onPointerMove={(e) => { if (drag) move(e); }} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
        onDoubleClick={() => { setWidth(DEFAULT_WIDTH); try { localStorage.removeItem('formulaWidth'); } catch { /* storage blocked */ } }} />
      <div className={`tabs${sheets.length ? '' : ' bare'}`} role="tablist">
        {sheets.map((s) => <button key={s.path} type="button" role="tab" className="tab" aria-selected={current === s} onClick={() => setPath(s.path)} title={s.name}>{s.name.replace(/\.[^.]+$/, '')}</button>)}
        <span className="spacer" />
        {sheets.length > 0 && <button type="button" className="btn ghost sm icon-only" onClick={() => input.current.click()} aria-label="Add a formula sheet" title="Add a formula sheet"><Icon name="plus" /></button>}
        {current && <button type="button" className="btn ghost sm icon-only" onClick={remove} aria-label="Remove this formula sheet" title="Remove this formula sheet"><Icon name="trash" /></button>}
        <button type="button" className="btn ghost sm icon-only" onClick={onClose} aria-label="Hide formula sheets" title="Hide (Alt+T)"><Icon name="x" /></button>
      </div>
      <div className="formula-body">
        {current ? <Sheet key={current.path} setId={setId} sheet={current} /> : (
          <div className="empty">
            <p>This set has no formula sheets yet.</p>
            <button type="button" className="btn primary" onClick={() => input.current.click()}><Icon name="plus" /> Upload a formula sheet</button>
            <p className="muted" style={{ marginTop: 8 }}>A PDF or an image. You can add several, and they show here as tabs.</p>
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="application/pdf,image/*" multiple hidden onChange={onChoose} />
    </aside>
  );
}
