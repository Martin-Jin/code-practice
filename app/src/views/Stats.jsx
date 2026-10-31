import { useStore } from '../lib/store.js';
import { getSet, getQuestion } from '../lib/catalog.js';
import { resetStats, statsFor } from '../lib/service.js';
import { libraryStats, questionRows, codingAsProgress, codingTroubleOf } from '../../shared/libstats.js';
import { timeAgo, plural } from '../lib/format.js';
import { backupNote } from '../lib/backup.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { SummaryBlocks, QuestionStats, CODING_WORDS } from '../components/StatsParts.jsx';
import { useDialogs } from '../components/Dialogs.jsx';

// Stats for a coding set: how it is going at a glance, then the questions, filtered and ranked as chosen.
export default function Stats({ setId, theme }) {
  useStore();
  const { confirm } = useDialogs();
  const set = getSet(setId);

  if (!set) return <Shell theme={theme} crumbs={[{ label: 'Unknown set' }]}><div className="empty">Unknown question set. <a href="#/">Dashboard</a></div></Shell>;

  const stats = statsFor(setId);
  const questions = set.categories.flatMap((c) => c.questions.map((n) => ({ uid: n, title: `Q${n} ${getQuestion(setId, n).title}`, section: c.name })));
  const progressOf = (n) => codingAsProgress(stats.questions[n]);
  const { total, sections } = libraryStats(questions, progressOf);
  const rows = questionRows(questions, progressOf, codingTroubleOf);

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset stats for this set?',
      body: `This clears every counter and time on this page (${plural(total.attempts, 'attempt')} so far). Your runs and their progress are not affected.${backupNote()}`,
      confirmText: 'Reset stats', danger: true,
    });
    if (ok) resetStats(setId);
  };

  return (
    <Shell theme={theme} crumbs={[{ label: set.name, href: `#/set/${setId}` }, { label: 'Stats' }]}>
      <div className="page-head">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1>{set.name}: stats</h1>
          <button type="button" className="btn danger sm" onClick={reset}><Icon name="trash" /> Reset stats</button>
        </div>
        <p className="muted">Counted across all runs since {new Date(stats.since).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}; last attempt {timeAgo(total.lastAt)}. An attempt is one press of Run (one compile), and a compile error counts as not passed.</p>
      </div>

      <SummaryBlocks total={total} words={CODING_WORDS} />
      <QuestionStats rows={rows} sections={sections} link={null} words={CODING_WORDS} />
    </Shell>
  );
}
