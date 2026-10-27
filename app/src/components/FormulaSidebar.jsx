import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { sheetsOf, addFormulaSheets, removeFormulaSheet, formulaBlob } from '../lib/formulas.js';
import { ZoomPan } from './Lightbox.jsx';
import Icon from './Icon.jsx';
import { toast } from './Toasts.jsx';
import { useDialogs } from './Dialogs.jsx';

// One sheet: a PDF in the browser's own viewer, or an image that can be zoomed and moved.
function Sheet({ setId, sheet }) {
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
  return sheet.type === 'pdf'
    ? <iframe className="formula-frame" src={url} title={sheet.name} />
    : <ZoomPan><img className="lib-image" src={url} alt={sheet.name} /></ZoomPan>;
}

// A side panel of the set's formula sheets, one tab each. With none, it offers the upload.
export default function FormulaSidebar({ setId, onClose }) {
  const st = useStore();
  const { confirm } = useDialogs();
  const sheets = sheetsOf(setId);
  const [path, setPath] = useState(null);
  const input = useRef(null);
  const current = sheets.find((s) => s.path === path) || sheets[0];

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

  return (
    <aside className="formula-side" aria-label="Formula sheets">
      <div className="tabs" role="tablist">
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
