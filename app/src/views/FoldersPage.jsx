import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { effectiveQuestions, getProgress } from '../lib/practice.js';
import { foldersSorted, createFolder, renameFolder, deleteFolder, removeFromFolder, moveItem, startDrag, hasDrag, readDrag } from '../lib/folders.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { useDialogs } from '../components/Dialogs.jsx';
import { toast } from '../components/Toasts.jsx';

// Your folders: pick one on the left, and drag its questions to reorder them, or onto another folder to move them.
export default function FoldersPage({ folderId, theme }) {
  const st = useStore();
  const { prompt, confirm } = useDialogs();
  const folders = foldersSorted();
  const current = st.libFolders[folderId] || null;
  const [over, setOver] = useState(null);   // folder id, or "row:<uid>" while dragging over a question

  const guard = (fn) => async (...args) => { try { await fn(...args); } catch (e) { toast(e.message, 'bad'); } };
  const make = guard(async () => {
    const name = await prompt({ title: 'New folder', label: 'Folder name' });
    if (name === null) return;
    window.location.hash = `#/folders/${(await createFolder(name)).id}`;
  });
  const rename = guard(async (f) => {
    const name = await prompt({ title: 'Rename folder', label: 'Folder name', initial: f.name });
    if (name !== null) await renameFolder(f.id, name);
  });
  const remove = async (f) => {
    if (!(await confirm({ title: `Delete the folder "${f.name}"?`, body: 'Only the folder is deleted. Its questions stay in their sets.', confirmText: 'Delete', danger: true }))) return;
    await deleteFolder(f.id);
    window.location.hash = '#/folders';
  };

  const dropOnFolder = guard(async (e, f) => {
    e.preventDefault();
    setOver(null);
    const d = readDrag(e);
    if (d && d.from !== f.id) await moveItem(d.from, f.id, d);
  });
  const dropOnRow = guard(async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(null);
    const d = readDrag(e);
    if (d) await moveItem(d.from, current.id, d, item);
  });
  const dropAtEnd = guard(async (e) => {
    e.preventDefault();
    setOver(null);
    const d = readDrag(e);
    if (d) await moveItem(d.from, current.id, d);
  });

  const rows = current ? current.items.map((item) => {
    const set = st.library.sets[item.setId];
    const q = set && effectiveQuestions(set).find((x) => x.uid === item.uid);
    return { item, set, q, progress: getProgress(item.setId, item.uid) };
  }) : [];

  return (
    <Shell theme={theme} crumbs={[{ label: 'Folders', href: '#/folders' }, ...(current ? [{ label: current.name }] : [])]}>
      <div className="page-head">
        <h1>Folders</h1>
        <p className="muted">Your own collections of questions, from any set. Drag a question onto a folder to move it, or drag within a folder to reorder. To add questions, drag them from a set's page onto a folder there.</p>
      </div>
      <div className="folders-layout">
        <nav className="card pad folder-list" aria-label="Folders">
          {folders.map((f) => (
            <div key={f.id} className={`drop${over === f.id ? ' over' : ''}${current && current.id === f.id ? ' current' : ''}`}
              onDragOver={(e) => { if (hasDrag(e)) { e.preventDefault(); setOver(f.id); } }} onDragLeave={() => setOver(null)} onDrop={(e) => dropOnFolder(e, f)}>
              <a href={`#/folders/${f.id}`}>{f.name}</a><span className="chip">{f.items.length}</span>
            </div>
          ))}
          {folders.length === 0 && <p className="muted">No folders yet.</p>}
          <button type="button" className="btn sm" onClick={make}><Icon name="plus" /> New folder</button>
        </nav>

        <section>
          {!current ? <div className="empty">{folders.length ? 'Choose a folder.' : 'Make a folder to start.'}</div> : (
            <>
              <div className="section-title">
                <h2>{current.name}</h2><span className="muted">{plural(current.items.length, 'question')}</span>
                <span className="spacer" />
                <button type="button" className="btn ghost sm" onClick={() => rename(current)}><Icon name="pencil" /> Rename</button>
                <button type="button" className="btn ghost sm" onClick={() => remove(current)}><Icon name="trash" /> Delete</button>
              </div>
              <div className="run-list" onDragOver={(e) => { if (hasDrag(e)) e.preventDefault(); }} onDrop={dropAtEnd}>
                {rows.length === 0 && <div className="empty">Empty. Drag questions here from a set's page.</div>}
                {rows.map(({ item, set, q, progress }) => (
                  <div key={`${item.setId}/${item.uid}`} className={`card run-row draggable${over === `row:${item.uid}` ? ' over' : ''}`} style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}
                    draggable onDragStart={(e) => startDrag(e, item, current.id)}
                    onDragOver={(e) => { if (hasDrag(e)) { e.preventDefault(); setOver(`row:${item.uid}`); } }} onDragLeave={() => setOver(null)} onDrop={(e) => dropOnRow(e, item)}>
                    <div style={{ minWidth: 0 }}>
                      <div className="title">{q ? <a href={`#/q/${encodeURIComponent(item.setId)}/${encodeURIComponent(item.uid)}`}>{q.title}</a> : <span className="muted">Not available: its set is not in this browser</span>}</div>
                      <div className="sub">
                        {set && <span className="chip">{set.title}</span>}
                        {q && <span className="muted">{q.section}</span>}
                        {progress && progress.difficult && <span className="chip warn">difficult</span>}
                        {progress && progress.attempts > 0 && <span className={`chip ${progress.lastOverall === 'right' ? 'ok' : 'bad'}`}>{progress.right} right · {progress.wrong} not right</span>}
                      </div>
                    </div>
                    <button type="button" className="btn ghost sm" onClick={() => removeFromFolder(current.id, item.setId, item.uid)} aria-label={`Remove ${q ? q.title : 'this question'} from the folder`}>Remove</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
