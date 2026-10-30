import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal, useDialogs } from './Dialogs.jsx';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import Demo from './Demo.jsx';
import agentPrompt from '../lib/agentprompt.js';
import { VERSION, CHANGELOG, startTab } from '../../shared/changelog.js';
import { APP_NAME } from '../../shared/brand.js';

const DOCS = 'https://github.com/martin-jin/practice-questions/blob/main/docs';
const SEEN = 'seenVersion';   // the version whose welcome window was last shown (not part of a backup: it is not a setting)

const Ext = ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>;
const Shot = ({ file, alt }) => <figure className="shot"><img src={`${import.meta.env.BASE_URL}tutorial/${file}`} alt={alt} loading="lazy" /></figure>;

// The whole agent prompt, to read before using it (the Copy button is in the animation below).
const PromptBox = () => <details className="prompt-box"><summary>Read the prompt</summary><pre>{agentPrompt}</pre></details>;

// The tutorial. One entry per section: the index, the progress dots and the search are all built from this list, so a new
// feature is one more entry (or a few lines in one). Keep it short.
const SECTIONS = [
  {
    id: 'start', title: 'What this is',
    body: (
      <>
        <p>{APP_NAME} is a place to keep your question sets and work through them like a quiz: answer, check, mark the hard ones and watch your stats. It holds two kinds of set: <b>C++ coding questions</b> you write and test in an editor, and <b>your own sets</b> (practice PDFs, screenshots, questions you type), where an answer key lets the app check what you type.</p>
        <p>You can create a set by <b>formatting a practice PDF with an AI agent</b> (or by hand), by adding a folder with a <code>.questions.json</code> file, by pasting a screenshot, or by typing a question in the app. Progress is saved in this browser only, so back it up now and then (last section).</p>
        <p className="muted">Already know the basics? Skip to <a href="#tut-add" data-jump="add">importing a set</a>, <a href="#tut-pdf" data-jump="pdf">formatting a PDF with an agent</a> or <a href="#tut-coding" data-jump="coding">practising</a>.</p>
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
          <li>Pick a mode (practice test, random, by topic, marked difficult, not seen yet, not right last time or all questions) and start a run. Random can split its questions evenly across topics, and a tick box leaves out questions you have already got right.</li>
          <li>Write your answer in the editor and press <b>Run</b> (Ctrl+Shift+Enter). Each test shows pass or fail, with what it expected and what it got.</li>
        </ol>
        <Shot file="set.jpg" alt="A coding set page with its test modes" />
        <p><b>Adding your own coding questions.</b> Coding sets are not imported through the app yet: they are C++ files in the project, in <code>sets/&lt;set-id&gt;/</code> (a <code>set.json</code>, one file per question with its task, starter code and tests, and the reference solutions). Adding one needs a copy of the project on your computer, so if you are only using the published page, first <b>clone the repo</b> (<code>git clone https://github.com/martin-jin/practice-questions.git</code>, then <code>cd app</code> and <code>npm install</code>; Node and a C++ compiler are needed to run it locally). Then copy <code>templates/example-set</code> (or <code>sets/sample</code>), edit it, then refresh the page if the local server is running (<code>app/start.ps1</code>), or run <code>npm run build</code> in the <code>app</code> folder. To share a set, send its folder. See the <Ext href={`${DOCS}/adding-questions.md`}>adding-questions guide</Ext> (sections 2 and 3) and the <Ext href={`${DOCS}/question-format.md`}>question format</Ext>. An agent can write the questions for you from that format.</p>
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
    id: 'agent-help', title: 'Get hints from an AI agent',
    body: (
      <>
        <p>On a question in <b>Your library</b>, choose <b>Solve with agent</b> to choose between opening the Claude Desktop app and your chosen chat website. Claude is the default website; change it in Settings if you prefer another site.</p>
        <ul>
          <li>Set the chat website in <b>Settings &gt; AI agent</b>. It must be an HTTPS address.</li>
          <li>The prompt asks the agent to guide you with one hint at a time, and to ask for your working first if you have not included any.</li>
          <li>The clipboard includes the prompt as text and rich HTML with the question image embedded, as well as the image itself. Chat apps that accept rich clipboard content can receive both with one <b>Ctrl+V</b>. Some chat apps use only the image or text; if so, paste those separately or attach the image.</li>
          <li>Browsers cannot insert clipboard content into another app automatically, so paste with <b>Ctrl+V</b> after the chat opens.</li>
          <li>The desktop option uses the standard <code>claude://</code> app link. If Claude Desktop is not installed or does not open, choose the website in the same dialog.</li>
          <li>Opening a solution (or pressing <b>S</b>) first asks whether you have tried the question. Confirm once to skip the reminder for that question for the rest of the run; starting a new run asks again.</li>
        </ul>
        <p className="muted">The app does not send anything to the AI website. You choose what to paste and share; check that service's privacy terms before sending your work.</p>
      </>
    ),
  },
  {
    id: 'pdf', title: 'Format a PDF with an agent',
    body: (
      <>
        <p>The app finds questions in a PDF from its layout: a cover listing the questions, then each question page followed by its worked solution. An AI agent can build that PDF from your tutorial sheets.</p>
        <ol>
          <li><b>Copy the prompt</b> with the Copy button in the animation below (you can read it first).</li>
          <li>Paste it into an AI agent. One that can read your files and write PDFs works best (Claude Code, for example), but any chat agent can start.</li>
          <li>Answer its questions: what course, which material, where the files are, whether you want answer keys. It builds the PDF in the layout the app reads, checks it and walks you through importing it, step by step.</li>
        </ol>
        <PromptBox />
        <Demo scene="agent" />
        <p className="muted">The layout it follows is described in <Ext href={`${DOCS}/practice-pdf-prompt.md`}>practice-pdf-prompt.md</Ext>. A single question can instead come from an agent adding it to a <code>.questions.json</code> file: see <Ext href={`${DOCS}/question-set-format.md`}>the set format</Ext> and the <Ext href={`${DOCS}/adding-questions.md`}>adding-questions guide</Ext>.</p>
      </>
    ),
  },
  {
    id: 'sheets', title: 'Formula sheets and answer keys',
    body: (
      <>
        <ul>
          <li><b>Formulas</b> (Alt+T) in a library question opens that set's sheets in a side panel. PDFs render sharply in the app, so Alt+T still works after you click the page; use the arrows to change pages, Ctrl+scroll to zoom, and the pinned Reset button to return to the fit view.</li>
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
          <li>A set's page shows one section at a time: click the underlined section name under <b>Questions in</b> to type and pick another. The tick beside it (<b>Mark all correct</b>) counts every question in that section as done, for work you finished before using the app.</li>
          <li>Choose a practice mode from the cards on a set's page and start a session. On <b>Question sets</b>, <b>Practise</b> beside <b>Select</b> and <b>New folder</b> runs every set in that folder (including subfolders); from the root it combines your whole library. <b>Mark as difficult</b> (or press D) flags a question; <b>Settings &gt; Practice</b> makes flagged ones come up more often.</li>
          <li>Worked solution PDF pages scroll horizontally. Enlarge a page to switch between pages with the arrows without losing your zoom.</li>
          <li>Each set has a <b>Stats</b> page with attempts, right and wrong counts.</li>
          <li>Press Alt+K for the command palette: search sets and questions, add a question, move a set to a folder.</li>
        </ul>
        <Shot file="library.jpg" alt="An imported set page with practice mode cards and questions grouped by section" />
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

// The tutorial tab: the sections, with an index at the top of the page, a search in the window's footer (portalled there), and a column of dots at the right edge, one per
// section, where the section being read shows its name beside its dot and the others shrink to a dot.
function Tutorial({ findRef, slot, section }) {
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

  // Opened from a link elsewhere in the app: start at that section.
  useEffect(() => {
    const box = scroller.current;
    const el = box && box.querySelector(`#tut-${section}`);
    if (!el) return undefined;
    // The screenshots above it load late and push it down, so stay on it until the reader scrolls.
    let hold = true;
    const align = () => { if (hold) box.scrollTop = el.offsetTop - 6; };
    const release = () => { hold = false; };
    align();
    el.classList.add('flash');
    box.addEventListener('load', align, true);
    box.addEventListener('wheel', release, { once: true });
    box.addEventListener('pointerdown', release, { once: true });
    box.addEventListener('keydown', release, { once: true });
    return () => box.removeEventListener('load', align, true);
  }, []);

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
      {slot && createPortal(
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
        </div>, slot)}
      <div className="tut-scroll" ref={scroller} onScroll={onScroll} onClick={(e) => {
        const link = e.target.closest && e.target.closest('[data-jump]');
        const at = link && SECTIONS.findIndex((s) => s.id === link.dataset.jump);
        if (link && at >= 0) { e.preventDefault(); goTo(at); }
      }}>
        <header className="tut-title">
          <h2>Welcome to {APP_NAME}</h2>
          <p className="muted">A short guide to practising, adding your own questions and keeping your progress safe.</p>
        </header>
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
export function Welcome({ tab: first, section, close }) {
  const [tab, setTab] = useState(first);
  const findRef = useRef(null);
  const [slot, setSlot] = useState(null);   // the footer's left side, where the tutorial puts its search
  // The tutorial has its own search, so Ctrl+F goes there while it is showing.
  const onKeyDown = (e) => {
    if (tab === 'tutorial' && (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'f' && findRef.current) {
      e.preventDefault();
      findRef.current.focus();
      findRef.current.select();
    }
  };
  return (
    <Modal className="welcome" closeButton title={<span className="welcome-title"><Logo size={30} /><span>{APP_NAME}</span><span className="chip">V{VERSION}</span></span>} onClose={() => close()} footer={<><span className="tut-find-slot" ref={setSlot} /><button type="button" className="btn primary" onClick={() => close()}>Got it</button></>}>
      <div className="welcome-body" onKeyDown={onKeyDown}>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" className="tab" aria-selected={tab === 'tutorial'} onClick={() => setTab('tutorial')}>Tutorial</button>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'changelog'} onClick={() => setTab('changelog')}>What's new</button>
        </div>
        {tab === 'tutorial' ? <Tutorial findRef={findRef} slot={slot} section={section} /> : <Changelog />}
      </div>
    </Modal>
  );
}

export const openWelcome = (open, tab = 'tutorial', section) => open(({ close }) => <Welcome tab={tab} section={section} close={close} />);

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
