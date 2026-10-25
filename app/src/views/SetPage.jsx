import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { getSet } from '../lib/catalog.js';
import { createRun } from '../lib/service.js';
import { plural } from '../lib/format.js';
import Shell from '../components/Shell.jsx';
import RunRow from '../components/RunRow.jsx';
import ModePicker, { defaultChoice } from '../components/ModePicker.jsx';
import { toast } from '../components/Toasts.jsx';

export default function SetPage({ setId, theme }) {
  const st = useStore();
  const set = getSet(setId);
  const [choice, setChoice] = useState(defaultChoice);
  const [name, setName] = useState('');

  if (!set) {
    return <Shell theme={theme} crumbs={[{ label: 'Unknown set' }]}><div className="empty">There is no question set called "{setId}". <a href="#/">Back to the dashboard</a></div></Shell>;
  }

  const runs = Object.values(st.runs).filter((r) => r.setId === setId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const start = () => {
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
        <h1>{set.name}</h1>
        <p className="muted">{set.description}</p>
        <div className="row"><a className="btn" href={`#/set/${setId}/stats`}>View stats</a></div>
      </div>

      <div className="two-col">
        <section>
          <div className="section-title"><h2>Start a new run</h2></div>
          <ModePicker set={set} value={choice} onChange={setChoice} />
          <div className="row" style={{ marginTop: 16 }}>
            <input type="text" placeholder="Run name (optional)" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1, minWidth: 160 }} maxLength={80} />
            <button type="button" className="btn primary lg" onClick={start}>Start run</button>
          </div>
        </section>

        <section>
          <div className="section-title"><h2>Your runs in this set</h2><span className="muted">{runs.length}</span></div>
          {runs.length === 0
            ? <div className="empty">No runs yet. Choose a mode and press Start.</div>
            : <div className="run-list">{runs.map((r) => <RunRow key={r.id} run={r} showSet={false} />)}</div>}

          <div className="section-title" style={{ marginTop: 28 }}><h2>Topics</h2></div>
          <div className="card pad" style={{ display: 'grid', gap: 6 }}>
            {set.categories.map((c) => (
              <div key={c.id} className="row" style={{ justifyContent: 'space-between' }}>
                <span>{c.name}</span>
                <span className="muted">{plural(c.questions.length, 'question')}{c.group !== 'core' ? ` · ${set.groups[c.group]}` : ''}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
