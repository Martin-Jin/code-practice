import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { foldersSorted, folderOf, createFolder, renameFolder, deleteFolder, moveSet, startDrag, hasDrag, readDrag } from '../lib/folders.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { AddFab, LibraryNotes } from '../components/Library.jsx';
import { useDialogs } from '../components/Dialogs.jsx';
import { toast } from '../components/Toasts.jsx';

const questionCount = (set) => set.categories.reduce((n, c) => n + c.questions.length, 0);

// A set is just a tile: click it to open it, where Browse, Stats and the rest are. `drag` makes a library set movable.
function Tile({ href, title, sub, chips, drag, onDragStart }) {
  return (
    <a className="card tile" href={href} draggable={drag ? 'true' : undefined} onDragStart={onDragStart}>
      <h2>{title}</h2>
      {sub && <span className="muted">{sub}</span>}
      <div className="meta">{chips.map((c, i) => <span key={i} className={`chip${c[1] ? ` ${c[1]}` : ''}`}>{c[0]}</span>)}</div>
    </a>
  );
}

// The coding sets, then your library laid out like a file explorer: folders and sets side by side. Click a folder
// to open it; drag a set onto a folder to file it, or onto "move out" inside a folder to take it back out.
export default function SetsPage({ folderId, theme }) {
  const st = useStore();
  const { prompt, confirm } = useDialogs();
  const [over, setOver] = useState(null);
  const folders = foldersSorted();
  const folder = folderId ? st.libFolders[folderId] || null : null;
  const sets = Object.values(st.library.sets).sort((a, b) => a.title.localeCompare(b.title));
  const here = folder ? sets.filter((x) => folder.items.some((i) => i.setId === x.id)) : sets.filter((x) => !folderOf(x.id));

  const guard = (fn) => async (...args) => { try { await fn(...args); } catch (e) { toast(e.message, 'bad'); } };
  const make = guard(async () => {
    const name = await prompt({ title: 'New folder', label: 'Folder name' });
    if (name !== null) await createFolder(name);
  });
  const rename = guard(async () => {
    const name = await prompt({ title: 'Rename folder', label: 'Folder name', initial: folder.name });
    if (name !== null) await renameFolder(folder.id, name);
  });
  const remove = async () => {
    if (!(await confirm({ title: `Delete the folder "${folder.name}"?`, body: 'Only the folder is deleted. Its sets move back to your library and keep all their questions and stats.', confirmText: 'Delete', danger: true }))) return;
    await deleteFolder(folder.id);
    window.location.hash = '#/sets';
  };
  const target = (id, toFolder) => ({
    onDragOver: (e) => { if (hasDrag(e)) { e.preventDefault(); setOver(id); } },
    onDragLeave: () => setOver(null),
    onDrop: guard(async (e) => {
      e.preventDefault();
      setOver(null);
      const setId = readDrag(e);
      if (setId) await moveSet(setId, toFolder);
    }),
  });

  const ongoing = Object.values(st.runs).filter((r) => !r.completedAt);
  return (
    <Shell theme={theme} crumbs={[{ label: 'Question sets', href: folder ? '#/sets' : undefined }, ...(folder ? [{ label: folder.name }] : [])]}>
      {!folder && (
        <section>
          <div className="section-title"><h2>Coding question sets</h2></div>
          <div className="explorer-grid">
            {st.catalog.sets.map((set) => {
              const stats = st.stats[set.id];
              const solved = stats ? Object.values(stats.questions).filter((q) => q.correct > 0).length : 0;
              const active = ongoing.filter((r) => r.setId === set.id).length;
              return (
                <Tile key={set.id} href={`#/set/${set.id}`} title={set.name} sub={set.description}
                  chips={[[plural(questionCount(set), 'question')], [`${solved} solved`, solved ? 'ok' : ''], ...(active ? [[`${plural(active, 'run')} in progress`, 'accent']] : [])]} />
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="section-title">
          <h2>{folder ? folder.name : 'Your library'}</h2><span className="muted">{folder ? plural(here.length, 'set') : sets.length}</span>
          <span className="spacer" />
          {folder
            ? <><button type="button" className="btn ghost sm" onClick={rename}><Icon name="pencil" /> Rename</button><button type="button" className="btn ghost sm" onClick={remove}><Icon name="trash" /> Delete folder</button></>
            : <button type="button" className="btn ghost sm" onClick={make}><Icon name="plus" /> New folder</button>}
        </div>
        {folderId && !folder && <div className="empty">That folder no longer exists. <a href="#/sets">Back to your library</a></div>}
        {folder && <div className={`drop-out${over === 'out' ? ' over' : ''}`} {...target('out', null)}>Drag a set here to move it out of this folder, or <a href="#/sets">go back to the library</a>.</div>}
        {(!folderId || folder) && (
          here.length === 0 && (folder || folders.length === 0) ? (
            <div className="empty">
              {folder ? 'This folder is empty.' : 'Question sets from folders on this computer (practice PDFs, quiz screenshots) show up here. Nothing is uploaded: the app keeps a copy in this browser. Use the + button at the bottom right to get started.'}
            </div>
          ) : (
            <div className="explorer-grid" style={folder ? { marginTop: 12 } : undefined}>
              {!folder && folders.map((f) => (
                <a key={f.id} href={`#/sets/${f.id}`} className={`card tile folder${over === f.id ? ' over' : ''}`} {...target(f.id, f.id)}>
                  <h2><Icon name="folder" /> {f.name}</h2>
                  <div className="meta"><span className="chip">{f.items.filter((i) => st.library.sets[i.setId]).length === 0 ? 'Empty' : plural(f.items.filter((i) => st.library.sets[i.setId]).length, 'set')}</span></div>
                </a>
              ))}
              {here.map((set) => (
                <Tile key={set.id} href={`#/lib/${encodeURIComponent(set.id)}`} title={set.title} sub={set.course} drag onDragStart={(e) => startDrag(e, set.id)}
                  chips={[[plural(set.manifest.questions.length, 'question')], [plural(new Set(set.manifest.questions.map((q) => q.section)).size, 'section')], ...(set.missing.length ? [[`${plural(set.missing.length, 'file')} missing`, 'warn']] : [])]} />
              ))}
            </div>
          )
        )}
      </section>

      <LibraryNotes />
      <AddFab />
    </Shell>
  );
}
