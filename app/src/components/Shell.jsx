import { Fragment } from 'react';
import { useStore } from '../lib/store.js';
import { setRunner, setAutoSuggest } from '../lib/service.js';
import { RUNNERS } from '../lib/runners.js';
import { persistent } from '../lib/db.js';
import Icon from './Icon.jsx';
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

const SHORTCUTS = [
  ['Anywhere', [
    ['Search questions', ['Ctrl+P']],
    ['Search question sets and questions (dashboard)', ['/']],
  ]],
  ['In a run', [
    ['Compile and run the tests', ['Ctrl+Shift+Enter']],
    ['Show or hide the task', ['Alt+T']],
    ['Show or hide the question list', ['Alt+Q']],
    ['Show or hide the output', ['Alt+O']],
  ]],
  ['In the editor', [
    ['Open name suggestions', ['Ctrl+Space']],
    ['Format the code', ['Shift+Alt+F']],
  ]],
];

export function HelpDialog({ close }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={() => close()} footer={<button type="button" className="btn primary" onClick={() => close()}>Done</button>}>
      <dl className="shortcuts">
        {SHORTCUTS.map(([group, rows]) => (
          <Fragment key={group}>
            <h3>{group}</h3>
            {rows.map(([what, keys]) => (
              <Fragment key={what}>
                <dt>{what}</dt>
                <dd>{keys.map((k) => <span key={k} className="kbd">{k}</span>)}</dd>
              </Fragment>
            ))}
          </Fragment>
        ))}
      </dl>
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
