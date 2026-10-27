import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { fuzzyFilter } from '../lib/fuzzy.js';
import { foldersSorted, folderOf, createFolder, moveSet } from '../lib/folders.js';
import { downloadBackup } from '../lib/backup.js';
import { useDialogs } from './Dialogs.jsx';
import AddQuestionDialog from './AddQuestion.jsx';
import { ImportDialog } from './Library.jsx';
import { SettingsDialog, HelpDialog as ShortcutsDialog } from './Shell.jsx';
import { toast } from './Toasts.jsx';
import Icon from './Icon.jsx';

// Every question set by name, for the "which set?" step: the library's sets, and the coding sets when `coding` is true.
const setOptions = (st, coding) => [
  ...Object.values(st.library.sets).sort((a, b) => a.title.localeCompare(b.title)).map((s) => ({ key: s.id, label: s.title, sub: folderOf(s.id) ? `in ${folderOf(s.id).name}` : s.course })),
  ...(coding ? st.catalog.sets.map((s) => ({ key: `code:${s.id}`, label: s.name, sub: 'coding set' })) : []),
];

// The palette's commands. A command with `args` asks for each one in turn, filling in the best match as you type: pick
// with Enter. `options(st, typed)` lists the choices for an argument; `run(values, ctx)` does it.
function commands(st, ctx) {
  const go = (hash) => () => { window.location.hash = hash; };
  const folderChoices = (_, typed) => {
    const exact = foldersSorted().some((f) => f.name.toLowerCase() === typed.trim().toLowerCase());
    return [
      { key: 'none', label: 'No folder', sub: 'move it back out to the library' },
      ...foldersSorted().map((f) => ({ key: f.id, label: f.name, sub: `${f.items.length} sets` })),
      ...(typed.trim() && !exact ? [{ key: `new:${typed.trim()}`, label: `New folder "${typed.trim()}"`, sub: 'create it and move the set in', keepOrder: true }] : []),
    ];
  };
  return [
    { id: 'add-question', label: 'Add a question', hint: 'make one from a screenshot', keywords: 'new create screenshot', run: () => ctx.open(({ close }) => <AddQuestionDialog close={close} />) },
    {
      id: 'upload', label: 'Upload questions', hint: 'a folder of sets or practice PDFs', keywords: 'import add folder pdf',
      run: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        input.onchange = () => { const files = [...input.files]; if (files.length) ctx.open(({ close }) => <ImportDialog files={files} close={close} />); };
        input.click();
      },
    },
    {
      id: 'move-set', label: 'Move question set to folder', hint: 'then type the set and the folder', keywords: 'file organise sort',
      args: [
        { name: 'set', prompt: 'Which question set?', options: (s) => setOptions(s, false) },
        { name: 'folder', prompt: 'Which folder?', options: folderChoices },
      ],
      run: async ([setId, folder]) => {
        let target = folder === 'none' ? null : folder;
        if (folder.startsWith('new:')) target = (await createFolder(folder.slice(4))).id;
        await moveSet(setId, target);
        toast(target ? `Moved to ${st.libFolders[target] ? st.libFolders[target].name : 'the folder'}.` : 'Moved out of its folder.');
      },
    },
    { id: 'new-folder', label: 'New folder', hint: 'in your library', keywords: 'create', args: [{ name: 'name', prompt: 'Folder name', options: (_, typed) => (typed.trim() ? [{ key: typed.trim(), label: `Create "${typed.trim()}"` }] : []) }], run: async ([name]) => { await createFolder(name); toast(`Folder "${name}" made.`); } },
    {
      id: 'open-set', label: 'Open a question set', hint: 'library or coding', keywords: 'go browse start',
      args: [{ name: 'set', prompt: 'Which question set?', options: (s) => setOptions(s, true) }],
      run: ([id]) => go(id.startsWith('code:') ? `#/set/${id.slice(5)}` : `#/lib/${encodeURIComponent(id)}`)(),
    },
    {
      id: 'stats', label: 'Show stats for a question set', keywords: 'statistics results',
      args: [{ name: 'set', prompt: 'Which question set?', options: (s) => setOptions(s, true) }],
      run: ([id]) => go(id.startsWith('code:') ? `#/set/${id.slice(5)}/stats` : `#/lib/${encodeURIComponent(id)}/stats`)(),
    },
    { id: 'dashboard', label: 'Go to the dashboard', keywords: 'home runs', run: go('#/') },
    { id: 'sets', label: 'Go to question sets', keywords: 'library folders', run: go('#/sets') },
    { id: 'theme', label: 'Switch theme', hint: 'auto, light, dark', keywords: 'dark light mode', run: () => ctx.theme.toggle() },
    { id: 'settings', label: 'Open settings', keywords: 'preferences runner backup', run: () => ctx.open(({ close }) => <SettingsDialog close={close} />) },
    { id: 'shortcuts', label: 'Keyboard shortcuts', keywords: 'help keys', run: () => ctx.open(({ close }) => <ShortcutsDialog close={close} />) },
    { id: 'backup', label: 'Back up now', hint: 'download a backup file', keywords: 'save export', run: () => toast(`Saved ${downloadBackup()}.`) },
  ];
}

// Ctrl+K: a command palette. Type to find a command, Enter to run it. A command that needs more (which set, which
// folder) asks for each piece in turn and fills in the best match as you type, so it is: command, two words, Enter.
export default function CommandPalette({ theme }) {
  const st = useStore();
  const dialogs = useDialogs();
  const [openNow, setOpenNow] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.code !== 'KeyK') return;
      if (e.target.closest && e.target.closest('.monaco-editor')) return;   // Monaco uses Ctrl+K for its own chords
      if (document.querySelector('dialog[open]:not(.palette)')) return;
      e.preventDefault();
      e.stopPropagation();
      setOpenNow((o) => !o);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  if (!openNow) return null;
  return <Palette st={st} ctx={{ open: dialogs.open, theme }} onClose={() => setOpenNow(false)} />;
}

function Palette({ st, ctx, onClose }) {
  const dialog = useRef(null);
  const list = useRef(null);
  const [command, setCommand] = useState(null);
  const [values, setValues] = useState([]);        // the answers so far, one per argument
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const all = useMemo(() => commands(st, ctx), [st.libFolders, st.library.sets]);

  useEffect(() => { const d = dialog.current; d.showModal(); return () => { if (d.open) d.close(); }; }, []);

  const arg = command && command.args ? command.args[values.length] : null;
  const rows = useMemo(() => {
    if (!command) return fuzzyFilter(all.map((c) => ({ key: c.id, label: c.label, sub: c.hint, keywords: c.keywords, command: c })), query, 40).map((r) => r.item);
    const options = arg.options(st, query);
    const matched = fuzzyFilter(options.map((o) => ({ ...o, keywords: o.sub })), query, 40).map((r) => r.item);
    // an option that creates something stays last, so Enter on a name that exists never creates a copy
    return [...matched.filter((o) => !o.keepOrder), ...options.filter((o) => o.keepOrder)];
  }, [command, values.length, query, all, st.libFolders, st.library.sets]);

  useEffect(() => setActive(0), [query, command, values.length]);
  useEffect(() => { const row = list.current && list.current.children[active]; if (row) row.scrollIntoView({ block: 'nearest' }); }, [active, rows]);

  const finish = (cmd, vals) => { onClose(); setTimeout(async () => { try { await cmd.run(vals); } catch (e) { toast(e.message, 'bad'); } }, 0); };
  const choose = (row) => {
    if (!row) return;
    if (!command) {
      if (row.command.args) { setCommand(row.command); setQuery(''); } else finish(row.command, []);
      return;
    }
    const next = [...values, row.key];
    if (next.length === command.args.length) finish(command, next);
    else { setValues(next); setQuery(''); }
  };
  const back = () => {
    if (values.length) { setValues(values.slice(0, -1)); setQuery(''); } else { setCommand(null); setQuery(''); }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, rows.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' || e.key === 'Tab') { if (rows[active] || e.key === 'Enter') e.preventDefault(); choose(rows[active]); }
    else if (e.key === 'Backspace' && !query && command) { e.preventDefault(); back(); }
  };

  return (
    <dialog ref={dialog} className="modal quick palette" aria-label="Command palette" onCancel={(e) => { e.preventDefault(); onClose(); }} onMouseDown={(e) => { if (e.target === dialog.current) onClose(); }}>
      <div className="quick-input">
        <Icon name="code" />
        {command && <span className="chip accent">{command.label}</span>}
        {values.map((v, i) => <span key={i} className="chip">{command.args[i].options(st, '').find((o) => o.key === v)?.label || v.replace(/^new:/, '')}</span>)}
        <input type="text" autoFocus value={query} spellCheck={false} autoComplete="off" aria-controls="palette-results"
          placeholder={arg ? arg.prompt : 'Type a command…'} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} />
        <span className="kbd">Esc</span>
      </div>
      <ul id="palette-results" className="quick-list" role="listbox" ref={list}>
        {rows.map((r, i) => (
          <li key={r.key} role="option" aria-selected={i === active} className={i === active ? 'active' : ''} onMouseMove={() => { if (active !== i) setActive(i); }} onClick={() => choose(r)}>
            <span className="q-text"><span className="q-label">{r.label}</span>{r.sub && <span className="q-sub">{r.sub}</span>}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="quick-empty">{arg ? 'Nothing matches.' : 'No command matches.'}</li>}
      </ul>
      <div className="quick-foot muted">↑ ↓ move · Enter or Tab choose · Backspace go back · Esc close</div>
    </dialog>
  );
}
