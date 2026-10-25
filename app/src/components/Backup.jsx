import { useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural, timeAgo } from '../lib/format.js';
import { backupStatus, downloadBackup, restoreBackup, reloadApp } from '../lib/backup.js';
import { parseBackup, summarise } from '../../shared/backup.js';
import { Modal, useDialogs } from './Dialogs.jsx';
import { toast } from './Toasts.jsx';

function backUpNow() {
  const name = downloadBackup();
  toast(`Saved ${name} to your downloads.`);
}

function RestoreDialog({ backup, fileName, close }) {
  const st = useStore();
  const [mode, setMode] = useState('merge');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sum = summarise(backup);
  const setNames = sum.sets.map((id) => st.catalog.sets.find((s) => s.id === id)?.name || id);

  const go = async () => {
    setBusy(true);
    try {
      await restoreBackup(backup, mode);
      close(true);
      toast('Restored. Reloading the page…');
      setTimeout(reloadApp, 700);
    } catch (e) {
      setError(`Nothing was changed. This browser would not save the data${e && e.message ? ` (${e.message})` : ''}.`);
      setBusy(false);
    }
  };

  const options = [
    { id: 'merge', title: 'Merge (recommended)', desc: 'Keeps what is in this browser and adds what the file has. Where both have the same run or question, the newer one wins.' },
    { id: 'replace', title: 'Replace everything', desc: 'Erases every run, stat and setting in this browser first, then loads the file.' },
  ];
  return (
    <Modal
      title="Restore this backup?" onClose={() => !busy && close(false)}
      footer={(
        <>
          <button type="button" className="btn" disabled={busy} onClick={() => close(false)}>Cancel</button>
          <button type="button" className={`btn ${mode === 'replace' ? 'danger solid' : 'primary'}`} disabled={busy} onClick={go}>
            {busy ? 'Restoring…' : mode === 'replace' ? 'Replace everything' : 'Merge'}
          </button>
        </>
      )}
    >
      <p><b>{fileName}</b>, made {new Date(sum.createdAt).toLocaleString('en-NZ', { dateStyle: 'medium', timeStyle: 'short' })}.</p>
      <ul className="muted" style={{ paddingLeft: 18 }}>
        <li>{plural(sum.runs, 'run')} ({sum.finishedRuns} finished) and {plural(sum.attempts, 'attempt')} in the stats</li>
        <li>{setNames.length ? setNames.join(', ') : 'No question sets'}</li>
        {(sum.libraryQuestions > 0 || sum.libraryRuns > 0) && <li>Your library: {plural(sum.libraryQuestions, 'question')} with progress and {plural(sum.libraryRuns, 'practice session')}</li>}
        <li>{plural(sum.settings, 'setting')}</li>
      </ul>
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
  useStore();   // re-render after a backup so "last backup" updates
  const { open } = useDialogs();
  const file = useRef(null);
  const status = backupStatus();

  const onFile = async (e) => {
    const chosen = e.target.files[0];
    e.target.value = '';   // so choosing the same file again still fires
    if (!chosen) return;
    let backup;
    try { backup = parseBackup(await chosen.text()); } catch (err) { toast(err.message, 'bad'); return; }
    open(({ close }) => <RestoreDialog backup={backup} fileName={chosen.name} close={close} />);
  };

  return (
    <>
      <h3>Backup</h3>
      <p className="muted">
        Your progress is saved in this browser only, and clearing site data deletes it. A backup is one file with every run, draft and stat from every question set, plus these settings.
      </p>
      <p>Last backup: <b>{timeAgo(status.at)}</b>{status.newAttempts > 0 && <span className="muted"> ({plural(status.newAttempts, 'attempt')} since)</span>}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn primary" onClick={backUpNow}>Back up now</button>
        <button type="button" className="btn" onClick={() => file.current.click()}>Restore from a backup…</button>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={onFile} />
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
      <button type="button" className="btn sm primary" onClick={backUpNow}>Back up now</button>
      <button type="button" className="btn sm" onClick={() => setHidden(true)}>Not now</button>
    </div>
  );
}
