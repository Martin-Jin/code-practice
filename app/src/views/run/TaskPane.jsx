import { useEffect, useState } from 'react';
import { plural } from '../../lib/format.js';
import Icon from '../../components/Icon.jsx';

// `code` spans in the task text.
function Inline({ text }) {
  return text.split(/(`[^`]+`)/g).map((part, i) => (part.startsWith('`') && part.endsWith('`') && part.length > 2
    ? <code key={i}>{part.slice(1, -1)}</code>
    : <span key={i}>{part}</span>));
}

// The statement is a source-code comment, hard-wrapped at ~80 columns. Join the wrapped lines
// of a sentence, but keep bullets and indented lines (lists, examples) on their own lines.
function reflow(lines) {
  const out = [];
  for (const line of lines) {
    const own = /^\s*(?:[-*•]|\d+[.)])\s/.test(line) || /^\s{2,}\S/.test(line);
    if (!out.length || own) out.push(line);
    else out[out.length - 1] += ` ${line.trim()}`;
  }
  return out.join('\n');
}

function Statement({ text }) {
  return text.split(/\n{2,}/).flatMap((para, i) => {
    const lines = para.split('\n');
    const heading = lines[0].trim() === 'Task';
    const body = heading ? lines.slice(1) : lines;
    return [
      heading && <h3 key={`h${i}`}>Task</h3>,
      body.length > 0 && <p key={`p${i}`} className="para"><Inline text={reflow(body)} /></p>,
    ];
  });
}

function ProvidedCode({ code }) {
  const [html, setHtml] = useState(null);
  useEffect(() => {
    let live = true;
    // Same highlighting as the editor; loads with the editor, plain text until then.
    import('../../lib/monaco.js').then(({ monaco }) => monaco.editor.colorize(code, 'cpp', { tabSize: 4 }))
      .then((h) => { if (live) setHtml(h); }).catch(() => {});
    return () => { live = false; };
  }, [code]);
  return html
    ? <pre className="code mono" dangerouslySetInnerHTML={{ __html: html }} />
    : <pre className="code mono">{code}</pre>;
}

export default function TaskPane({ q, onHide }) {
  // The pane unmounts when hidden, so the last tab is kept in this browser (not reset per question).
  const [tab, setTabState] = useState(() => {
    try { return localStorage.getItem('taskTab') === 'provided' ? 'provided' : 'task'; } catch { return 'task'; }
  });
  const setTab = (next) => {
    setTabState(next);
    try { localStorage.setItem('taskTab', next); } catch { /* storage blocked */ }
  };
  return (
    <section className="qpane" aria-label="Question">
      <div className="tabs" role="tablist">
        <button type="button" role="tab" className="tab" aria-selected={tab === 'task'} onClick={() => setTab('task')}>Task</button>
        <button type="button" role="tab" className="tab" aria-selected={tab === 'provided'} onClick={() => setTab('provided')}>Provided code</button>
        <span className="spacer" />
        {onHide && (
          <button type="button" className="btn ghost sm icon-only" onClick={onHide} title="Hide the task (Alt+T)" aria-label="Hide task">
            <Icon name="back" />
          </button>
        )}
      </div>
      <div className="pane-scroll prose">
        {tab === 'task' ? (
          <>
            <h2>Q{q.number}. {q.title}</h2>
            <div className="chips">
              <span className="chip accent">{plural(q.marks, 'mark')}</span>
              <span className="chip">{q.topic}</span>
              <span className="chip">{q.visibleTests} visible / {q.hiddenTests} hidden tests</span>
            </div>
            <Statement text={q.statement} />
          </>
        ) : (
          <>
            <p className="para muted">This code is already part of the program your answer is added to. Do not paste it into the editor.</p>
            <ProvidedCode code={q.provided} />
          </>
        )}
      </div>
    </section>
  );
}
