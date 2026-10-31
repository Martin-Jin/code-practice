import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { getSet } from '../lib/catalog.js';
import { createRun } from '../lib/service.js';
import { plural } from '../lib/format.js';
import Icon from '../components/Icon.jsx';
import Shell from '../components/Shell.jsx';
import RunRow from '../components/RunRow.jsx';
import ModePicker, { defaultChoice } from '../components/ModePicker.jsx';
import { useDialogs } from '../components/Dialogs.jsx';
import { toast } from '../components/Toasts.jsx';

export default function SetPage({ setId, theme }) {
  const st = useStore();
  const { prompt } = useDialogs();
  const set = getSet(setId);
  const [choice, setChoice] = useState(defaultChoice);

  if (!set) {
    return <Shell theme={theme} crumbs={[{ label: 'Unknown set' }]}><div className="empty">There is no question set called "{setId}". <a href="#/">Back to the dashboard</a></div></Shell>;
  }

  const runs = Object.values(st.runs).filter((r) => r.setId === setId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const total = set.categories.reduce((n, c) => n + c.questions.length, 0);

  const start = async () => {
    const name = await prompt({ title: 'Start run', label: 'Run name (optional)', placeholder: 'Leave blank for an automatic name', confirmText: 'Start' });
    if (name === null) return;
    try {
      const run = createRun({ setId, mode: choice.mode, options: choice.options, name });
      window.location.hash = `#/run/${run.id}`;
    } catch (e) {
      toast(e.message, 'bad');
    }
  };

  return (
    <Shell theme={theme} crumbs={[{ label: set.name }]}>
      <div className="page-head">
        <h1 className="title-with-icon">{set.name} <a className="btn ghost icon-only reveal" href={`#/set/${setId}/stats`} title="View stats" aria-label="View stats"><Icon name="stats" /><span className="label">Stats</span></a></h1>
        <p className="muted">{[plural(total, 'question'), plural(set.categories.length, 'topic')].join(' · ')}</p>
        {set.description && <p className="muted">{set.description}</p>}
      </div>

      <div className="two-col fit">
        <section>
          <div className="section-title"><h2>Practise</h2>{st.prioritise && <span className="chip accent">Drawing hard questions more often</span>}</div>
          <ModePicker set={set} value={choice} onChange={setChoice} onStart={start} />
        </section>

        <section className="fit-col">
          <div className="section-title"><h2>Your runs in this set</h2><span className="muted">{runs.length}</span></div>
          {runs.length === 0
            ? <div className="empty">No runs yet. Choose a mode and press Start.</div>
            : <div className="run-list">{runs.map((r) => <RunRow key={r.id} run={r} showSet={false} />)}</div>}

        </section>
      </div>
    </Shell>
  );
}
