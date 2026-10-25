import { Fragment, useEffect, useState } from 'react';
import { useStore } from '../lib/store.js';
import { setRunner, setAutoSuggest, setShortcut, resetShortcuts } from '../lib/service.js';
import { ACTIONS, FIXED, comboFor, eventCombo, checkCombo } from '../lib/shortcuts.js';
import { RUNNERS } from '../lib/runners.js';
import { persistent } from '../lib/db.js';
import Icon from './Icon.jsx';
import Keys from './Keys.jsx';
import { Modal, useDialogs } from './Dialogs.jsx';
import GlobalSearch from './GlobalSearch.jsx';

export const THEME_ICON = { auto: 'auto', light: 'sun', dark: 'moon' };
export const THEME_LABEL = { auto: 'Auto (follows your system)', light: 'Light', dark: 'Dark' };

// Shows the current mode; a click switches to the next one (auto, light, dark).
export function ThemeButton({ theme }) {
  const label = `Theme: ${THEME_LABEL[theme.mode]}. Click for ${THEME_LABEL[theme.next]}.`;
  return (
    <button type="button" className="btn ghost icon-only" onClick={theme.toggle} title={label} aria-label={label}>
      <Icon name={THEME_ICON[theme.mode]} />
    </button>
  );
}

export function SettingsDialog({ close }) {
  const st = useStore();
  const options = ['local', 'online'];
  return (
    <Modal title="Settings" onClose={() => close()} footer={<button type="button" className="btn primary" onClick={() => close()}>Done</button>}>
      <div className="modes">
        {options.map((id) => {
          const disabled = id === 'local' && !st.local;
          return (
            <div key={id} className={`mode${st.runner === id ? ' selected' : ''}`} style={disabled ? { opacity: 0.6 } : undefined}>
              <label>
                <input type="radio" name="runner" disabled={disabled} checked={st.runner === id} onChange={() => setRunner(id)} />
                <span className="m-title">{RUNNERS[id].label}</span>
                <span className="m-desc">
                  {id === 'local'
                    ? (st.local ? `${st.local.compiler}. Nothing leaves this computer.` : 'Not available: start the local server with "npm run serve" in the app folder, then open the page it prints.')
                    : 'Compiles on wandbox.org, a free public service, so nothing has to be installed. Your answer and the question’s tests are sent to it.'}
                </span>
              </label>
            </div>
          );
        })}
      </div>
      <h3>Editor</h3>
      <label className="check">
        <input type="checkbox" checked={st.autoSuggest} onChange={(e) => setAutoSuggest(e.target.checked)} />
        <span>Suggest names as you type (Ctrl+Space also turns this on)</span>
      </label>
      {!persistent && <div className="notice">This browser is not letting the page save data, so progress will be lost when you close the tab.</div>}
      <p className="muted">Runs, drafts and stats are saved in this browser only. Clearing site data removes them.</p>
    </Modal>
  );
}

// Keyboard shortcuts. Click a key combination to record a new one; a combination that clashes
// with another action is refused, and one that clashes with a browser shortcut asks first.
export function HelpDialog({ close }) {
  const st = useStore();
  const [editing, setEditing] = useState(null);   // action id waiting for a key press
  const [note, setNote] = useState('');            // why the last key press was refused
  const [pending, setPending] = useState(null);    // { id, combo, text }: a clash to confirm

  const apply = (id, combo) => {
    setShortcut(id, combo === ACTIONS.find((a) => a.id === id).def ? null : combo);
    setEditing(null);
    setNote('');
    setPending(null);
  };

  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') { setEditing(null); setNote(''); return; }
      const combo = eventCombo(e);
      if (!combo) return;
      const res = checkCombo(combo, editing, st.shortcuts);
      if (res.error) { setNote(res.error); return; }
      if (res.warning) { setPending({ id: editing, combo, text: res.warning }); setEditing(null); setNote(''); return; }
      apply(editing, combo);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [editing, st.shortcuts]);

  const changed = Object.keys(st.shortcuts).length > 0;
  const groups = [...new Set([...ACTIONS, ...FIXED].map((x) => x.group))];
  return (
    <Modal
      title="Keyboard shortcuts" onClose={() => close()}
      footer={(
        <>
          {changed && <button type="button" className="btn" onClick={() => { resetShortcuts(); setNote(''); setPending(null); }}>Reset all</button>}
          <button type="button" className="btn primary" onClick={() => close()}>Done</button>
        </>
      )}
    >
      <p className="muted">Click a shortcut to change it, then press the new keys. Esc cancels.</p>
      <dl className="shortcuts">
        {groups.map((group) => (
          <Fragment key={group}>
            <h3>{group}</h3>
            {ACTIONS.filter((x) => x.group === group).map((a) => (
              <Fragment key={a.id}>
                <dt>{a.label}</dt>
                <dd>
                  {st.shortcuts[a.id] && !editing && (
                    <button type="button" className="btn ghost sm" onClick={() => apply(a.id, a.def)} title={`Put ${a.def} back`}>Reset</button>
                  )}
                  <button type="button" className={`rebind${editing === a.id ? ' recording' : ''}`} aria-label={`${a.label}: ${comboFor(a.id, st.shortcuts)}. Change`}
                    onClick={() => { setEditing(a.id); setNote(''); setPending(null); }}>
                    {editing === a.id ? 'Press the new keys…' : <Keys combo={comboFor(a.id, st.shortcuts)} />}
                  </button>
                </dd>
              </Fragment>
            ))}
            {FIXED.filter((x) => x.group === group).map((f) => (
              <Fragment key={f.label}>
                <dt>{f.label}</dt>
                <dd><span className="kbd">{f.combo}</span></dd>
              </Fragment>
            ))}
          </Fragment>
        ))}
      </dl>
      {note && <div className="notice" role="alert">{note}</div>}
      {pending && (
        <div className="notice" role="alert">
          <p>{pending.text}</p>
          <p style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" className="btn primary sm" onClick={() => apply(pending.id, pending.combo)}>Use {pending.combo} anyway</button>
            <button type="button" className="btn sm" onClick={() => setPending(null)}>Keep the old one</button>
          </p>
        </div>
      )}
    </Modal>
  );
}

export function HelpButton() {
  const { open } = useDialogs();
  return (
    <button type="button" className="btn ghost icon-only" onClick={() => open(({ close }) => <HelpDialog close={close} />)}
      title="Help: keyboard shortcuts" aria-label="Help: keyboard shortcuts">
      <Icon name="help" />
    </button>
  );
}

export function SettingsButton() {
  const { open } = useDialogs();
  const st = useStore();
  return (
    <button type="button" className="btn ghost" onClick={() => open(({ close }) => <SettingsDialog close={close} />)}
      title={`Settings. Code is compiled with: ${RUNNERS[st.runner].label}`} aria-label={`Settings, runner: ${RUNNERS[st.runner].label}`}>
      <Icon name="gear" /> {RUNNERS[st.runner].short}
    </button>
  );
}

// Top bar for the dashboard, set and stats pages.
export default function Shell({ crumbs = [], theme, children }) {
  return (
    <>
      <nav className="shell-nav">
        <a className="brand" href="#/"><span className="logo"><Icon name="terminal" /></span>Code Practice</a>
        <div className="crumbs">
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <span>/</span>
              {c.href ? <a href={c.href}>{c.label}</a> : <b>{c.label}</b>}
            </span>
          ))}
        </div>
        <span className="spacer" />
        <GlobalSearch />
        <SettingsButton />
        <HelpButton />
        <ThemeButton theme={theme} />
      </nav>
      <main className="page">{children}</main>
    </>
  );
}
