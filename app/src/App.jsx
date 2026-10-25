import { useEffect, useState } from 'react';
import { useStore } from './lib/store.js';
import { boot } from './lib/service.js';
import { flushPracticeSaves } from './lib/practice.js';
import useTheme from './components/useTheme.js';
import { DialogProvider } from './components/Dialogs.jsx';
import ToastHost from './components/Toasts.jsx';
import Dashboard from './views/Dashboard.jsx';
import SetPage from './views/SetPage.jsx';
import Stats from './views/Stats.jsx';
import LibrarySet from './views/LibrarySet.jsx';
import LibraryStats from './views/LibraryStats.jsx';
import QuestionView from './views/QuestionView.jsx';
import PracticeView from './views/PracticeView.jsx';
import RunView from './views/run/RunView.jsx';

// #/  #/set/<id>  #/set/<id>/stats  #/lib/<id>  #/lib/<id>/stats  #/q/<set id>/<uid>  #/practice/<id>  #/practice/<id>/<uid|summary>  #/run/<id>  #/run/<id>/<question>  #/run/<id>/summary
function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => setParts(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}

function Screen({ theme }) {
  const [view, id, extra] = useRoute();
  if (view === 'run' && id) return <RunView key={id} runId={id} param={extra} theme={theme} />;
  if (view === 'set' && id && extra === 'stats') return <Stats setId={id} theme={theme} />;
  if (view === 'set' && id) return <SetPage setId={id} theme={theme} />;
  if (view === 'lib' && id && extra === 'stats') return <LibraryStats setId={id} theme={theme} />;
  if (view === 'lib' && id) return <LibrarySet setId={id} theme={theme} />;
  if (view === 'practice' && id) return <PracticeView runId={id} param={extra} theme={theme} />;
  if (view === 'q' && id && extra) return <QuestionView key={`${id}/${extra}`} setId={id} uid={extra} theme={theme} />;
  return <Dashboard theme={theme} />;
}

export default function App() {
  const st = useStore();
  const theme = useTheme();
  useEffect(() => { boot(); }, []);
  // Answers are saved a moment after typing; make sure none is lost when the tab closes.
  useEffect(() => {
    window.addEventListener('pagehide', flushPracticeSaves);
    return () => window.removeEventListener('pagehide', flushPracticeSaves);
  }, []);
  // Ctrl+S is muscle memory from VS Code; the app saves by itself, so stop the browser's save dialog.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 's') e.preventDefault();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  let body;
  if (!st.ready) body = <div className="running" style={{ justifyContent: 'center', height: '100vh' }}><span className="spinner" /> Loading…</div>;
  else if (st.error) {
    body = (
      <div className="page">
        <div className="notice">
          <b>The app could not start.</b> {st.error}
          <p style={{ marginTop: 6 }}>If you are running it locally, build the question catalog with <code>npm run catalog</code> in the app folder and reload.</p>
        </div>
      </div>
    );
  } else body = <Screen theme={theme} />;

  return (
    <DialogProvider>
      {body}
      <ToastHost />
    </DialogProvider>
  );
}
