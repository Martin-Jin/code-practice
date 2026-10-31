import { useRef } from 'react';
import { MODE_LABELS } from '../../shared/modes.js';
import { getSet } from '../lib/catalog.js';
import { deleteRun, runSummary } from '../lib/service.js';
import { timeAgo, plural } from '../lib/format.js';
import { backupNote } from '../lib/backup.js';
import Icon from './Icon.jsx';
import { useSlide } from './SlideText.jsx';
import { useDialogs } from './Dialogs.jsx';

// One saved run: progress, mode and Resume / Abandon.
export default function RunRow({ run, showSet = true, compact = false }) {
  const { confirm } = useDialogs();
  const row = useRef(null);
  const main = useRef(null);
  useSlide(main, row);   // a thin row cuts its text off and slides it on hover
  const sum = runSummary(run);
  const pct = sum.total ? (sum.passed / sum.total) * 100 : 0;
  const done = !!run.completedAt;
  const href = `#/run/${run.id}${done ? '/summary' : ''}`;
  const progress = `${sum.passed} / ${sum.total} passed · ${plural(sum.totalAttempts, 'attempt')}`;

  const abandon = async () => {
    const ok = await confirm({
      title: done ? 'Delete this run?' : 'Abandon this run?',
      body: done ? 'Its results will be removed. Your lifetime stats are kept.'
        : `You have ${plural(sum.passed, 'question')} passed out of ${sum.total}. Abandoning deletes this run’s progress and drafts. Your lifetime stats are kept.${backupNote()}`,
      confirmText: done ? 'Delete' : 'Abandon run',
      danger: true,
    });
    if (ok) deleteRun(run.id);
  };

  return (
    <div className={`card run-row${compact ? ' compact' : ''}`} ref={row}>
      <div style={{ minWidth: 0 }} ref={main}>
        {compact
          ? <a className="title row-link" href={href} title={run.name}>{run.name}</a>   // a thin row is one big link into the run
          : <div className="title" title={run.name}>{run.name}</div>}
        <div className="sub">
          <span className="chip accent">{MODE_LABELS[run.mode]}</span>
          {showSet && <span className="chip">{getSet(run.setId)?.name || run.setId}</span>}
          <span className="muted">{done ? `Finished ${timeAgo(run.completedAt)}` : `Updated ${timeAgo(run.updatedAt)}`}</span>
        </div>
      </div>
      <div className="prog" title={compact ? progress : undefined}>
        <div className={`bar${done ? ' ok' : ''}`}><i style={{ width: `${pct}%` }} /></div>
        <span>{compact ? `${sum.passed} / ${sum.total}` : progress}</span>
      </div>
      <div className="btns">
        {!compact && <a className="btn primary" href={href}>{done ? 'Results' : 'Resume'}</a>}
        <button type="button" className="btn ghost icon-only danger" onClick={abandon} title={done ? 'Delete run' : 'Abandon run'} aria-label={done ? 'Delete run' : 'Abandon run'}>
          <Icon name="trash" />
        </button>
      </div>
    </div>
  );
}
