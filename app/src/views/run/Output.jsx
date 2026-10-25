import { tokenDiff, lineDiff, showWhitespace } from '../../lib/diff.js';
import { RUNNERS } from '../../lib/runners.js';
import { plural } from '../../lib/format.js';
import Icon from '../../components/Icon.jsx';

// Text with the changed parts marked. Whitespace-only changes are made visible.
function Marked({ segments }) {
  return segments.map((s, i) => (s.changed
    ? <mark key={i} className="d">{/^\s+$/.test(s.text) ? showWhitespace(s.text) : s.text}</mark>
    : <span key={i}>{s.text}</span>));
}

function ValueDiff({ expected, actual }) {
  const d = tokenDiff(expected, actual);
  return (
    <div className="vdiff">
      <span className="lab e">Expected</span>
      <div className="val exp"><Marked segments={d.left} /></div>
      <span className="lab g">Got</span>
      <div className="val got"><Marked segments={d.right} /></div>
    </div>
  );
}

function DiffTable({ expected, actual }) {
  const rows = lineDiff(expected, actual);
  return (
    <table className="difftable">
      <colgroup><col style={{ width: 34 }} /><col /><col style={{ width: 34 }} /><col /></colgroup>
      <thead><tr><th className="e" colSpan={2}>Expected</th><th className="g" colSpan={2}>Got</th></tr></thead>
      <tbody>
        {rows.map((r, i) => {
          let left = r.exp, right = r.got;
          if (r.kind === 'chg') {
            const d = tokenDiff(r.exp, r.got);
            left = <Marked segments={d.left} />;
            right = <Marked segments={d.right} />;
          }
          return (
            <tr key={i} className={r.kind}>
              <td className="no">{r.expNo}</td>
              <td className="t e exp">{left}</td>
              <td className="no">{r.gotNo}</td>
              <td className="t g got">{right}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Failure({ f }) {
  if (f.kind === 'output') {
    return (
      <div className="failure">
        <DiffTable expected={f.expected} actual={f.actual} />
        <details className="raw"><summary>Raw message from the test</summary><pre className="raw-msg">{f.message}</pre></details>
      </div>
    );
  }
  return (
    <div className="failure">
      <pre className="raw-msg">{f.message}</pre>
      {f.kind === 'value' && <ValueDiff expected={f.expected} actual={f.actual} />}
    </div>
  );
}

function TestCard({ t, result }) {
  const label = (
    <>
      <span className={`st ${t.status === 'pass' ? 'passed' : 'failed'}`}><Icon name={t.status === 'pass' ? 'check' : 'x'} /></span>
      <span className="tname">{t.name}</span>
      <span className={`chip${t.hidden ? '' : ' accent'}`}>{t.hidden ? 'hidden' : 'visible'}</span>
    </>
  );
  if (t.status === 'pass') return <div className="test pass"><div className="summary" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>{label}</div></div>;

  const stopped = result.run && result.run.timedOut
    ? `The program was stopped after ${result.run.timeoutMs ? `${result.run.timeoutMs / 1000} s` : 'the runner’s time limit'} while running this test. Look for an infinite loop.`
    : t.interruption === 'crash'
      ? `The program crashed while running this test: ${result.run.crashName || 'abnormal termination'} (exit code ${result.run.exitCode}).`
      : 'The program exited while running this test, before it reported a result. Does your code call exit()?';
  return (
    <details className={`test ${t.status}`} open>
      <summary>{label}</summary>
      <div className="body">
        {t.status === 'crash' ? <pre className="raw-msg">{stopped}</pre> : t.failures.map((f, i) => <Failure key={i} f={f} />)}
      </div>
    </details>
  );
}

function Banner({ tone, icon, title, sub }) {
  return (
    <div className={`banner ${tone}`}>
      <span className="ico"><Icon name={icon} /></span>
      <div><div className="big">{title}</div><div className="sub">{sub}</div></div>
    </div>
  );
}

// g++ output exactly as printed, with severity colours and clickable locations.
function CompilerLog({ result, q, onJump }) {
  const { output, diagnostics } = result.compile;
  if (!output.trim()) return <p className="muted">The compiler printed nothing.</p>;
  const loc = /^(.+?):(\d+):(\d+):(.*)$/;
  return (
    <pre className="logbox mono">
      {output.replace(/\n$/, '').split('\n').map((line, i) => {
        const m = loc.exec(line);
        let cls = 'l-dim';
        if (/: (fatal )?error:/.test(line)) cls = 'l-error';
        else if (/: warning:/.test(line)) cls = 'l-warning';
        else if (/: note:/.test(line)) cls = 'l-note';
        else if (!/^\s*\d*\s*\|/.test(line) && !/^\s+[~^]/.test(line)) cls = '';
        let body = line;
        if (m && m[1].split(/[\\/]/).pop() === q.file) {
          const d = diagnostics.find((x) => x.line === Number(m[2]) && x.col === Number(m[3]));
          const text = `${m[1]}:${m[2]}:${m[3]}:`;
          body = (
            <>
              {d && d.answerLine
                ? <a className="loc" onClick={() => onJump(d.answerLine, d.col)} title={`Go to line ${d.answerLine} of your answer`}>{text}</a>
                : <span className="loc" title="This line is in the provided code or tests, not in your answer">{text}</span>}
              {m[4]}
            </>
          );
        }
        return <div key={i} className={cls}>{body}{'\n'}</div>;
      })}
    </pre>
  );
}

function Results({ result, q, onJump, onTab }) {
  const { status, compile, run, summary } = result;
  const via = RUNNERS[result.runner] ? RUNNERS[result.runner].label : null;
  const timing = [
    compile.ms != null && `compiled in ${(compile.ms / 1000).toFixed(1)} s`,
    run && run.ms != null && `ran in ${run.ms} ms`,
    via,
  ].filter(Boolean).join(' · ');

  if (status === 'compile_error') {
    return (
      <>
        <Banner tone="bad" icon="x" title="Compilation failed" sub={`${plural(compile.errorCount || 1, 'error')}. Nothing was run. ${timing}`} />
        <CompilerLog result={result} q={q} onJump={onJump} />
      </>
    );
  }
  let banner;
  if (status === 'passed') {
    banner = <Banner tone="ok" icon="check" title="All tests passed" sub={`${summary.passed} / ${summary.total} tests · ${timing}`} />;
  } else if (status === 'timeout') {
    banner = <Banner tone="bad" icon="warning" title="Timed out" sub={`The program did not finish${result.interruptedTest ? ` (stuck in "${result.interruptedTest}")` : ''}. ${timing}`} />;
  } else if (status === 'crashed') {
    banner = (
      <Banner tone="bad" icon="warning" title={run.crashName ? `Program crashed: ${run.crashName}` : 'Program stopped early'}
        sub={`${result.interruptedTest ? `During "${result.interruptedTest}". ` : ''}Exit code ${run.exitCode}. ${timing}`} />
    );
  } else {
    banner = <Banner tone="bad" icon="x" title={`${summary.total - summary.passed} of ${summary.total} tests failed`} sub={`${summary.passed} passed. ${timing}`} />;
  }
  return (
    <>
      {banner}
      {compile.warningCount > 0 && (
        <p className="notrun" style={{ marginTop: -6 }}>
          The compiler reported {plural(compile.warningCount, 'warning')}. <a onClick={() => onTab('compiler')} style={{ cursor: 'pointer' }}>See compiler output</a>
        </p>
      )}
      <div className="tests">{result.tests.map((t, i) => <TestCard key={i} t={t} result={result} />)}</div>
      {result.notRun > 0 && <p className="notrun">{plural(result.notRun, 'more test')} did not run because the program stopped.</p>}
    </>
  );
}

function Raw({ result }) {
  const run = result.run;
  if (!run) return <p className="muted">The program was not run because it did not compile.</p>;
  return (
    <>
      <div className="logsec">
        <h4>Program output (stdout)</h4>
        <pre className="logbox mono">{run.stdout || '(empty)'}</pre>
      </div>
      {run.stderr && <div className="logsec"><h4>Program error output (stderr)</h4><pre className="logbox mono">{run.stderr}</pre></div>}
      <p className="muted">Exit code {run.exitCode}{run.signal ? ` (${run.signal})` : ''}{run.truncated ? ' · output was cut off at 400 KB' : ''}</p>
    </>
  );
}

function CompilerTab({ result, q, onJump }) {
  return (
    <div className="logsec">
      <h4>g++ output {result.compile.warningCount > 0 && <span className="chip warn">{plural(result.compile.warningCount, 'warning')}</span>}</h4>
      <CompilerLog result={result} q={q} onJump={onJump} />
    </div>
  );
}

export default function Output({ result, q, running, runnerError, tab, onTab, onJump, open, onToggle }) {
  const c = result && result.compile;
  let body;
  if (running) body = <div className="running"><span className="spinner" /> Compiling and running the tests…</div>;
  else if (runnerError) body = <Banner tone="warn" icon="warning" title="Could not run your code" sub={runnerError} />;
  else if (!result) body = <div className="placeholder">Press <b>Run</b> (<span className="kbd">Ctrl</span> + <span className="kbd">Enter</span>) to compile your answer and run the tests.</div>;
  else if (tab === 'compiler') body = <CompilerTab result={result} q={q} onJump={onJump} />;
  else if (tab === 'raw') body = <Raw result={result} />;
  else body = <Results result={result} q={q} onJump={onJump} onTab={onTab} />;

  const tabs = [['results', 'Results'], ['compiler', 'Compiler'], ['raw', 'Raw output']];
  // What the collapsed bar shows, so the last result is still visible with the output hidden.
  let summary = null;
  if (running) summary = <span className="chip">Running…</span>;
  else if (result && result.status === 'passed') summary = <span className="chip ok">All passed</span>;
  else if (result && result.status === 'compile_error') summary = <span className="chip bad">Compile error</span>;
  else if (result) summary = <span className="chip bad">{result.summary.passed}/{result.summary.total} passed</span>;

  return (
    <section className={`output${open ? '' : ' closed'}`}>
      <div className="tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" className="tab" aria-selected={open && tab === id} onClick={() => { if (!open) onToggle(); onTab(id); }}>
            {label}
            {id === 'compiler' && c && c.errorCount > 0 && <span className="badge bad">{c.errorCount}</span>}
            {id === 'compiler' && c && c.errorCount === 0 && c.warningCount > 0 && <span className="badge">{c.warningCount}</span>}
          </button>
        ))}
        {!open && summary}
        <span className="spacer" />
        <button type="button" className="btn ghost sm icon-only" onClick={onToggle} aria-expanded={open}
          title={open ? 'Hide the output (Alt+O)' : 'Show the output (Alt+O)'} aria-label={open ? 'Hide output' : 'Show output'}>
          <Icon name="chevron" style={open ? undefined : { transform: 'rotate(180deg)' }} />
        </button>
      </div>
      {open && <div className="out-body">{body}</div>}
    </section>
  );
}
