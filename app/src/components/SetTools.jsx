import { useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { sheetsOf, addFormulaSheets, addFormulaSheetsToSets, removeFormulaSheet } from '../lib/formulas.js';
import { downloadSets } from '../lib/backup.js';
import SetPicker, { useLibrarySets } from './SetPicker.jsx';
import Icon from './Icon.jsx';
import { Modal, useDialogs } from './Dialogs.jsx';
import { toast } from './Toasts.jsx';

// Adds one or more formula sheets to every set the user ticks. Each set gets its own copy of the file.
export function FormulaToSetsDialog({ close }) {
  const items = useLibrarySets();
  const [picked, setPicked] = useState(new Set());
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  const go = async () => {
    setBusy(true);
    try {
      const { files: usable, added } = await addFormulaSheetsToSets([...picked], files, { skipSame: true });
      if (!usable) { toast('Choose a PDF or an image.', 'bad'); setBusy(false); return; }
      close(true);
      toast(added ? `Added to ${plural(picked.size, 'set')}.` : 'Those sets already have that sheet.');
    } catch (e) { toast(`Could not add it: ${e.message}`, 'bad'); setBusy(false); }
  };

  return (
    <Modal wide title="Add a formula sheet to sets" onClose={() => !busy && close(false)}
      footer={(
        <>
          <button type="button" className="btn" disabled={busy} onClick={() => close(false)}>Cancel</button>
          <button type="button" className="btn primary" disabled={busy || !files.length || !picked.size} onClick={go}>
            {busy ? 'Saving…' : `Add to ${plural(picked.size, 'set')}`}
          </button>
        </>
      )}>
      <div>
        <button type="button" className="btn" onClick={() => input.current.click()}><Icon name="plus" /> {files.length ? 'Choose other files' : 'Choose a PDF or image'}</button>
        <input ref={input} type="file" accept="application/pdf,image/*" multiple hidden onChange={(e) => { setFiles([...e.target.files]); e.target.value = ''; }} />
        {files.length > 0 && <span className="muted"> {files.map((f) => f.name).join(', ')}</span>}
      </div>
      <SetPicker items={items} picked={picked} onChange={setPicked} />
      <p className="muted">Each set you tick keeps its own copy, so it can be exported on its own with the sheet. A set that already has the same file is left as it is.</p>
    </Modal>
  );
}

// Downloads the ticked sets as one zip: their questions, PDFs, images and formula sheets, but never progress.
export function ExportSetsDialog({ close }) {
  const items = useLibrarySets();
  const [picked, setPicked] = useState(new Set());
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      const name = await downloadSets([...picked]);
      close(true);
      toast(name ? `Saved ${name} to your downloads. Restore it from Settings > Backup to bring the sets back.` : 'Nothing to export.', name ? 'info' : 'bad');
    } catch (e) { toast(`Could not make the file: ${e.message}`, 'bad'); setBusy(false); }
  };

  return (
    <Modal wide title="Export sets" onClose={() => !busy && close(false)}
      footer={(
        <>
          <button type="button" className="btn" disabled={busy} onClick={() => close(false)}>Cancel</button>
          <button type="button" className="btn primary" disabled={busy || !picked.size} onClick={go}>{busy ? 'Making the file…' : `Export ${plural(picked.size, 'set')}`}</button>
        </>
      )}>
      <SetPicker items={items} picked={picked} onChange={setPicked} />
      <p className="muted">One zip with the sets' questions, answer keys, PDFs, images and formula sheets. Your progress is not in it. Open it with <b>Restore from a backup…</b> in Settings on any computer: a set that computer already has keeps its own copy and only gains what is missing. Course PDFs may not be yours to pass on.</p>
    </Modal>
  );
}

// One set's formula sheets: add more or delete any of them (the copy in this browser; your own file is not touched).
export function FormulaSheetsDialog({ setId, close }) {
  useStore();
  const { confirm } = useDialogs();
  const sheets = sheetsOf(setId);
  const input = useRef(null);
  const remove = async (s) => {
    if (!(await confirm({ title: `Remove ${s.name}?`, body: 'The copy kept in this browser is deleted. Your own file is not touched.', confirmText: 'Remove', danger: true }))) return;
    try { await removeFormulaSheet(setId, s.path); } catch (e) { toast(`Could not remove it: ${e.message}`, 'bad'); }
  };
  const onChoose = async (e) => {
    const chosen = e.target.files;
    try { if (!(await addFormulaSheets(setId, chosen))) toast('Choose a PDF or an image.', 'bad'); } catch (err) { toast(`Could not add it: ${err.message}`, 'bad'); }
    e.target.value = '';
  };
  return (
    <Modal title="Formula sheets" onClose={() => close()}
      footer={<><button type="button" className="btn" onClick={() => input.current.click()}><Icon name="plus" /> Add a sheet</button><button type="button" className="btn primary" onClick={() => close()}>Done</button></>}>
      {sheets.length === 0 && <p className="muted">This set has no formula sheets.</p>}
      <div>
        {sheets.map((s) => (
          <div key={s.path} className="sheet-row">
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{s.name} <span className="muted">({s.type === 'pdf' ? 'PDF' : 'image'})</span></span>
            <button type="button" className="btn ghost sm" onClick={() => remove(s)} aria-label={`Remove ${s.name}`}><Icon name="trash" /> Remove</button>
          </div>
        ))}
      </div>
      <input ref={input} type="file" accept="application/pdf,image/*" multiple hidden onChange={onChoose} />
    </Modal>
  );
}
