import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { scanFolder, indexPdf, importSet, requestPersistence, storageStatus, mb } from '../lib/library.js';
import Icon from './Icon.jsx';
import { Modal, useDialogs } from './Dialogs.jsx';
import AddQuestionDialog from './AddQuestion.jsx';
import { FormulaToSetsDialog, ExportSetsDialog } from './SetTools.jsx';
import { toast } from './Toasts.jsx';
import { openWelcome } from './Welcome.jsx';

const DOCS = 'https://github.com/martin-jin/practice-questions/blob/main/docs';
const FORMAT_DOC = `${DOCS}/question-set-format.md`;
const STATUS = { new: ['New', 'accent'], update: ['Changed', 'warn'], current: ['Up to date', 'ok'] };

function SetChoice({ item, picked, onToggle }) {
  const { set, errors, skipped, missing, status, warnings = [], merge } = item;
  const usable = !!set;
  return (
    <div className="card pad" style={{ display: 'grid', gap: 6, opacity: usable ? 1 : 0.85 }}>
      <label className="check" style={{ alignItems: 'flex-start' }}>
        <input type="checkbox" disabled={!usable} checked={!!picked} onChange={() => onToggle(item.path)} style={{ marginTop: 3 }} />
        <span style={{ display: 'grid', gap: 4 }}>
          <b>{usable ? set.title : item.path}</b>
          {usable && <span className="muted">{item.path}</span>}
        </span>
      </label>
      {usable && (
        <div className="meta" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className={`chip ${STATUS[status][1]}`}>{STATUS[status][0]}</span>
          {set.course && <span className="chip">{set.course}</span>}
          <span className="chip">{plural(set.questions.length, 'question')}</span>
          <span className="chip">{mb(item.bytes)}</span>
          {set.pdf && <span className="chip">PDF</span>}
          {item.generated && <span className="chip">Indexed here</span>}
        </div>
      )}
      {errors.length > 0 && <div className="notice" role="alert">{errors.join(' ')}</div>}
      {merge && (
        <div className="notice">
          This updates the copy already in this browser: {plural(merge.kept, 'question')} keep their stats and answers
          {merge.renamed > 0 ? ` (${merge.renamed} matched although the title or source changed)` : ''}, {merge.added} {merge.added === 1 ? 'is' : 'are'} new.
          {merge.droppedTitles.length > 0 && <> {plural(merge.droppedTitles.length, 'question')} {merge.droppedTitles.length === 1 ? 'is' : 'are'} no longer in the PDF and will disappear from the set (their stats stay saved, in case they come back): {merge.droppedTitles.slice(0, 3).join('; ')}{merge.droppedTitles.length > 3 ? '; …' : ''}.</>}
        </div>
      )}
      {warnings.length > 0 && <div className="notice">{warnings.join(' ')}</div>}
      {missing.length > 0 && (
        <div className="notice">
          {plural(missing.length, 'file')} named in the set {missing.length === 1 ? 'is' : 'are'} not in the folder: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ', …' : ''}. Those questions will show without it.
        </div>
      )}
      {skipped.length > 0 && (
        <details className="notice">
          <summary>{plural(skipped.length, 'question')} will be left out because of problems</summary>
          <ul style={{ paddingLeft: 18, marginTop: 6 }}>
            {skipped.slice(0, 20).map((s) => <li key={s.number}>Question {s.number}{s.title ? ` (${s.title})` : ''}: {s.problems.join('; ')}.</li>)}
            {skipped.length > 20 && <li>…and {skipped.length - 20} more.</li>}
          </ul>
        </details>
      )}
    </div>
  );
}

// Scans the chosen folder, lets the user tick the sets to import, and copies them in.
export function ImportDialog({ files, close }) {
  const { open } = useDialogs();
  const [phase, setPhase] = useState('scanning');   // scanning | review | importing | failed
  const [scan, setScan] = useState(null);
  const [picked, setPicked] = useState({});         // manifest path -> ticked
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [indexing, setIndexing] = useState(null);   // { path, page, pages } while a PDF is being read
  const [auto, setAuto] = useState(false);          // true while the PDFs found are being read one after another
  const [failed, setFailed] = useState({});         // PDF path -> why it could not be read
  const alive = useRef(true);

  useEffect(() => {
    let live = true;
    alive.current = true;
    scanFolder(files).then(async (s) => {
      if (!live) return;
      setScan(s);
      setPicked(Object.fromEntries(s.sets.filter((x) => x.set && x.status !== 'current').map((x) => [x.path, true])));
      setPhase('review');
      // A PDF with no manifest beside it is read straight away, one at a time (each takes a while).
      setAuto(true);
      for (const pdf of s.pdfs.filter((p) => !p.indexed || p.changed)) { if (!alive.current) return; await index(pdf); }
      if (alive.current) setAuto(false);
    }).catch((e) => { if (live) { setError(`Could not read the folder: ${e.message}`); setPhase('failed'); } });
    return () => { live = false; alive.current = false; };
  }, [files]);

  const todo = scan ? scan.sets.filter((x) => x.set && picked[x.path]) : [];

  // Reads a PDF with no manifest beside it and adds the questions it finds to the list.
  async function index(pdf) {
    setFailed((f) => { const { [pdf.path]: _, ...rest } = f; return rest; });
    setIndexing({ path: pdf.path, page: 0, pages: 0 });
    try {
      const item = await indexPdf(pdf, (page, pages) => { if (alive.current) setIndexing({ path: pdf.path, page, pages }); });
      if (!alive.current) return;
      setScan((s) => ({
        ...s,
        sets: [...s.sets.filter((x) => x.path !== item.path), item].sort((a, b) => a.path.localeCompare(b.path)),
        pdfs: s.pdfs.map((p) => (p.path === pdf.path ? { ...p, indexed: item.set.title, changed: false } : p)),
      }));
      setPicked((p) => ({ ...p, [item.path]: true }));
    } catch (e) {
      if (alive.current) setFailed((f) => ({ ...f, [pdf.path]: e.message }));
    }
    if (alive.current) setIndexing(null);
  }
  const toggle = (path) => setPicked((p) => ({ ...p, [path]: !p[path] }));

  const run = async () => {
    requestPersistence();   // from this click, so the browser may ask; not awaited
    setError('');
    setPhase('importing');
    try {
      let n = 0;
      for (const item of todo) {
        setMessage(`Copying ${item.set.title} (${++n} of ${todo.length})…`);
        await importSet(item);
      }
      close(true);
      toast(`Imported ${plural(todo.length, 'set')}, ${plural(todo.reduce((q, x) => q + x.set.questions.length, 0), 'question')}.`);
    } catch (e) {
      setError(`Nothing more was imported. ${e.message}`);
      setPhase('review');
    }
  };

  const busy = phase === 'scanning' || phase === 'importing' || !!indexing || auto;
  return (
    <Modal
      wide title="Add questions from a folder" onClose={() => !busy && close(false)}
      footer={(
        <>
          <button type="button" className="btn" disabled={phase === 'importing'} onClick={() => close(false)}>Cancel</button>
          <button type="button" className="btn primary" disabled={busy || phase === 'failed' || todo.length === 0} onClick={run}>
            {todo.length ? `Import ${plural(todo.length, 'set')}` : 'Import'}
          </button>
        </>
      )}
    >
      {phase === 'scanning' && <div className="running"><span className="spinner" /> Reading the folder…</div>}
      {phase === 'importing' && <div className="running"><span className="spinner" /> {message}</div>}
      {phase === 'failed' && <div className="notice" role="alert">{error}</div>}
      {scan && phase !== 'scanning' && (
        <>
          <p className="muted">
            Looked at {plural(scan.scanned, 'file')} and found {scan.usable} the app can use. Nothing is uploaded: the sets you tick are copied into this browser, and your folder is not changed.
          </p>
          {scan.sets.length === 0 && (
            <div className="notice">
              No question sets here. A set is a file ending in <code>.questions.json</code> with its images (and PDF) beside it. <a href={FORMAT_DOC} target="_blank" rel="noreferrer">How sets are laid out</a>.
            </div>
          )}
          {scan.sets.map((item) => <SetChoice key={item.path} item={item} picked={picked[item.path]} onToggle={toggle} />)}
          {scan.pdfs.length > 0 && (
            <div className="card pad" style={{ display: 'grid', gap: 8 }}>
              <b>{plural(scan.pdfs.length, 'PDF')} without a question set file</b>
              <span className="muted">The app reads each practice PDF itself and lists its questions, one after another (about half a minute each), provided the PDF is laid out the way the app expects (<a href="#" onClick={(e) => { e.preventDefault(); openWelcome(open, 'tutorial', 'pdf'); }}>see the tutorial</a>). To keep the result beside the PDF instead, run <code>node tools/index-pdf.js</code> from the repo.</span>
              {scan.pdfs.map((p) => (
                <div key={p.path} style={{ display: 'grid', gap: 4 }}>
                  <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                    <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{p.path} <span className="muted">({mb(p.size)})</span></span>
                    {indexing && indexing.path === p.path
                      ? <span className="running"><span className="spinner" /> Page {indexing.page} of {indexing.pages || '…'}</span>
                      : failed[p.path]
                        ? <button type="button" className="btn sm" disabled={busy} onClick={() => index(p)}>Try again</button>
                        : p.indexed && !p.changed
                          ? <span className="chip ok">Indexed</span>
                          : <span className="muted">Waiting…</span>}
                  </div>
                  {failed[p.path] && <div className="notice" role="alert">Could not read it: {failed[p.path]}</div>}
                </div>
              ))}
            </div>
          )}
          {error && phase !== 'failed' && <div className="notice" role="alert">{error}</div>}
        </>
      )}
    </Modal>
  );
}

function StorageNote() {
  const st = useStore();
  const [info, setInfo] = useState(null);
  const count = Object.keys(st.library.sets).length;
  useEffect(() => { if (count) storageStatus().then(setInfo); }, [count]);
  if (!count || !info) return null;
  return (
    <p className="muted">
      This site is using {mb(info.usage)} of browser storage.{' '}
      {info.persisted ? 'The browser has agreed not to clear it automatically.' : 'The browser may clear it if the disk runs low; you can re-add the folder at any time. Progress is separate: use Backup in Settings.'}
    </p>
  );
}

// The round button at the bottom right that fans out a few labelled options. `options`: [[label, icon, run]].
// With `swap` the main icon turns into a cross while open (otherwise the plus turns by itself).
export function Fab({ options, icon, label, swap, children }) {
  const [expanded, setExpanded] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!expanded) return undefined;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setExpanded(false); };
    const esc = (e) => { if (e.key === 'Escape') setExpanded(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [expanded]);

  return (
    <div className={`fab${expanded ? ' open' : ''}${swap ? ' swap' : ''}`} ref={box}>
      {options.map(([label, icon, run], i) => (
        <button key={label} type="button" className="fab-opt" style={{ transitionDelay: expanded ? `${(options.length - 1 - i) * 50}ms` : '0ms' }}
          tabIndex={expanded ? 0 : -1} aria-label={label} onClick={() => { setExpanded(false); run(); }}>
          <span className="ico"><Icon name={icon} /></span>
          <span className="label">{label}</span>
        </button>
      ))}
      <button type="button" className="fab-main" aria-expanded={expanded} aria-label={expanded ? 'Close the menu' : label} title={label} onClick={() => setExpanded(!expanded)}>
        <Icon name={swap && expanded ? 'x' : icon} />
      </button>
      {children}
    </div>
  );
}

// The floating add button: press it and round buttons pop up; hovering one slides out what it does.
// "Add or update a folder" chooses a folder of sets or PDFs; "Add a question" makes one from a screenshot; the last two
// put a formula sheet into several sets and export chosen sets with their files.
export function AddFab() {
  const { open } = useDialogs();
  const input = useRef(null);
  const onChoose = (e) => {
    const files = [...e.target.files];
    e.target.value = '';   // so choosing the same folder again still fires
    if (files.length) open(({ close }) => <ImportDialog files={files} close={close} />);
  };
  const options = [
    ['Add a question from a screenshot', 'task', () => open(({ close }) => <AddQuestionDialog close={close} />)],
    ['Add or update a folder of sets or PDFs', 'folder', () => input.current.click()],
    ['Add a formula sheet to several sets', 'sidebar', () => open(({ close }) => <FormulaToSetsDialog close={close} />)],
    ['Export chosen sets', 'exit', () => open(({ close }) => <ExportSetsDialog close={close} />)],
  ];
  return (
    <Fab options={options} icon="plus" label="Add to your library">
      <input ref={input} type="file" webkitdirectory="" multiple hidden onChange={onChoose} />
    </Fab>
  );
}

// Under the library: how storage is used, and a link to the tutorial's section on adding questions.
export function LibraryNotes() {
  const { open } = useDialogs();
  return (
    <section>
      <p className="muted">
        Use the <b>+</b> button at the bottom right to add a folder of sets or PDFs, make a question from a screenshot, add a formula sheet to several sets, or export chosen sets.
      </p>
      <StorageNote />
      <p>
        <button type="button" className="btn ghost sm" onClick={() => openWelcome(open, 'tutorial', 'add')}><Icon name="help" /> How to add questions (tutorial)</button>
      </p>
    </section>
  );
}
