import { useStore } from '../lib/store.js';
import { setRunner } from '../lib/service.js';
import { RUNNERS } from '../lib/runners.js';
import { persistent } from '../lib/db.js';
import Icon from './Icon.jsx';
import { Modal, useDialogs } from './Dialogs.jsx';

export function ThemeButton({ theme }) {
  return (
    <button type="button" className="btn ghost icon-only" onClick={theme.toggle} title="Switch light / dark theme" aria-label="Switch light or dark theme">
      <Icon name={theme.dark ? 'sun' : 'moon'} />
    </button>
  );
}

function SettingsDialog({ close }) {
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
      {!persistent && <div className="notice">This browser is not letting the page save data, so progress will be lost when you close the tab.</div>}
      <p className="muted">Runs, drafts and stats are saved in this browser only. Clearing site data removes them.</p>
    </Modal>
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
        <SettingsButton />
        <ThemeButton theme={theme} />
      </nav>
      <main className="page">{children}</main>
    </>
  );
}
