import { Fragment, useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { setRunner, setAutoSuggest, setPrioritise, setShortcut, resetShortcuts } from '../lib/service.js';
import { ACTIONS, FIXED, comboFor, eventCombo, checkCombo } from '../lib/shortcuts.js';
import { RUNNERS } from '../lib/runners.js';
import { persistent } from '../lib/db.js';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import Keys from './Keys.jsx';
import { Modal, useDialogs } from './Dialogs.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import { BackupSection } from './Backup.jsx';
import KebabMenu from './KebabMenu.jsx';
import { APP_NAME } from '../../shared/brand.js';
import { DEFAULT_AGENT_URL, normaliseAgentUrl } from '../../shared/solve-agent.js';
import { readAgentUrl, saveAgentUrl } from '../lib/solve-agent.js';
import { toast } from './Toasts.jsx';
import { openWelcome } from './Welcome.jsx';

export const THEME_ICON = { auto: 'auto', light: 'sun', dark: 'moon' };
export const THEME_LABEL = { auto: 'Auto (follows your system)', light: 'Light', dark: 'Dark' };

export function SettingsDialog({ close }) {
  const st = useStore();
  const { open } = useDialogs();
  const [agentUrl, setAgentUrl] = useState(readAgentUrl);
  const [agentUrlError, setAgentUrlError] = useState('');
  const options = ['local', 'online'];
  const saveAgentWebsite = () => {
    if (!normaliseAgentUrl(agentUrl)) {
      setAgentUrlError('Enter a complete HTTPS address without a username or password.');
      return;
    }
    try {
      setAgentUrl(saveAgentUrl(agentUrl));
      setAgentUrlError('');
      toast('AI chat website saved.');
    } catch (e) {
      setAgentUrlError(`Could not save this setting: ${e.message}`);
    }
  };
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
      <h3>Practice</h3>
      <label className="check">
        <input type="checkbox" checked={st.prioritise} onChange={(e) => setPrioritise(e.target.checked)} />
        <span>Draw questions I struggle with more often</span>
      </label>
      <p className="muted">
        Applies to random picks: the practice test, Random mode, and random sessions in your library. C++ questions you fail often come up more; library questions you marked difficult or got wrong come up more. Every question can still appear.
      </p>
      <h3>AI agent</h3>
      <label className="field">AI chat website
        <input type="text" value={agentUrl} placeholder={DEFAULT_AGENT_URL} autoComplete="url" onChange={(e) => { setAgentUrl(e.target.value); setAgentUrlError(''); }} />
      </label>
      <p className="muted">Solve with agent opens this HTTPS address and copies the question, your saved answers and notes. Use Try Claude Desktop below a solution to try the app instead. Nothing is sent until you paste it into the chat. The question image is copied when the browser supports it; otherwise attach it manually.</p>
      {agentUrlError && <div className="notice bad" role="alert">{agentUrlError}</div>}
      <button type="button" className="btn" onClick={saveAgentWebsite}>Save AI chat website</button>
      {!persistent && <div className="notice">This browser is not letting the page save data, so progress will be lost when you close the tab.</div>}
      <h3>Help</h3>
      <div><button type="button" className="btn" onClick={() => { close(); openWelcome(open); }}>Open the tutorial and what's new</button></div>
      <BackupSection />
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

// Settings, help and the theme switch behind one three-dot button, so the top bar stays short on a phone.
function NavMenu({ theme }) {
  const { open } = useDialogs();
  return (
    <KebabMenu label="Settings, help and theme" items={[
      { label: 'Settings', icon: 'gear', onClick: () => open(({ close }) => <SettingsDialog close={close} />) },
      { label: 'Tutorial and what\'s new', icon: 'questions', onClick: () => openWelcome(open) },
      { label: 'Help: keyboard shortcuts', icon: 'help', onClick: () => open(({ close }) => <HelpDialog close={close} />) },
      { label: `Theme: ${THEME_LABEL[theme.mode]}`, icon: THEME_ICON[theme.mode], onClick: theme.toggle },
    ]} />
  );
}

// The app's pages: the dashboard (what you are in the middle of), the question sets (everything you can start) and the history (the last sets you ran).
const TABS = [['dashboard', 'Dashboard', '#/', 'home'], ['sets', 'Question sets', '#/sets', 'questions'], ['history', 'History', '#/history', 'history']];
const tabOfHash = () => (/^#\/(sets|set|lib|q)(\/|$)/.test(window.location.hash) ? 'sets' : /^#\/history(\/|$)/.test(window.location.hash) ? 'history' : /^#\/?$/.test(window.location.hash) ? 'dashboard' : null);

// Top bar for the dashboard, set and stats pages. `hero` is a banner between the bar and the page (the landing page's).
export default function Shell({ crumbs = [], theme, hero = null, children }) {
  return (
    <>
      <nav className="shell-nav">
        <a className="brand" href="#/"><span className="logo"><Logo /></span><span className="brand-name">{APP_NAME}</span></a>
        <div className="top-tabs" role="navigation" aria-label="Pages">
          {TABS.map(([id, label, href, icon]) => (
            <a key={id} href={href} title={label} aria-label={label} aria-current={tabOfHash() === id ? 'page' : undefined}>
              <Icon name={icon} /><span className="tab-label">{label}</span>
            </a>
          ))}
        </div>
        <span className="spacer" />
        <GlobalSearch />
        <NavMenu theme={theme} />
      </nav>
      {hero}
      <main className="page">
        {crumbs.length > 0 && (
          <div className="crumbs" role="group" aria-label="Current location">
            {crumbs.map((c, i) => (
              <span key={i} className="crumb-group">
                <span className="crumb-sep" aria-hidden="true">/</span>
                {c.href && i < crumbs.length - 1 ? <a className="crumb-item" href={c.href}>{c.label}</a> : <b className="crumb-item" aria-current={i === crumbs.length - 1 ? 'location' : undefined}>{c.label}</b>}
              </span>
            ))}
          </div>
        )}
        {children}
      </main>
    </>
  );
}
