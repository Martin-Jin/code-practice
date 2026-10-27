import { useCallback, useEffect, useRef, useState } from 'react';
import { MODE_LABELS } from '../../../shared/modes.js';
import { useStore, state } from '../../lib/store.js';
import { eventCombo, actionFor, comboFor } from '../../lib/shortcuts.js';
import { getSet, getQuestion } from '../../lib/catalog.js';
import {
  runQuestion, setAutoSuggest, resetCode, resetRun, reselect, renameRun, deleteRun, runSummary, flushSaves,
} from '../../lib/service.js';
import Icon from '../../components/Icon.jsx';
import Logo from '../../components/Logo.jsx';
import { Modal, useDialogs } from '../../components/Dialogs.jsx';
import { SettingsDialog, HelpDialog, THEME_ICON, THEME_LABEL } from '../../components/Shell.jsx';
import ModePicker, { defaultChoice } from '../../components/ModePicker.jsx';
import { toast } from '../../components/Toasts.jsx';
import { backupNote } from '../../lib/backup.js';
import Sidebar, { questionStatus } from './Sidebar.jsx';
import TaskPane from './TaskPane.jsx';
import EditorPane from './EditorPane.jsx';
import Output from './Output.jsx';
import Finish from './Finish.jsx';
import RunMenu from './RunMenu.jsx';
import QuickSearch from '../../components/QuickSearch.jsx';
import useMediaQuery from '../../components/useMediaQuery.js';

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
};
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ } };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Pane sizes in percent, shared by every question and run (saved in this browser).
const DEFAULT_SIZES = { q: 42, out: 38 };
const TASK_RANGE = [22, 70];
const OUT_RANGE = [12, 75];
// Dragging a divider closer than this to its edge hides the pane when you let go.
const HIDE_TASK_BELOW = 12;   // % of the workspace width
const HIDE_OUT_BELOW = 8;     // % of the editor column height

// Draggable divider. onMove receives the pointer position; the parent turns it into a size.
// The drag ends however the pointer is released (also outside the window), a double-click
// resets the size, and a body class stops text selection and the editor stealing the mouse.
function Splitter({ horizontal, onMove, onEnd, onReset }) {
  const [drag, setDrag] = useState(false);
  const stop = () => {
    if (!drag) return;
    setDrag(false);
    document.body.classList.remove('resizing', 'resizing-x', 'resizing-y');
    onEnd();
  };
  return (
    <div
      className={`splitter ${horizontal ? 'h' : 'v'}${drag ? ' drag' : ''}`}
      role="separator" aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      title="Drag to resize. Drag to the edge to hide. Double-click to reset."
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        document.body.classList.add('resizing', horizontal ? 'resizing-y' : 'resizing-x');
        setDrag(true);
      }}
      onPointerMove={(e) => { if (drag) onMove(e); }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onDoubleClick={onReset}
    />
  );
}

function ChangeModeDialog({ run, set, close }) {
  const [choice, setChoice] = useState({ mode: run.mode === 'custom' ? 'practice' : run.mode, options: { ...defaultChoice().options, ...run.options } });
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
  const keyOf = (id) => comboFor(id, st.shortcuts);
  const run = st.runs[runId];
  const dialogs = useDialogs();
  const editor = useRef(null);
  const workRef = useRef(null);
  const rightRef = useRef(null);
  const dragRef = useRef(null);  // set while a drag has gone past the hide threshold

  const [running, setRunning] = useState(null);       // question number being run
  const [runnerError, setRunnerError] = useState(null);
  const [outTabs, setOutTabs] = useState({});
  const [taskOpen, setTaskOpen] = useState(() => load('taskOpen', window.innerWidth > 1100));
  const [sideOpen, setSideOpen] = useState(() => load('sideOpen', true));
  const [outputOpen, setOutputOpen] = useState(() => load('outputOpen', true));
  const [sizes, setSizes] = useState(() => load('sizes', DEFAULT_SIZES));
  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;
  const [editorKey, setEditorKey] = useState(0);
  const [finishOpen, setFinishOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // On a phone the workspace shows one panel at a time, chosen from a bar at the bottom.
  const mobile = useMediaQuery('(max-width: 820px)');
  const [mtab, setMtab] = useState('task');
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
    setTaskOpen((open) => { save('taskOpen', !open); return !open; });
  }, []);
  const toggleSide = useCallback(() => setSideOpen((open) => { save('sideOpen', !open); return !open; }), []);
  const toggleOutput = useCallback(() => setOutputOpen((open) => { save('outputOpen', !open); return !open; }), []);

  // Keyboard shortcuts (rebindable, see shortcuts.js). Capture phase, so they also work while the
  // editor has focus; ignored while a dialog is open. actionsRef is filled in below, once the
  // handlers exist.
  const actionsRef = useRef({});
  useEffect(() => {
    const onKey = (e) => {
      if (document.querySelector('dialog[open]')) return;
      const combo = eventCombo(e);
      const action = combo && actionFor(combo, state.shortcuts);
      const fn = action && action.id !== 'exit' && actionsRef.current[action.id];
      if (!fn) return;
      e.preventDefault();
      e.stopPropagation();
      fn();
    };
    // Leaving the run waits for the bubble phase: if the editor (closing a suggestion list, clearing
    // a selection) or a menu already used the key, it has called preventDefault and we stay.
    const onKeyLate = (e) => {
      if (e.defaultPrevented || document.querySelector('dialog[open]')) return;
      const combo = eventCombo(e);
      const action = combo && actionFor(combo, state.shortcuts);
      if (action && action.id === 'exit') { e.preventDefault(); window.location.hash = '#/'; }
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keydown', onKeyLate);
    return () => { window.removeEventListener('keydown', onKey, true); window.removeEventListener('keydown', onKeyLate); };
  }, []);

  // Write drafts to disk when the tab is hidden or closed.
  useEffect(() => {
    const flush = () => { if (editor.current) editor.current.flush(); else flushSaves(); };
    const hidden = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', hidden);
    return () => { window.removeEventListener('beforeunload', flush); document.removeEventListener('visibilitychange', hidden); flush(); };
  }, []);

  useEffect(() => { if (run) document.title = `${run.name} · Practice Questions`; return () => { document.title = 'Practice Questions'; }; }, [run && run.name]);

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
    setMtab('output');
    setRunning(num);
    setRunnerError(null);
    try {
      const { result, justCompleted, counted } = await runQuestion(run.id, num, code);
      if (!counted) toast('Nothing typed yet, so this run was not counted as an attempt.');
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
    { label: 'Reset code', icon: 'refresh', title: 'Put the starter code back for this question', onClick: resetCurrentCode },
    { label: `Suggest as you type: ${st.autoSuggest ? 'on' : 'off'}`, icon: 'code', title: `Name suggestions while typing. ${keyOf('suggest')} also turns this on.`, onClick: () => setAutoSuggest(!st.autoSuggest) },
    { label: 'Settings…', icon: 'gear', onClick: () => dialogs.open(({ close }) => <SettingsDialog close={close} />) },
    { label: `Theme: ${THEME_LABEL[theme.mode]}`, icon: THEME_ICON[theme.mode], title: `Click for ${THEME_LABEL[theme.next]}`, onClick: theme.toggle },
    { label: 'Keyboard shortcuts', icon: 'help', onClick: () => dialogs.open(({ close }) => <HelpDialog close={close} />) },
    'sep',
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
        title: 'Abandon this run?', body: `This deletes the run, its ${sum.passed} passed question${sum.passed === 1 ? '' : 's'} and your drafts. Your lifetime stats are kept.${backupNote()}`,
        confirmText: 'Abandon run', danger: true,
      });
      if (ok) { editor.current.discard(); deleteRun(run.id); window.location.hash = '#/'; }
    } },
  ];

  // Below the hide threshold the pane shrinks with the pointer as a preview; letting go there
  // hides it and brings back the last size that was kept, ready for the next time it opens.
  const startDrag = (axis) => (e) => {
    if (axis === 'x') {
      const r = workRef.current.getBoundingClientRect();
      const raw = ((e.clientX - r.left) / r.width) * 100;
      dragRef.current = raw < HIDE_TASK_BELOW ? 'task' : null;
      setSizes((s) => ({ ...s, q: raw < HIDE_TASK_BELOW ? Math.max(raw, 2) : clamp(raw, ...TASK_RANGE) }));
    } else {
      const r = rightRef.current.getBoundingClientRect();
      const raw = ((r.bottom - e.clientY) / r.height) * 100;
      dragRef.current = raw < HIDE_OUT_BELOW ? 'output' : null;
      setSizes((s) => ({ ...s, out: raw < HIDE_OUT_BELOW ? Math.max(raw, 1) : clamp(raw, ...OUT_RANGE) }));
    }
  };

  const endDrag = () => {
    const hide = dragRef.current;
    dragRef.current = null;
    if (!hide) { save('sizes', sizesRef.current); return; }
    const kept = { ...DEFAULT_SIZES, ...load('sizes', DEFAULT_SIZES) };
    const restored = { ...sizesRef.current, q: clamp(kept.q, ...TASK_RANGE), out: clamp(kept.out, ...OUT_RANGE) };
    setSizes(restored);
    save('sizes', restored);
    if (hide === 'task') { setTaskOpen(false); save('taskOpen', false); }
    else { setOutputOpen(false); save('outputOpen', false); }
  };

  const resetSizes = () => { setSizes(DEFAULT_SIZES); save('sizes', DEFAULT_SIZES); };

  const taskPane = <TaskPane q={q} onHide={toggleTask} />;

  actionsRef.current = {
    run: handleRun, task: toggleTask, side: toggleSide, output: toggleOutput,
    search: () => setSearchOpen(true),
    format: () => editor.current && editor.current.format(),
    suggest: () => editor.current && editor.current.suggest(),
  };

  // Fuzzy search over this run's questions.
  const searchItems = searchOpen ? numbers.map((m) => {
    const mq = getQuestion(run.setId, m);
    const cat = set.categories.find((c) => c.questions.includes(m));
    return {
      key: m, label: `Q${m} ${mq.title}`, sub: cat ? cat.name : '', keywords: mq.topic,
      status: questionStatus(run, m), badge: m === n ? 'current' : `${mq.marks}m`, onSelect: () => goto(m),
    };
  }) : [];

  return (
    <div className={`run${mobile ? ' mobile' : ''}`} data-mtab={mtab}>
      <header className="run-top">
        <a className="brand hide-mobile" href="#/" title="Practice Questions: back to the dashboard" aria-label="Back to the dashboard"><span className="logo"><Logo /></span></a>
        <a className="btn ghost icon-only show-mobile" href="#/" title="Back to the dashboard. Your progress is kept." aria-label="Back to the dashboard"><Icon name="back" /></a>
        <span className="qt" title={`${q.title} (${run.name}, ${MODE_LABELS[run.mode]})`}>Q{n} · {q.title}</span>
        {stq.attempts > 0 && <span className="muted small hide-mobile">{stq.attempts} attempt{stq.attempts === 1 ? '' : 's'}</span>}
        {status === 'passed' && <span className="chip ok">Passed</span>}
        <span className="spacer" />
        <div className="progress hide-mobile" title={`${sum.passed} of ${sum.total} questions pass`}>
          <div className={`bar${run.completedAt ? ' ok' : ''}`}><i style={{ width: `${(sum.passed / sum.total) * 100}%` }} /></div>
          <span>{sum.passed}/{sum.total}</span>
        </div>
        {run.completedAt && <button type="button" className="btn" onClick={() => { setCelebrate(false); setFinishOpen(true); }}>Results</button>}
        <button type="button" className="btn ghost icon-only" disabled={idx <= 0} onClick={() => goto(numbers[idx - 1])} title="Previous question" aria-label="Previous question"><Icon name="back" /></button>
        <button type="button" className="btn ghost icon-only" disabled={idx >= numbers.length - 1} onClick={() => goto(numbers[idx + 1])} title="Next question" aria-label="Next question">
          <Icon name="back" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <button type="button" className="btn ghost icon-only hide-mobile" onClick={() => editor.current && editor.current.format()} title={`Format the code (${keyOf('format')})`} aria-label="Format code"><Icon name="format" /></button>
        <button type="button" className="btn primary" onClick={handleRun} disabled={running !== null} title={`Compile and run the tests (${keyOf('run')})`}>
          <Icon name="play" solid /> {running === n ? 'Running…' : 'Run'}
        </button>
        <RunMenu items={menu} className="show-mobile" />
      </header>

      <div className={`run-body${sideOpen ? '' : ' side-hidden'}`}>
        <nav className="activity" aria-label="Panels">
          <a className="btn ghost icon-only" href="#/" title="Exit to the dashboard. Your progress is kept." aria-label="Exit to the dashboard"><Icon name="exit" /></a>
          <hr />
          <button type="button" className="btn ghost icon-only" onClick={toggleSide} aria-pressed={sideOpen} title={`Show or hide the questions (${keyOf('side')})`} aria-label="Questions">
            <Icon name="questions" />
          </button>
          <button type="button" className="btn ghost icon-only" onClick={toggleTask} aria-pressed={taskOpen} title={`Show or hide the task text next to the editor (${keyOf('task')})`} aria-label="Task">
            <Icon name="task" />
          </button>
          <RunMenu items={menu} side />
        </nav>
        <Sidebar run={run} set={set} current={n} onSearch={() => setSearchOpen(true)}
          onSelect={(num) => { goto(num); setMtab('task'); }} />

        <div className={`work${taskOpen || mobile ? '' : ' task-closed'}`} ref={workRef} style={{ '--q-w': `${sizes.q}%` }}>
          {(taskOpen || mobile) && taskPane}
          {taskOpen && !mobile && <Splitter onMove={startDrag('x')} onEnd={endDrag} onReset={resetSizes} />}

          <section className={`right${outputOpen || mobile ? '' : ' out-closed'}`} ref={rightRef} style={{ '--out-h': `${sizes.out}%` }}>
            <EditorPane key={editorKey} ref={editor} run={run} n={n} dark={theme.dark} autoSuggest={st.autoSuggest} onAutoSuggest={setAutoSuggest} />
            {outputOpen && !mobile && <Splitter horizontal onMove={startDrag('y')} onEnd={endDrag} onReset={resetSizes} />}
            <Output
              result={result} q={q} running={running === n} runnerError={runnerError} open={outputOpen || mobile} onToggle={toggleOutput}
              tab={outTabs[n] || 'results'} onTab={(t) => setOutTabs((o) => ({ ...o, [n]: t }))}
              onJump={(line, col) => editor.current && editor.current.reveal(line, col)}
            />
          </section>

        </div>
      </div>

      {mobile && (
        <nav className="m-tabs" aria-label="Panels">
          {[['questions', 'sidebar', 'Questions'], ['task', 'task', 'Task'], ['code', 'code', 'Code'], ['output', 'stats', 'Output']].map(([id, icon, label]) => (
            <button key={id} type="button" aria-selected={mtab === id} onClick={() => setMtab(id)}>
              <Icon name={icon} />{label}
              {id === 'output' && result && <span className={`dot ${result.status === 'passed' ? 'ok' : 'bad'}`} />}
            </button>
          ))}
        </nav>
      )}

      {searchOpen && (
        <QuickSearch
          items={searchItems} placeholder="Search the questions in this run…"
          onClose={() => { setSearchOpen(false); setTimeout(() => editor.current && editor.current.focus(), 0); }}
        />
      )}

      {showFinish && (
        <Finish run={run} celebrate={celebrate} onClose={() => { setFinishOpen(false); setCelebrate(false); if (param === 'summary') goto(n); }} />
      )}
    </div>
  );
}
