import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { Markup, Stem, Solution } from '../components/Question.jsx';

// One question of an imported set: the question, its parts and a Solution panel.
export default function QuestionView({ setId, uid, theme }) {
  const st = useStore();
  const set = st.library.sets[setId];
  const questions = set ? set.manifest.questions : [];
  const index = questions.findIndex((q) => q.uid === uid);
  const question = questions[index];
  const [showSolution, setShowSolution] = useState(false);
  useEffect(() => { setShowSolution(false); window.scrollTo(0, 0); }, [uid]);

  if (!question) {
    return <Shell theme={theme} crumbs={[{ label: 'Unknown question' }]}><div className="empty">That question is not in an imported set. <a href="#/">Back to the dashboard</a></div></Shell>;
  }
  const go = (i) => `#/q/${encodeURIComponent(setId)}/${encodeURIComponent(questions[i].uid)}`;

  return (
    <Shell theme={theme} crumbs={[{ label: set.title, href: `#/lib/${encodeURIComponent(setId)}` }, { label: question.section }]}>
      <div className="qview">
        <article className="card pad qmain">
          <div className="sub" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="chip accent">{index + 1} / {questions.length}</span>
            {question.marks !== null && <span className="chip">{plural(question.marks, 'mark')}</span>}
            {question.source && <span className="muted">{question.source}</span>}
          </div>
          <h1 style={{ margin: '8px 0 14px' }}>{question.title}</h1>
          <Stem set={set} question={question} />
          {question.parts.some((p) => p.prompt || p.type === 'mcq') && (
            <ol className="parts">
              {question.parts.map((p) => (
                <li key={p.label} data-label={p.label}>
                  {p.prompt && <Markup text={p.prompt} />}
                  {p.type === 'mcq' && <ul>{p.options.map((o, i) => <li key={i}><Markup text={o} /></li>)}</ul>}
                </li>
              ))}
            </ol>
          )}
          <div className="row" style={{ marginTop: 18 }}>
            {index > 0 && <a className="btn" href={go(index - 1)}><Icon name="back" /> Previous</a>}
            {index < questions.length - 1 && <a className="btn primary" href={go(index + 1)}>Next</a>}
          </div>
        </article>

        <aside className="qside">
          <div className="card pad">
            <button type="button" className="btn" aria-expanded={showSolution} onClick={() => setShowSolution((v) => !v)}>
              {showSolution ? 'Hide solution' : 'Show solution'}
            </button>
            {showSolution && <div style={{ marginTop: 14 }}><Solution set={set} question={question} /></div>}
          </div>
        </aside>
      </div>
    </Shell>
  );
}
