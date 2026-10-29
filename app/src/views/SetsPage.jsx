import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { foldersSorted, foldersIn, folderOf, folderPath, descendantIds, createFolder, renameFolder, deleteFolder, moveSet, moveFolder, startDrag, hasDrag, readDrag } from '../lib/folders.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import KebabMenu from '../components/KebabMenu.jsx';
import { AddFab, LibraryNotes } from '../components/Library.jsx';
import { useDialogs, Modal } from '../components/Dialogs.jsx';
import { toast } from '../components/Toasts.jsx';
import useRangePick from '../lib/rangepick.js';

const questionCount = (set) => set.categories.reduce((n, c) => n + c.questions.length, 0);

// While selecting, a click on a tile ticks it instead of opening it.
const selectable = (selecting, key, picked, bind) => (selecting ? { className: picked.has(key) ? ' selected' : '', ...bind(key) } : { className: '' });
const Tick = ({ on }) => <input type="checkbox" className="tile-tick" checked={on} readOnly tabIndex={-1} aria-hidden="true" />;

// Where the selected sets and folders can go: the library itself, or any folder that is not one of them or inside one.
export function MoveDialog({ picked, close, initial = '' }) {
  const folderIds = [...picked].filter((k) => k.startsWith('f:')).map((k) => k.slice(2));
  const blocked = new Set(folderIds.flatMap((id) => [id, ...descendantIds(id)]));
  const options = foldersSorted().filter((f) => !blocked.has(f.id));
  const [dest, setDest] = useState(initial);
  return (
    <Modal title={`Move ${plural(picked.size, 'item')}`} onClose={() => close(null)}
      footer={<><button type="button" className="btn" onClick={() => close(null)}>Cancel</button><button type="button" className="btn primary" onClick={() => close(dest)}>Move</button></>}>
      <label className="muted" htmlFor="move-dest">Move them to</label>
      <select id="move-dest" value={dest} onChange={(e) => setDest(e.target.value)} autoFocus>
        <option value="">Your library (no folder)</option>
        {options.map((f) => <option key={f.id} value={f.id}>{folderPath(f.id).map((p) => p.name).join(' / ')}</option>)}
      </select>
    </Modal>
  );
}

// A set is just a tile: click it to open it, where Browse, Stats and the rest are. `drag` makes a library set movable.
function Tile({ href, title, sub, chips, drag, onDragStart, pick }) {
  return (
    <a className={`card tile${pick ? pick.className : ''}`} href={href} draggable={drag && !pick ? 'true' : undefined} onDragStart={onDragStart} {...(pick ? { onClick: pick.onClick, onPointerDown: pick.onPointerDown, onPointerEnter: pick.onPointerEnter } : {})}>
      <h2>{pick && <Tick on={pick.className !== ''} />}{title}</h2>
      {sub && <span className="muted">{sub}</span>}
      <div className="meta">{chips.map((c, i) => <span key={i} className={`chip${c[1] ? ` ${c[1]}` : ''}`}>{c[0]}</span>)}</div>
    </a>
  );
}

// The coding sets, then your library laid out like a file explorer: folders and sets side by side. Click a folder
// to open it; drag a set onto a folder to file it, or onto "move out" inside a folder to take it back out.
export default function SetsPage({ folderId, theme }) {
  const st = useStore();
  const { prompt, confirm, open } = useDialogs();
  const [over, setOver] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState(new Set());
  useEffect(() => { setSelecting(false); setPicked(new Set()); }, [folderId]);
  const folder = folderId ? st.libFolders[folderId] || null : null;
  const folders = foldersIn(folderId || null);
  const sets = Object.values(st.library.sets).sort((a, b) => a.title.localeCompare(b.title));
  const here =folder ? sets.filter((x) => folder.items.some((i) => i.setId === x.id)) : sets.filter((x) => !folderOf(x.id));
  // Selecting: press and drag over tiles to tick several, or shift-click a range, in the order the tiles are shown.
  const bind = useRangePick([...folders.map((f) => `f:${f.id}`), ...here.map((x) => `s:${x.id}`)], picked, setPicked);

  const guard = (fn) => async (...args) => { try { await fn(...args); } catch (e) { toast(e.message, 'bad'); } };
  const make = guard(async () => {
    const name = await prompt({ title: 'New folder', label: 'Folder name' });
    if (name !== null) await createFolder(name, folderId || null);
  });
  const moveSelected = guard(async () => {
    const dest = await open(({ close }) => <MoveDialog picked={picked} close={close} />);
    if (dest === null) return;
    for (const key of picked) {
      if (key.startsWith('f:')) await moveFolder(key.slice(2), dest || null);
      else await moveSet(key.slice(2), dest || null);
    }
    toast(`Moved ${plural(picked.size, 'item')}.`);
    setPicked(new Set());
    setSelecting(false);
  });
  const rename = guard(async (f) => {
    const name = await prompt({ title: 'Rename folder', label: 'Folder name', initial: f.name });
    if (name !== null) await renameFolder(f.id, name);
  });
  const remove = async (f) => {
    if (!(await confirm({ title: `Delete the folder "${f.name}"?`, body: 'Only the folder is deleted. Its sets move back to your library and keep all their questions and stats.', confirmText: 'Delete', danger: true }))) return;
    await deleteFolder(f.id);
    if (folder) window.location.hash = folder.parentId ? `#/sets/${folder.parentId}` : '#/sets';
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
    <Shell theme={theme} crumbs={[{ label: 'Question sets', href: folder ? '#/sets' : undefined }, ...(folder ? folderPath(folder.id).map((f, i, all) => (i < all.length - 1 ? { label: f.name, href: `#/sets/${f.id}` } : { label: f.name })) : [])]}>
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
          {selecting && <button type="button" className="btn primary sm" disabled={picked.size === 0} onClick={moveSelected}><Icon name="move" /> Move{picked.size ? ` (${picked.size})` : ''}</button>}
          {(here.length > 0 || folders.length > 0) && (
            <button type="button" className={`btn sm${selecting ? ' primary' : ' ghost'}`} aria-pressed={selecting} onClick={() => { setSelecting(!selecting); setPicked(new Set()); }}>
              <Icon name="check" /> {selecting ? 'Done' : 'Select'}
            </button>
          )}
          <button type="button" className="btn ghost sm" onClick={make}><Icon name="plus" /> New folder</button>
          {folder && <KebabMenu label="Folder options" items={[{ label: 'Rename', icon: 'pencil', onClick: () => rename(folder) }, { label: 'Delete folder', icon: 'trash', danger: true, onClick: () => remove(folder) }]} />}
        </div>
        {folderId && !folder && <div className="empty">That folder no longer exists. <a href="#/sets">Back to your library</a></div>}
        {folder && <div className={`drop-out${over === 'out' ? ' over' : ''}`} {...target('out', folder.parentId || null)}>Drag a set here to move it up a level, or <a href={folder.parentId ? `#/sets/${folder.parentId}` : '#/sets'}>go back</a>.</div>}
        {(!folderId || folder) && (
          here.length === 0 && folders.length === 0 ? (
            <div className="empty">
              {folder ? 'This folder is empty.' : 'Question sets from folders on this computer (practice PDFs, quiz screenshots) show up here. Nothing is uploaded: the app keeps a copy in this browser. Use the + button at the bottom right to get started.'}
            </div>
          ) : (
            <div className={`explorer-grid${selecting ? ' selecting' : ''}`} style={folder ? { marginTop: 12 } : undefined}>
              {folders.map((f) => {
                const inside = sets.filter((x) => f.items.some((i) => i.setId === x.id));
                const subs = foldersIn(f.id).length;
                const pick = selectable(selecting, `f:${f.id}`, picked, bind);
                const info = [subs ? plural(subs, 'folder') : '', inside.length ? `${plural(inside.length, 'set')}: ${inside.slice(0, 3).map((x) => x.title).join(', ')}${inside.length > 3 ? ', …' : ''}` : ''].filter(Boolean).join(', ');
                return (
                  <div key={f.id} className="folder-wrap">
                    <a href={`#/sets/${f.id}`} className={`card tile folder${over === f.id ? ' over' : ''}${pick.className}`} {...(selecting ? { onClick: pick.onClick, onPointerDown: pick.onPointerDown, onPointerEnter: pick.onPointerEnter } : target(f.id, f.id))}>
                      <h2>{selecting && <Tick on={pick.className !== ''} />}<Icon name="folder" /> {f.name}</h2>
                      <span className="muted folder-info">{info || 'Empty'}</span>
                    </a>
                    {!selecting && <KebabMenu label={`Options for ${f.name}`} items={[{ label: 'Rename', icon: 'pencil', onClick: () => rename(f) }, { label: 'Delete folder', icon: 'trash', danger: true, onClick: () => remove(f) }]} />}
                  </div>
                );
              })}
              {here.map((set) => (
                <Tile key={set.id} href={`#/lib/${encodeURIComponent(set.id)}`} title={set.title} sub={set.course} drag onDragStart={(e) => startDrag(e, set.id)} pick={selecting ? selectable(true, `s:${set.id}`, picked, bind) : null}
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
