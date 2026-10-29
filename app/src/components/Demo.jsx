import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

// Animated walkthroughs for the tutorial. Each scene is a short script: a caption and a cursor target per step, and a
// `render(shown)` that draws the mock screen once the step's click has landed. The mock uses the app's own classes, so it
// follows the theme and stays in step with the real look. The stage is a fixed 1000 x 600 canvas scaled to its box; the
// cursor finds each target by its data-t attribute, so layout changes cannot leave it pointing at nothing.
const W = 1000;
const H = 600;
const MOVE = 900;   // ms for the cursor to reach a target; the screen changes when it arrives
const HOLD = 2300;  // ms spent on each step

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveals `text` a few letters at a time, as if typed.
function Type({ text }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(reducedMotion() ? text.length : 0);
    if (reducedMotion()) return undefined;
    const id = setInterval(() => setN((k) => { if (k >= text.length) { clearInterval(id); return k; } return k + 1; }), 70);
    return () => clearInterval(id);
  }, [text]);
  return <>{text.slice(0, n)}</>;
}

const Bar = () => (
  <div className="dm-bar"><b>Practice Questions</b><span>Dashboard</span><span className="on">Question sets</span></div>
);

const OPTIONS = [['question', 'Add a question from a screenshot', 'task'], ['folder', 'Add or update a folder of sets or PDFs', 'folder'], ['formula', 'Add a formula sheet to several sets', 'sidebar'], ['export', 'Export chosen sets', 'exit']];

// The round + button, optionally fanned out; `hot` shows the label of one option.
function Fab({ open, hot }) {
  return (
    <div className="dm-fab">
      {open && OPTIONS.map(([key, label, icon]) => (
        <div key={key} className="dm-opt" data-t={`opt-${key}`}>
          {hot === key && <span className="dm-label">{label}</span>}
          <span className="dm-round small"><Icon name={icon} /></span>
        </div>
      ))}
      <span className="dm-round main" data-t="fab"><Icon name={open ? 'x' : 'plus'} /></span>
    </div>
  );
}

const Dialog = ({ title, children, footer }) => (
  <div className="dm-dim">
    <div className="dm-dialog">
      <h2>{title}</h2>
      <div className="dm-dbody">{children}</div>
      <div className="dm-dfoot">{footer}</div>
    </div>
  </div>
);

const Tile = ({ title, i }) => (
  <div className="card tile dm-tile" data-t={`tile-${i}`}>
    <h2>{title}</h2><span className="muted">Sample course</span>
    <div className="meta"><span className="chip">6 questions</span><span className="chip">3 sections</span></div>
  </div>
);

const SETS = ['Thermodynamics (sample)', 'Fluid Mechanics (sample)', 'Heat Transfer (sample)'];

// The search-and-tick list the formula-sheet and export dialogs share.
function Picker({ query, items, ticked, count }) {
  return (
    <>
      <div className="dm-search" data-t="search"><Icon name="search" />{query ? <Type key={query} text={query} /> : <span className="muted">Search your sets</span>}</div>
      <div className="dm-list">
        {items.map((name) => (
          <label key={name}><input type="checkbox" readOnly checked={ticked.includes(name)} data-t={`tick-${name === items[0] ? 0 : 1}`} /><b>{name}</b><span className="muted"> · Sample course</span></label>
        ))}
      </div>
      <span className="muted">{count}</span>
    </>
  );
}

const ALL = [...SETS, 'Dynamics notes'];

const SCENES = {
  import: {
    title: 'Importing a folder of sets',
    steps: [['Press the + button', 'fab'], ['Add or update a folder', 'opt-folder'], ['Tick the sets to import', 'tick-0'], ['Press Import', 'import'], ['They appear in Your library', 'tile-0']],
    render: (s) => (
      <>
        <Bar />
        <div className="dm-page">
          <h3>YOUR LIBRARY</h3>
          {s >= 3 ? <div className="explorer-grid">{SETS.map((t, i) => <Tile key={t} title={t} i={i} />)}</div>
            : <div className="empty">Question sets from folders on this computer show up here. Use the + button to get started.</div>}
        </div>
        <Fab open={s === 0} hot={s === 0 ? 'folder' : null} />
        {(s === 1 || s === 2) && (
          <Dialog title="Add questions from a folder" footer={<><span className="btn">Cancel</span><span className="btn primary" data-t="import">Import 3 sets</span></>}>
            <p className="muted">Looked at 9 files and found 7 the app can use. Nothing is uploaded: the sets you tick are copied into this browser.</p>
            {SETS.map((t, i) => (
              <div key={t} className="card pad dm-row"><input type="checkbox" readOnly checked={s >= 2} data-t={`tick-${i}`} /><b>{t}</b><span className="chip accent">New</span><span className="chip">6 questions</span></div>
            ))}
          </Dialog>
        )}
      </>
    ),
  },
  agent: {
    title: 'Formatting a practice PDF with an agent',
    steps: [['Copy the prompt template', 'copy'], ['Fill in the four blanks', 'fields'], ['Paste it into your agent', 'chat-input'], ['It builds the PDF and answer keys', 'progress'], ['Import the folder it writes', 'files']],
    render: (s) => (
      <div className="dm-split">
        <div className="card pad dm-pane">
          <b>Agent prompt</b>
          <div className="dm-fields" data-t="fields">
            {[['Course', 'Thermodynamics'], ['Target PDF', 'none, make a new one'], ['Sources to merge', 'tutorials/*.pdf'], ['Answer keys', 'yes']].map(([k, v]) => (
              <div key={k}><span className="muted">{k}:</span> <span className="dm-fill">{s >= 1 ? <Type key={v} text={v} /> : ''}</span></div>
            ))}
          </div>
          <span className="btn" data-t="copy"><Icon name="plus" /> Copy the template</span>
        </div>
        <div className="card pad dm-pane">
          <b>AI agent</b>
          <div className="dm-chat">
            {s >= 2 && <div className="dm-bubble">Merge my tutorial sheets into a practice PDF, with answer keys.</div>}
            <div className="dm-progress" data-t="progress">
              {s >= 3 && ['Merging 3 sources…', 'Checking the layout…', 'Writing answer keys…'].map((l, i) => <div key={l} className="dm-line" style={{ animationDelay: `${i * 0.5}s` }}><Icon name="check" /> {l}</div>)}
            </div>
          </div>
          <div className="dm-input" data-t="chat-input"><span className="muted">{s >= 2 ? '' : 'Paste the prompt here'}</span></div>
          <div className="dm-files" data-t="files">
            {s >= 4 && <><span className="chip ok">Thermodynamics - Practice Questions.pdf</span><span className="chip ok">….questions.json</span></>}
          </div>
        </div>
      </div>
    ),
  },
  formula: {
    title: 'Adding one formula sheet to several sets',
    steps: [['Add a formula sheet to several sets', 'opt-formula'], ['Choose the file', 'file'], ['Search for your sets', 'search'], ['Select shown', 'select'], ['Add to 3 sets', 'add']],
    render: (s) => (
      <>
        <Bar />
        <div className="dm-page"><h3>YOUR LIBRARY</h3><div className="explorer-grid">{SETS.map((t, i) => <Tile key={t} title={t} i={i} />)}</div></div>
        <Fab open={s < 0} hot="formula" />
        {s >= 0 && s < 4 && (
          <Dialog title="Add a formula sheet to sets" footer={<><span className="btn">Cancel</span><span className="btn primary" data-t="add">Add to {s >= 3 ? 3 : 0} sets</span></>}>
            <div><span className="btn" data-t="file"><Icon name="plus" /> Choose a PDF or image</span>{s >= 1 && <span className="muted"> formulas.pdf</span>}</div>
            <Picker query={s >= 2 ? 'sample' : ''} items={s >= 2 ? SETS : ALL} ticked={s >= 3 ? SETS : []} count={`${s >= 3 ? 3 : 0} sets chosen of 4`} />
            <span className="btn sm dm-select" data-t="select">Select shown</span>
          </Dialog>
        )}
        {s >= 4 && <div className="dm-toast">Added to 3 sets.</div>}
      </>
    ),
  },
  export: {
    title: 'Exporting chosen sets',
    steps: [['Export chosen sets', 'opt-export'], ['Search for the set', 'search'], ['Tick it', 'tick-0'], ['Export', 'go']],
    render: (s) => (
      <>
        <Bar />
        <div className="dm-page"><h3>YOUR LIBRARY</h3><div className="explorer-grid">{SETS.map((t, i) => <Tile key={t} title={t} i={i} />)}</div></div>
        <Fab open={s < 0} hot="export" />
        {s >= 0 && s < 3 && (
          <Dialog title="Export sets" footer={<><span className="btn">Cancel</span><span className="btn primary" data-t="go">Export {s >= 2 ? 1 : 0} sets</span></>}>
            <Picker query={s >= 1 ? 'heat' : ''} items={s >= 1 ? [SETS[2]] : SETS} ticked={s >= 2 ? [SETS[2]] : []} count={`${s >= 2 ? 1 : 0} set chosen of 3`} />
            <p className="muted">One zip with the sets' questions, PDFs, images and formula sheets. Your progress is not in it.</p>
          </Dialog>
        )}
        {s >= 3 && <div className="dm-toast">Saved code-practice-questions.zip to your downloads.</div>}
      </>
    ),
  },
};

// One scene, with a caption, step counter and play/replay controls. It only runs while on screen, and under reduced motion
// it shows its last frame and stays still.
export default function Demo({ scene }) {
  const { steps, render, title } = SCENES[scene];
  const still = reducedMotion();
  const box = useRef(null);
  const stage = useRef(null);
  const [scale, setScale] = useState(0.6);
  const [i, setI] = useState(still ? steps.length - 1 : 0);          // the step the cursor is heading for
  const [shown, setShown] = useState(still ? steps.length - 1 : -1);  // the last step whose click has landed
  const [seen, setSeen] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [cursor, setCursor] = useState([W / 2, H / 2]);
  const run = !still && seen && playing;

  useLayoutEffect(() => {
    const fit = () => box.current && setScale(box.current.clientWidth / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box.current);
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.4 });
    io.observe(box.current);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  useEffect(() => {
    if (!run) return undefined;
    if (i === 0) setShown(-1);
    const aim = setTimeout(() => {
      const el = stage.current && stage.current.querySelector(`[data-t="${steps[i][1]}"]`);
      if (el) {
        const a = stage.current.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        setCursor([(b.left + b.width / 2 - a.left) / scale, (b.top + b.height / 2 - a.top) / scale]);
      }
    }, 80);
    const land = setTimeout(() => setShown(i), MOVE + 80);
    const next = setTimeout(() => setI((k) => (k + 1) % steps.length), HOLD);
    return () => { clearTimeout(aim); clearTimeout(land); clearTimeout(next); };
  }, [run, i]);

  const replay = () => { setShown(-1); setI(0); setPlaying(true); };
  return (
    <figure className="demo">
      <div className="dm-box" ref={box} role="img" aria-label={`Animation: ${title}. ${steps.map((s) => s[0]).join('; ')}.`}>
        <div className="dm-stage" ref={stage} style={{ transform: `scale(${scale})` }}>
          {render(shown)}
          {!still && <span className="dm-cursor" style={{ transform: `translate(${cursor[0]}px, ${cursor[1]}px)` }} key="cursor"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 2l16 9-7 2-3 7z" fill="#111" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /></svg>{shown === i && <span className="dm-ripple" key={`${i}-${shown}`} />}</span>}
          <div className="dm-caption"><span>{i + 1}/{steps.length}</span> {steps[i][0]}</div>
        </div>
      </div>
      {!still && (
        <figcaption className="dm-controls">
          <button type="button" className="btn ghost sm" onClick={() => setPlaying(!playing)} aria-pressed={!playing}>{playing ? 'Pause' : 'Play'}</button>
          <button type="button" className="btn ghost sm" onClick={replay}>Replay</button>
        </figcaption>
      )}
    </figure>
  );
}
