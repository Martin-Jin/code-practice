import { useEffect, useRef, useState } from 'react';
import { Modal, useDialogs } from './Dialogs.jsx';
import Icon from './Icon.jsx';
import Demo from './Demo.jsx';
import { VERSION, CHANGELOG, startTab } from '../../shared/changelog.js';

const DOCS = 'https://github.com/martin-jin/practice-questions/blob/main/docs';
const SEEN = 'seenVersion';   // the version whose welcome window was last shown (not part of a backup: it is not a setting)

const Ext = ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>;
const Shot = ({ file, alt }) => <figure className="shot"><img src={`${import.meta.env.BASE_URL}tutorial/${file}`} alt={alt} loading="lazy" /></figure>;

// The tutorial. One entry per section: the index, the progress dots and the search are all built from this list, so a new
// feature is one more entry (or a few lines in one). Keep it short.
const SECTIONS = [
  {
    id: 'start', title: 'What this is',
    body: (
      <>
        <p>Two kinds of question side by side: <b>C++ coding questions</b> you write and test in an editor, and <b>your own sets</b> (practice PDFs, screenshots, questions you type). Progress is saved in this browser only, so back it up now and then (last section).</p>
        <Shot file="dashboard.jpg" alt="The dashboard, listing runs in progress" />
      </>
    ),
  },
  {
    id: 'coding', title: 'Practise coding questions',
    body: (
      <>
        <ol>
          <li>Open the <b>Question sets</b> tab and click a coding set.</li>
          <li>Pick a mode (practice test, random, by topic or all questions) and start a run.</li>
          <li>Write your answer in the editor and press <b>Run</b> (Ctrl+Shift+Enter). Each test shows pass or fail, with what it expected and what it got.</li>
        </ol>
        <Shot file="set.jpg" alt="A coding set page with its test modes" />
        <p className="muted">Alt+T hides the task, Alt+O the output, Ctrl+P searches, Alt+K opens the command palette. The <b>?</b> or the three-dot menu lists every shortcut.</p>
      </>
    ),
  },
  {
    id: 'add', title: 'Add your own questions',
    body: (
      <>
        <p><b>To import a set</b> (a practice PDF, or a <code>.questions.json</code> with its images):</p>
        <ol>
          <li>Put the files in one folder. A PDF alone is fine; the app reads its questions itself (about half a minute for a big one).</li>
          <li>On <b>Question sets</b>, press the round <b>+</b> at the bottom right, then <b>Add or update a folder of sets or PDFs</b>, and choose that folder.</li>
          <li>The app lists each set it found, with its question count and whether it is new or changed. Tick the ones you want and press <b>Import</b>.</li>
          <li>The sets appear under <b>Your library</b>. After you change the files, choose the folder again: only what changed is copied.</li>
        </ol>
        <Demo scene="import" />
        <p>The <b>+</b> also has <b>Add a question from a screenshot</b> (paste an image, drag a box over the question, add the parts to answer), <b>Add a formula sheet to several sets</b> and <b>Export chosen sets</b> (last two sections).</p>
        <p className="muted">Nothing is uploaded. The app keeps copies in this browser, and your folder is never changed. To build the PDF itself with an agent, see the next section.</p>
      </>
    ),
  },
  {
    id: 'pdf', title: 'Format a PDF with an agent',
    body: (
      <>
        <p>The app finds questions in a PDF from its layout: a cover listing the questions, then each question page followed by its worked solution. An AI agent can build that PDF from your tutorial sheets.</p>
        <ol>
          <li>Open the <Ext href={`${DOCS}/practice-pdf-prompt.md`}>agent prompt</Ext> and copy the template under <b>The prompt</b>.</li>
          <li>Fill in the four blanks: <b>Course</b>, <b>Target PDF</b> (or "none, make a new one"), <b>Sources to merge</b> and <b>Answer keys</b> (blank means yes).</li>
          <li>Paste it into an agent that can read your files and run commands (Claude Code, for example), opened in this repo so it can finish the answer keys.</li>
          <li>It writes the PDF, and a <code>.questions.json</code> beside it holding the answer keys and units. Import that folder with <b>+ &gt; Add or update a folder</b>.</li>
        </ol>
        <Demo scene="agent" />
        <p className="muted">Without the repo the agent still builds the PDF, and the app reads it by itself, but every part is self-marked until you add answers. A single question from a screenshot can also come from an agent: see <Ext href={`${DOCS}/question-set-format.md`}>the set format</Ext> and the <Ext href={`${DOCS}/adding-questions.md`}>adding-questions guide</Ext>.</p>
      </>
    ),
  },
  {
    id: 'sheets', title: 'Formula sheets and answer keys',
    body: (
      <>
        <ul>
          <li><b>Formulas</b> (Alt+T) in a library question opens that set's sheets in a side panel.</li>
          <li><b>+ &gt; Add a formula sheet to several sets</b>: choose the file, search and tick the sets. Each gets its own copy, so it travels with the set when exported.</li>
          <li>To remove one, open the set and press <b>Edit this set &gt; Formula sheets</b>.</li>
          <li>Typed answers are checked once a question has an answer: press the pen beside <b>Answers</b> to add or correct it. Numbers match within 1%, or the decimal places asked for.</li>
        </ul>
        <Demo scene="formula" />
      </>
    ),
  },
  {
    id: 'track', title: 'Practise and track',
    body: (
      <>
        <ul>
          <li>Start a practice session from a set's page. <b>Mark as difficult</b> (or press D) flags a question; <b>Settings &gt; Practice</b> makes flagged ones come up more often.</li>
          <li>Each set has a <b>Stats</b> page with attempts, right and wrong counts.</li>
          <li>Press Alt+K for the command palette: search sets and questions, add a question, move a set to a folder.</li>
        </ul>
        <Shot file="library.jpg" alt="An imported set page, with its questions grouped by section" />
      </>
    ),
  },
  {
    id: 'backup', title: 'Back up and share',
    body: (
      <>
        <ul>
          <li><b>Settings &gt; Backup &gt; Back up now</b> saves your progress to one file. Clearing the browser's site data deletes it otherwise. Tick <b>Include my imported sets</b> to put the PDFs in too (a zip).</li>
          <li><b>+ &gt; Export chosen sets</b>: search and tick sets to download just those, with their PDFs, images and formula sheets and no progress. Open the file with <b>Restore from a backup…</b> in Settings.</li>
        </ul>
        <Demo scene="export" />
        <p className="muted">Course PDFs may not be yours to pass on.</p>
      </>
    ),
  },
];

const highlights = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';

// The tutorial tab: an index and a search at the top, the sections below, and a column of dots at the right edge, one per
// section, where the section being read shows its name beside its dot and the others shrink to a dot.
function Tutorial({ findRef }) {
  const scroller = useRef(null);
  const content = useRef(null);
  const ranges = useRef([]);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState({ count: 0, at: 0 });
  const [say, setSay] = useState(true);   // the current dot shows its section name, then fades

  useEffect(() => {
    setSay(true);
    const id = setTimeout(() => setSay(false), 1500);
    return () => clearTimeout(id);
  }, [active]);

  const onScroll = () => {
    const box = scroller.current;
    if (!box) return;
    let now = 0;
    SECTIONS.forEach((s, i) => { const el = box.querySelector(`#tut-${s.id}`); if (el && el.offsetTop - box.scrollTop <= 40) now = i; });
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4) now = SECTIONS.length - 1;
    setActive(now);
  };
  const goTo = (i) => {
    const box = scroller.current;
    const el = box && box.querySelector(`#tut-${SECTIONS[i].id}`);
    if (!el) return;
    box.scrollTo({ top: el.offsetTop - 6, behavior: 'smooth' });
    el.classList.remove('flash');
    void el.offsetWidth;   // restart the animation if the same section is chosen twice
    el.classList.add('flash');
  };

  // Every match of the search in the sections' text, as ranges (the browser's own Ctrl+F cannot be told to stay in one tab).
  useEffect(() => {
    const q = query.trim().toLowerCase();
    ranges.current = [];
    if (q && content.current) {
      const walker = document.createTreeWalker(content.current, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.nodeValue.toLowerCase();
        for (let i = text.indexOf(q); i !== -1; i = text.indexOf(q, i + q.length)) {
          const r = document.createRange();
          r.setStart(node, i);
          r.setEnd(node, i + q.length);
          ranges.current.push(r);
        }
      }
    }
    setFound({ count: ranges.current.length, at: 0 });
  }, [query]);

  // Marks the matches (the current one stronger) and scrolls to the current one.
  useEffect(() => {
    const list = ranges.current;
    if (!list.length) return undefined;
    if (highlights) {
      CSS.highlights.set('tut-find', new Highlight(...list.filter((_, i) => i !== found.at)));
      CSS.highlights.set('tut-now', new Highlight(list[found.at]));
    }
    const el = list[found.at] && list[found.at].startContainer.parentElement;
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return () => { if (highlights) { CSS.highlights.delete('tut-find'); CSS.highlights.delete('tut-now'); } };
  }, [found]);

  const step = (by) => setFound((f) => (f.count ? { ...f, at: (f.at + by + f.count) % f.count } : f));
  const typing = query.trim() !== '';

  return (
    <div className="tut">
      <div className="tut-top">
        <div className="tut-find">
          <Icon name="search" />
          <input ref={findRef} type="text" value={query} placeholder="Search this guide (Ctrl+F)" aria-label="Search this guide"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); } }} />
          {typing && <span className="muted count">{found.count ? `${found.at + 1} of ${found.count}` : 'No matches'}</span>}
          {typing && found.count > 1 && (
            <>
              <button type="button" className="btn ghost sm" onClick={() => step(-1)} aria-label="Previous match">Prev</button>
              <button type="button" className="btn ghost sm" onClick={() => step(1)} aria-label="Next match">Next</button>
            </>
          )}
        </div>
      </div>
      <div className="tut-scroll" ref={scroller} onScroll={onScroll}>
        <nav className="tut-index" aria-label="Index">
          <h3>In this guide</h3>
          <ol>
            {SECTIONS.map((s, i) => (
              <li key={s.id}><a href={`#tut-${s.id}`} onClick={(e) => { e.preventDefault(); goTo(i); }}>{s.title}</a></li>
            ))}
          </ol>
        </nav>
        <div ref={content}>
          {SECTIONS.map((s, i) => <section key={s.id} id={`tut-${s.id}`} onAnimationEnd={(e) => e.currentTarget.classList.remove('flash')}><h3>{i + 1}. {s.title}</h3>{s.body}</section>)}
        </div>
      </div>
      <nav className="tut-rail" aria-label="Progress through the guide">
        {SECTIONS.map((s, i) => (
          <button key={s.id} type="button" className={`dot${i === active ? ` on${say ? ' say' : ''}` : ''}`} aria-label={s.title} aria-current={i === active ? 'step' : undefined} onClick={() => goTo(i)}>
            <span className="name">{s.title}</span><span className="pip" />
          </button>
        ))}
      </nav>
    </div>
  );
}

const niceDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });

function Changelog() {
  return (
    <div className="tut-scroll changelog">
      {CHANGELOG.map((c, i) => (
        <article key={c.version}>
          <h3>{c.version} <span className="muted">{niceDate(c.date)}</span>{i === 0 && <span className="chip accent">latest</span>}</h3>
          <b>{c.title}</b>
          <ul>{c.items.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
      ))}
      <p className="muted">The {CHANGELOG.length} latest changes.</p>
    </div>
  );
}

// The welcome window: a tutorial tab and a change log tab, about half the screen, in the middle.
export function Welcome({ tab: first, close }) {
  const [tab, setTab] = useState(first);
  const findRef = useRef(null);
  // The tutorial has its own search, so Ctrl+F goes there while it is showing.
  const onKeyDown = (e) => {
    if (tab === 'tutorial' && (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'f' && findRef.current) {
      e.preventDefault();
      findRef.current.focus();
      findRef.current.select();
    }
  };
  return (
    <Modal className="welcome" title={`Practice Questions ${VERSION}`} onClose={() => close()} footer={<button type="button" className="btn primary" onClick={() => close()}>Got it</button>}>
      <div className="welcome-body" onKeyDown={onKeyDown}>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" className="tab" aria-selected={tab === 'tutorial'} onClick={() => setTab('tutorial')}>Tutorial</button>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'changelog'} onClick={() => setTab('changelog')}>What's new</button>
        </div>
        {tab === 'tutorial' ? <Tutorial findRef={findRef} /> : <Changelog />}
      </div>
    </Modal>
  );
}

export const openWelcome = (open, tab = 'tutorial') => open(({ close }) => <Welcome tab={tab} close={close} />);

// Opens the window when this version has not been shown here yet: on the tutorial for a first visit, on the change log after
// an update. Recorded as soon as it opens, so a reload does not show it again.
export function WelcomeOnStart() {
  const { open } = useDialogs();
  useEffect(() => {
    let seen = null;
    try { seen = localStorage.getItem(SEEN); } catch { /* storage blocked */ }
    const tab = startTab(seen);
    if (!tab) return;
    try { localStorage.setItem(SEEN, VERSION); } catch { /* storage blocked */ }
    openWelcome(open, tab);
  }, []);
  return null;
}
