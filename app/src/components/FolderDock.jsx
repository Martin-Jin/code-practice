import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { foldersSorted, createFolder, addToFolder, hasDrag, readDrag } from '../lib/folders.js';
import { useDialogs } from './Dialogs.jsx';
import { toast } from './Toasts.jsx';
import Icon from './Icon.jsx';

// A drop target for every folder, shown beside a set's questions: drag a question onto one to put it in. The
// question rows also have a menu, for doing the same without dragging.
export default function FolderDock() {
  const st = useStore();
  const { prompt } = useDialogs();
  const [over, setOver] = useState(null);
  const folders = foldersSorted();

  const drop = async (e, folder) => {
    e.preventDefault();
    setOver(null);
    const d = readDrag(e);
    if (!d) return;
    try { toast((await addToFolder(folder.id, d.setId, d.uid)) ? `Added to ${folder.name}.` : `Already in ${folder.name}.`); } catch (err) { toast(err.message, 'bad'); }
  };
  const make = async () => {
    const name = await prompt({ title: 'New folder', label: 'Folder name' });
    if (name === null) return;
    try { await createFolder(name); } catch (err) { toast(err.message, 'bad'); }
  };

  return (
    <aside className="folder-dock card pad" aria-label="Folders">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>Folders</b>
        <button type="button" className="btn ghost sm" onClick={make}><Icon name="plus" /> New</button>
      </div>
      {folders.length === 0 && <p className="muted">Make a folder, then drag questions onto it.</p>}
      {folders.map((f) => (
        <div key={f.id} className={`drop${over === f.id ? ' over' : ''}`}
          onDragOver={(e) => { if (hasDrag(e)) { e.preventDefault(); setOver(f.id); } }} onDragLeave={() => setOver(null)} onDrop={(e) => drop(e, f)}>
          <a href={`#/folders/${f.id}`}>{f.name}</a><span className="chip">{f.items.length}</span>
        </div>
      ))}
      {folders.length > 0 && <a className="muted" href="#/folders">Organise folders</a>}
    </aside>
  );
}
