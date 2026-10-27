import { useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural, timeAgo } from '../lib/format.js';
import { backupStatus, downloadBackup, downloadShare, restoreBackup, readBackupFile, reloadApp } from '../lib/backup.js';
import { summarise } from '../../shared/backup.js';
import { Modal, useDialogs } from './Dialogs.jsx';
import { toast } from './Toasts.jsx';

async function shareQuestions(files) {
  try {
    const name = await downloadShare({ files });
    toast(name ? `Saved ${name} to your downloads.${files ? '' : ' It holds only the questions you made in the app.'}` : 'There is nothing to share yet. Use the + button to add questions.', name ? 'info' : 'bad');
  } catch (e) { toast(`Could not make the file: ${e.message}`, 'bad'); }
}

async function backUpNow(files = false) {
  try { toast(`Saved ${await downloadBackup({ files })} to your downloads.`); } catch (e) { toast(`Could not make the backup: ${e.message}`, 'bad'); }
}

function RestoreDialog({ backup, zip, fileName, close }) {
  const st = useStore();
  const [mode, setMode] = useState('merge');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sum = summarise(backup);
  const setNames = sum.sets.map((id) => st.catalog.sets.find((s) => s.id === id)?.name || id);

  const go = async () => {
    setBusy(true);
    try {
      await restoreBackup(backup, mode, zip);
      close(true);
      toast('Restored. Reloading the page…');
      setTimeout(reloadApp, 700);
    } catch (e) {
      setError(`Nothing was changed. This browser would not save the data${e && e.message ? ` (${e.message})` : ''}.`);
      setBusy(false);
    }
  };

  const share = backup.kind === 'share';
  const options = share ? [{ id: 'merge', title: 'Add these questions', desc: 'Adds the questions in this file to your own. Nothing you have is removed or replaced.' }] : [
    { id: 'merge', title: 'Merge (recommended)', desc: 'Keeps what is in this browser and adds what the file has. Where both have the same run or question, the newer one wins.' },
    { id: 'replace', title: 'Replace everything', desc: 'Erases every run, stat and setting in this browser first, then loads the file.' },
  ];
  return (
    <Modal
      title={share ? 'Add shared questions?' : 'Restore this backup?'} onClose={() => !busy && close(false)}
      footer={(
        <>
          <button type="button" className="btn" disabled={busy} onClick={() => close(false)}>Cancel</button>
          <button type="button" className={`btn ${mode === 'replace' ? 'danger solid' : 'primary'}`} disabled={busy} onClick={go}>
            {busy ? 'Working…' : share ? 'Add questions' : mode === 'replace' ? 'Replace everything' : 'Merge'}
          </button>
        </>
      )}
    >
      <p><b>{fileName}</b>, made {new Date(sum.createdAt).toLocaleString('en-NZ', { dateStyle: 'medium', timeStyle: 'short' })}.</p>
      {share ? <p className="muted">{plural(backup.stores.libMine.reduce((n, r) => n + r.manifest.questions.length, 0), 'question')} in {plural(backup.stores.libMine.length, 'set')} of your own{backup.stores.libMine.length ? `: ${backup.stores.libMine.map((r) => r.manifest.title).join(', ')}` : ''}.{backup.library.length > 0 && ` Also ${plural(backup.library.length, 'imported set')} with ${backup.library.length === 1 ? 'its' : 'their'} PDFs and images: ${backup.library.map((r) => r.title).join(', ')}. A set you already have keeps your copy and only gains the questions added to it.`}</p> : <ul className="muted" style={{ paddingLeft: 18 }}>
        <li>{plural(sum.runs, 'run')} ({sum.finishedRuns} finished) and {plural(sum.attempts, 'attempt')} in the stats</li>
        <li>{setNames.length ? setNames.join(', ') : 'No question sets'}</li>
        {sum.librarySets > 0 && <li>{plural(sum.librarySets, 'imported set')} with their PDFs and images, recreated if this browser lacks them</li>}
        {(sum.libraryQuestions > 0 || sum.libraryRuns > 0) && <li>Your library: {plural(sum.libraryQuestions, 'question')} with progress and {plural(sum.libraryRuns, 'practice session')}</li>}
        <li>{plural(sum.settings, 'setting')}</li>
      </ul>}
      <div className="modes">
        {options.map((o) => (
          <div key={o.id} className={`mode${mode === o.id ? ' selected' : ''}`}>
            <label>
              <input type="radio" name="restore-mode" checked={mode === o.id} disabled={busy} onChange={() => setMode(o.id)} />
              <span className="m-title">{o.title}</span>
              <span className="m-desc">{o.desc}</span>
            </label>
          </div>
        ))}
      </div>
      {error && <div className="notice" role="alert">{error}</div>}
    </Modal>
  );
}

// Inside the Settings dialog.
export function BackupSection() {
  const st = useStore();   // re-render after a backup so "last backup" updates
  const { open } = useDialogs();
  const file = useRef(null);
  const [files, setFiles] = useState(false);   // also include the imported sets' PDFs and images
  const [busy, setBusy] = useState(false);
  const status = backupStatus();
  const imported = Object.values(st.library.sets).filter((x) => !x.userOwned);
  const megabytes = Math.round(imported.reduce((n, x) => n + x.bytes, 0) / 1048576);

  const onFile = async (e) => {
    const chosen = e.target.files[0];
    e.target.value = '';   // so choosing the same file again still fires
    if (!chosen) return;
    let read;
    try { read = await readBackupFile(chosen); } catch (err) { toast(err.message, 'bad'); return; }
    open(({ close }) => <RestoreDialog backup={read.backup} zip={read.zip} fileName={chosen.name} close={close} />);
  };
  const run = async (fn) => { setBusy(true); await fn(files); setBusy(false); };

  return (
    <>
      <h3>Backup</h3>
      <p className="muted">
        Your progress is saved in this browser only, and clearing site data deletes it. A backup is one file with every run, draft and stat from every question set, plus this app's settings (nothing from other pages on the same site). To give someone your own questions without your progress, use Export my questions to share; they open it with Restore, which only adds to what they have.
      </p>
      <p>Last backup: <b>{timeAgo(status.at)}</b>{status.newAttempts > 0 && <span className="muted"> ({plural(status.newAttempts, 'attempt')} since)</span>}</p>
      {imported.length > 0 && (
        <label className="check">
          <input type="checkbox" checked={files} onChange={(e) => setFiles(e.target.checked)} />
          <span>Include my imported sets with their PDFs and images (a zip file of about {megabytes} MB)</span>
        </label>
      )}
      {files && <p className="muted">With this, a restore on another computer recreates the sets themselves, so the folders need not be added again. If you give the export to someone, remember that course PDFs may not be yours to pass on. Progress is never in the export.</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn primary" disabled={busy} onClick={() => run(backUpNow)}>{busy ? 'Working…' : 'Back up now'}</button>
        <button type="button" className="btn" disabled={busy} onClick={() => file.current.click()}>Restore from a backup…</button>
        <button type="button" className="btn" disabled={busy} onClick={() => run(shareQuestions)} title="Only the questions you made in the app and their answer keys, never your progress or settings, to give to someone else">Export my questions to share</button>
        <input ref={file} type="file" accept=".json,.zip,application/json,application/zip" hidden onChange={onFile} />
      </div>
    </>
  );
}

// Shown on the dashboard once there is enough unsaved progress.
export function BackupReminder() {
  useStore();
  const [hidden, setHidden] = useState(false);
  const status = backupStatus();
  if (hidden || !status.due) return null;
  return (
    <div className="notice row" role="status">
      <span>
        {plural(status.newAttempts, 'attempt')} since your last backup ({status.at ? timeAgo(status.at) : 'none yet'}). Progress is saved only in this browser, and clearing site data deletes it.
      </span>
      <button type="button" className="btn sm primary" onClick={() => backUpNow()}>Back up now</button>
      <button type="button" className="btn sm" onClick={() => setHidden(true)}>Not now</button>
    </div>
  );
}
