import { useState } from 'react';
import { plural } from '../lib/format.js';
import { Modal } from './Dialogs.jsx';
import { validationError } from './Toasts.jsx';

// Customise a run by topic (or section): which ones to draw from and, for a random run, how many questions from each.
// topics: [{ id, name, available, group? }]; groups: [{ id, label }] to head the list (optional).
// selected: the ticked ids (empty = `defaults`, else every topic); counts: { id: n } or null; withCounts: also ask how many from each.
// onClose(null) cancels, onClose({ selected, counts }) applies (counts is null unless withCounts).
export default function TopicDialog({ title, topics, groups, selected, defaults, counts, withCounts, onClose }) {
  const [on, setOn] = useState(() => new Set(selected.length ? selected : defaults || topics.filter((t) => t.available > 0).map((t) => t.id)));
  const [per, setPer] = useState(() => Object.fromEntries(topics.map((t) => [t.id, String((counts && counts[t.id]) || Math.min(2, t.available))])));
  const toggle = (id) => setOn((s) => { const next = new Set(s); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const cap = (t) => Math.min(Math.max(0, Math.floor(Number(per[t.id]) || 0)), t.available);
  const chosen = topics.filter((t) => on.has(t.id));
  const total = chosen.reduce((n, t) => n + (withCounts ? cap(t) : t.available), 0);

  const apply = () => {
    if (!chosen.length) return validationError('Choose at least one topic.');
    if (withCounts && chosen.some((t) => cap(t) < 1)) return validationError('Choose how many questions you want from each ticked topic (at least 1).');
    onClose({ selected: chosen.map((t) => t.id), counts: withCounts ? Object.fromEntries(chosen.map((t) => [t.id, cap(t)])) : null });
  };

  const row = (t) => (
    <div className="topic-row" key={t.id}>
      <label className="check">
        <input type="checkbox" checked={on.has(t.id)} disabled={t.available < 1} onChange={() => toggle(t.id)} />
        {t.name} <span className="muted">({t.available})</span>
      </label>
      {withCounts && (
        <input type="number" min="1" max={t.available} value={per[t.id]} disabled={!on.has(t.id) || t.available < 1}
          aria-label={`Questions from ${t.name}`} onChange={(e) => setPer({ ...per, [t.id]: e.target.value })} style={{ width: 80 }} />
      )}
    </div>
  );

  return (
    <Modal wide title={title} onClose={() => onClose(null)}
      footer={<><button type="button" className="btn" onClick={() => onClose(null)}>Cancel</button><button type="button" className="btn primary" onClick={apply}>Apply</button></>}>
      <div className="row">
        <button type="button" className="btn ghost sm" onClick={() => setOn(new Set(topics.filter((t) => t.available > 0).map((t) => t.id)))}>Select all</button>
        <button type="button" className="btn ghost sm" onClick={() => setOn(new Set())}>Clear</button>
        <span className="muted">{withCounts ? `${plural(total, 'question')} from ${plural(chosen.length, 'topic')}, drawn at random from each` : `${plural(total, 'question')} in ${plural(chosen.length, 'topic')}`}</span>
      </div>
      {groups
        ? groups.map((g) => {
          const list = topics.filter((t) => t.group === g.id);
          return list.length ? <div className="topic-group" key={g.id}><h4>{g.label}</h4>{list.map(row)}</div> : null;
        })
        : <div className="topic-group">{topics.map(row)}</div>}
    </Modal>
  );
}
