import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { scanFolder, indexPdf, importSet, removeSet, requestPersistence, storageStatus, mb } from '../lib/library.js';
import Icon from './Icon.jsx';
import { Modal, useDialogs } from './Dialogs.jsx';
import AddQuestionDialog from './AddQuestion.jsx';
import { toast } from './Toasts.jsx';

const DOCS = 'https://github.com/martin-jin/practice-questions/blob/main/docs';
const FORMAT_DOC = `${DOCS}/question-set-format.md`;
const STATUS = { new: ['New', 'accent'], update: ['Changed', 'warn'], current: ['Up to date', 'ok'] };

function SetChoice({ item, picked, onToggle }) {
  const { set, errors, skipped, missing, status, warnings = [] } = item;
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
function ImportDialog({ files, close }) {
  const [phase, setPhase] = useState('scanning');   // scanning | review | importing | failed
  const [scan, setScan] = useState(null);
  const [picked, setPicked] = useState({});         // manifest path -> ticked
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [indexing, setIndexing] = useState(null);   // { path, page, pages } while a PDF is being read

  useEffect(() => {
    let live = true;
    scanFolder(files).then((s) => {
      if (!live) return;
      setScan(s);
      setPicked(Object.fromEntries(s.sets.filter((x) => x.set && x.status !== 'current').map((x) => [x.path, true])));
      setPhase('review');
    }).catch((e) => { if (live) { setError(`Could not read the folder: ${e.message}`); setPhase('failed'); } });
    return () => { live = false; };
  }, [files]);

  const todo = scan ? scan.sets.filter((x) => x.set && picked[x.path]) : [];

  // Reads a PDF with no manifest beside it and adds the questions it finds to the list.
  const index = async (pdf) => {
    setError('');
    setIndexing({ path: pdf.path, page: 0, pages: 0 });
    try {
      const item = await indexPdf(pdf, (page, pages) => setIndexing({ path: pdf.path, page, pages }));
      setScan((s) => ({
        ...s,
        sets: [...s.sets.filter((x) => x.path !== item.path), item].sort((a, b) => a.path.localeCompare(b.path)),
        pdfs: s.pdfs.map((p) => (p.path === pdf.path ? { ...p, indexed: item.set.title, changed: false } : p)),
      }));
      setPicked((p) => ({ ...p, [item.path]: true }));
    } catch (e) {
      setError(`Could not read ${pdf.path}: ${e.message}`);
    }
    setIndexing(null);
  };
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

  const busy = phase === 'scanning' || phase === 'importing' || !!indexing;
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
              <span className="muted">The app can find the questions in a practice PDF itself if the PDF is laid out the way the app expects (see How to add questions). It takes about half a minute. To keep the result beside the PDF instead, run <code>node tools/index-pdf.js</code> from the repo.</span>
              {scan.pdfs.map((p) => (
                <div key={p.path} className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                  <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{p.path} <span className="muted">({mb(p.size)})</span></span>
                  {indexing && indexing.path === p.path
                    ? <span className="running"><span className="spinner" /> Page {indexing.page} of {indexing.pages || '…'}</span>
                    : p.indexed && !p.changed
                      ? <span className="chip ok">Indexed</span>
                      : <button type="button" className="btn sm" disabled={busy} onClick={() => index(p)}>{p.indexed ? 'Index again (file changed)' : 'Find the questions'}</button>}
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

// A short guide to every way of getting questions in. The full version is docs/adding-questions.md.
function HelpDialog({ close }) {
  return (
    <Modal wide title="How to add questions" onClose={() => close()} footer={<button type="button" className="btn primary" onClick={() => close()}>Done</button>}>
      <h3>A practice PDF</h3>
      <ol className="steps">
        <li>Press <b>Add or update a folder…</b> and choose the folder that holds the PDF.</li>
        <li>Press <b>Find the questions</b> next to it. The app reads the PDF (about half a minute) and lists what it found, checked against the PDF's cover.</li>
        <li>Tick it and press <b>Import</b>. Open it from <b>Your library</b> with <b>Browse</b>.</li>
      </ol>
      <p>The PDF has to be laid out a certain way (a cover that lists the questions, then each question page followed by its worked solution), because the app finds the questions from the layout. Build it with the <a href={`${DOCS}/practice-pdf-prompt.md`} target="_blank" rel="noreferrer">agent prompt</a> that does it for you, or format it by hand to the same rules.</p>
      <p className="muted">To keep the result beside the PDF, run <code>node tools/index-pdf.js "file.pdf"</code> in the repo's <code>app</code> folder, then import the folder. Nothing is uploaded; your folder is not changed.</p>

      <h3>A screenshot, or a question you write</h3>
      <ol className="steps">
        <li>Press <b>Add a question…</b>, then Ctrl+V to paste a screenshot (or drop or choose an image).</li>
        <li>Drag a box over the question, give it a title, a section and the parts to answer (a number with its unit, multiple choice, or self-marked).</li>
        <li>Press <b>Save question</b>. It goes in <b>My questions</b>, and is included in a backup.</li>
      </ol>

      <h3>Let an agent do it</h3>
      <p>An AI agent can build the practice PDF from your tutorial sheets (<a href={`${DOCS}/practice-pdf-prompt.md`} target="_blank" rel="noreferrer">prompt and layout</a>), or add one question to a <code>.questions.json</code> file from a screenshot, following <a href={FORMAT_DOC} target="_blank" rel="noreferrer">the question set format</a>.</p>

      <h3>After importing</h3>
      <ul>
        <li>Open a question and use the <b>Answer key</b> tab to add the answer, so the app can check what you type.</li>
        <li><b>Mark as difficult</b> (or press D) flags a question. Turn on <b>Settings &gt; Practice</b> to draw those more often.</li>
        <li>Practise a set from its page, and press <b>Back up now</b> in Settings now and then: your progress is only in this browser.</li>
      </ul>

      <h3>More coding questions</h3>
      <p>Coding questions are C++ files in the repo, not added here. Follow section 2 of <a href={`${DOCS}/adding-questions.md`} target="_blank" rel="noreferrer">the adding-questions guide</a>.</p>
      <p className="muted"><a href={`${DOCS}/adding-questions.md`} target="_blank" rel="noreferrer">Full guide</a> · <a href={FORMAT_DOC} target="_blank" rel="noreferrer">How question sets are laid out</a></p>
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

// Dashboard section: the sets imported from the user's folders, and the button that adds more.
export function LibrarySection() {
  const st = useStore();
  const { open, confirm } = useDialogs();
  const input = useRef(null);
  const sets = Object.values(st.library.sets).sort((a, b) => a.title.localeCompare(b.title));

  const onChoose = (e) => {
    const files = [...e.target.files];
    e.target.value = '';   // so choosing the same folder again still fires
    if (files.length) open(({ close }) => <ImportDialog files={files} close={close} />);
  };

  const remove = async (set) => {
    const ok = await confirm({
      title: `Remove ${set.title}?`,
      body: 'This deletes the copy kept in this browser. Your folder is not touched, and you can add it again later.',
      confirmText: 'Remove', danger: true,
    });
    if (!ok) return;
    try { await removeSet(set.id); } catch (e) { toast(`Could not remove it: ${e.message}`, 'bad'); }
  };

  return (
    <section>
      <div className="section-title with-action">
        <h2>Your library</h2><span className="muted">{sets.length}</span>
        <button type="button" className="btn ghost sm" onClick={() => open(({ close }) => <HelpDialog close={close} />)}><Icon name="help" /> How to add questions</button>
      </div>
      {sets.length === 0
        ? (
          <div className="empty">
            Question sets from folders on this computer (practice PDFs, quiz screenshots) show up here. Nothing is uploaded: the app keeps a copy in this browser. Press <b>How to add questions</b> to get started.
          </div>
        )
        : (
          <div className="grid">
            {sets.map((set) => (
              <div key={set.id} className="card set-card">
                <div>
                  <h2>{set.title}</h2>
                  {set.course && <p className="muted" style={{ marginTop: 4 }}>{set.course}</p>}
                </div>
                <div className="meta">
                  <span className="chip">{plural(set.manifest.questions.length, 'question')}</span>
                  <span className="chip">{plural(new Set(set.manifest.questions.map((q) => q.section)).size, 'section')}</span>
                  <span className="chip">{mb(set.bytes)}</span>
                  {set.missing.length > 0 && <span className="chip warn">{plural(set.missing.length, 'file')} missing</span>}
                </div>
                <div className="actions">
                  <a className="btn primary" href={`#/lib/${encodeURIComponent(set.id)}`}>Browse</a>
                  {set.userOwned
                    ? <button type="button" className="btn" onClick={() => open(({ close }) => <AddQuestionDialog close={close} />)}><Icon name="plus" /> Add a question</button>
                    : <button type="button" className="btn" onClick={() => remove(set)}><Icon name="trash" /> Remove</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      <div className="row" style={{ marginTop: 12 }}>
        <button type="button" className="btn" onClick={() => input.current.click()}><Icon name="plus" /> Add or update a folder…</button>
        <input ref={input} type="file" webkitdirectory="" multiple hidden onChange={onChoose} />
        <button type="button" className="btn" onClick={() => open(({ close }) => <AddQuestionDialog close={close} />)}><Icon name="plus" /> Add a question…</button>
        <span className="muted">Choose the folder that holds your <code>.questions.json</code> files (choose it again after changing them), or make a question from a screenshot.</span>
      </div>
      <StorageNote />
    </section>
  );
}
