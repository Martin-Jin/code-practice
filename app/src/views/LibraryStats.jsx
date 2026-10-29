import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { libraryStats, questionRows, keepRow, rankRows, ROW_FILTERS } from '../../shared/libstats.js';
import { effectiveQuestions, getProgress, resetLibStats } from '../lib/practice.js';
import { timeAgo, plural } from '../lib/format.js';
import { backupNote } from '../lib/backup.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { useDialogs } from '../components/Dialogs.jsx';
import { folderCrumbs } from '../lib/folders.js';

const percent = (rate) => (rate === null ? '–' : `${Math.round(rate * 100)}%`);

const VIEWS = [['section', 'By section'], ['ranked', 'Ranked']];

// Rows of the per-question table. `section` adds the section's name, for the ranked list where rows are not grouped.
function QuestionTable({ rows, link, section }) {
  return (
    <table className="stats">
      <thead><tr><th className="l">Question</th>{section && <th className="l">Section</th>}<th>Right</th><th>Not right</th><th>Right rate</th><th>Difficult</th><th>Last check</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.uid} className={r.attempts === 0 ? 'zero' : ''}>
            <td className="title l"><a href={link(r.uid)}>{r.title}</a></td>
            {section && <td className="l muted">{r.section}</td>}
            <td>{r.right}</td>
            <td>{r.wrong}</td>
            <td>{r.rate === null ? '–' : <><span className="rate"><i style={{ width: `${r.rate * 100}%` }} /></span>{percent(r.rate)}</>}</td>
            <td>{r.difficult ? 'yes' : ''}</td>
            <td>{timeAgo(r.lastAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Tile({ n, label, tone }) {
  return <div className={`card tile ${tone || ''}`}><div className="n">{n}</div><div className="l">{label}</div></div>;
}

// Stats for an imported set: totals, a row per section, and the questions most worth another go.
export default function LibraryStats({ setId, theme }) {
  const st = useStore();
  const { confirm } = useDialogs();
  const record = st.library.sets[setId];
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('section');
  const [collapsed, setCollapsed] = useState({});

  if (!record) {
    return <Shell theme={theme} crumbs={[{ label: 'Unknown set' }]}><div className="empty">There is no imported set called "{setId}". <a href="#/">Back to the dashboard</a></div></Shell>;
  }

  const questions = effectiveQuestions(record);
  const { total, sections, worth } = libraryStats(questions, (uid) => getProgress(setId, uid));
  const rows = questionRows(questions, (uid) => getProgress(setId, uid)).filter((r) => keepRow(filter, r));
  const link = (uid) => `#/q/${encodeURIComponent(setId)}/${encodeURIComponent(uid)}`;

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset stats for this set?',
      body: `This clears the counts and last results on this page (${plural(total.attempts, 'check')} so far). Your typed answers, difficult marks and answer keys are kept.${backupNote()}`,
      confirmText: 'Reset stats', danger: true,
    });
    if (ok) resetLibStats(setId);
  };

  return (
    <Shell theme={theme} crumbs={[...folderCrumbs(setId), { label: record.title, href: `#/lib/${encodeURIComponent(setId)}` }, { label: 'Stats' }]}>
      <div className="page-head">
        <h1>{record.title}: stats</h1>
        <p className="muted">Counted over every check you have made, in sessions or on a single question. A check counts when every part has an answer and a key to check it against; last check {timeAgo(total.lastAt)}.</p>
      </div>

      <div className="tiles">
        <Tile n={total.attempts} label="Checks" />
        <Tile n={total.right} label="Right" tone="ok" />
        <Tile n={total.wrong} label="Not right" tone="bad" />
        <Tile n={percent(total.rate)} label="Right rate" />
        <Tile n={`${total.solved} / ${total.questions}`} label="Questions solved" />
        <Tile n={total.notYetRight} label="Tried, never right" tone="warn" />
        <Tile n={total.untried} label="Not checked yet" />
        <Tile n={total.difficult} label="Marked difficult" tone="warn" />
      </div>

      <section>
        <div className="section-title"><h2>Worth another go</h2><span className="muted">{worth.length}</span></div>
        {worth.length === 0 ? (
          <div className="empty">Nothing yet. Questions you mark as difficult, or get not right, appear here.</div>
        ) : (
          <div className="card stat-cat">
            <div className="body">
              <table className="stats">
                <thead><tr><th className="l">Question</th><th className="l">Section</th><th>Right</th><th>Not right</th><th>Difficult</th><th>Last check</th></tr></thead>
                <tbody>
                  {worth.map((r) => (
                    <tr key={r.uid}>
                      <td className="title l"><a href={link(r.uid)}>{r.title}</a></td>
                      <td className="l muted">{r.section}</td>
                      <td>{r.right}</td>
                      <td>{r.wrong}</td>
                      <td>{r.difficult ? 'yes' : ''}</td>
                      <td>{timeAgo(r.lastAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="section-title">
          <h2>By section</h2><span className="muted">{sections.length}</span>
          <span className="spacer" />
          <button type="button" className="btn danger sm" onClick={reset}><Icon name="trash" /> Reset stats</button>
        </div>
        <div className="card stat-cat">
          <div className="body">
            <table className="stats">
              <thead><tr><th className="l">Section</th><th>Questions</th><th>Solved</th><th>Not checked</th><th>Right</th><th>Not right</th><th>Right rate</th><th>Difficult</th></tr></thead>
              <tbody>
                {sections.map((s) => (
                  <tr key={s.name} className={s.attempts === 0 ? 'zero' : ''}>
                    <td className="title l">{s.name}</td>
                    <td>{s.questions}</td>
                    <td><span className="rate"><i style={{ width: `${s.questions ? (s.solved / s.questions) * 100 : 0}%` }} /></span>{s.solved}</td>
                    <td>{s.untried}</td>
                    <td>{s.right}</td>
                    <td>{s.wrong}</td>
                    <td>{percent(s.rate)}</td>
                    <td>{s.difficult || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Questions</h2><span className="muted">{rows.length} of {questions.length}</span>
        </div>
        <div className="row" style={{ marginBottom: 12 }}>
          <div className="filters" role="group" aria-label="Filter questions">
            {ROW_FILTERS.map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}
          </div>
          <div className="filters" role="group" aria-label="How to list the questions">
            {VIEWS.map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}
          </div>
        </div>
        {rows.length === 0 ? <div className="empty">No questions match this filter.</div> : view === 'ranked' ? (
          <div className="card stat-cat"><div className="body"><QuestionTable rows={rankRows(rows)} link={link} section /></div></div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {sections.map((s) => {
              const mine = rows.filter((r) => r.section === s.name);
              if (!mine.length) return null;
              const open = !collapsed[s.name];
              return (
                <div key={s.name} className="card stat-cat">
                  <button type="button" className="cat-head" aria-expanded={open} onClick={() => setCollapsed({ ...collapsed, [s.name]: open })}>
                    <span className="chev"><Icon name="chevron" /></span>
                    <span style={{ flex: 1 }}>{s.name}</span>
                    <span className="chip">{s.solved} / {s.questions} solved</span>
                  </button>
                  {open && <div className="body"><QuestionTable rows={mine} link={link} /></div>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </Shell>
  );
}
