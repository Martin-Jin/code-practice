import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { foldersSorted, folderOf, createFolder, renameFolder, deleteFolder, moveSet, startDrag, hasDrag, readDrag } from '../lib/folders.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { LibrarySetCard, LibraryTools } from '../components/Library.jsx';
import { useDialogs } from '../components/Dialogs.jsx';
import { toast } from '../components/Toasts.jsx';

const questionCount = (set) => set.categories.reduce((n, c) => n + c.questions.length, 0);

function CodingSetCard({ set, ongoing, stats }) {
  const solved = stats ? Object.values(stats.questions).filter((q) => q.correct > 0).length : 0;
  const active = ongoing.filter((r) => r.setId === set.id).length;
  return (
    <div className="card set-card">
      <div>
        <h2>{set.name}</h2>
        <p className="muted" style={{ marginTop: 4 }}>{set.description}</p>
      </div>
      <div className="meta">
        <span className="chip">{plural(questionCount(set), 'question')}</span>
        <span className="chip">{plural(set.categories.length, 'topic')}</span>
        <span className={`chip${solved ? ' ok' : ''}`}>{solved} solved</span>
        {active > 0 && <span className="chip accent">{plural(active, 'run')} in progress</span>}
      </div>
      <div className="actions">
        <a className="btn primary" href={`#/set/${set.id}`}>Start a run</a>
        <a className="btn" href={`#/set/${set.id}/stats`}>Stats</a>
      </div>
    </div>
  );
}

// Every question set, sorted into your folders. Drag a set's card onto a folder (or use its "Move to" menu); drag it
// onto "Not in a folder" to take it out.
export default function SetsPage({ theme }) {
  const st = useStore();
  const { prompt, confirm } = useDialogs();
  const [over, setOver] = useState(null);   // folder id, or 'none' while a card is dragged over a zone
  const ongoing = Object.values(st.runs).filter((r) => !r.completedAt);
  const folders = foldersSorted();

  // Every set as { id, title, card }: the coding sets first, then the library's.
  const all = [
    ...st.catalog.sets.map((set) => ({ id: set.id, title: set.name, card: <CodingSetCard set={set} ongoing={ongoing} stats={st.stats[set.id]} /> })),
    ...Object.values(st.library.sets).sort((a, b) => a.title.localeCompare(b.title)).map((set) => ({ id: set.id, title: set.title, card: <LibrarySetCard set={set} /> })),
  ];
  const inFolder = (f) => all.filter((x) => f.items.some((i) => i.setId === x.id));
  const loose = all.filter((x) => !folderOf(x.id));

  const guard = (fn) => async (...args) => { try { await fn(...args); } catch (e) { toast(e.message, 'bad'); } };
  const make = guard(async () => {
    const name = await prompt({ title: 'New folder', label: 'Folder name' });
    if (name !== null) await createFolder(name);
  });
  const rename = guard(async (f) => {
    const name = await prompt({ title: 'Rename folder', label: 'Folder name', initial: f.name });
    if (name !== null) await renameFolder(f.id, name);
  });
  const remove = async (f) => {
    if (await confirm({ title: `Delete the folder "${f.name}"?`, body: 'Only the folder is deleted. Its sets move back to "Not in a folder" and keep all their questions and stats.', confirmText: 'Delete', danger: true })) await deleteFolder(f.id);
  };
  const drop = guard(async (e, folderId) => {
    e.preventDefault();
    setOver(null);
    const setId = readDrag(e);
    if (setId) await moveSet(setId, folderId);
  });
  const zone = (id) => ({
    onDragOver: (e) => { if (hasDrag(e)) { e.preventDefault(); setOver(id); } },
    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); },
    onDrop: (e) => drop(e, id === 'none' ? null : id),
    className: `folder-zone${over === id ? ' over' : ''}`,
  });
  const tile = (x) => (
    <div key={x.id} className="set-tile" draggable onDragStart={(e) => startDrag(e, x.id)}>
      {x.card}
      <select className="move" value={(folderOf(x.id) || { id: '' }).id} aria-label={`Move ${x.title} to a folder`} onChange={(e) => guard(moveSet)(x.id, e.target.value || null)}>
        <option value="">Not in a folder</option>
        {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
    </div>
  );

  return (
    <Shell theme={theme} crumbs={[{ label: 'Question sets' }]}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="muted" style={{ margin: 0 }}>
          {folders.length ? 'Drag a set onto a folder to file it there, or use the menu under it.' : 'Make a folder to sort your sets into, then drag a set onto it.'}
        </p>
        <button type="button" className="btn" onClick={make}><Icon name="plus" /> New folder</button>
      </div>

      {folders.map((f) => (
        <section key={f.id} {...zone(f.id)}>
          <div className="section-title">
            <h2>{f.name}</h2><span className="muted">{plural(inFolder(f).length, 'set')}</span>
            <span className="spacer" />
            <button type="button" className="btn ghost sm" onClick={() => rename(f)}><Icon name="pencil" /> Rename</button>
            <button type="button" className="btn ghost sm" onClick={() => remove(f)}><Icon name="trash" /> Delete</button>
          </div>
          {inFolder(f).length === 0 ? <p className="zone-hint">Empty. Drag a set here.</p> : <div className="grid">{inFolder(f).map(tile)}</div>}
        </section>
      ))}

      <section {...(folders.length ? zone('none') : {})}>
        {folders.length > 0 && <div className="section-title"><h2>Not in a folder</h2><span className="muted">{loose.length}</span></div>}
        {folders.length > 0 && loose.length === 0 ? <p className="zone-hint">Every set is in a folder. Drag one here to take it out.</p> : <div className="grid">{loose.map(tile)}</div>}
      </section>

      <LibraryTools />
    </Shell>
  );
}
