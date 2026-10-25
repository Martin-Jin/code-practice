import { useMemo } from 'react';
import { getQuestion } from '../../lib/catalog.js';
import { duration, plural } from '../../lib/format.js';
import Icon from '../../components/Icon.jsx';

const COLOURS = ['#2563eb', '#17803d', '#e3b341', '#c62828', '#8b5cf6', '#06b6d4'];

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 48 }, () => ({
    left: Math.random() * 100, delay: Math.random() * 0.8, time: 2.2 + Math.random() * 1.8,
    colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
  })), []);
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => <i key={i} style={{ left: `${p.left}%`, background: p.colour, animationDuration: `${p.time}s`, animationDelay: `${p.delay}s` }} />)}
    </div>
  );
}

// Shown when every question in the run passes (and from "Results" on the dashboard).
export default function Finish({ run, onClose, celebrate }) {
  const states = run.questions.map((n) => ({ n, q: getQuestion(run.setId, n), st: run.state[n] }));
  const attempts = states.reduce((a, s) => a + s.st.attempts, 0);
  const wrong = states.reduce((a, s) => a + s.st.wrong, 0);
  const compileErrors = states.reduce((a, s) => a + s.st.compileErrors, 0);
  const took = run.completedAt ? duration(new Date(run.completedAt) - new Date(run.createdAt)) : '–';
  const firstTry = states.filter((s) => s.st.attempts === 1 && s.st.status === 'passed').length;

  return (
    <div className="finish" role="dialog" aria-modal="true" aria-label="Run complete">
      {celebrate && <Confetti />}
      <div className="card panel">
        <div className="hero">
          <div className="medal"><Icon name="check" /></div>
          <h1>All {plural(states.length, 'question')} passed</h1>
          <p className="muted">{run.name}</p>
        </div>
        <div className="tiles">
          <div className="card tile"><div className="n">{attempts}</div><div className="l">Attempts</div></div>
          <div className="card tile ok"><div className="n">{firstTry}</div><div className="l">Passed first try</div></div>
          <div className="card tile bad"><div className="n">{wrong}</div><div className="l">Wrong runs</div></div>
          <div className="card tile warn"><div className="n">{compileErrors}</div><div className="l">Compile errors</div></div>
          <div className="card tile"><div className="n">{took}</div><div className="l">Time taken</div></div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="stats">
            <thead><tr><th>#</th><th className="l">Question</th><th>Attempts</th><th>Wrong</th><th>Compile errors</th></tr></thead>
            <tbody>
              {states.map(({ n, q, st }) => (
                <tr key={n}><td>Q{n}</td><td className="title l">{q.title}</td><td>{st.attempts}</td><td>{st.wrong}</td><td>{st.compileErrors}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="btns">
          <button type="button" className="btn" onClick={onClose}>Review my answers</button>
          <a className="btn primary" href={`#/set/${run.setId}`}>Start another run</a>
          <a className="btn" href={`#/set/${run.setId}/stats`}>Stats</a>
          <a className="btn" href="#/">Dashboard</a>
        </div>
      </div>
    </div>
  );
}
