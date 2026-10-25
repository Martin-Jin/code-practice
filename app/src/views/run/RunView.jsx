import { useCallback, useEffect, useRef, useState } from 'react';
import { MODE_LABELS } from '../../../shared/modes.js';
import { useStore, state } from '../../lib/store.js';
import { getSet, getQuestion } from '../../lib/catalog.js';
import {
  runQuestion, resetCode, resetRun, reselect, renameRun, deleteRun, runSummary, flushSaves,
} from '../../lib/service.js';
import Icon from '../../components/Icon.jsx';
import { Modal, useDialogs } from '../../components/Dialogs.jsx';
import { SettingsButton, ThemeButton } from '../../components/Shell.jsx';
import ModePicker, { defaultChoice } from '../../components/ModePicker.jsx';
import { toast } from '../../components/Toasts.jsx';
import Sidebar, { questionStatus } from './Sidebar.jsx';
import TaskPane from './TaskPane.jsx';
import EditorPane from './EditorPane.jsx';
import Output from './Output.jsx';
import Finish from './Finish.jsx';
import RunMenu from './RunMenu.jsx';

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
};
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ } };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Draggable divider. onMove receives the pointer position; the parent turns it into a size.
function Splitter({ horizontal, onMove, onEnd }) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={`splitter ${horizontal ? 'h' : 'v'}${drag ? ' drag' : ''}`}
      role="separator" aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); }}
      onPointerMove={(e) => { if (drag) onMove(e); }}
      onPointerUp={() => { setDrag(false); onEnd(); }}
    />
  );
}

function ChangeModeDialog({ run, set, close }) {
  const [choice, setChoice] = useState({ mode: run.mode, options: { ...defaultChoice().options, ...run.options } });
  return (
    <Modal
      title="Change test mode" wide onClose={() => close(null)}
      footer={(
        <>
          <button type="button" className="btn" onClick={() => close(null)}>Cancel</button>
          <button type="button" className="btn primary" onClick={() => close(choice)}>Switch mode</button>
        </>
      )}
    >
      <div className="notice">Switching mode picks a new set of questions. Progress and drafts in this run are cleared; your lifetime stats are kept.</div>
      <ModePicker set={set} value={choice} onChange={setChoice} />
    </Modal>
  );
}

export default function RunView({ runId, param, theme }) {
  const st = useStore();
  const run = st.runs[runId];
  const dialogs = useDialogs();
  const editor = useRef(null);
  const workRef = useRef(null);
  const rightRef = useRef(null);

  const [running, setRunning] = useState(null);       // question number being run
  const [runnerError, setRunnerError] = useState(null);
  const [outTabs, setOutTabs] = useState({});
  const [taskOpen, setTaskOpen] = useState(() => load('taskOpen', window.innerWidth > 1100));
  const [peek, setPeek] = useState(false);
  const [sideOpen, setSideOpen] = useState(() => load('sideOpen', true));
  const [outputOpen, setOutputOpen] = useState(() => load('outputOpen', true));
  const [sizes, setSizes] = useState(() => load('sizes', { q: 42, out: 38 }));
  const [editorKey, setEditorKey] = useState(0);
  const [finishOpen, setFinishOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const set = run && getSet(run.setId);
  const numbers = run ? run.questions : [];
  const asNumber = Number(param);
  const n = run && (numbers.includes(asNumber) ? asNumber : numbers.includes(run.current) ? run.current : numbers[0]);
  const q = run && getQuestion(run.setId, n);
  const showFinish = !!run && run.completedAt && (finishOpen || param === 'summary');

  const goto = useCallback((num) => { window.location.hash = `#/run/${runId}/${num}`; }, [runId]);

  // A bare #/run/<id> URL settles on the current question.
  useEffect(() => { if (run && String(n) !== param && param !== 'summary') window.location.replace(`#/run/${runId}/${n}`); }, [run, n, param, runId]);

  const toggleTask = useCallback(() => {
    setPeek(false);
    setTaskOpen((open) => { save('taskOpen', !open); return !open; });
  }, []);
  const toggleSide = useCallback(() => setSideOpen((open) => { save('sideOpen', !open); return !open; }), []);
  const toggleOutput = useCallback(() => setOutputOpen((open) => { save('outputOpen', !open); return !open; }), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 't') { e.preventDefault(); if (taskOpen) toggleTask(); else setPeek((p) => !p); }
      else if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'b') { e.preventDefault(); toggleSide(); }
      else if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'o') { e.preventDefault(); toggleOutput(); }
      else if (e.key === 'Escape') setPeek(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [taskOpen, toggleTask, toggleSide, toggleOutput]);

  // Write drafts to disk when the tab is hidden or closed.
  useEffect(() => {
    const flush = () => { if (editor.current) editor.current.flush(); else flushSaves(); };
    const hidden = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', hidden);
    return () => { window.removeEventListener('beforeunload', flush); document.removeEventListener('visibilitychange', hidden); flush(); };
  }, []);

  useEffect(() => { if (run) document.title = `${run.name} · Code Practice`; return () => { document.title = 'Code Practice'; }; }, [run && run.name]);

  const currentN = useRef(n);
  currentN.current = n;

  const handleRun = useCallback(async () => {
    if (running !== null || !run) return;
    const num = n;
    if (state.runner === 'online' && load('online-ack', false) !== true) {
      const ok = await dialogs.confirm({
        title: 'Run on wandbox.org?',
        body: 'The online runner sends your answer, together with this question’s tests, to wandbox.org to be compiled and run. Nothing else is sent. You can switch to the local runner in Settings if you have the local server running.',
        confirmText: 'Run online',
      });
      if (!ok) return;
      save('online-ack', true);
    }
    const code = editor.current.getCode();
    setOutputOpen(true);  // a run is pointless if its result stays hidden
    save('outputOpen', true);
    setRunning(num);
    setRunnerError(null);
    try {
      const { result, justCompleted } = await runQuestion(run.id, num, code);
      setOutTabs((t) => ({ ...t, [num]: result.status === 'compile_error' ? 'compiler' : 'results' }));
      if (currentN.current === num && editor.current) editor.current.setMarkers(result.compile.diagnostics);
      if (justCompleted) { setCelebrate(true); setFinishOpen(true); }
    } catch (e) {
      setRunnerError(e.message);
    } finally {
      setRunning(null);
    }
  }, [running, run, n, dialogs]);

  if (!run) {
    return (
      <div className="page">
        <div className="empty">This run no longer exists. <a href="#/">Back to the dashboard</a></div>
      </div>
    );
  }

  const sum = runSummary(run);
  const stq = run.state[n];
  const idx = numbers.indexOf(n);
  const result = stq.lastResult;
  const status = questionStatus(run, n);
  const rerollable = run.mode === 'practice' || run.mode === 'random';

  const resetCurrentCode = async () => {
    const edited = editor.current.getCode() !== q.starter;
    if (edited) {
      const ok = await dialogs.confirm({
        title: 'Reset your code?', body: 'The editor goes back to the starter code for this question. Your current code is lost.',
        confirmText: 'Reset code', danger: true,
      });
      if (!ok) return;
    }
    editor.current.discard();
    editor.current.setCode(resetCode(run.id, n));
  };

  const afterSelectionChange = () => { setEditorKey((k) => k + 1); setOutTabs({}); setRunnerError(null); window.location.hash = `#/run/${runId}`; };

  const menu = [
    { label: 'Rename run', icon: 'pencil', onClick: async () => {
      const name = await dialogs.prompt({ title: 'Rename run', label: 'Run name (leave empty for the default)', initial: run.name });
      if (name !== null) renameRun(run.id, name);
    } },
    'sep',
    { label: 'Reset progress', icon: 'refresh', onClick: async () => {
      const ok = await dialogs.confirm({
        title: 'Reset this run?', body: `All ${sum.total} questions go back to their starter code and their results are cleared. The question selection stays the same. Your lifetime stats are kept.`,
        confirmText: 'Reset progress', danger: true,
      });
      if (ok) { editor.current.discard(); resetRun(run.id); afterSelectionChange(); }
    } },
    { label: 'New questions (re-draw)', icon: 'refresh', disabled: !rerollable,
      title: rerollable ? undefined : 'Only Practice test and Random runs draw questions at random',
      onClick: async () => {
        const ok = await dialogs.confirm({
          title: 'Draw new questions?', body: 'You get a fresh random selection for this mode. Progress and drafts in this run are cleared.',
          confirmText: 'Draw new questions', danger: true,
        });
        if (ok) { editor.current.discard(); reselect(run.id); afterSelectionChange(); }
      } },
    { label: 'Change test mode…', icon: 'sidebar', onClick: async () => {
      const choice = await dialogs.open(({ close }) => <ChangeModeDialog run={run} set={set} close={close} />);
      if (!choice) return;
      try { editor.current.discard(); reselect(run.id, choice.mode, choice.options); afterSelectionChange(); } catch (e) { toast(e.message, 'bad'); }
    } },
    'sep',
    { label: 'Abandon run', icon: 'trash', danger: true, onClick: async () => {
      const ok = await dialogs.confirm({
        title: 'Abandon this run?', body: `This deletes the run, its ${sum.passed} passed question${sum.passed === 1 ? '' : 's'} and your drafts. Your lifetime stats are kept.`,
        confirmText: 'Abandon run', danger: true,
      });
      if (ok) { editor.current.discard(); deleteRun(run.id); window.location.hash = '#/'; }
    } },
  ];

  const startDrag = (axis) => (e) => {
    if (axis === 'x') {
      const r = workRef.current.getBoundingClientRect();
      setSizes((s) => ({ ...s, q: clamp(((e.clientX - r.left) / r.width) * 100, 22, 70) }));
    } else {
      const r = rightRef.current.getBoundingClientRect();
      setSizes((s) => ({ ...s, out: clamp(((r.bottom - e.clientY) / r.height) * 100, 12, 75) }));
    }
  };

  const taskPane = <TaskPane q={q} onHide={taskOpen ? toggleTask : () => setPeek(false)} />;

  return (
    <div className="run">
      <header className="run-top">
        <a className="btn ghost icon-only" href="#/" title="Back to the dashboard. Your progress is kept." aria-label="Back to the dashboard"><Icon name="back" /></a>
        <button type="button" className="btn ghost icon-only" onClick={toggleSide} aria-pressed={sideOpen} title="Show or hide the question list (Alt+B)" aria-label="Toggle question list">
          <Icon name="sidebar" />
        </button>
        <h1 title={`${run.name} (${MODE_LABELS[run.mode]})`}>{run.name}</h1>
        <span className="spacer" />
        <div className="progress" title={`${sum.passed} of ${sum.total} questions pass`}>
          <div className={`bar${run.completedAt ? ' ok' : ''}`}><i style={{ width: `${(sum.passed / sum.total) * 100}%` }} /></div>
          <span>{sum.passed}/{sum.total}</span>
        </div>
        {run.completedAt && <button type="button" className="btn" onClick={() => { setCelebrate(false); setFinishOpen(true); }}>Results</button>}
        <RunMenu items={menu} />
        <SettingsButton />
        <ThemeButton theme={theme} />
      </header>

      <div className={`run-body${sideOpen ? '' : ' side-hidden'}`}>
        <Sidebar run={run} set={set} current={n} onSelect={goto} />

        <div className={`work${taskOpen ? '' : ' task-closed'}`} ref={workRef} style={{ '--q-w': `${sizes.q}%` }}>
          <button type="button" className="rail" onClick={() => setPeek(true)} title="Show the task (Alt+T)">
            <Icon name="task" /><span>TASK</span>
          </button>
          {taskOpen && taskPane}
          {taskOpen && <Splitter onMove={startDrag('x')} onEnd={() => save('sizes', sizes)} />}

          <section className={`right${outputOpen ? '' : ' out-closed'}`} ref={rightRef} style={{ '--out-h': `${sizes.out}%` }}>
            <div className="editor-bar">
              <span className="qt" title={q.title}>Q{n} · {q.title}</span>
              {stq.attempts > 0 && <span className="muted small">{stq.attempts} attempt{stq.attempts === 1 ? '' : 's'}</span>}
              {status === 'passed' && <span className="chip ok">Passed</span>}
              <button type="button" className="btn ghost" aria-pressed={taskOpen} onClick={toggleTask} title="Show or hide the task text next to the editor (Alt+T)">
                <Icon name="task" /> Task
              </button>
              <button type="button" className="btn ghost" aria-pressed={outputOpen} onClick={toggleOutput} title="Show or hide the test output under the editor (Alt+O)">
                <Icon name="stats" /> Output
              </button>
              <button type="button" className="btn ghost icon-only" disabled={idx <= 0} onClick={() => goto(numbers[idx - 1])} title="Previous question" aria-label="Previous question"><Icon name="back" /></button>
              <button type="button" className="btn ghost icon-only" disabled={idx >= numbers.length - 1} onClick={() => goto(numbers[idx + 1])} title="Next question" aria-label="Next question">
                <Icon name="back" style={{ transform: 'rotate(180deg)' }} />
              </button>
              <button type="button" className="btn ghost icon-only" onClick={resetCurrentCode} title="Reset code: put the starter code back" aria-label="Reset code"><Icon name="refresh" /></button>
              <button type="button" className="btn primary" onClick={handleRun} disabled={running !== null} title="Compile and run the tests (Ctrl+Enter)">
                <Icon name="play" solid /> {running === n ? 'Running…' : 'Run'}
              </button>
            </div>
            <EditorPane key={editorKey} ref={editor} run={run} n={n} dark={theme.dark} onRun={handleRun} />
            {outputOpen && <Splitter horizontal onMove={startDrag('y')} onEnd={() => save('sizes', sizes)} />}
            <Output
              result={result} q={q} running={running === n} runnerError={runnerError} open={outputOpen} onToggle={toggleOutput}
              tab={outTabs[n] || 'results'} onTab={(t) => setOutTabs((o) => ({ ...o, [n]: t }))}
              onJump={(line, col) => editor.current && editor.current.reveal(line, col)}
            />
          </section>

          {peek && !taskOpen && (
            <>
              <div className="peek-backdrop" onClick={() => setPeek(false)} />
              <div className="peek">{taskPane}</div>
            </>
          )}
        </div>
      </div>

      {showFinish && (
        <Finish run={run} celebrate={celebrate} onClose={() => { setFinishOpen(false); setCelebrate(false); if (param === 'summary') goto(n); }} />
      )}
    </div>
  );
}
