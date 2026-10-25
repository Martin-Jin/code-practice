import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { getSet, getQuestion } from '../lib/catalog.js';
import { resetStats, statsFor } from '../lib/service.js';
import { timeAgo, plural } from '../lib/format.js';
import { backupNote } from '../lib/backup.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { useDialogs } from '../components/Dialogs.jsx';

const FILTERS = [
  ['all', 'All'],
  ['attempted', 'Attempted'],
  ['unsolved', 'Never solved'],
  ['struggling', 'Struggling'],
  ['new', 'Not tried'],
];

const empty = { attempts: 0, correct: 0, wrong: 0, compileErrors: 0, crashes: 0, lastAt: null };

function keep(filter, s) {
  if (filter === 'attempted') return s.attempts > 0;
  if (filter === 'unsolved') return s.attempts > 0 && s.correct === 0;
  if (filter === 'struggling') return s.wrong + s.compileErrors > s.correct;
  if (filter === 'new') return s.attempts === 0;
  return true;
}

function Tile({ n, label, tone }) {
  return <div className={`card tile ${tone || ''}`}><div className="n">{n}</div><div className="l">{label}</div></div>;
}

export default function Stats({ setId, theme }) {
  const st = useStore();
  const { confirm } = useDialogs();
  const set = getSet(setId);
  const [filter, setFilter] = useState('all');
  const [collapsed, setCollapsed] = useState({});

  if (!set) return <Shell theme={theme} crumbs={[{ label: 'Unknown set' }]}><div className="empty">Unknown question set. <a href="#/">Dashboard</a></div></Shell>;

  const stats = statsFor(setId);
  const per = (n) => ({ ...empty, ...(stats.questions[n] || {}) });
  const all = Object.values(stats.questions);
  const sumOf = (k) => all.reduce((a, q) => a + (q[k] || 0), 0);
  const total = set.categories.reduce((n, c) => n + c.questions.length, 0);
  const solved = all.filter((q) => q.correct > 0).length;
  const correct = sumOf('correct'), wrong = sumOf('wrong');
  const rate = correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : null;

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset stats for this set?',
      body: `This clears every counter on this page (${plural(sumOf('attempts'), 'attempt')} so far). Your runs and their progress are not affected.${backupNote()}`,
      confirmText: 'Reset stats', danger: true,
    });
    if (ok) resetStats(setId);
  };

  return (
    <Shell theme={theme} crumbs={[{ label: set.name, href: `#/set/${setId}` }, { label: 'Stats' }]}>
      <div className="page-head">
        <h1>{set.name}: stats</h1>
        <p className="muted">Counted across all runs since {new Date(stats.since).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}. An attempt is one press of Run (one compile).</p>
      </div>

      <div className="tiles">
        <Tile n={sumOf('attempts')} label="Compile attempts" />
        <Tile n={correct} label="Correct runs" tone="ok" />
        <Tile n={wrong} label="Wrong runs" tone="bad" />
        <Tile n={sumOf('compileErrors')} label="Compile errors" tone="warn" />
        <Tile n={`${solved} / ${total}`} label="Questions solved" />
        <Tile n={rate === null ? '–' : `${rate}%`} label="Pass rate (compiled runs)" />
        <Tile n={`${stats.runsCompleted} / ${stats.runsStarted}`} label="Runs completed / started" />
      </div>

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="filters" role="group" aria-label="Filter questions">
          {FILTERS.map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}
        </div>
        <button type="button" className="btn danger" onClick={reset}><Icon name="trash" /> Reset stats</button>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {set.categories.map((c) => {
          const rows = c.questions.filter((n) => keep(filter, per(n)));
          if (!rows.length) return null;
          const open = !collapsed[c.id];
          const solvedHere = c.questions.filter((n) => per(n).correct > 0).length;
          return (
            <div key={c.id} className="card stat-cat">
              <button type="button" className="cat-head" aria-expanded={open} onClick={() => setCollapsed({ ...collapsed, [c.id]: open })}>
                <span className="chev"><Icon name="chevron" /></span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span className="chip">{solvedHere} / {c.questions.length} solved</span>
              </button>
              {open && (
                <div className="body">
                  <table className="stats">
                    <thead>
                      <tr><th>#</th><th className="l">Question</th><th>Attempts</th><th>Correct</th><th>Wrong</th><th>Compile errors</th><th>Crashes</th><th>Pass rate</th><th>Last attempt</th></tr>
                    </thead>
                    <tbody>
                      {rows.map((n) => {
                        const s = per(n);
                        const ran = s.correct + s.wrong;
                        const pct = ran ? Math.round((s.correct / ran) * 100) : null;
                        return (
                          <tr key={n} className={s.attempts === 0 ? 'zero' : ''}>
                            <td>Q{n}</td>
                            <td className="title l">{getQuestion(setId, n).title}</td>
                            <td>{s.attempts}</td>
                            <td>{s.correct}</td>
                            <td>{s.wrong}</td>
                            <td>{s.compileErrors}</td>
                            <td>{s.crashes}</td>
                            <td>{pct === null ? '–' : <><span className="rate"><i style={{ width: `${pct}%` }} /></span>{pct}%</>}</td>
                            <td>{timeAgo(s.lastAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
