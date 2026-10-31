import { useEffect, useRef, useState } from 'react';

import { toast, connect } from '../lib/toast.js';

export { toast };
export function validationError(message) { toast(message, 'bad'); }

const MAX = 3;
const SHOWN = { bad: 5200, action: 1000 };   // how long, in ms, before a toast disappears; others last 3500

function Toast({ item, remove }) {
  const timer = useRef(null);
  const left = useRef(item.ms);
  const started = useRef(0);
  const start = () => { started.current = Date.now(); timer.current = setTimeout(remove, left.current); };
  const stop = () => { clearTimeout(timer.current); left.current = Math.max(200, left.current - (Date.now() - started.current)); };
  useEffect(() => { start(); return () => clearTimeout(timer.current); }, []);
  const props = { className: `toast ${item.kind}${item.action ? ' action' : ''}`, style: { animationDuration: `${item.ms}ms` }, onMouseEnter: stop, onMouseLeave: start };
  if (!item.action) return <div {...props} role={item.kind === 'bad' ? 'alert' : 'status'}>{item.message}</div>;
  return (
    <button type="button" {...props} onClick={() => { remove(); item.onClick(); }}>
      <b>{item.action}</b><span>{item.message}</span>
    </button>
  );
}

export default function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let id = 0;
    return connect((message, kind, { action, onClick } = {}) => {
      const item = { id: ++id, message, kind, action, onClick, ms: action ? SHOWN.action : SHOWN[kind] || 3500 };
      setItems((l) => [...l, item].slice(-MAX));
    });
  }, []);
  const remove = (item) => () => setItems((l) => l.filter((x) => x !== item));
  return (
    <div id="toasts">
      {items.map((t) => <Toast key={t.id} item={t} remove={remove(t)} />)}
    </div>
  );
}
