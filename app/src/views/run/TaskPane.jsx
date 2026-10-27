import { useEffect, useState } from 'react';
import { plural } from '../../lib/format.js';
import Icon from '../../components/Icon.jsx';
import { useStore } from '../../lib/store.js';
import { comboFor } from '../../lib/shortcuts.js';
import { RESTRICTION_LABELS, RESTRICTIONS } from '../../../shared/restrictions.js';

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

const indentOf = (line) => line.match(/^ */)[0].length;
const BULLET = /^(\s*)([-*•]|\d+[.)])\s+(\S.*)$/;

// A list marker starts an item, except a "0." or "2." at the very left, which is a wrapped
// sentence ("... 0. (k may be ...)") rather than a numbered list.
function marker(line, inList) {
  const m = BULLET.exec(line);
  if (!m) return null;
  const ordered = /\d/.test(m[2]);
  if (ordered && !inList && m[1].length === 0 && parseInt(m[2], 10) !== 1) return null;
  return { indent: m[1].length, ordered, number: ordered ? parseInt(m[2], 10) : 0, text: m[3] };
}

// Splits lines into paragraphs and lists. An item owns the lines indented deeper than its marker;
// those are parsed again, so nested lists work. Other text keeps the reflow rules above.
function parseBlocks(lines) {
  const blocks = [];
  let para = [];
  const flush = () => { if (para.length) blocks.push({ type: 'p', text: reflow(para) }); para = []; };
  for (let i = 0; i < lines.length;) {
    const first = marker(lines[i], false);
    if (!first) { para.push(lines[i]); i += 1; continue; }
    flush();
    const list = { type: 'list', ordered: first.ordered, start: first.number, items: [] };
    while (i < lines.length) {
      const m = marker(lines[i], true);
      if (!m || m.indent !== first.indent || m.ordered !== first.ordered) break;
      i += 1;
      const body = [];
      while (i < lines.length && indentOf(lines[i]) > m.indent) body.push(lines[i++]);
      list.items.push({ text: m.text, body });
    }
    blocks.push(list);
  }
  flush();
  return blocks;
}

const dedent = (lines) => {
  const n = Math.min(...lines.map(indentOf));
  return lines.map((l) => l.slice(n));
};

// "T Top()      return the top" (a signature, a wide gap, then what it does) shows the signature as code.
// A wide gap after plain words ("the node is a leaf    -> delete it") is only alignment.
function Item({ item: { text, body: rawBody } }) {
  const split = /^(.*?\S) {3,}(\S.*)$/.exec(text);
  const sig = split && /[(){}<>:=]|^(class|struct)\b/.test(split[1]) ? split : null;
  const body = rawBody.length ? dedent(rawBody) : [];
  const nested = body.some((l) => marker(l, false));
  const prose = !sig && !/\(|::/.test(text);
  // Wrapped lines continue the sentence, unless a signature heads the item and they describe it.
  if (!nested && (sig || prose)) {
    const flat = (sig ? sig[2] : text.replace(/ {2,}/g, ' '));
    const rest = [flat, ...body.map((l) => l.trim())].join(' ');
    return <li>{sig && <><code>{sig[1]}</code> </>}<Inline text={rest} /></li>;
  }
  return (
    <li>
      {body.length > 0 && !nested ? <code>{text}</code> : <Inline text={text} />}
      {body.length > 0 && <Blocks lines={body} />}
    </li>
  );
}

function Blocks({ lines }) {
  return parseBlocks(lines).map((b, i) => (b.type === 'list'
    ? (b.ordered
      ? <ol key={i} className="items" start={b.start}>{b.items.map((it, k) => <Item key={k} item={it} />)}</ol>
      : <ul key={i} className="items">{b.items.map((it, k) => <Item key={k} item={it} />)}</ul>)
    : <p key={i} className="para"><Inline text={b.text} /></p>));
}

function Statement({ text }) {
  return text.split(/\n{2,}/).flatMap((para, i) => {
    const lines = para.split('\n');
    const heading = lines[0].trim() === 'Task';
    const body = heading ? lines.slice(1) : lines;
    return [
      heading && <h3 key={`h${i}`}>Task</h3>,
      body.length > 0 && <Blocks key={`b${i}`} lines={body} />,
    ];
  });
}

// C++ source with the editor's highlighting (plain text until the editor has loaded).
function CodeBlock({ code }) {
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

const TABS = ['task', 'provided', 'tests'];

export default function TaskPane({ q, onHide }) {
  const st = useStore();
  // The pane unmounts when hidden, so the last tab is kept in this browser (not reset per question).
  const [tab, setTabState] = useState(() => {
    try { const saved = localStorage.getItem('taskTab'); return TABS.includes(saved) ? saved : 'task'; } catch { return 'task'; }
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
        <button type="button" role="tab" className="tab" aria-selected={tab === 'tests'} onClick={() => setTab('tests')}>Visible tests</button>
        <span className="spacer" />
        {onHide && (
          <button type="button" className="btn ghost sm icon-only" onClick={onHide} title={`Hide the task (${comboFor('task', st.shortcuts)})`} aria-label="Hide task">
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
              {(q.restrict || []).map((r) => <span key={r} className="chip warn" title={`${RESTRICTIONS[r]} The app checks this when you press Run.`}>{RESTRICTION_LABELS[r]}</span>)}
            </div>
            <Statement text={q.statement} />
          </>
        ) : tab === 'provided' ? (
          <>
            <p className="para muted">This code is already part of the program your answer is added to. Do not paste it into the editor.</p>
            <CodeBlock code={q.provided} />
          </>
        ) : (
          <>
            <p className="para muted">
              These {plural(q.visibleTests, 'test')} run, and show their results, whenever you press Run.
              {q.hiddenTests > 0 && ` ${plural(q.hiddenTests, 'hidden test')} also run, but their code is not shown.`}
            </p>
            {q.visibleCode ? <CodeBlock code={q.visibleCode} /> : <p className="para muted">The code of these tests is not available.</p>}
          </>
        )}
      </div>
    </section>
  );
}
