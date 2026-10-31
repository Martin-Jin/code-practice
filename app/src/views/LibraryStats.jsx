import { useStore } from '../lib/store.js';
import { libraryStats, questionRows } from '../../shared/libstats.js';
import { effectiveQuestions, getProgress, resetLibStats } from '../lib/practice.js';
import { timeAgo, plural } from '../lib/format.js';
import { backupNote } from '../lib/backup.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { SummaryBlocks, QuestionStats, IMPORTED_WORDS } from '../components/StatsParts.jsx';
import { useDialogs } from '../components/Dialogs.jsx';
import { folderCrumbs } from '../lib/folders.js';

// Stats for an imported set: how it is going at a glance, then the questions, filtered and ranked as chosen.
export default function LibraryStats({ setId, theme }) {
  const st = useStore();
  const { confirm } = useDialogs();
  const record = st.library.sets[setId];

  if (!record) {
    return <Shell theme={theme} crumbs={[{ label: 'Unknown set' }]}><div className="empty">There is no imported set called "{setId}". <a href="#/">Back to the dashboard</a></div></Shell>;
  }

  const questions = effectiveQuestions(record);
  const { total, sections } = libraryStats(questions, (uid) => getProgress(setId, uid));
  const all = questionRows(questions, (uid) => getProgress(setId, uid));
  const link = (uid) => `#/q/${encodeURIComponent(setId)}/${encodeURIComponent(uid)}`;

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset stats for this set?',
      body: `This clears the counts, times and last results on this page (${plural(total.attempts, 'check')} so far). Your typed answers, difficult marks and answer keys are kept.${backupNote()}`,
      confirmText: 'Reset stats', danger: true,
    });
    if (ok) resetLibStats(setId);
  };

  return (
    <Shell theme={theme} crumbs={[...folderCrumbs(setId), { label: record.title, href: `#/lib/${encodeURIComponent(setId)}` }, { label: 'Stats' }]}>
      <div className="page-head">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1>{record.title}: stats</h1>
          <button type="button" className="btn danger sm" onClick={reset}><Icon name="trash" /> Reset stats</button>
        </div>
        <p className="muted">Counted over every check you have made; last check {timeAgo(total.lastAt)}.</p>
      </div>

      <SummaryBlocks total={total} words={IMPORTED_WORDS} />
      <QuestionStats rows={all} sections={sections} link={link} words={IMPORTED_WORDS} />
    </Shell>
  );
}
